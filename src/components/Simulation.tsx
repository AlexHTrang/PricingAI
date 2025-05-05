import React, { useState } from 'react';
import { SKU } from '../services/api';

interface SimulationProps {
  skusInAnalysis: SKU[];
}

const Simulation: React.FC<SimulationProps> = ({ skusInAnalysis }) => {
  const [priceChanges, setPriceChanges] = useState<{ [key: string]: number }>({});

  const handlePriceChangeInput = (skuName: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setPriceChanges(prev => ({
      ...prev,
      [skuName]: numValue
    }));
  };

  const calculateNewPrice = (currentPrice: number, changePercent: number) => {
    return currentPrice * (1 + changePercent / 100);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium text-green-600 mb-6">Pricing Configuration</h2>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-4 px-4 font-medium text-gray-600">Name of Product</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">Competitor or own SKU</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">Current consumer price (€/unit)</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">Input - Consumer price change (%)</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">New consumer price (€/unit)</th>
              <th className="text-left py-4 px-4 font-medium text-gray-600">New GP (€/HL)</th>
            </tr>
          </thead>
          <tbody>
            {skusInAnalysis.map((sku) => {
              const priceChange = priceChanges[sku.name] || 0;
              const currentPrice = sku.customer_price || 0;
              const newPrice = calculateNewPrice(currentPrice, priceChange);

              return (
                <tr key={sku.name} className="border-b">
                  <td className="py-3 px-4">{sku.name}</td>
                  <td className="py-3 px-4">{sku.ownership}</td>
                  <td className="py-3 px-4">{currentPrice.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={priceChange || ''}
                      onChange={(e) => handlePriceChangeInput(sku.name, e.target.value)}
                      className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="--%"
                    />
                  </td>
                  <td className="py-3 px-4">{newPrice.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {sku.ownership === 'OWN' ? (sku.gp || 0).toFixed(2) : '--'}
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