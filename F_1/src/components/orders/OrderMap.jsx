import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, MapPin } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
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
const buyerIcon = createCustomIcon('blue');

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
    <div className="w-full h-80 rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner relative z-0">
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
        
        {/* Farmer Marker */}
        <Marker position={farmerCoords} icon={farmerIcon}>
          <Popup>
            <div className="font-bold flex items-center gap-2 text-green-700">
              <MapPin size={16} /> Farmer Location
            </div>
            <span className="text-sm">Origin</span>
          </Popup>
        </Marker>

        {/* Buyer Marker */}
        <Marker position={buyerCoords} icon={buyerIcon}>
          <Popup>
             <div className="font-bold flex items-center gap-2 text-blue-700">
              <MapPin size={16} /> Your Location
            </div>
            <span className="text-sm">Destination</span>
          </Popup>
        </Marker>

        {/* Route Line */}
        <Polyline 
          positions={[farmerCoords, buyerCoords]} 
          color="#f59e0b" 
          weight={4} 
          dashArray="10, 10" 
        />
      </MapContainer>
      
      {/* Overlay Status Badge */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2">
         <Truck className="w-5 h-5 text-orange-600" />
         <span className="font-semibold text-slate-800 text-sm tracking-wide">Live Route Tracking</span>
      </div>
    </div>
  );
}
