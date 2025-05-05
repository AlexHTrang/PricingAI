import React, { useState } from 'react';
import PricingSimulator from './components/PricingSimulator';
import SKUConfiguration from './components/SKUConfiguration';
import Simulation from './components/Simulation';
import heineken_logo from './assets/heineken-logo.png';
import { SKU } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('sku-config');
  const [skusInAnalysis, setSkusInAnalysis] = useState<SKU[]>([]);

  const handleSkusInAnalysisChange = (skus: SKU[]) => {
    setSkusInAnalysis(skus);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <ul className="flex border-b">
            <li className="mr-4">
              <a href="#" className="inline-block px-4 py-2 text-gray-500 hover:text-gray-700">
                Macro Economics View
              </a>
            </li>
            <li className="mr-4">
              <a href="#" className="inline-block px-4 py-2 text-gray-500 hover:text-gray-700">
                Diagnostics View
              </a>
            </li>
            <li className="mr-4">
              <a href="#" className="inline-block px-4 py-2 text-heineken-green border-b-2 border-heineken-green">
                Pricing Simulator
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="flex">
          <aside className="w-64 pr-8">
            <nav>
              <h2 className="text-lg font-medium mb-4">Overview</h2>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setActiveTab('sku-config')}
                    className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'sku-config' 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">📦</span>
                    SKU Configuration
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('simulation')}
                    className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'simulation' 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">📊</span>
                    Simulation
                  </button>
                </li>
              </ul>
            </nav>
          </aside>
          <div className="flex-1 bg-white rounded-lg shadow">
            {activeTab === 'sku-config' && <SKUConfiguration onSkusInAnalysisChange={handleSkusInAnalysisChange} skusInAnalysis={skusInAnalysis} />}
            {activeTab === 'simulation' && <Simulation skusInAnalysis={skusInAnalysis} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 