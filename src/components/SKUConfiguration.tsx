import React, { useState, useEffect, useMemo } from 'react';
import { api, SKU } from '../services/api';

interface SKUConfigurationProps {
  onSkusInAnalysisChange: (skus: SKU[]) => void;
  skusInAnalysis: SKU[];
}

const SKUConfiguration: React.FC<SKUConfigurationProps> = ({ onSkusInAnalysisChange, skusInAnalysis }) => {
  const formatNumber = (value: number | undefined, decimals: number = 2) => {
    if (value === undefined || value === null) return '--';
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const calculateNewGP = (currentGP: number, priceChangePercent: number) => {
    return currentGP * (1 + priceChangePercent / 100);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedSKUs, setSelectedSKUs] = useState<string[]>([]);
  const [availableSKUs, setAvailableSKUs] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(false);
  const [allSKUs, setAllSKUs] = useState<SKU[]>([]);
  const [priceChanges, setPriceChanges] = useState<Record<string, number>>({});

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
      // Debug log to check specific SKU data
      if (skus.length > 0) {
        console.log('First SKU data:', {
          name: skus[0].name,
          volume: skus[0].volume,
          customer_price: skus[0].customer_price,
          gp: skus[0].gp,
          volume_sold: skus[0].volume_sold,
          price_elasticity: skus[0].price_elasticity,
          price: skus[0].price,
          rsv: skus[0].rsv,
          gp_mass: skus[0].gp_mass,
          unit_sold: skus[0].unit_sold,
          volume_share: skus[0].volume_share,
          value_share: skus[0].value_share
        });
      }
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

  const handlePriceChangeInput = (skuName: string, value: string) => {
    const newPriceChange = parseFloat(value);
    setPriceChanges(prev => ({
      ...prev,
      [skuName]: newPriceChange
    }));
  };

  const calculateNewPrice = (currentPrice: number, priceChangePercent: number) => {
    return currentPrice * (1 + priceChangePercent / 100);
  };

  return (
    <div className="p-4 md:p-6">
      {/* SKUs in Analysis */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-medium">SKUs in Analysis</h3>
          <button className="text-gray-400 hover:text-gray-600" title="2025 Sales data">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        <div className="w-full">
          <div className="border rounded-lg shadow">
            <div className="w-full">
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 border-r font-bold w-12"></th>
                    <th className="text-left py-3 px-4 border-r font-bold text-gray-700 w-[20%]">SKU Name</th>
                    <th className="text-left py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden sm:table-cell">Ownership</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden lg:table-cell">Volume (L/Units)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[12%] hidden md:table-cell">Customer Price (€/unit)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden xl:table-cell">GP (€/hL)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden lg:table-cell">Volume sold (L)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden xl:table-cell">Price elasticity</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden md:table-cell">Price (€/L)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden lg:table-cell">Total RSV (€m)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden xl:table-cell">Total GP (€m)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden 2xl:table-cell">Volume MS (%)</th>
                    <th className="text-right py-3 px-4 border-r font-bold text-gray-700 w-[10%] hidden 2xl:table-cell">Value MS (%)</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-700 w-[10%] hidden lg:table-cell">Unit sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {skusInAnalysis.map((sku, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 border-r w-12">
                        <button 
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleRemoveSKU(sku)}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-3 px-4 border-r whitespace-nowrap overflow-hidden text-ellipsis">{sku.name}</td>
                      <td className="py-3 px-4 border-r whitespace-nowrap hidden sm:table-cell">{sku.ownership}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden lg:table-cell">{formatNumber(sku.volume)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden md:table-cell">{formatNumber(sku.customer_price)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden xl:table-cell">{formatNumber(sku.gp, 4)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden lg:table-cell">{formatNumber(sku.volume_sold, 0)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden xl:table-cell">{formatNumber(sku.price_elasticity, 1)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden md:table-cell">{formatNumber(sku.price)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden lg:table-cell">{formatNumber(sku.rsv, 2)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden xl:table-cell">{formatNumber(sku.gp_mass, 2)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden 2xl:table-cell">{formatNumber(sku.volume_share)}</td>
                      <td className="py-3 px-4 border-r text-right whitespace-nowrap hidden 2xl:table-cell">{formatNumber(sku.value_share)}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap hidden lg:table-cell">{formatNumber(sku.unit_sold, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add SKUs to Analysis */}
      <div>
        <h2 className="text-xl md:text-2xl font-medium text-green-600 mb-4 md:mb-6">Add SKUs to Analysis</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6 md:mb-8">
          <div className="flex-1 relative">
            <div className="mb-1 text-sm font-medium text-gray-700">Search</div>
            <input
              type="text"
              placeholder="Search SKU"
              className="w-full px-3 md:px-4 py-2 border rounded-md pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute right-3 top-[35px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">Ownership</div>
              <select 
                value={selectedOwnership}
                onChange={(e) => setSelectedOwnership(e.target.value)}
                className="w-full px-3 md:px-4 py-2 border rounded-md bg-white"
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
                className="w-full px-3 md:px-4 py-2 border rounded-md bg-white"
              >
                <option value="">ALL</option>
                <option value="TOTAL BEER">BEER</option>
                <option value="TOTAL CIDER">CIDER</option>
                <option value="TOTAL WINE">WINE</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <div className="mb-1 text-sm font-medium text-gray-700">Segment</div>
              <select 
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full px-3 md:px-4 py-2 border rounded-md bg-white"
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
        </div>

        {/* Available SKUs Table */}
        <div className="w-full">
          <div className="border rounded-lg shadow">
            <div className="w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm md:text-base font-bold w-[40%]">SKU Name</th>
                    <th className="text-left py-3 px-4 text-sm md:text-base font-bold w-[20%] hidden sm:table-cell">Ownership</th>
                    <th className="text-left py-3 px-4 text-sm md:text-base font-bold w-[20%] hidden md:table-cell">Category</th>
                    <th className="text-left py-3 px-4 text-sm md:text-base font-bold w-[20%] hidden lg:table-cell">Segment</th>
                    <th className="text-right py-3 px-4 text-sm md:text-base font-bold">Select</th>
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
                        <td className="py-2 md:py-3 px-3 md:px-4 text-sm md:text-base overflow-hidden text-ellipsis whitespace-nowrap">{sku.name}</td>
                        <td className="py-2 md:py-3 px-3 md:px-4 text-sm md:text-base whitespace-nowrap hidden sm:table-cell">{sku.ownership}</td>
                        <td className="py-2 md:py-3 px-3 md:px-4 text-sm md:text-base whitespace-nowrap hidden md:table-cell">{sku.category}</td>
                        <td className="py-2 md:py-3 px-3 md:px-4 text-sm md:text-base whitespace-nowrap hidden lg:table-cell">{sku.segment}</td>
                        <td className="py-2 md:py-3 px-3 md:px-4 text-right">
                          <button 
                            className="bg-green-500 text-white px-3 md:px-4 py-1 rounded text-sm md:text-base hover:bg-green-600 transition-colors"
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
      </div>
    </div>
  );
};

export default SKUConfiguration; 