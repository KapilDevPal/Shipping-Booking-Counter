import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, getFullLabelUrl } from '../api/axios';
import { 
  Sparkles, 
  Search, 
  HelpCircle, 
  MapPin, 
  Scale, 
  Box, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Check, 
  Download, 
  RefreshCw 
} from 'lucide-react';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Zipcode {
  id: string;
  zipcode: string;
  city: string;
  state: string;
}

interface RateQuote {
  partnerCode: string;
  partnerName: string;
  serviceCode: string;
  serviceName: string;
  rate: number;
  tax: number;
  totalAmount: number;
  transitDays: number;
}

export default function BookingCounter() {
  const queryClient = useQueryClient();
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [rateQuotes, setRateQuotes] = useState<RateQuote[]>([]);
  const [cheapestQuote, setCheapestQuote] = useState<RateQuote | null>(null);
  const [fastestQuote, setFastestQuote] = useState<RateQuote | null>(null);
  const [isSearchingRates, setIsSearchingRates] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Booking confirmation modal state
  const [bookedShipment, setBookedShipment] = useState<any | null>(null);

  const { register, handleSubmit, control, setValue, reset } = useForm({
    defaultValues: {
      toCountry: 'US',
      toZipcodeId: '',
      packageType: 'PARCEL',
      shipmentType: 'EXPRESS',
      weight: 1.0,
      length: 10,
      width: 10,
      height: 10,
      volumetricWeight: 0.2,
      referenceNo: '',
      remarks: '',
      signatureRequired: false,
      specialHandling: false,
      insurance: false,
      nonStandardGoods: false,
      fromCity: 'Panaji',
      fromState: 'Goa',
      fromPincode: '403001',
      shipDate: new Date().toISOString().split('T')[0],
    }
  });

  // Watch dimensions & weight for volumetric calculations
  const weight = useWatch({ control, name: 'weight' });
  const length = useWatch({ control, name: 'length' });
  const width = useWatch({ control, name: 'width' });
  const height = useWatch({ control, name: 'height' });

  // Auto-calculate volumetric weight: (L * W * H) / 5000
  useEffect(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const vol = (l * w * h) / 5000;
    setValue('volumetricWeight', Number(vol.toFixed(2)));
  }, [length, width, height, setValue]);

  // Fetch Countries
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await apiClient.get('/locations/countries');
      return res.data.data || [];
    }
  });

  // Fetch Zipcodes for selected country
  const { data: zipcodes = [] } = useQuery<Zipcode[]>({
    queryKey: ['zipcodes', selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const res = await apiClient.get(`/locations/zipcodes?country=${selectedCountry}`);
      return res.data.data || [];
    },
    enabled: !!selectedCountry
  });

  // Automatically select the first zipcode if list updates
  useEffect(() => {
    if (zipcodes.length > 0) {
      setValue('toZipcodeId', zipcodes[0].id);
    } else {
      setValue('toZipcodeId', '');
    }
  }, [zipcodes, setValue]);

  // Find city & state for chosen Zipcode to display
  const watchedZipcodeId = useWatch({ control, name: 'toZipcodeId' });
  const activeZipcode = zipcodes.find(z => z.id === watchedZipcodeId);

  // Search rates action
  const handleCheckRates = async (formData: any) => {
    setIsSearchingRates(true);
    setSearchError(null);
    setRateQuotes([]);
    setCheapestQuote(null);
    setFastestQuote(null);

    try {
      const payload = {
        toCountry: formData.toCountry,
        toZipcodeId: formData.toZipcodeId,
        packageType: formData.packageType,
        shipmentType: formData.shipmentType,
        weight: Number(formData.weight),
        length: Number(formData.length),
        width: Number(formData.width),
        height: Number(formData.height),
        volumetricWeight: Number(formData.volumetricWeight),
        insurance: formData.insurance,
        signatureRequired: formData.signatureRequired,
        specialHandling: formData.specialHandling,
        nonStandardGoods: formData.nonStandardGoods,
      };

      const res = await apiClient.post('/rates/check', payload);
      const quotes: RateQuote[] = res.data.data?.rates || [];

      if (quotes.length === 0) {
        setSearchError('No active shipping rates found for this configuration.');
        return;
      }

      setRateQuotes(quotes);

      // Find cheapest & fastest
      let cheapest = quotes[0];
      let fastest = quotes[0];

      quotes.forEach(q => {
        if (q.totalAmount < cheapest.totalAmount) {
          cheapest = q;
        }
        if (q.transitDays < fastest.transitDays) {
          fastest = q;
        }
      });

      setCheapestQuote(cheapest);
      setFastestQuote(fastest);

    } catch (e: any) {
      setSearchError(e.response?.data?.message || 'Error fetching rates from integration service.');
    } finally {
      setIsSearchingRates(false);
    }
  };

  // Book shipment mutation
  const bookShipmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/shipments/book', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setBookedShipment(data);
      // Invalidate queries to refresh wallet balance and dashboards
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (e: any) => {
      alert(e.response?.data?.message || 'Insufficent wallet balance or booking error.');
    }
  });

  const handleSelectQuote = (quote: RateQuote) => {
    const currentVals = {
      referenceNo: (document.getElementById('referenceNo') as HTMLInputElement)?.value || '',
      remarks: (document.getElementById('remarks') as HTMLTextAreaElement)?.value || '',
      packageType: (document.getElementById('packageType') as HTMLSelectElement)?.value || 'PARCEL',
      shipmentType: (document.getElementById('shipmentType') as HTMLSelectElement)?.value || 'EXPRESS',
      toCountry: selectedCountry,
      toZipcodeId: watchedZipcodeId,
      weight: Number(weight),
      length: Number(length),
      width: Number(width),
      height: Number(height),
      volumetricWeight: (Number(length) * Number(width) * Number(height)) / 5000,
      fromCity: 'Panaji',
      fromState: 'Goa',
      fromPincode: '403001',
      shipDate: (document.getElementById('shipDate') as HTMLInputElement)?.value || new Date().toISOString().split('T')[0],
      signatureRequired: (document.getElementById('signatureRequired') as HTMLInputElement)?.checked || false,
      specialHandling: (document.getElementById('specialHandling') as HTMLInputElement)?.checked || false,
      insurance: (document.getElementById('insurance') as HTMLInputElement)?.checked || false,
      nonStandardGoods: (document.getElementById('nonStandardGoods') as HTMLInputElement)?.checked || false,
    };

    const bookingPayload = {
      ...currentVals,
      partnerCode: quote.partnerCode,
      partnerName: quote.partnerName,
      serviceCode: quote.serviceCode,
      serviceName: quote.serviceName,
      rate: quote.rate,
      tax: quote.tax,
      totalAmount: quote.totalAmount,
      transitDays: quote.transitDays,
    };

    bookShipmentMutation.mutate(bookingPayload);
  };

  const handleCloseModal = () => {
    setBookedShipment(null);
    setRateQuotes([]);
    reset();
  };

  const chargeableWeight = Math.max(Number(weight) || 0, (Number(length) * Number(width) * Number(height) / 5000));

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Title Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
          Shipping Booking Counter
        </h1>
        <p className="text-slate-400 text-sm">
          Calculate package dimensions, scan integrated rates, and print label instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Details (7 Cols) */}
        <form onSubmit={handleSubmit(handleCheckRates)} className="lg:col-span-7 space-y-6">
          
          {/* Card: Destination Details */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <MapPin className="text-brand-500 h-5 w-5" />
              <h3 className="font-semibold text-white">1. Route & Destination</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Destination Country */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Destination Country
                </label>
                <select
                  id="toCountry"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  {...register('toCountry')}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setValue('toCountry', e.target.value);
                  }}
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Zipcode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Zipcode / Area Pincode
                </label>
                {zipcodes.length === 0 ? (
                  <select disabled className="w-full bg-slate-950/20 border border-slate-850/50 rounded-xl px-4 py-2.5 text-sm text-slate-500">
                    <option>No zipcodes loaded</option>
                  </select>
                ) : (
                  <select
                    id="toZipcodeId"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    {...register('toZipcodeId')}
                  >
                    {zipcodes.map((z) => (
                      <option key={z.id} value={z.id} className="bg-slate-900">
                        {z.zipcode} - {z.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Resolved Zipcode details badge */}
            {activeZipcode && (
              <div className="text-xs bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-3 text-slate-400">
                <span className="font-semibold text-brand-400 uppercase">Resolved Delivery Zone: </span> 
                {activeZipcode.city}, {activeZipcode.state} (Zone Active)
              </div>
            )}
          </div>

          {/* Card: Dimensions & Weight */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Scale className="text-brand-500 h-5 w-5" />
              <h3 className="font-semibold text-white">2. Load Configuration</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Package Type
                </label>
                <select
                  id="packageType"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  {...register('packageType')}
                >
                  <option value="PARCEL" className="bg-slate-900">Parcel / Box Package</option>
                  <option value="DOCUMENT" className="bg-slate-900">Document / Letter</option>
                </select>
              </div>

              {/* Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Transit Mode
                </label>
                <select
                  id="shipmentType"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  {...register('shipmentType')}
                >
                  <option value="EXPRESS" className="bg-slate-900">Express Shipping (Air)</option>
                  <option value="SURFACE" className="bg-slate-900">Surface Cargo (Ground)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Actual Weight */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  {...register('weight')}
                />
              </div>

              {/* Length */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Length (cm)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  {...register('length')}
                />
              </div>

              {/* Width */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Width (cm)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  {...register('width')}
                />
              </div>

              {/* Height */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Height (cm)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  {...register('height')}
                />
              </div>
            </div>

            {/* Calculations metrics summary */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/60 border border-slate-850 rounded-xl p-4 mt-2">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Volumetric Weight</p>
                <p className="text-base font-bold text-slate-300">
                  {((Number(length) * Number(width) * Number(height)) / 5000).toFixed(2)} kg
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chargeable Weight</p>
                <p className="text-base font-bold text-brand-400">
                  {chargeableWeight.toFixed(2)} kg
                </p>
              </div>
            </div>
          </div>

          {/* Card: Add-ons & References */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Box className="text-brand-500 h-5 w-5" />
              <h3 className="font-semibold text-white">3. Services & References</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reference Code / AWB
                </label>
                <input
                  id="referenceNo"
                  type="text"
                  placeholder="e.g. REF-234242"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  {...register('referenceNo')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Shipment Dispatch Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    id="shipDate"
                    type="date"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none"
                    {...register('shipDate')}
                  />
                </div>
              </div>
            </div>

            {/* Checkbox Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center space-x-2.5 bg-slate-950/30 border border-slate-850 rounded-xl p-3 cursor-pointer hover:border-slate-800 transition-colors">
                <input id="signatureRequired" type="checkbox" className="accent-brand-500" {...register('signatureRequired')} />
                <span className="text-xs text-slate-300">Signature Required</span>
              </label>

              <label className="flex items-center space-x-2.5 bg-slate-950/30 border border-slate-850 rounded-xl p-3 cursor-pointer hover:border-slate-800 transition-colors">
                <input id="specialHandling" type="checkbox" className="accent-brand-500" {...register('specialHandling')} />
                <span className="text-xs text-slate-300">Special Handling</span>
              </label>

              <label className="flex items-center space-x-2.5 bg-slate-950/30 border border-slate-850 rounded-xl p-3 cursor-pointer hover:border-slate-800 transition-colors">
                <input id="insurance" type="checkbox" className="accent-brand-500" {...register('insurance')} />
                <span className="text-xs text-slate-300">Insurance Cover</span>
              </label>

              <label className="flex items-center space-x-2.5 bg-slate-950/30 border border-slate-850 rounded-xl p-3 cursor-pointer hover:border-slate-800 transition-colors">
                <input id="nonStandardGoods" type="checkbox" className="accent-brand-500" {...register('nonStandardGoods')} />
                <span className="text-xs text-slate-300">Non-Standard Goods</span>
              </label>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Internal Remarks / Handling Note
              </label>
              <textarea
                id="remarks"
                placeholder="Special instruction for courier partners..."
                rows={2}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none"
                {...register('remarks')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearchingRates}
            className="w-full glass-button-primary flex items-center justify-center cursor-pointer"
          >
            {isSearchingRates ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Search className="mr-2 h-5 w-5" />
            )}
            Check Courier Partners & Compare Rates
          </button>
        </form>

        {/* Right Column: Rate Quotes Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg text-white">Compare Carriers</h3>
                <p className="text-xs text-slate-500">Live rate response from API integrations</p>
              </div>
              <Sparkles size={18} className="text-brand-500" />
            </div>

            <div className="p-6 space-y-4">
              {isSearchingRates ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-400 font-medium">Scanning network routes...</p>
                </div>
              ) : searchError ? (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-2.5 text-rose-400 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{searchError}</p>
                </div>
              ) : rateQuotes.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <HelpCircle size={32} className="mx-auto text-slate-600" />
                  <p className="text-sm font-medium">Provide destination & details, then click Compare Rates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rateQuotes.map((q) => {
                    const isCheapest = cheapestQuote?.partnerCode === q.partnerCode && cheapestQuote?.totalAmount === q.totalAmount;
                    const isFastest = fastestQuote?.partnerCode === q.partnerCode && fastestQuote?.transitDays === q.transitDays;

                    return (
                      <div 
                        key={`${q.partnerCode}-${q.serviceCode}`}
                        className="bg-slate-950/80 border border-slate-850 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all duration-200 carrier-card"
                      >
                        {/* Quote Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white leading-tight">{q.partnerName}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{q.serviceName} ({q.transitDays} Days Transit)</p>
                          </div>
                          
                          {/* Badges indicators */}
                          <div className="flex flex-col items-end space-y-1">
                            {isCheapest && (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider">
                                Cheapest
                              </span>
                            )}
                            {isFastest && (
                              <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider">
                                Fastest
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financial break-ups */}
                        <div className="flex items-baseline justify-between border-t border-b border-slate-900 py-3">
                          <div className="text-[10px] text-slate-400 font-semibold space-y-0.5">
                            <p>Base Rate: ₹{q.rate.toFixed(2)}</p>
                            <p>Service Tax: ₹{q.tax.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Total Charges</p>
                            <p className="text-xl font-extrabold text-white">₹{q.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Confirm and Book Action */}
                        <button
                          onClick={() => handleSelectQuote(q)}
                          disabled={bookShipmentMutation.isPending}
                          className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-slate-200 hover:text-emerald-400 hover:bg-emerald-500/5 text-xs font-bold transition-all duration-200 cursor-pointer"
                        >
                          {bookShipmentMutation.isPending ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <Check className="mr-2 h-4 w-4 text-emerald-400" />
                          )}
                          Confirm & Book Label
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Success Modal */}
      {bookedShipment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center relative space-y-6">
            
            {/* Success Shield animation */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 mx-auto">
              <ShieldCheck size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-2xl text-white">Shipment Confirmed!</h3>
              <p className="text-slate-400 text-sm">
                AWB generated successfully. Amount deducted from wallet balance.
              </p>
            </div>

            {/* AWB and Route details card */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3.5 text-left">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs text-slate-400 font-semibold">Air Waybill Number</span>
                <span className="font-mono text-sm font-bold text-white">{bookedShipment.awbNo}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs text-slate-400 font-semibold">Courier Partner</span>
                <span className="text-xs font-semibold text-slate-200">
                  {bookedShipment.rate?.partner?.name || 'FlightGo Partner'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Total Amount Deducted</span>
                <span className="text-xs font-bold text-emerald-400">
                  ₹{bookedShipment.rate?.totalAmount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="flex space-x-3">
              <a
                href={getFullLabelUrl(bookedShipment.labelUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all duration-200"
              >
                <Download size={14} className="mr-2" /> Download AWB Label
              </a>
              <button
                onClick={handleCloseModal}
                className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors duration-200 cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
