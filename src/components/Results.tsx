import React from 'react';
import { SKU } from '../services/api';
import { useGlobalContext } from '../context/GlobalContext';

type FlowStatus = 'at_fair_share' | 'above_fair_share' | 'below_fair_share' | 'na';

interface ResultsProps {
  skusInAnalysis: SKU[];
  priceChanges: { [key: string]: number };
  kValue: number;
  nValue: number;
  flowStatuses: { [key: string]: FlowStatus };
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

const Results: React.FC<ResultsProps> = ({ skusInAnalysis, priceChanges, kValue, nValue, flowStatuses }) => {
  const { marketData, isLoading } = useGlobalContext();

  if (isLoading) {
    return <div className="p-6">Loading market data...</div>;
  }

  const formatNumber = (value: number | string | undefined, suffix: string = '', isGP: boolean = false) => {
    if (value === undefined || value === null) return 'n.a.';
    if (typeof value === 'number') {
      const absValue = Math.abs(value);
      const formatted = absValue.toLocaleString('en-US', {
        minimumFractionDigits: suffix === 'm' ? 2 : isGP ? 0 : 2,
        maximumFractionDigits: suffix === 'm' ? 2 : isGP ? 0 : 2
      });
      const sign = value < 0 ? '-' : '';
      if (suffix === 'm') {
        return `${sign}${formatted} €m`;
      }
      return `${sign}${formatted}${suffix}`;
    }
    return value;
  };

  const calculateMarketContraction = (sku: SKU): number => {
    // Calculate weighted average price change using total market volume
    const weightedPriceChange = skusInAnalysis.reduce((sum, sku) => {
      const priceChange = priceChanges[sku.name] / 100 || 0;
      const volumeSold = sku.volume_sold || 0;  // Convert to hectoliters
      return sum + (priceChange * volumeSold);
    }, 0) / marketData.totalVolumeSoldHL;

    // Apply the market contraction formula
    const marketContraction = -kValue * Math.pow(weightedPriceChange, nValue) * Math.sign(marketData.totalVolumeSoldHL);
    return marketContraction;
  };

  const calculateVolumeChangeFromOwnPrice = (sku: SKU): number => {
    const priceChange = priceChanges[sku.name] || 0;
    const priceElasticity = sku.price_elasticity || 0;
    return priceChange * priceElasticity;
  };

  // Get volume market share from SKU configuration
  const getVolumeMS = (skuName: string): number => {
    const sku = skusInAnalysis.find(s => s.name === skuName);
    return sku?.volume_share || 0;
  };

  // Calculate Below Fair Share value
  const calculateBelowFairShare = (toSku: string): number => {
    const volumeMS = getVolumeMS(toSku);
    const option1 = 0.5 * volumeMS;

    const aboveFairShareSKUs = new Set<string>();
    const belowFairShareSKUs = new Set<string>();

    skusInAnalysis.forEach(fromSku => {
      skusInAnalysis.forEach(targetSku => {
        const status = getFlowStatus(fromSku.name, targetSku.name);
        if (status === 'above_fair_share') {
          aboveFairShareSKUs.add(targetSku.name);
        } else if (status === 'below_fair_share') {
          belowFairShareSKUs.add(targetSku.name);
        }
      });
    });

    const aboveFairShareMSSum = Array.from(aboveFairShareSKUs).reduce((sum, skuName) => {
      return sum + getVolumeMS(skuName);
    }, 0);

    const option2 = belowFairShareSKUs.size > 0 ? 
      volumeMS - ((0.5 * aboveFairShareMSSum) / belowFairShareSKUs.size) : 0;

    return Math.max(option1, option2);
  };

  // Calculate Above Fair Share value
  const calculateAboveFairShare = (toSku: string): number => {
    const volumeMS = getVolumeMS(toSku);
    const option1 = 1.5 * volumeMS;

    const aboveFairShareSKUs = new Set<string>();
    const belowFairShareSKUs = new Set<string>();

    skusInAnalysis.forEach(fromSku => {
      skusInAnalysis.forEach(targetSku => {
        const status = getFlowStatus(fromSku.name, targetSku.name);
        if (status === 'above_fair_share') {
          aboveFairShareSKUs.add(targetSku.name);
        } else if (status === 'below_fair_share') {
          belowFairShareSKUs.add(targetSku.name);
        }
      });
    });

    const belowFairShareMSSum = Array.from(belowFairShareSKUs).reduce((sum, skuName) => {
      return sum + getVolumeMS(skuName);
    }, 0);

    const option2 = aboveFairShareSKUs.size > 0 ? 
      volumeMS + ((0.5 * belowFairShareMSSum) / aboveFairShareSKUs.size) : 0;

    return Math.min(option1, option2);
  };

  // Get flow status for a pair of SKUs
  const getFlowStatus = (fromSku: string, toSku: string): FlowStatus => {
    if (fromSku === toSku) return 'na';
    const key = `${fromSku}-${toSku}`;
    return flowStatuses[key] || 'at_fair_share';
  };

  // Get volume flow percentage for a cell
  const getVolumeFlowPercentage = (fromSku: string, toSku: string): number => {
    if (fromSku === toSku) return 0;

    // Check if validation passes
    const hasAboveFairShare = Object.values(flowStatuses).some(status => status === 'above_fair_share');
    const hasBelowFairShare = Object.values(flowStatuses).some(status => status === 'below_fair_share');
    const isBalanced = (!hasAboveFairShare && !hasBelowFairShare) || (hasAboveFairShare && hasBelowFairShare);
    
    if (!isBalanced) {
      return 0;
    }

    const status = getFlowStatus(fromSku, toSku);
    
    switch (status) {
      case 'na':
        return 0;
      case 'at_fair_share':
        return getVolumeMS(toSku);
      case 'below_fair_share':
        return calculateBelowFairShare(toSku);
      case 'above_fair_share':
        return calculateAboveFairShare(toSku);
      default:
        return 0;
    }
  };

  // Calculate volume change from others price change using matrix product
  const calculateVolumeChangeFromOthers = (sku: SKU): number => {
    // Get the array of volume changes from own price changes for all SKUs
    const volumeChangesArray = skusInAnalysis.map(s => calculateVolumeChangeFromOwnPrice(s));

    // Get the volume flow matrix row for the current SKU
    const volumeFlowRow = skusInAnalysis.map(fromSku => getVolumeFlowPercentage(sku.name, fromSku.name) / 100);

    // Calculate matrix product (dot product of the row with volume changes array)
    const volumeChangeFromOthers = volumeFlowRow.reduce((sum, flowPercentage, index) => {
      // Skip the SKU's own volume change
      if (skusInAnalysis[index].name === sku.name) {
        return sum;
      }
      return sum + (flowPercentage * volumeChangesArray[index]);
    }, 0);

    // Negate the result to swap the sign
    return -volumeChangeFromOthers;
  };

  // Calculate all volume impacts first
  const volumeImpactDetails = skusInAnalysis.map(sku => {
    const ownPriceChange = calculateVolumeChangeFromOwnPrice(sku);
    const othersPriceChange = calculateVolumeChangeFromOthers(sku);
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

  // Calculate impacts for each SKU using the pre-calculated volume impacts
  const calculateSKUImpacts = (sku: SKU): SKUImpact => {
    const volumeImpact = volumeImpactDetails.find(v => v.skuName === sku.name);
    const volumeImpactPercent = volumeImpact?.netVolumeImpact || 0;
    const volumeInHL = (sku.volume_sold || 0) / 100;
    const volumeImpactMass = volumeInHL * (volumeImpactPercent / 100);
    
    const priceChange = priceChanges[sku.name] || 0;
    
    // Calculate RSV Impact using the formula
    const rsvImpactPercent = volumeImpactPercent + priceChange + (volumeImpactPercent * priceChange / 100);
    const rsvImpactMass = ((sku.rsv || 0) * (rsvImpactPercent / 100));

    // Calculate New Volume Market Share using current volume_share from SKU
    const currentVolumeMS = sku.volume_share || 0;
    const newVolume = volumeInHL + volumeImpactMass;
    const newVolumeMS = (newVolume / marketData.totalVolumeSoldHL) * 100;
    const volumeMSChange = newVolumeMS - currentVolumeMS;

    // Calculate New Value Market Share
    const currentValueMS = sku.value_share || 0;
    const currentRSV = sku.rsv || 0;
    const newRSV = currentRSV * (1 + rsvImpactPercent / 100);
    const newValueMS = (newRSV / marketData.totalRSVMillions) * 100;
    const valueMSChange = newValueMS - currentValueMS;

    // Calculate GP Impact
    const currentGP = sku.gp || 0;
    const newGP = currentGP * (1 + priceChange / 100);
    const gpImpactPerHL = newGP - currentGP;
    const gpImpactPercent = gpImpactPerHL + volumeImpactPercent + (gpImpactPerHL * volumeImpactPercent / 100);
    
    // Calculate GP Impact mass using the current GP mass and impact percentage
    const currentGPMass = sku.gp_mass || 0;  // This is already in millions
    const gpImpactMass = currentGPMass * (gpImpactPercent / 100);

    console.log('GP Impact calculation for', sku.name, {
      currentGP,
      newGP,
      gpImpactPerHL,
      gpImpactPercent,
      currentGPMass,
      gpImpactMass
    });

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
        percent: `${newVolumeMS.toFixed(2)}%`,
        mass: `${volumeMSChange.toFixed(2)} pp`
      },
      valueShare: {
        percent: `${newValueMS.toFixed(2)}%`,
        mass: `${valueMSChange.toFixed(2)} pp`
      },
      gpImpact: {
        percent: sku.ownership === 'OWN' ? gpImpactPercent : 'n.a.',
        mass: sku.ownership === 'OWN' ? `${gpImpactMass.toFixed(2)} €m` : 'n.a.'
      }
    };
  };

  const skuImpacts = skusInAnalysis.map(calculateSKUImpacts);

  // Calculate portfolio level impacts
  const calculatePortfolioImpacts = () => {
    // Filter for OWN SKUs
    const ownSkus = skusInAnalysis.filter(sku => sku.ownership === 'OWN');
    
    // Calculate Volume Impact using SUMPRODUCT formula
    const volumeSumProduct = ownSkus.reduce((sum, sku) => {
      const volumeImpact = volumeImpactDetails.find(v => v.skuName === sku.name)?.netVolumeImpact || 0;
      const volumeSold = sku.volume_sold || 0;
      return sum + (volumeImpact * volumeSold);
    }, 0);
    
    const totalOwnVolume = ownSkus.reduce((sum, sku) => sum + (sku.volume_sold || 0), 0);
    const portfolioVolumeImpactPercent = totalOwnVolume ? (volumeSumProduct / totalOwnVolume) : 0;

    // Calculate total volume impact mass by summing individual SKU impacts
    const volumeImpactMass = ownSkus.reduce((sum, sku) => {
      const volumeImpact = volumeImpactDetails.find(v => v.skuName === sku.name)?.netVolumeImpact || 0;
      const volumeInHL = (sku.volume_sold || 0) / 100;  // Convert to hectoliters
      const skuVolumeImpact = volumeInHL * (volumeImpact / 100);  // Convert percentage to decimal
      return sum + skuVolumeImpact;
    }, 0);

    // Calculate RSV Impact using SUMPRODUCT formula
    const rsvSumProduct = ownSkus.reduce((sum, sku) => {
      const impact = skuImpacts.find(impact => impact.name === sku.name);
      const rsvImpact = impact ? Number(impact.rsvImpact.percent) : 0;
      const currentRSV = sku.rsv || 0;
      return sum + (rsvImpact * currentRSV);
    }, 0);

    const totalOwnRSV = ownSkus.reduce((sum, sku) => sum + (sku.rsv || 0), 0);
    const portfolioRSVImpactPercent = totalOwnRSV ? (rsvSumProduct / totalOwnRSV) : 0;

    // Calculate RSV impact mass
    const rsvImpactMass = ownSkus.reduce((sum, sku) => {
      const impact = skuImpacts.find(impact => impact.name === sku.name);
      const rsvImpactValue = impact ? Number(impact.rsvImpact.mass.split(' ')[0]) : 0;
      return sum + rsvImpactValue;
    }, 0);

    // Calculate Portfolio Volume Market Share Impact
    // First calculate total volume sold and impacts for OWN SKUs
    const totalOwnVolumeSoldHL = ownSkus.reduce((sum, sku) => sum + ((sku.volume_sold || 0) / 100), 0);
    const totalOwnVolumeImpactHL = ownSkus.reduce((sum, sku) => {
      const volumeImpact = volumeImpactDetails.find(v => v.skuName === sku.name)?.netVolumeImpact || 0;
      const volumeInHL = (sku.volume_sold || 0) / 100;
      return sum + (volumeInHL * (volumeImpact / 100));
    }, 0);

    // Calculate total volume sold and impacts for ALL SKUs
    const totalAllVolumeSoldHL = skusInAnalysis.reduce((sum, sku) => sum + ((sku.volume_sold || 0) / 100), 0);
    const totalAllVolumeImpactHL = skusInAnalysis.reduce((sum, sku) => {
      const volumeImpact = volumeImpactDetails.find(v => v.skuName === sku.name)?.netVolumeImpact || 0;
      const volumeInHL = (sku.volume_sold || 0) / 100;
      return sum + (volumeInHL * (volumeImpact / 100));
    }, 0);

    // Calculate current and new market shares
    const currentVolumeMS = (totalOwnVolumeSoldHL / totalAllVolumeSoldHL) * 100;
    const newVolumeMS = ((totalOwnVolumeSoldHL + totalOwnVolumeImpactHL) / (totalAllVolumeSoldHL + totalAllVolumeImpactHL)) * 100;
    const volumeMSImpact = newVolumeMS - currentVolumeMS;

    console.log('Portfolio Volume MS Impact calculation:', {
      totalOwnVolumeSoldHL,
      totalOwnVolumeImpactHL,
      totalAllVolumeSoldHL,
      totalAllVolumeImpactHL,
      currentVolumeMS,
      newVolumeMS,
      volumeMSImpact
    });

    // Calculate Portfolio Value Market Share Impact
    // First calculate total RSV and impacts for OWN SKUs
    const totalOwnRSVImpact = ownSkus.reduce((sum, sku) => {
      const impact = skuImpacts.find(impact => impact.name === sku.name);
      const rsvImpactPercent = impact ? Number(impact.rsvImpact.percent) : 0;
      const currentRSV = sku.rsv || 0;
      return sum + (currentRSV * (rsvImpactPercent / 100));
    }, 0);

    // Calculate total RSV and impacts for ALL SKUs
    const totalAllRSV = skusInAnalysis.reduce((sum, sku) => sum + (sku.rsv || 0), 0);
    const totalAllRSVImpact = skusInAnalysis.reduce((sum, sku) => {
      const impact = skuImpacts.find(impact => impact.name === sku.name);
      const rsvImpactPercent = impact ? Number(impact.rsvImpact.percent) : 0;
      const currentRSV = sku.rsv || 0;
      return sum + (currentRSV * (rsvImpactPercent / 100));
    }, 0);

    // Calculate current and new value market shares
    const currentValueMS = (totalOwnRSV / totalAllRSV) * 100;
    const newValueMS = ((totalOwnRSV + totalOwnRSVImpact) / (totalAllRSV + totalAllRSVImpact)) * 100;
    const valueMSImpact = newValueMS - currentValueMS;

    console.log('Portfolio Value MS Impact calculation:', {
      totalOwnRSV,
      totalOwnRSVImpact,
      totalAllRSV,
      totalAllRSVImpact,
      currentValueMS,
      newValueMS,
      valueMSImpact
    });

    // Calculate GP Impact using SUMPRODUCT formula
    const gpSumProduct = ownSkus.reduce((sum, sku) => {
      const impact = skuImpacts.find(impact => impact.name === sku.name);
      const gpImpactPercent = impact && impact.gpImpact.percent !== 'n.a.' ? Number(impact.gpImpact.percent) : 0;
      const currentGPMass = sku.gp_mass || 0;
      return sum + (gpImpactPercent * currentGPMass);
    }, 0);

    const totalOwnGPMass = ownSkus.reduce((sum, sku) => sum + (sku.gp_mass || 0), 0);
    const portfolioGPImpactPercent = totalOwnGPMass ? (gpSumProduct / totalOwnGPMass) : 0;

    // Calculate total GP impact mass by summing individual SKU impacts
    const gpImpactMass = ownSkus.reduce((sum, sku) => {
      const impact = skuImpacts.find(impact => impact.name === sku.name);
      const gpImpactValue = impact && impact.gpImpact.mass !== 'n.a.' ? Number(impact.gpImpact.mass.split(' ')[0]) : 0;
      return sum + gpImpactValue;
    }, 0);

    console.log('Portfolio GP Impact calculation:', {
      gpSumProduct,
      totalOwnGPMass,
      portfolioGPImpactPercent,
      gpImpactMass
    });

    return {
      volumeImpact: {
        percent: portfolioVolumeImpactPercent.toFixed(2),
        mass: volumeImpactMass.toFixed(2)
      },
      rsvImpact: {
        percent: portfolioRSVImpactPercent.toFixed(2),
        mass: rsvImpactMass.toFixed(2)
      },
      volumeShare: { 
        percent: newVolumeMS.toFixed(1),
        mass: volumeMSImpact.toFixed(2)
      },
      valueShare: { 
        percent: newValueMS.toFixed(1),
        mass: valueMSImpact.toFixed(2)
      },
      gpImpact: {
        percent: portfolioGPImpactPercent.toFixed(2),
        mass: gpImpactMass.toFixed(2)
      }
    };
  };

  const portfolioImpacts = calculatePortfolioImpacts();

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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Volume MS Impact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Value MS Impact</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">GP impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">%</td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.volumeImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.volumeImpact.percent} %
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.rsvImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.rsvImpact.percent} %
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{portfolioImpacts.volumeShare.percent} %</td>
                <td className="px-6 py-4 text-sm text-gray-500">{portfolioImpacts.valueShare.percent} %</td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.gpImpact.percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.gpImpact.percent} %
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Mass</td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.volumeImpact.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.volumeImpact.mass} hL
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.rsvImpact.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.rsvImpact.mass} €m
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.volumeShare.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.volumeShare.mass} pp
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.valueShare.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.valueShare.mass} pp
                </td>
                <td className={`px-6 py-4 text-sm ${Number(portfolioImpacts.gpImpact.mass) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioImpacts.gpImpact.mass} €m
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
                    <td className={`px-6 py-4 text-sm ${sku.gpImpact.mass === 'n.a.' ? 'text-gray-500' : Number(sku.gpImpact.mass.split(' ')[0]) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sku.gpImpact.mass}
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