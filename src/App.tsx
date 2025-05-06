import React, { useState } from 'react';
import SKUConfiguration from './components/SKUConfiguration';
import Simulation from './components/Simulation';
import Results from './components/Results';
import VolumeFlow from './components/VolumeFlow';
import MarketContraction from './components/MarketContraction';
import SKUElasticity from './components/SKUElasticity';
import heineken_logo from './assets/heineken-logo.png';
import { SKU } from './services/api';
import { GlobalProvider } from './context/GlobalContext';

type FlowStatus = 'at_fair_share' | 'above_fair_share' | 'below_fair_share' | 'na';
type TabType = 'sku-config' | 'price-config' | 'sku-elasticity' | 'volume-flow' | 'market-contraction' | 'results';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('sku-config');
  const [skusInAnalysis, setSkusInAnalysis] = useState<SKU[]>([]);
  const [priceChanges, setPriceChanges] = useState<{ [key: string]: number }>({});
  const [flowStatuses, setFlowStatuses] = useState<{ [key: string]: FlowStatus }>({});
  const [kValue, setKValue] = useState(5);
  const [nValue, setNValue] = useState(2);

  return (
    <GlobalProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-2">
            <div className="flex-shrink-0">
              <img src={heineken_logo} alt="Heineken APAC D-HUB" className="h-12 w-auto" />
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-4xl font-bold text-heineken-green tracking-wider font-space uppercase">
              RMG Dynamic Pricing
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-gray-800">Demo Account</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">IP: 12306801</span>
                <button className="rounded-full bg-white p-1 shadow-sm">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button className="p-1">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <nav className="px-4">
            <ul className="flex border-b justify-center">
              <li className="mx-4">
                <a href="#" className="inline-block px-6 py-3 text-lg font-bold text-gray-500 hover:text-gray-700">
                  Macro Economics View
                </a>
              </li>
              <li className="mx-4">
                <a href="#" className="inline-block px-6 py-3 text-lg font-bold text-gray-500 hover:text-gray-700">
                  Diagnostics View
                </a>
              </li>
              <li className="mx-4">
                <a href="#" className="inline-block px-6 py-3 text-lg font-bold text-heineken-green border-b-2 border-heineken-green">
                  Pricing Simulator
                </a>
              </li>
            </ul>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex">
            <aside className="w-56 flex-shrink-0">
              <nav>
                <h2 className="text-lg font-medium mb-4">Simulation</h2>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab('sku-config')}
                      className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                        activeTab === 'sku-config' 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2 flex-shrink-0">📦</span>
                      SKU Configuration
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('sku-elasticity')}
                      className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                        activeTab === 'sku-elasticity' 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2 flex-shrink-0">📊</span>
                      SKU Elasticity
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('price-config')}
                      className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                        activeTab === 'price-config' 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2 flex-shrink-0">💰</span>
                      Price Configuration
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('volume-flow')}
                      className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                        activeTab === 'volume-flow' 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2 flex-shrink-0">🔄</span>
                      Volume Flow
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('market-contraction')}
                      className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                        activeTab === 'market-contraction' 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2 flex-shrink-0">📉</span>
                      Market Contraction
                    </button>
                  </li>
                  <li className="pt-4 mt-4 border-t border-gray-200">
                    <button
                      onClick={() => setActiveTab('results')}
                      className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
                        activeTab === 'results' 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2 flex-shrink-0">📈</span>
                      <span className="truncate text-lg font-bold">Results</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </aside>
            <div className="flex-1 bg-white rounded-lg shadow">
              {activeTab === 'sku-config' && (
                <SKUConfiguration 
                  skusInAnalysis={skusInAnalysis}
                  onSkusInAnalysisChange={setSkusInAnalysis}
                />
              )}
              
              {activeTab === 'sku-elasticity' && (
                <SKUElasticity 
                  skusInAnalysis={skusInAnalysis}
                />
              )}

              {activeTab === 'price-config' && (
                <Simulation 
                  skusInAnalysis={skusInAnalysis}
                  priceChanges={priceChanges}
                  onPriceChangesUpdate={setPriceChanges}
                />
              )}

              {activeTab === 'volume-flow' && (
                <VolumeFlow 
                  skusInAnalysis={skusInAnalysis}
                  flowStatuses={flowStatuses}
                  onFlowStatusesUpdate={setFlowStatuses}
                />
              )}

              {activeTab === 'market-contraction' && (
                <MarketContraction 
                  kValue={kValue}
                  nValue={nValue}
                  onParamsUpdate={(k: number, n: number) => {
                    setKValue(k);
                    setNValue(n);
                  }}
                />
              )}

              {activeTab === 'results' && (
                <Results 
                  skusInAnalysis={skusInAnalysis} 
                  priceChanges={priceChanges}
                  kValue={kValue}
                  nValue={nValue}
                  flowStatuses={flowStatuses}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </GlobalProvider>
  );
}

export default App; 