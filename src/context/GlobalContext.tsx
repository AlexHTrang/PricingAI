import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface GlobalMarketData {
  totalVolumeSoldHL: number;
  totalRSVMillions: number;
}

interface GlobalContextType {
  marketData: GlobalMarketData;
  isLoading: boolean;
}

const GlobalContext = createContext<GlobalContextType>({
  marketData: {
    totalVolumeSoldHL: 0,
    totalRSVMillions: 0
  },
  isLoading: true
});

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<GlobalMarketData>({
    totalVolumeSoldHL: 0,
    totalRSVMillions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const allSKUs = await api.getAllSKUs();
        
        // Calculate total volume sold in hectoliters (divide by 100 to convert from liters)
        const totalVolume = allSKUs.reduce((sum, sku) => sum + (sku.volume_sold || 0), 0) / 100;
        
        // Calculate total RSV in millions
        const totalRSV = allSKUs.reduce((sum, sku) => sum + (sku.rsv || 0), 0);

        setMarketData({
          totalVolumeSoldHL: totalVolume,
          totalRSVMillions: totalRSV
        });
      } catch (error) {
        console.error('Error fetching global market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalData();
  }, []);

  return (
    <GlobalContext.Provider value={{ marketData, isLoading }}>
      {children}
    </GlobalContext.Provider>
  );
}; 