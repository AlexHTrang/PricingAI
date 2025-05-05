import pandas as pd
import numpy as np
from typing import Dict, List

class PriceCalculator:
    def __init__(self, base_data: pd.DataFrame):
        self.base_data = base_data

    def calculate_price_impact(self, sku_name: str, price_change_percent: float) -> Dict:
        """Calculate the impact of a price change on volume and revenue"""
        sku = self.base_data[self.base_data['name'] == sku_name].iloc[0]
        
        # Calculate new price
        price_multiplier = 1 + (price_change_percent / 100)
        new_price = sku['customer_price'] * price_multiplier
        
        # Calculate volume impact using price elasticity
        if pd.notna(sku['price_elasticity']):
            volume_change_percent = sku['price_elasticity'] * price_change_percent
            new_volume = sku['volume_sold'] * (1 + (volume_change_percent / 100))
        else:
            new_volume = sku['volume_sold']
        
        # Calculate new revenue and GP
        new_revenue = new_price * new_volume
        new_gp = (new_revenue * (sku['gp'] / 100)) if pd.notna(sku['gp']) else None
        
        return {
            'new_price': round(new_price, 2),
            'new_volume': round(new_volume, 2),
            'new_revenue': round(new_revenue, 2),
            'new_gp': round(new_gp, 2) if new_gp is not None else None,
            'volume_change_percent': round(((new_volume - sku['volume_sold']) / sku['volume_sold']) * 100, 1)
        }

    def analyze_market_impact(self, price_changes: List[Dict]) -> Dict:
        """Analyze the market-wide impact of multiple price changes"""
        market_data = self.base_data.copy()
        total_market_volume = market_data['volume_sold'].sum()
        total_market_revenue = (market_data['customer_price'] * market_data['volume_sold']).sum()
        
        # Apply price changes
        for change in price_changes:
            sku_name = change['sku_name']
            price_change = change['price_change']
            impact = self.calculate_price_impact(sku_name, price_change)
            
            idx = market_data[market_data['name'] == sku_name].index[0]
            market_data.at[idx, 'volume_sold'] = impact['new_volume']
            market_data.at[idx, 'customer_price'] = impact['new_price']
        
        # Calculate new market totals
        new_total_volume = market_data['volume_sold'].sum()
        new_total_revenue = (market_data['customer_price'] * market_data['volume_sold']).sum()
        
        return {
            'market_volume_change': round(((new_total_volume - total_market_volume) / total_market_volume) * 100, 1),
            'market_revenue_change': round(((new_total_revenue - total_market_revenue) / total_market_revenue) * 100, 1),
            'new_market_shares': self._calculate_market_shares(market_data)
        }

    def _calculate_market_shares(self, market_data: pd.DataFrame) -> Dict:
        """Calculate new market shares after price changes"""
        total_volume = market_data['volume_sold'].sum()
        total_revenue = (market_data['customer_price'] * market_data['volume_sold']).sum()
        
        market_shares = {}
        for _, sku in market_data.iterrows():
            if pd.notna(sku['volume_sold']):
                volume_share = (sku['volume_sold'] / total_volume) * 100
                revenue_share = ((sku['customer_price'] * sku['volume_sold']) / total_revenue) * 100
                market_shares[sku['name']] = {
                    'volume_share': round(volume_share, 1),
                    'value_share': round(revenue_share, 1)
                }
        
        return market_shares 