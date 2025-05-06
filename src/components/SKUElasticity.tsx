import React, { useState } from 'react';
import { SKU } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SKUElasticityProps {
  skusInAnalysis: SKU[];
}

interface DataPoint {
  priceChange: number;
  volume: number;
  revenue: number;
  margin: number;
}

const SKUElasticity: React.FC<SKUElasticityProps> = ({ skusInAnalysis }) => {
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'revenue' | 'margin'>('volume');

  const generateElasticityCurve = (sku: SKU): DataPoint[] => {
    const basePrice = sku.price || 0;
    const baseVolume = sku.volume_sold || 0;
    const elasticity = sku.price_elasticity || 0;
    const baseGP = sku.gp || 0;
    
    const points: DataPoint[] = [];
    for (let i = -20; i <= 20; i += 2) {
      const priceChange = i / 100;
      const newPrice = basePrice * (1 + priceChange);
      const volumeChange = priceChange * elasticity;
      const newVolume = baseVolume * (1 + volumeChange);
      const newRevenue = newPrice * newVolume;
      const newMargin = newVolume * (baseGP * (1 + priceChange));
      
      points.push({
        priceChange: i,
        volume: newVolume,
        revenue: newRevenue,
        margin: newMargin
      });
    }
    
    return points;
  };

  const getOptimalPoint = (data: DataPoint[], metric: 'volume' | 'revenue' | 'margin'): { value: number; priceChange: number } => {
    const maxPoint = data.reduce((max, point) => 
      point[metric] > max[metric] ? point : max
    , data[0]);
    
    return {
      value: maxPoint[metric],
      priceChange: maxPoint.priceChange
    };
  };

  const formatValue = (value: number, type: string): string => {
    switch (type) {
      case 'volume':
        return `${(value / 1000).toFixed(1)}k L`;
      case 'revenue':
      case 'margin':
        return `€${(value / 1000000).toFixed(2)}M`;
      default:
        return value.toFixed(2);
    }
  };

  const getMetricColor = (metric: string): string => {
    switch (metric) {
      case 'volume':
        return '#059669';
      case 'revenue':
        return '#0284c7';
      case 'margin':
        return '#7c3aed';
      default:
        return '#000000';
    }
  };

  const renderMetricButton = (metric: 'volume' | 'revenue' | 'margin', label: string) => (
    <button
      onClick={() => setSelectedMetric(metric)}
      className={`px-4 py-2 rounded-lg font-medium ${
        selectedMetric === metric
          ? `bg-${metric === 'volume' ? 'emerald' : metric === 'revenue' ? 'blue' : 'purple'}-100 
             text-${metric === 'volume' ? 'emerald' : metric === 'revenue' ? 'blue' : 'purple'}-700`
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label} Impact
    </button>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium text-green-600">SKU Elasticity Analysis</h2>
        <div className="flex space-x-4">
          {renderMetricButton('volume', 'Volume')}
          {renderMetricButton('revenue', 'Revenue')}
          {renderMetricButton('margin', 'Margin')}
        </div>
      </div>
      
      <div className="space-y-8">
        {skusInAnalysis.map((sku) => {
          const data = generateElasticityCurve(sku);
          const optimal = getOptimalPoint(data, selectedMetric);
          
          return (
            <div key={sku.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{sku.name}</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Price Elasticity</p>
                      <p className={`text-lg font-bold ${(sku.price_elasticity || 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {(sku.price_elasticity || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-lg font-bold">€{(sku.price || 0).toFixed(2)}/L</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Base Volume</p>
                      <p className="text-lg font-bold">{formatValue(sku.volume_sold || 0, 'volume')}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Optimal Price Change</p>
                  <p className="text-2xl font-bold text-green-600">{optimal.priceChange}%</p>
                  <p className="text-sm text-gray-500">Maximum {selectedMetric}</p>
                  <p className="text-lg font-bold">{formatValue(optimal.value, selectedMetric)}</p>
                </div>
              </div>
              
              <div className="h-[400px] mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 30, right: 50, left: 50, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="priceChange"
                      label={{ value: 'Price Change (%)', position: 'insideBottom', offset: -20 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      yAxisId="metric"
                      orientation="left"
                      label={{ 
                        value: `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Impact`, 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: -30
                      }}
                      tickFormatter={(value) => formatValue(value, selectedMetric)}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === selectedMetric) {
                          return [formatValue(value as number, selectedMetric), selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Price Change: ${label}%`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                    />
                    <ReferenceLine
                      x={optimal.priceChange}
                      yAxisId="metric"
                      stroke="#16a34a"
                      strokeDasharray="3 3"
                      label={{
                        value: 'Optimal',
                        position: 'insideTopRight',
                        offset: 10,
                        fill: '#16a34a'
                      }}
                    />
                    <Line
                      yAxisId="metric"
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={getMetricColor(selectedMetric)}
                      strokeWidth={3}
                      dot={false}
                      name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SKUElasticity; 