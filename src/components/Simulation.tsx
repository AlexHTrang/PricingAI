import React from 'react';
import { SKU } from '../services/api';

interface SimulationProps {
  skusInAnalysis: SKU[];
  priceChanges: { [key: string]: number };
  onPriceChangesUpdate: (changes: { [key: string]: number }) => void;
}

const Simulation: React.FC<SimulationProps> = ({ skusInAnalysis, priceChanges, onPriceChangesUpdate }) => {
  const handlePriceChangeInput = (skuName: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    onPriceChangesUpdate({
      ...priceChanges,
      [skuName]: numValue
    });
  };

  const calculateNewPrice = (currentPrice: number, changePercent: number) => {
    return currentPrice * (1 + changePercent / 100);
  };

  const calculateNewGP = (currentGP: number, priceChangePercent: number) => {
    return currentGP * (1 + priceChangePercent / 100);
  };

  const formatNumber = (value: number | undefined, decimals: number = 2, isGP: boolean = false) => {
    if (value === undefined || value === null) return '--';
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: isGP ? 0 : decimals,
      maximumFractionDigits: isGP ? 0 : decimals 
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium text-green-600 mb-6">Pricing Configuration</h2>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-4 px-4 font-medium text-gray-600">Name of Product</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">Ownership</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">Current consumer price (€/unit)</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">Current GP (€/HL)</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">
                <div className="flex items-center">
                  <span>Input - Price change (%)</span>
                  <svg className="w-5 h-5 ml-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">New consumer price (€/unit)</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">New GP (€/HL)</th>
            </tr>
          </thead>
          <tbody>
            {skusInAnalysis.map((sku) => {
              const priceChange = priceChanges[sku.name] || 0;
              const currentPrice = sku.customer_price || 0;
              const currentGP = sku.gp || 0;
              const newPrice = calculateNewPrice(currentPrice, priceChange);
              const newGP = calculateNewGP(currentGP, priceChange);

              return (
                <tr key={sku.name} className="border-b">
                  <td className="py-3 px-4">{sku.name}</td>
                  <td className="py-3 px-4">{sku.ownership}</td>
                  <td className="py-3 px-4">{formatNumber(currentPrice)}</td>
                  <td className="py-3 px-4">
                    {sku.ownership === 'OWN' ? formatNumber(currentGP, 2, true) : '--'}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={priceChange || ''}
                      onChange={(e) => handlePriceChangeInput(sku.name, e.target.value)}
                      className="w-full px-3 py-2 border-2 border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:bg-green-50 transition-colors"
                      placeholder="Enter price change..."
                    />
                  </td>
                  <td className={`py-3 px-4 font-medium ${
                    priceChange > 0 
                      ? 'text-green-600 bg-green-50' 
                      : priceChange < 0 
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600'
                  }`}>
                    {formatNumber(newPrice)}
                  </td>
                  <td className={`py-3 px-4 font-medium ${
                    priceChange > 0 
                      ? 'text-green-600 bg-green-50' 
                      : priceChange < 0 
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600'
                  }`}>
                    {sku.ownership === 'OWN' ? formatNumber(newGP, 2, true) : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Simulation; 