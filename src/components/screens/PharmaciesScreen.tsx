import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  Phone,
  Navigation,
  Clock,
  Truck,
  Star,
  Compass,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PharmacyItem, AppLanguage } from '../../types';
import { SEED_PHARMACIES } from '../../data/seedData';
import { getTranslation } from '../../i18n/translations';

interface PharmaciesScreenProps {
  lang: AppLanguage;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const PharmaciesScreen: React.FC<PharmaciesScreenProps> = ({ lang, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [only24Hours, setOnly24Hours] = useState(false);
  const [onlyDelivery, setOnlyDelivery] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 23.0225, lng: 72.5714 }); // Ahmedabad default
  const [locating, setLocating] = useState(false);
  const [directionsPharmacy, setDirectionsPharmacy] = useState<PharmacyItem | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('warning', 'GPS Unavailable', 'Geolocation is not supported in this browser environment.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
        showToast('success', 'GPS Updated', `Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        setLocating(false);
        showToast('info', 'GPS Simulated', 'Using regional reference center (Ahmedabad).');
      },
      { timeout: 5000 }
    );
  };

  const filteredPharmacies = useMemo(() => {
    return SEED_PHARMACIES.map((p) => {
      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
      return { ...p, calculatedDistance: `${dist} km` };
    })
      .filter((p) => {
        if (only24Hours && !p.isOpen24Hours) return false;
        if (onlyDelivery && !p.hasDelivery) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dA = parseFloat(a.calculatedDistance);
        const dB = parseFloat(b.calculatedDistance);
        return dA - dB;
      });
  }, [searchQuery, only24Hours, onlyDelivery, userLocation]);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Header with GPS locator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6B21A8] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A]">Nearby Pharmacies</h2>
              <p className="text-[11px] text-slate-500">24/7 chemists & local drug stores</p>
            </div>
          </div>

          <button
            onClick={handleGetLocation}
            id="btn-gps-locate"
            disabled={locating}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-[11px] font-bold text-[#0F4C81] flex items-center gap-1.5 transition-all"
          >
            <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'Refresh GPS'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="input-pharmacy-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chemist name, road, or area..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setOnly24Hours(!only24Hours)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              only24Hours
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Open 24/7 Only
          </button>
          <button
            onClick={() => setOnlyDelivery(!onlyDelivery)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              onlyDelivery
                ? 'bg-[#0EA5E9] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Home Delivery
          </button>
        </div>
      </div>

      {/* 2. Interactive Area Radar Map */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Chemist Radar</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {filteredPharmacies.length} available nearby
          </span>
        </div>

        {/* Radar Visual Canvas */}
        <div className="h-28 rounded-xl bg-slate-800/80 border border-slate-700 relative flex items-center justify-center overflow-hidden">
          {/* Radar circles */}
          <div className="w-20 h-20 rounded-full border border-sky-500/20 absolute" />
          <div className="w-40 h-40 rounded-full border border-sky-500/15 absolute" />

          {/* User Beacon */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-sky-400 flex items-center justify-center ring-4 ring-sky-400/30">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-[9px] font-bold text-sky-200 mt-1">You Are Here</span>
          </div>

          {/* Pharmacy Pins scattered */}
          {filteredPharmacies.slice(0, 4).map((p, idx) => {
            const offsets = [
              { top: '20%', left: '25%' },
              { top: '30%', right: '20%' },
              { bottom: '25%', left: '30%' },
              { bottom: '20%', right: '25%' },
            ][idx];

            return (
              <button
                key={p.id}
                onClick={() => setDirectionsPharmacy(p)}
                style={offsets}
                className="absolute z-20 group flex items-center gap-1 bg-white/90 hover:bg-white text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md active:scale-95 transition-all"
              >
                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                <span>{p.calculatedDistance}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. List of Pharmacy Cards */}
      <div className="space-y-3">
        {filteredPharmacies.map((pharm) => (
          <div
            key={pharm.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-sky-300 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">{pharm.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pharm.address}
                </p>
              </div>

              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-sky-50 text-[#0F4C81] border border-sky-100 shrink-0">
                {pharm.calculatedDistance}
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 my-2.5">
              {pharm.isOpen24Hours && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Open 24/7</span>
                </span>
              )}
              {pharm.hasDelivery && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#0EA5E9] border border-sky-100 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  <span>Home Delivery</span>
                </span>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{pharm.rating}</span>
                <span className="text-slate-400 font-normal">({pharm.reviewCount})</span>
              </span>
            </div>

            {/* Actions: Call & Directions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
              <a
                href={`tel:${pharm.phone}`}
                id={`btn-call-pharm-${pharm.id}`}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>Call Chemist</span>
              </a>

              <button
                onClick={() => setDirectionsPharmacy(pharm)}
                id={`btn-route-pharm-${pharm.id}`}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Directions Modal */}
      {directionsPharmacy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">
                  Route to {directionsPharmacy.name}
                </h3>
                <p className="text-xs text-slate-500">{directionsPharmacy.address}</p>
              </div>
              <button
                onClick={() => setDirectionsPharmacy(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#0F4C81] uppercase tracking-wide">
                    Estimated Travel Time
                  </span>
                  <p className="text-base font-extrabold text-[#0F172A]">
                    ~{Math.max(4, Math.round(parseFloat(directionsPharmacy.calculatedDistance || '1') * 4))} mins
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0EA5E9]">
                  {directionsPharmacy.calculatedDistance}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </div>
                  <span>Head towards main avenue from your current location</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </div>
                  <span>Follow route towards {directionsPharmacy.city || 'local'} Medical Enclave</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    3
                  </div>
                  <span>Arrive at {directionsPharmacy.name} on the ground level</span>
                </div>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${directionsPharmacy.lat},${directionsPharmacy.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Start GPS Navigation</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
