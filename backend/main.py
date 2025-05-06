from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import pandas as pd
from pathlib import Path
from pricing.calculator import PriceCalculator

app = FastAPI(title="RMG Dynamic Pricing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class SKU(BaseModel):
    name: str
    ownership: str
    category: str
    segment: str
    volume: Optional[float] = None
    customer_price: Optional[float] = None
    gp: Optional[float] = None
    volume_sold: Optional[float] = None
    price_elasticity: Optional[float] = None
    price: Optional[float] = None
    rsv: Optional[float] = None
    gp_mass: Optional[float] = None
    volume_share: Optional[float] = None
    value_share: Optional[float] = None
    unit_sold: Optional[float] = None

class PriceChange(BaseModel):
    sku_name: str
    price_change: float

# Load data from CSV
def load_sku_data():
    csv_path = Path(__file__).parent / "data" / "aggregated_sales_2025.csv"
    try:
        df = pd.read_csv(csv_path)
        # The columns are already properly named in the CSV, just need to map them to our model
        df = df.rename(columns={
            'ITEM': 'name',
            'Level_1': 'category',
            'Level_3': 'segment',
            'VolumePerUnit': 'volume',  # Volume (L/Units)
            'CustomerPrice': 'customer_price',  # Customer Price (EUR/unit)
            'GrossProfit': 'gp',  # GP (EUR/hL)
            'VolumeSold': 'volume_sold',  # Volume sold (khL)
            'PriceElasticity': 'price_elasticity',  # Price elasticity
            'PricePerL': 'price',  # Price (EUR/L)
            'RSV': 'rsv',  # RSV (mass, EUR m)
            'Profit': 'gp_mass',  # GP (mass, EUR m)
            'Total_Sales_Units': 'unit_sold',  # Unit sold (# of k units)
            'VoMS': 'volume_share',
            'VaMS': 'value_share',
            'OWNERSHIP': 'ownership'
        })
        
        # Ensure numeric columns are float type
        numeric_columns = ['volume', 'customer_price', 'gp', 'volume_sold', 
                         'price_elasticity', 'price', 'rsv', 'gp_mass', 
                         'unit_sold', 'volume_share', 'value_share']
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # # Calculate market shares
        # total_volume = df['volume_sold'].sum()
        # total_value = (df['customer_price'] * df['volume_sold']).sum()
        # df['volume_share'] = 0
        # df['value_share'] = 0
        
        # Round numeric values for display
        df = df.round({
            'volume': 2,
            'customer_price': 2,
            'gp': 4,
            'volume_sold': 0,
            'price_elasticity': 2,
            'price': 2,
            'rsv': 2,
            'gp_mass': 2,
            'unit_sold': 2,
            'volume_share': 2,
            'value_share': 2
        })
        
        # Fill any missing values with 0
        df = df.fillna(0)
        
        return df
    except FileNotFoundError:
        return pd.DataFrame()

# Initialize price calculator
calculator = PriceCalculator(load_sku_data())

# Routes
@app.get("/api/skus", response_model=List[SKU])
async def get_skus():
    """Get all SKUs"""
    df = load_sku_data()
    result = df.to_dict('records')
    # Debug log
    print("First SKU data:", result[0] if result else "No SKUs found")
    return result

@app.get("/api/skus/search")
async def search_skus(
    query: Optional[str] = None,
    ownership: Optional[str] = None,
    category: Optional[str] = None,
    segment: Optional[str] = None
):
    """Search SKUs with filters"""
    df = load_sku_data()
    
    if query:
        df = df[df['name'].str.contains(query, case=False)]
    if ownership:
        df = df[df['ownership'] == ownership]
    if category:
        df = df[df['category'] == category]
    if segment:
        df = df[df['segment'] == segment]
    
    return df.to_dict('records')

@app.get("/api/skus/{sku_name}")
async def get_sku(sku_name: str):
    """Get SKU by name"""
    df = load_sku_data()
    sku = df[df['name'] == sku_name].to_dict('records')
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")
    return sku[0]

@app.post("/api/pricing/calculate-impact")
async def calculate_price_impact(sku_name: str, price_change: float):
    """Calculate the impact of a price change on a single SKU"""
    try:
        impact = calculator.calculate_price_impact(sku_name, price_change)
        return impact
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/pricing/analyze-market")
async def analyze_market_impact(price_changes: List[PriceChange]):
    """Analyze the market-wide impact of multiple price changes"""
    try:
        changes = [{"sku_name": change.sku_name, "price_change": change.price_change} 
                  for change in price_changes]
        impact = calculator.analyze_market_impact(changes)
        return impact
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 