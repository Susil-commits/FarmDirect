import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const farmerIcon = createCustomIcon('green');
const buyerIcon = createCustomIcon('orange');

export default function OrderMap({ order }) {
  const defaultFarmerCoords = [28.6139, 77.2090];
  const defaultBuyerCoords = [28.5355, 77.3910];
  
  const farmerCoords = order?.farmerCoordinates || defaultFarmerCoords;
  const buyerCoords = order?.buyerCoordinates || defaultBuyerCoords;

  const center = [
    (farmerCoords[0] + buyerCoords[0]) / 2,
    (farmerCoords[1] + buyerCoords[1]) / 2
  ];

  return (
    <div className="w-full h-80 rounded-[28px] overflow-hidden border border-stone-200/90 shadow-xl relative z-0">
      <MapContainer 
        center={center} 
        zoom={10} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {}
        <Marker position={farmerCoords} icon={farmerIcon}>
          <Popup>
            <div className="font-bold flex items-center gap-2 text-[#132E20]">
              <MapPin size={16} className="text-emerald-700" /> Farm Origin Location
            </div>
            <span className="text-xs text-stone-600">Direct Farm Pickup Point</span>
          </Popup>
        </Marker>

        {}
        <Marker position={buyerCoords} icon={buyerIcon}>
          <Popup>
             <div className="font-bold flex items-center gap-2 text-[#D97736]">
              <MapPin size={16} /> Destination Delivery Address
            </div>
            <span className="text-xs text-stone-600">Delivery Point</span>
          </Popup>
        </Marker>

        {}
        <Polyline 
          positions={[farmerCoords, buyerCoords]} 
          color="#D97736" 
          weight={4} 
          dashArray="8, 8" 
        />
      </MapContainer>
      
      {}
      <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-stone-200 flex items-center gap-2 font-sans-body">
         <Truck className="w-4 h-4 text-[#D97736]" />
         <span className="font-bold text-[#132E20] text-xs uppercase tracking-wider">Live Route Tracking</span>
      </div>
    </div>
  );
}
