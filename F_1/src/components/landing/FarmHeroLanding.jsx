import React, { useState, useEffect } from 'react';
import DynamicFloatingNavbar from './DynamicFloatingNavbar';
import HeroCreamSection from './HeroCreamSection';
import ForestGreenPeelSection from './ForestGreenPeelSection';
import CreamValueSection from './CreamValueSection';
import DarkImpactSection from './DarkImpactSection';

export default function FarmHeroLanding({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('cream');

  useEffect(() => {
    // Setup IntersectionObserver for smooth navbar color transitions
    const sectionThemes = [
      { id: 'hero', theme: 'cream' },
      { id: 'why-direct', theme: 'forest' },
      { id: 'how-it-works', theme: 'cream' },
      { id: 'impact', theme: 'dark' },
    ];

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px',
      threshold: 0.15,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const match = sectionThemes.find((s) => s.id === entry.target.id);
          if (match) {
            setActiveSection(match.theme);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionThemes.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleExploreClick = () => {
    if (onNavigate) {
      onNavigate('/marketplace');
    } else {
      const el = document.getElementById('why-direct');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="font-sans-body min-h-screen bg-[#FBF8F3] text-[#132E20] selection:bg-[#D97736] selection:text-white">
      {/* Sticky Scroll-Aware Floating Pill Navbar */}
      <DynamicFloatingNavbar activeSection={activeSection} onNavigate={onNavigate} />

      {/* Section 1: Hero Warm Cream */}
      <HeroCreamSection onExploreClick={handleExploreClick} />

      {/* Section 2: Overlapping Dark Forest-Green Peel-Up */}
      <ForestGreenPeelSection onExploreClick={handleExploreClick} />

      {/* Section 3: Overlapping Warm Cream Peel-Up */}
      <CreamValueSection onExploreClick={handleExploreClick} onNavigate={onNavigate} />

      {/* Section 4: Overlapping Near-Black Peel-Up */}
      <DarkImpactSection onExploreClick={handleExploreClick} onNavigate={onNavigate} />
    </div>
  );
}
