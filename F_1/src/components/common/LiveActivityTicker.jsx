import React, { useState, useEffect } from 'react';
import { ShoppingCart, UserCheck, Star, Activity } from 'lucide-react';

const EVENTS = [
  { text: "Rahul just bought 5kg Organic Tomatoes", icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-100" },
  { text: "New verified farmer joined from Pune", icon: UserCheck, color: "text-blue-500", bg: "bg-blue-100" },
  { text: "Priya gave a 5-star review to Green Farms", icon: Star, color: "text-yellow-500", bg: "bg-yellow-100" },
  { text: "10kg fresh Apples listed in Shimla", icon: Activity, color: "text-purple-500", bg: "bg-purple-100" }
];

export default function LiveActivityTicker() {
  return null;
}
