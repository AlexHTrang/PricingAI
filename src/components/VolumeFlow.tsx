import React from 'react';
import { SKU } from '../services/api';

type FlowStatus = 'at_fair_share' | 'above_fair_share' | 'below_fair_share' | 'na';

interface VolumeFlowProps {
  skusInAnalysis: SKU[];
  flowStatuses: { [key: string]: FlowStatus };
  onFlowStatusesUpdate: (statuses: { [key: string]: FlowStatus }) => void;
}

const VolumeFlow: React.FC<VolumeFlowProps> = ({ skusInAnalysis, flowStatuses, onFlowStatusesUpdate }) => {
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

  const handleStatusChange = (fromSku: string, toSku: string, newStatus: FlowStatus) => {
    const key1 = `${fromSku}-${toSku}`;
    const key2 = `${toSku}-${fromSku}`;
    
    onFlowStatusesUpdate({
      ...flowStatuses,
      [key1]: newStatus,
      [key2]: newStatus
    });
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

  // Placeholder function for volume flow percentage calculation
  const getVolumeFlowPercentage = (fromSku: string, toSku: string): string => {
    if (fromSku === toSku) return 'n.a.';
    return '0.00%';
  };

  return (
    <div className="p-6">
      {/* Configuration Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-green-600">Volume Flow configuration</h2>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
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
                  {skusInAnalysis.map(toSku => (
                    <td key={toSku.name} className="px-6 py-4 text-sm text-right">
                      {getVolumeFlowPercentage(fromSku.name, toSku.name)}
                    </td>
                  ))}
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