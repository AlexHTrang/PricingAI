import React, { useState } from 'react';

interface PricingRow {
  id: number;
  productName: string;
  type: 'Own' | 'Competitor' | '0';
  currentPrice: number;
  priceChange: string;
  newPrice: number;
  newGP?: number;
}

const initialData: PricingRow[] = [
  { id: 1, productName: 'Heniken 12x30cL CAN', type: 'Own', currentPrice: 9.79, priceChange: '8%', newPrice: 10.57, newGP: 59.40 },
  { id: 2, productName: 'Heniken 12x25cL CAN', type: 'Own', currentPrice: 8.59, priceChange: '-5%', newPrice: 8.16, newGP: 57.00 },
  { id: 3, productName: '1664 6x30cL RGB', type: 'Competitor', currentPrice: 5.59, priceChange: '25%', newPrice: 6.99 },
  { id: 4, productName: '1664 6x33cL CAN', type: 'Competitor', currentPrice: 5.59, priceChange: '3%', newPrice: 5.76 },
  { id: 5, productName: 'Heniken 6x50cL CAN', type: '0', currentPrice: 0, priceChange: '--%', newPrice: 0, newGP: 0 },
  { id: 6, productName: 'Heniken 12x33cL CAN', type: '0', currentPrice: 0, priceChange: '--%', newPrice: 0, newGP: 0 },
];

const PricingSimulator: React.FC = () => {
  const [data, setData] = useState<PricingRow[]>(initialData);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Pricing Configuration</h2>
          <button className="text-gray-400 hover:text-gray-600">
            <span className="sr-only">Information</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Name of Product</th>
                <th className="text-left py-3 px-4">Competitor or own SKU</th>
                <th className="text-left py-3 px-4">Current consumer price (€/unit)</th>
                <th className="text-left py-3 px-4">Input - Consumer price change (%)</th>
                <th className="text-left py-3 px-4">New consumer price (€/unit)</th>
                <th className="text-left py-3 px-4">New GP (€/HL)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-3 px-4">{row.productName}</td>
                  <td className="py-3 px-4">{row.type}</td>
                  <td className="py-3 px-4">{row.currentPrice.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={row.priceChange}
                      className="w-24 px-2 py-1 border rounded bg-gray-100"
                      readOnly
                    />
                  </td>
                  <td className="py-3 px-4">{row.newPrice.toFixed(2)}</td>
                  <td className="py-3 px-4">{row.newGP?.toFixed(2) || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingSimulator; 