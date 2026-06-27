import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, getFullLabelUrl } from '../api/axios';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  X
} from 'lucide-react';

export default function Shipments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);

  // Fetch all shipments
  const { data: shipments = [], isLoading } = useQuery<any[]>({
    queryKey: ['shipments'],
    queryFn: async () => {
      const res = await apiClient.get('/shipments');
      return res.data;
    },
    refetchInterval: 15000,
  });

  // Filter shipments locally
  const filteredShipments = shipments.filter((s: any) => {
    const matchesSearch = 
      (s.awbNo && s.awbNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.toCountry && s.toCountry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.referenceNo && s.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in select-none">
      {/* Title block */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
          Cargo Air Waybills
        </h1>
        <p className="text-slate-400 text-sm">
          Track logistics status, print package labels, and monitor transit exceptions.
        </p>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search AWB, Reference, or Country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Filter size={14} />
            <span className="font-semibold uppercase tracking-wider">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-850 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="ALL" className="bg-slate-900">All Shipments</option>
            <option value="BOOKED" className="bg-slate-900">Booked</option>
            <option value="PICKED_UP" className="bg-slate-900">Picked Up</option>
            <option value="IN_TRANSIT" className="bg-slate-900">In Transit</option>
            <option value="OUT_FOR_DELIVERY" className="bg-slate-900">Out For Delivery</option>
            <option value="DELIVERED" className="bg-slate-900">Delivered</option>
            <option value="CANCELLED" className="bg-slate-900">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">AWB Number</th>
                <th className="py-4 px-6">Reference No</th>
                <th className="py-4 px-6">Destination</th>
                <th className="py-4 px-6">Carrier Partner</th>
                <th className="py-4 px-6">Actual / Vol Weight</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Booked Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading airwaybills feed...
                  </td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No shipments found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s: any) => {
                  const selectedRate = s.rates?.find((r: any) => r.isSelected) || s.rates?.[0];
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-white">
                        {s.awbNo || 'PENDING'}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                        {s.referenceNo || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-200 font-medium">{s.toCountry}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{s.toCity || 'Zone Standard'}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {selectedRate?.partner?.name || 'FlightGo Partner'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-200 font-semibold">{s.weight} kg</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Vol: {s.volumetricWeight || 0} kg</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'DELIVERED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : s.status === 'BOOKED'
                            ? 'bg-blue-500/10 text-brand-400 border border-brand-500/20'
                            : s.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        <div>
                          {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {/* Quick Label PDF Download */}
                        {s.labelUrl && (
                          <a
                            href={getFullLabelUrl(s.labelUrl)}
                            target="_blank"
                            rel="noreferrer"
                            title="Download label"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-500/30 transition-colors"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        {/* Detail Modal Action */}
                        <button
                          onClick={() => setSelectedShipment(s)}
                          title="View Details"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-500/30 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Details Drawer / Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl relative select-none">
            
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Waybill Details</h3>
                <p className="font-mono text-xs text-brand-400 mt-0.5">{selectedShipment.awbNo}</p>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Status block */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Current Transit Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    selectedShipment.status === 'DELIVERED' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-brand-400 border border-brand-500/20'
                  }`}>
                    {selectedShipment.status}
                  </span>
                </div>
                
                {/* Visual mini-timeline */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase pt-2">
                  <div className="flex flex-col items-center space-y-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500 ring-4 ring-brand-500/20" />
                    <span className="text-brand-400">Booked</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-brand-500/30 mx-2" />
                  <div className="flex flex-col items-center space-y-1.5">
                    <span className={`w-2 h-2 rounded-full ${['PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'].includes(selectedShipment.status) ? 'bg-brand-500 ring-4 ring-brand-500/20' : 'bg-slate-800'}`} />
                    <span className={['PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'].includes(selectedShipment.status) ? 'text-brand-400' : ''}>Transit</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-slate-800 mx-2" />
                  <div className="flex flex-col items-center space-y-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedShipment.status === 'DELIVERED' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-800'}`} />
                    <span className={selectedShipment.status === 'DELIVERED' ? 'text-emerald-400' : ''}>Delivered</span>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Package Details</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-950/20 border border-slate-850/60 rounded-2xl p-4 text-xs">
                  <div>
                    <p className="text-slate-500">Package Type</p>
                    <p className="font-semibold text-slate-200 mt-1 capitalize">{selectedShipment.packageType.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Transit Mode</p>
                    <p className="font-semibold text-slate-200 mt-1 capitalize">{selectedShipment.shipmentType.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Actual Weight</p>
                    <p className="font-semibold text-slate-200 mt-1">{selectedShipment.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Volumetric Weight</p>
                    <p className="font-semibold text-slate-200 mt-1">{selectedShipment.volumetricWeight || '0.00'} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Package Dimensions (L × W × H)</p>
                    <p className="font-semibold text-slate-200 mt-1">
                      {selectedShipment.length || '0'} cm × {selectedShipment.width || '0'} cm × {selectedShipment.height || '0'} cm
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Add-on Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Services Checked</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Signature Required', val: selectedShipment.signatureRequired },
                    { label: 'Special Handling', val: selectedShipment.specialHandling },
                    { label: 'Insurance Cover', val: selectedShipment.insurance },
                    { label: 'Non-Standard Goods', val: selectedShipment.nonStandardGoods },
                  ].map((srv, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center space-x-2.5 border rounded-xl p-3 text-xs ${
                        srv.val 
                          ? 'border-brand-500/20 bg-brand-500/5 text-brand-400 font-semibold' 
                          : 'border-slate-850 bg-slate-950/20 text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${srv.val ? 'bg-brand-500' : 'bg-slate-800'}`} />
                      <span>{srv.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipient Details</h4>
                <div className="bg-slate-950/20 border border-slate-850/60 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination Country</span>
                    <span className="font-semibold text-slate-200">{selectedShipment.toCountry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">City / Zone</span>
                    <span className="font-semibold text-slate-200">{selectedShipment.toCity || 'Zone Standard'}</span>
                  </div>
                  {selectedShipment.toState && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">State / Region</span>
                      <span className="font-semibold text-slate-200">{selectedShipment.toState}</span>
                    </div>
                  )}
                  {selectedShipment.remarks && (
                    <div className="border-t border-slate-900 pt-2.5 mt-1">
                      <p className="text-slate-500">Remarks</p>
                      <p className="text-slate-300 mt-1 leading-normal italic font-medium">"{selectedShipment.remarks}"</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Print Label Footer */}
            {selectedShipment.labelUrl && (
              <div className="p-6 border-t border-slate-800 bg-slate-950/20">
                <a
                  href={getFullLabelUrl(selectedShipment.labelUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all duration-200"
                >
                  <Download size={14} className="mr-2" /> Download Air Waybill Label
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
