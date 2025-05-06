import React from 'react';
import { SKU } from '../services/api';

interface ResultsProps {
  skusInAnalysis: SKU[];
  priceChanges: { [key: string]: number };
  kValue: number;
  nValue: number;
}

interface ImpactData {
  percent: number | string;
  mass: string;
}

interface SKUImpact {
  name: string;
  volumeImpact: ImpactData;
  rsvImpact: ImpactData;
  volumeShare: ImpactData;
  valueShare: ImpactData;
  gpImpact: ImpactData;
}

const Results: React.FC<ResultsProps> = ({ skusInAnalysis, priceChanges, kValue, nValue }) => {
  const formatNumber = (value: number | string | undefined, suffix: string = '', isGP: boolean = false) => {
    if (value === undefined || value === null) return 'n.a.';
    if (typeof value === 'number') {
      const absValue = Math.abs(value);
      const formatted = absValue.toLocaleString('en-US', {
        minimumFractionDigits: suffix === 'm' ? 2 : isGP ? 0 : 2,
        maximumFractionDigits: suffix === 'm' ? 2 : isGP ? 0 : 2
      });
      return `${value < 0 ? '-' : ''}${formatted}${suffix}`;
    }
    return value;
  };

  const calculateMarketContraction = (sku: SKU): number => {
    // Calculate weighted average price change
    const totalVolumeSold = skusInAnalysis.reduce((sum, sku) => sum + (sku.volume_sold || 0), 0);
    const weightedPriceChange = skusInAnalysis.reduce((sum, sku) => {
      const priceChange = priceChanges[sku.name] / 100 || 0;
      const volumeSold = sku.volume_sold || 0;  // Convert to hectoliters
      return sum + (priceChange * volumeSold);
    }, 0) / totalVolumeSold;

    // Apply the market contraction formula
    const marketContraction = -kValue * Math.pow(weightedPriceChange, nValue) * Math.sign(totalVolumeSold) * 100;
    return marketContraction;
  };

  const calculateVolumeChangeFromOwnPrice = (sku: SKU): number => {
    const priceChange = priceChanges[sku.name] || 0;
    const priceElasticity = sku.price_elasticity || 0;
    return priceChange * priceElasticity;
  };

  // Calculate all volume impacts first
  const volumeImpactDetails = skusInAnalysis.map(sku => {
    const ownPriceChange = calculateVolumeChangeFromOwnPrice(sku);
    const othersPriceChange = 0; // Placeholder
    const marketContraction = calculateMarketContraction(sku);
    const netVolumeImpact = ownPriceChange + othersPriceChange + marketContraction;
    
    return {
      skuName: sku.name,
      ownPriceChange,
      othersPriceChange,
      marketContraction,
      netVolumeImpact
    };
  });

  // Calculate total volume sold across all SKUs in hectoliters
  const totalVolumeSoldHL = skusInAnalysis.reduce((sum, sku) => sum + ((sku.volume_sold || 0) / 100), 0);

  // Calculate impacts for each SKU using the pre-calculated volume impacts
  const calculateSKUImpacts = (sku: SKU): SKUImpact => {
    const volumeImpact = volumeImpactDetails.find(v => v.skuName === sku.name);
    const volumeImpactPercent = volumeImpact?.netVolumeImpact || 0;
    const volumeInHL = (sku.volume_sold || 0) / 100;
    const volumeImpactMass = volumeInHL * (volumeImpactPercent / 100);
    
    // Get price change from priceChanges
    const priceChange = priceChanges[sku.name] || 0;
    
    // Calculate RSV Impact using the formula
    const rsvImpactPercent = volumeImpactPercent + priceChange + (volumeImpactPercent * priceChange / 100);
    const rsvImpactMass = ((sku.rsv || 0) * (rsvImpactPercent / 100));

    // Calculate New Volume Market Share using current volume_share from SKU
    const currentVolumeMS = sku.volume_share || 0;
    const newVolume = volumeInHL + volumeImpactMass;
    const newVolumeMS = (newVolume / totalVolumeSoldHL) * 100;
    const volumeMSChange = newVolumeMS - currentVolumeMS;

    // Calculate GP Impact
    const currentGP = sku.gp || 0;
    const newGP = currentGP * (1 + priceChange / 100);  // Same calculation as in Price Configuration
    const gpImpactPerHL = newGP - currentGP;  // Absolute GP impact per hectoliter
    const gpImpactPercent = gpImpactPerHL + volumeImpactPercent + (gpImpactPerHL * volumeImpactPercent / 100);
    const totalGP = (sku.gp || 0) * volumeInHL;  // Total GP from SKU configuration
    const gpImpactMass = totalGP / 1000000 * (gpImpactPercent / 100);  // Convert to millions (divide by 1000)

    return {
      name: sku.name,
      volumeImpact: {
        percent: volumeImpactPercent,
        mass: `${volumeImpactMass.toFixed(2)} hL`
      },
      rsvImpact: {
        percent: rsvImpactPercent,
        mass: `${rsvImpactMass.toFixed(2)} €m`
      },
      volumeShare: {
        percent: newVolumeMS.toFixed(2) + '%',
        mass: `${volumeMSChange.toFixed(2)}pp`
      },
      valueShare: {
        percent: 'n.a.',
        mass: `${(rsvImpactPercent / 10).toFixed(1)}pp`
      },
      gpImpact: {
        percent: sku.ownership === 'OWN' ? gpImpactPercent : 'n.a.',
        mass: sku.ownership === 'OWN' ? `${gpImpactMass.toFixed(3)}m` : 'n.a.'
      }
    };
  };

  const skuImpacts = skusInAnalysis.map(calculateSKUImpacts);

  // Calculate portfolio level impacts
  const calculatePortfolioImpacts = (skuImpacts: SKUImpact[]) => {
    const ownSkuImpacts = skuImpacts.filter(impact => 
      skusInAnalysis.find(sku => sku.name === impact.name)?.ownership === 'OWN'
    );

    const totalVolumeImpact = ownSkuImpacts.reduce((sum, impact) => 
      sum + Number(impact.volumeImpact.percent), 0) / (ownSkuImpacts.length || 1);
    
    const totalRSVImpact = ownSkuImpacts.reduce((sum, impact) => 
      sum + Number(impact.rsvImpact.percent), 0) / (ownSkuImpacts.length || 1);

    const volumeMassImpact = ownSkuImpacts.reduce((sum, impact) => 
      sum + Number(impact.volumeImpact.mass.split(' ')[0]), 0);
    
    const rsvMassImpact = ownSkuImpacts.reduce((sum, impact) => 
      sum + Number(impact.rsvImpact.mass.split(' ')[0]), 0);

    return {
      volumeImpact: { percent: totalVolumeImpact.toFixed(0), mass: volumeMassImpact.toFixed(2) },
      rsvImpact: { percent: totalRSVImpact.toFixed(0), mass: rsvMassImpact.toFixed(2) },
      volumeShare: { percent: 'n.a.', mass: (volumeMassImpact * 0.2).toFixed(1) },
      valueShare: { percent: 'n.a.', mass: (rsvMassImpact * 0.2).toFixed(1) },
      gpImpact: { 
        percent: totalRSVImpact.toFixed(0), 
        mass: (rsvMassImpact * 0.3).toFixed(2) 
      }
    };
  };

  const portfolioImpacts = calculatePortfolioImpacts(skuImpacts);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium text-green-600 mb-6">Simulation Results</h2>
      
      {/* Portfolio Level Impact */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th colSpan={6} className="px-6 py-3 text-left text-lg font-medium text-gray-700 bg-gray-50">
                  Impact at portfolio level
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700"></th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Volume impact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">RSV impact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Volume market share impact (in pp only)</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Value market share impact (in pp only)</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">GP impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">%</td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.volumeImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatNumber(portfolioImpacts.volumeImpact.percent, '%')}
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.rsvImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatNumber(portfolioImpacts.rsvImpact.percent, '%')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{portfolioImpacts.volumeShare.percent}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{portfolioImpacts.valueShare.percent}</td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.gpImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatNumber(portfolioImpacts.gpImpact.percent, '%', true)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Mass</td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.volumeImpact.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.volumeImpact.mass}
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.rsvImpact.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.rsvImpact.mass}
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.volumeShare.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.volumeShare.mass}pp
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.valueShare.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.valueShare.mass}pp
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.gpImpact.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.gpImpact.mass}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SKU Level Impact */}
      <div>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th colSpan={7} className="px-6 py-3 text-left text-lg font-medium text-gray-700 bg-gray-50">
                  Impact at SKU level
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">SKU Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700"></th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Volume impact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">RSV Impact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">New Volume MS</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">New Value MS</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">GP Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {skuImpacts.map((sku, index) => (
                <React.Fragment key={sku.name}>
                  <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td rowSpan={2} className="px-6 py-4 text-sm text-gray-900">{sku.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">%</td>
                    <td className={`px-6 py-4 text-sm ${Number(sku.volumeImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(sku.volumeImpact.percent, '%')}
                    </td>
                    <td className={`px-6 py-4 text-sm ${Number(sku.rsvImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(sku.rsvImpact.percent, '%')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{sku.volumeShare.percent}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{sku.valueShare.percent}</td>
                    <td className={`px-6 py-4 text-sm ${sku.gpImpact.percent === 'n.a.' ? 'text-gray-500' : Number(sku.gpImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(sku.gpImpact.percent, '%', true)}
                    </td>
                  </tr>
                  <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">Mass</td>
                    <td className={`px-6 py-4 text-sm ${Number(sku.volumeImpact.mass.split(' ')[0]) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sku.volumeImpact.mass}
                    </td>
                    <td className={`px-6 py-4 text-sm ${Number(sku.rsvImpact.mass.split(' ')[0]) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sku.rsvImpact.mass}
                    </td>
                    <td className={`px-6 py-4 text-sm ${Number(sku.volumeShare.mass.split('pp')[0]) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sku.volumeShare.mass}
                    </td>
                    <td className={`px-6 py-4 text-sm ${Number(sku.valueShare.mass.split('pp')[0]) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sku.valueShare.mass}
                    </td>
                    <td className={`px-6 py-4 text-sm ${sku.gpImpact.mass === 'n.a.' ? 'text-gray-500' : Number(sku.gpImpact.mass.split('m')[0]) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(Number(sku.gpImpact.mass.split('m')[0]), 'm', true)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volume Impact */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th colSpan={5} className="px-6 py-3 text-left text-lg font-medium text-gray-700 bg-gray-50">
                  Volume Impact
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">SKU Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Volume change from own price change</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Volume change from others price change</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Market contraction</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Net Volume Impact</th>
              </tr>
            </thead>
            <tbody>
              {volumeImpactDetails.map((impact, index) => (
                <tr key={impact.skuName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900">{impact.skuName}</td>
                  <td className={`px-6 py-4 text-sm ${impact.ownPriceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(impact.ownPriceChange, '%')}
                  </td>
                  <td className={`px-6 py-4 text-sm ${impact.othersPriceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(impact.othersPriceChange, '%')}
                  </td>
                  <td className={`px-6 py-4 text-sm ${impact.marketContraction >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(impact.marketContraction, '%')}
                  </td>
                  <td className={`px-6 py-4 text-sm ${impact.netVolumeImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(impact.netVolumeImpact, '%')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Results; 