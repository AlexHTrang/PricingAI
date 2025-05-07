import React, { useState } from 'react';
import { SKU } from '../services/api';

type FlowStatus = 'at_fair_share' | 'above_fair_share' | 'below_fair_share' | 'na';

interface VolumeFlowProps {
  skusInAnalysis: SKU[];
  flowStatuses: { [key: string]: FlowStatus };
  onFlowStatusesUpdate: (statuses: { [key: string]: FlowStatus }) => void;
}

const VolumeFlow: React.FC<VolumeFlowProps> = ({ skusInAnalysis, flowStatuses, onFlowStatusesUpdate }) => {
  const [warningMessage, setWarningMessage] = useState<string>('');

  const validateFairShareBalance = (statuses: { [key: string]: FlowStatus }): boolean => {
    const hasAboveFairShare = Object.values(statuses).some(status => status === 'above_fair_share');
    const hasBelowFairShare = Object.values(statuses).some(status => status === 'below_fair_share');

    return (!hasAboveFairShare && !hasBelowFairShare) || (hasAboveFairShare && hasBelowFairShare);
  };

  const handleStatusChange = (fromSku: string, toSku: string, newStatus: FlowStatus) => {
    const key = `${fromSku}-${toSku}`;
    const newStatuses = {
      ...flowStatuses,
      [key]: newStatus
    };
    
    if (!validateFairShareBalance(newStatuses)) {
      if (newStatus === 'above_fair_share') {
        setWarningMessage('Warning: When using "Above fair share", at least one "Below fair share" should exist for balance. Please adjust to continue the Calculation for Volume Matrix Flow.');
      } else if (newStatus === 'below_fair_share') {
        setWarningMessage('Warning: When using "Below fair share", at least one "Above fair share" should exist for balance. Please adjust to continue the Calculation for Volume Matrix Flow.');
      } else if (newStatus === 'at_fair_share') {
        // Check which type of imbalance would be created
        const hasAbove = Object.values(newStatuses).some(status => status === 'above_fair_share');
        const hasBelow = Object.values(newStatuses).some(status => status === 'below_fair_share');
        
        if (hasAbove) {
          setWarningMessage('Warning: Changing to "At fair share" would leave "Above fair share" without a corresponding "Below fair share". Please adjust to continue the Calculation for Volume Matrix Flow.');
        } else if (hasBelow) {
          setWarningMessage('Warning: Changing to "At fair share" would leave "Below fair share" without a corresponding "Above fair share". Please adjust to continue the Calculation for Volume Matrix Flow.');
        }
      }
    } else {
      setWarningMessage(''); // Clear warning if validation passes
    }
    
    onFlowStatusesUpdate(newStatuses);
  };

  const getStatusColor = (status: FlowStatus) => {
    switch (status) {
      case 'at_fair_share':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'above_fair_share':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'below_fair_share':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: FlowStatus) => {
    switch (status) {
      case 'at_fair_share':
        return 'At fair share';
      case 'above_fair_share':
        return 'Above fair share';
      case 'below_fair_share':
        return 'Below fair share';
      default:
        return 'n.a.';
    }
  };

  const getStatusArrow = (status: FlowStatus) => {
    switch (status) {
      case 'at_fair_share':
        return '▼';
      case 'above_fair_share':
        return '▲';
      case 'below_fair_share':
        return '▼';
      default:
        return '▼';
    }
  };

  const getFlowStatus = (fromSku: string, toSku: string): FlowStatus => {
    if (fromSku === toSku) return 'na';
    const key = `${fromSku}-${toSku}`;
    return flowStatuses[key] || 'at_fair_share';
  };

  const renderStatusDropdown = (fromSku: string, toSku: string) => {
    const status = getFlowStatus(fromSku, toSku);
    if (status === 'na') {
      return (
        <div className="inline-block w-40 px-3 py-1 bg-gray-100 text-gray-700 rounded-md">
          <span className="text-sm">n.a.</span>
        </div>
      );
    }

    return (
      <div className={`inline-block w-40 rounded-md ${getStatusColor(status)}`}>
        <select
          value={status}
          onChange={(e) => handleStatusChange(fromSku, toSku, e.target.value as FlowStatus)}
          className={`w-full px-3 py-1 rounded-md border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-0 ${getStatusColor(status)}`}
          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
        >
          <option value="above_fair_share">Above fair share</option>
          <option value="at_fair_share">At fair share</option>
          <option value="below_fair_share">Below fair share</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  };

  // Get volume market share from SKU configuration (volume_share)
  const getVolumeMS = (skuName: string): number => {
    const sku = skusInAnalysis.find(s => s.name === skuName);
    const volumeShare = sku?.volume_share || 0;
    console.log(`Getting Volume MS for ${skuName} from SKU configuration:`, { 
      skuName, 
      configuredVolumeShare: volumeShare 
    });
    return volumeShare;
  };

  // Calculate Below Fair Share value
  const calculateBelowFairShare = (toSku: string): number => {
    // Get Volume MS from SKU configuration
    const volumeMS = getVolumeMS(toSku);
    const option1 = 0.5 * volumeMS;

    // Get unique SKUs with Above Fair Share and Below Fair Share
    const aboveFairShareSKUs = new Set<string>();
    const belowFairShareSKUs = new Set<string>();

    // First pass: identify unique SKUs with Above/Below Fair Share
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

    // Calculate sum of Volume MS for Above Fair Share SKUs
    const aboveFairShareMSSum = Array.from(aboveFairShareSKUs).reduce((sum, skuName) => {
      return sum + getVolumeMS(skuName);
    }, 0);

    // Calculate option 2
    const option2 = belowFairShareSKUs.size > 0 ? 
      volumeMS - ((0.5 * aboveFairShareMSSum) / belowFairShareSKUs.size) : 0;

    console.log(`Below Fair Share calculation for ${toSku}:`, {
      volumeMS,
      option1,
      option2,
      aboveFairShareSKUs: Array.from(aboveFairShareSKUs),
      belowFairShareSKUs: Array.from(belowFairShareSKUs),
      aboveFairShareMSSum,
      belowFairShareCount: belowFairShareSKUs.size
    });

    // Return the higher value between option1 and option2
    return Math.max(option1, option2);
  };

  // Calculate Above Fair Share value
  const calculateAboveFairShare = (toSku: string): number => {
    // Get Volume MS from SKU configuration
    const volumeMS = getVolumeMS(toSku);
    const option1 = 1.5 * volumeMS;

    // Get unique SKUs with Above Fair Share and Below Fair Share
    const aboveFairShareSKUs = new Set<string>();
    const belowFairShareSKUs = new Set<string>();

    // First pass: identify unique SKUs with Above/Below Fair Share
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

    // Calculate sum of Volume MS for Below Fair Share SKUs
    const belowFairShareMSSum = Array.from(belowFairShareSKUs).reduce((sum, skuName) => {
      return sum + getVolumeMS(skuName);
    }, 0);

    // Calculate option 2
    const option2 = aboveFairShareSKUs.size > 0 ? 
      volumeMS + ((0.5 * belowFairShareMSSum) / aboveFairShareSKUs.size) : 0;

    console.log(`Above Fair Share calculation for ${toSku}:`, {
      volumeMS,
      option1,
      option2,
      aboveFairShareSKUs: Array.from(aboveFairShareSKUs),
      belowFairShareSKUs: Array.from(belowFairShareSKUs),
      belowFairShareMSSum,
      aboveFairShareCount: aboveFairShareSKUs.size
    });

    // Return the lower value between option1 and option2
    return Math.min(option1, option2);
  };

  // Get volume flow percentage for a cell
  const getVolumeFlowPercentage = (fromSku: string, toSku: string): string => {
    if (fromSku === toSku) return '0.00%';

    // Check if validation passes
    if (!validateFairShareBalance(flowStatuses)) {
      return '0.00%';
    }

    const status = getFlowStatus(fromSku, toSku);
    
    switch (status) {
      case 'na':
        return '0.00%';
      case 'at_fair_share':
        return `${getVolumeMS(toSku).toFixed(2)}%`;
      case 'below_fair_share':
        return `${calculateBelowFairShare(toSku).toFixed(2)}%`;
      case 'above_fair_share':
        return `${calculateAboveFairShare(toSku).toFixed(2)}%`;
      default:
        return '0.00%';
    }
  };

  return (
    <div className="p-6">
      {/* Configuration Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-green-600">Volume Flow configuration</h2>
          <div className="flex items-center">
            <button className="p-2 text-gray-400 hover:text-gray-600 group relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                Rule: If there is at least one "Above Fair Share" selection, there must be at least one "Below Fair Share" selection, and vice versa.
              </div>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 flex items-center space-x-6 bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-700">Legend:</div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Above fair share</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded mr-2"></div>
            <span className="text-sm text-gray-600">At fair share</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Below fair share</span>
          </div>
        </div>
        
        {/* Configuration Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">SKU Name</th>
                {skusInAnalysis.map(sku => (
                  <th key={sku.name} className="px-6 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">
                    {sku.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skusInAnalysis.map((fromSku, rowIndex) => (
                <tr key={fromSku.name} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900 sticky left-0 z-10 bg-inherit">{fromSku.name}</td>
                  {skusInAnalysis.map(toSku => (
                    <td key={toSku.name} className="px-6 py-4 relative">
                      {renderStatusDropdown(fromSku.name, toSku.name)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Message */}
      {warningMessage && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-700">{warningMessage}</span>
          </div>
        </div>
      )}

      {/* Volume Flow Matrix Section */}
      <div>
        <h2 className="text-2xl font-medium text-green-600 mb-6">Volume Flow matrix</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">SKU Name</th>
                {skusInAnalysis.map(sku => (
                  <th key={sku.name} className="px-6 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">
                    {sku.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skusInAnalysis.map((fromSku, rowIndex) => (
                <tr key={fromSku.name} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900 sticky left-0 z-10 bg-inherit">{fromSku.name}</td>
                  {skusInAnalysis.map(toSku => {
                    const flowPercentage = getVolumeFlowPercentage(fromSku.name, toSku.name);
                    const isZeroPercent = flowPercentage === '0.00%';
                    return (
                      <td 
                        key={toSku.name} 
                        className={`px-6 py-4 text-sm text-right ${isZeroPercent ? 'text-gray-400' : 'text-gray-900'}`}
                      >
                        {flowPercentage}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VolumeFlow; 