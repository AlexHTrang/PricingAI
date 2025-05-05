import React, { useState, useEffect, useMemo } from 'react';
import { api, SKU } from '../services/api';

interface SKUConfigurationProps {
  onSkusInAnalysisChange: (skus: SKU[]) => void;
  skusInAnalysis: SKU[];
}

const SKUConfiguration: React.FC<SKUConfigurationProps> = ({ onSkusInAnalysisChange, skusInAnalysis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedSKUs, setSelectedSKUs] = useState<string[]>([]);
  const [availableSKUs, setAvailableSKUs] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(false);
  const [allSKUs, setAllSKUs] = useState<SKU[]>([]);

  // Reset segment when category changes
  useEffect(() => {
    setSelectedSegment('');
  }, [selectedCategory]);

  // Get available segments based on selected category
  const availableSegments = useMemo(() => {
    if (!selectedCategory) {
      // When "ALL" is selected, show all unique segments from the data
      const uniqueSegments = Array.from(new Set(allSKUs.map(sku => sku.segment))).sort();
      return ['', ...uniqueSegments]; // Empty string for "ALL" option
    }

    switch (selectedCategory) {
      case 'TOTAL BEER':
        return [
          '',           // For "ALL" option
          'ECONOMY',
          'EVERYDAY CRAFT',
          'MAINSTREAM',
          'PREMIUM'
        ];
      case 'TOTAL CIDER':
        return [
          '',           // For "ALL" option
          'CIDER'
        ];
      case 'TOTAL WINE':
        return [
          '',           // For "ALL" option
          'WINE'
        ];
      default:
        return [''];    // Just "ALL" option
    }
  }, [selectedCategory, allSKUs]);

  // Fetch all SKUs on component mount
  useEffect(() => {
    fetchAllSKUs();
  }, []);

  // Filter SKUs when search or filters change
  useEffect(() => {
    filterSKUs();
  }, [searchTerm, selectedOwnership, selectedCategory, selectedSegment, allSKUs]);

  const fetchAllSKUs = async () => {
    try {
      setLoading(true);
      console.log('Fetching all SKUs...');
      const skus = await api.getAllSKUs();
      console.log('Fetched SKUs:', skus);
      setAllSKUs(skus);
      setAvailableSKUs(skus);
    } catch (error) {
      console.error('Error fetching SKUs:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterSKUs = () => {
    let filteredSKUs = allSKUs.filter(sku => !selectedSKUs.includes(sku.name));

    if (searchTerm) {
      filteredSKUs = filteredSKUs.filter(sku => 
        sku.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedOwnership) {
      filteredSKUs = filteredSKUs.filter(sku => 
        sku.ownership === selectedOwnership
      );
    }

    if (selectedCategory) {
      filteredSKUs = filteredSKUs.filter(sku => 
        sku.category === selectedCategory
      );
    }

    if (selectedSegment) {
      filteredSKUs = filteredSKUs.filter(sku => 
        sku.segment === selectedSegment
      );
    }

    setAvailableSKUs(filteredSKUs);
  };

  const handleSelectSKU = (sku: SKU) => {
    const newSkusInAnalysis = [...skusInAnalysis, sku];
    setSelectedSKUs(prev => [...prev, sku.name]);
    onSkusInAnalysisChange(newSkusInAnalysis);
    setAvailableSKUs(prev => prev.filter(s => s.name !== sku.name));
  };

  const handleRemoveSKU = (sku: SKU) => {
    const newSkusInAnalysis = skusInAnalysis.filter(s => s.name !== sku.name);
    setSelectedSKUs(prev => prev.filter(name => name !== sku.name));
    onSkusInAnalysisChange(newSkusInAnalysis);
    filterSKUs(); // Reapply filters to add the removed SKU back to available SKUs
  };

  return (
    <div className="p-6">
      {/* SKUs in Analysis */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium">SKUs in Analysis</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b text-sm">
                <th className="text-left py-3 px-2"></th>
                <th className="text-left py-3 px-2">SKU Name</th>
                <th className="text-left py-3 px-2">Ownership</th>
                <th className="text-left py-3 px-2">Volume (L/Units)</th>
                <th className="text-left py-3 px-2">Customer Price (€/unit)</th>
                <th className="text-left py-3 px-2">GP (€/hL)</th>
                <th className="text-left py-3 px-2">Volume sold (khL)</th>
                <th className="text-left py-3 px-2">Price elasticity</th>
                <th className="text-left py-3 px-2">Price (€/L)</th>
                <th className="text-left py-3 px-2">RSV (mass,€m)</th>
                <th className="text-left py-3 px-2">GP (mass,€m)</th>
                <th className="text-left py-3 px-2">Volume market share (%)</th>
                <th className="text-left py-3 px-2">Value market share (%)</th>
                <th className="text-left py-3 px-2">Unit sold (# of k units)</th>
              </tr>
            </thead>
            <tbody>
              {skusInAnalysis.map((sku, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 px-2">
                    <button 
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleRemoveSKU(sku)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                  <td className="py-3 px-2">{sku.name}</td>
                  <td className="py-3 px-2">{sku.ownership}</td>
                  <td className="py-3 px-2">{sku.volume || '--'}</td>
                  <td className="py-3 px-2">{sku.customer_price?.toFixed(2) || '--'}</td>
                  <td className="py-3 px-2">{sku.gp || '--'}</td>
                  <td className="py-3 px-2">{sku.volume_sold || '--'}</td>
                  <td className="py-3 px-2">{sku.price_elasticity || '--'}</td>
                  <td className="py-3 px-2">{sku.price?.toFixed(2) || '--'}</td>
                  <td className="py-3 px-2">{sku.rsv?.toFixed(2) || '--'}</td>
                  <td className="py-3 px-2">{sku.gp_mass?.toFixed(2) || '--'}</td>
                  <td className="py-3 px-2">{sku.volume_share || '--'}</td>
                  <td className="py-3 px-2">{sku.value_share || '--'}</td>
                  <td className="py-3 px-2">{sku.unit_sold?.toFixed(2) || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add SKUs to Analysis */}
      <div>
        <h2 className="text-2xl font-medium text-green-600 mb-6">Add SKUs to Analysis</h2>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex-1 relative">
            <div className="mb-1 text-sm font-medium text-gray-700">Search</div>
            <input
              type="text"
              placeholder="Search SKU"
              className="w-full px-4 py-2 border rounded-md pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute right-3 top-[35px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div>
            <div className="mb-1 text-sm font-medium text-gray-700">Ownership</div>
            <select 
              value={selectedOwnership}
              onChange={(e) => setSelectedOwnership(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white min-w-[120px]"
            >
              <option value="">ALL</option>
              <option value="OWN">OWN</option>
              <option value="COMPETITOR">COMPETITOR</option>
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-gray-700">Category</div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white min-w-[120px]"
            >
              <option value="">ALL</option>
              <option value="TOTAL BEER">BEER</option>
              <option value="TOTAL CIDER">CIDER</option>
              <option value="TOTAL WINE">WINE</option>
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-gray-700">Segment</div>
            <select 
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white min-w-[120px]"
            >
              <option value="">ALL</option>
              {availableSegments.filter(Boolean).map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Available SKUs Table */}
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">SKU Name</th>
                <th className="text-left py-3 px-4">Ownership</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Segment</th>
                <th className="text-right py-3 px-4">Select for analysis</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">Loading...</td>
                </tr>
              ) : availableSKUs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">No SKUs found</td>
                </tr>
              ) : (
                availableSKUs.map((sku, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">{sku.name}</td>
                    <td className="py-3 px-4">{sku.ownership}</td>
                    <td className="py-3 px-4">{sku.category}</td>
                    <td className="py-3 px-4">{sku.segment}</td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition-colors"
                        onClick={() => handleSelectSKU(sku)}
                      >
                        Select +
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SKUConfiguration; 