import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

interface DataPoint {
  x: number;
  y: number;
}

interface MarketContractionProps {
  kValue: number;
  nValue: number;
  onParamsUpdate: (k: number, n: number) => void;
}

const MarketContraction: React.FC<MarketContractionProps> = ({ kValue, nValue, onParamsUpdate }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [tempK, setTempK] = useState(kValue.toString());
  const [tempN, setTempN] = useState(nValue.toString());

  useEffect(() => {
    setTempK(kValue.toString());
    setTempN(nValue.toString());
  }, [kValue, nValue]);

  const generateDataPoints = (k: number, n: number) => {
    const points: DataPoint[] = [];
    for (let x = -5; x <= 5; x += 0.1) {
      const y = -k * Math.pow(x, n) * Math.sign(x);
      points.push({ x, y });
    }
    return points;
  };

  const handleApply = () => {
    const newK = parseFloat(tempK);
    const newN = parseFloat(tempN);
    
    if (!isNaN(newK) && !isNaN(newN) && newK > 0 && newN > 0) {
      onParamsUpdate(newK, newN);
    } else {
      // Reset temp values if invalid
      setTempK(kValue.toString());
      setTempN(nValue.toString());
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const data = generateDataPoints(kValue, nValue);

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Market Contraction',
            data: data,
            borderColor: '#047857', // Heineken green
            backgroundColor: '#047857',
            showLine: true,
            pointRadius: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Market Contraction Hypothesis',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  return `(${(context.parsed.x * 10).toFixed(1)}%, ${(context.parsed.y * 10).toFixed(1)}%)`;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              position: 'center',
              title: {
                display: true,
                text: 'Price Change (%)',
                font: {
                  size: 14
                }
              },
              grid: {
                color: '#e5e7eb'
              },
              ticks: {
                callback: function(tickValue: number | string) {
                  const value = Number(tickValue);
                  return (value * 10) + '%';
                }
              }
            },
            y: {
              type: 'linear',
              position: 'left',
              title: {
                display: true,
                text: 'Volume Change (%)',
                font: {
                  size: 14
                }
              },
              grid: {
                color: '#e5e7eb'
              },
              ticks: {
                callback: function(tickValue: number | string) {
                  const value = Number(tickValue);
                  return value + '%';
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [kValue, nValue]);

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        {/* Warning Box */}
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
          <h3 className="text-xl font-bold mb-2">REFERENCE ONLY</h3>
          <p className="text-lg mb-2">DO NOT TOUCH WITHOUT HAVING A DISCUSSION AND APPROVAL FROM YOUR REGIONAL RMG HEAD</p>
          <p className="text-lg font-semibold">THE k & n INPUT HELP DEFINE THE MARKET CONTRACTION CURVE</p>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Market Contraction Hypothesis</h2>

        <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
          {/* Left Column - Parameters and Formula */}
          <div className="lg:w-1/3 space-y-6">
            {/* Parameters Input Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Parameters</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="k-value" className="block text-sm font-medium text-gray-700 mb-1">
                    k = coefficient
                  </label>
                  <input
                    id="k-value"
                    type="number"
                    value={tempK}
                    onChange={(e) => setTempK(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter k value"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="n-value" className="block text-sm font-medium text-gray-700 mb-1">
                    n = power
                  </label>
                  <input
                    id="n-value"
                    type="number"
                    value={tempN}
                    onChange={(e) => setTempN(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter n value"
                    min="0"
                    step="0.1"
                  />
                </div>
                <button
                  onClick={handleApply}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Formula Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Formula</h3>
              <p className="text-gray-600 mb-3">
                This chart demonstrates the market contraction hypothesis using:
              </p>
              <div className="font-mono bg-white p-3 rounded-md border border-gray-200 mb-4 text-center">
                Y = -k * (x^n) * SIGN(x)
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-700">Where:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Y is the volume change (%)</li>
                  <li>x is the price change (%)</li>
                  <li>k is the coefficient (currently: {kValue})</li>
                  <li>n is the power (currently: {nValue})</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Chart */}
          <div className="lg:w-2/3 bg-gray-50 rounded-lg p-4">
            <div className="bg-white rounded-lg p-4 h-[600px]">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketContraction; 