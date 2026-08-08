import React, { useState, useEffect } from 'react';
import { ShoppingCart, UserCheck, Star, Activity } from 'lucide-react';

const EVENTS = [
  { text: "Rahul just bought 5kg Organic Tomatoes", icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-100" },
  { text: "New verified farmer joined from Pune", icon: UserCheck, color: "text-blue-500", bg: "bg-blue-100" },
  { text: "Priya gave a 5-star review to Green Farms", icon: Star, color: "text-yellow-500", bg: "bg-yellow-100" },
  { text: "10kg fresh Apples listed in Shimla", icon: Activity, color: "text-purple-500", bg: "bg-purple-100" }
];

export default function LiveActivityTicker() {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setCurrentEvent(randomEvent);
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
    }, Math.floor(Math.random() * 15000) + 15000);

    return () => clearInterval(intervalId);
  }, []);

  if (!currentEvent) return null;

  return (
    <div className={`fixed bottom-6 left-6 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-3 pr-6 flex items-center gap-3">
        <div className={`p-2 rounded-full ${currentEvent.bg}`}>
          <currentEvent.icon size={18} className={currentEvent.color} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Live Update</p>
          <p className="text-sm font-semibold text-gray-800">{currentEvent.text}</p>
        </div>
      </div>
    </div>
  );
}
