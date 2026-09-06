import React from 'react';
import HeroCreamSection from './HeroCreamSection';
import ForestGreenPeelSection from './ForestGreenPeelSection';
import CreamValueSection from './CreamValueSection';
import DarkImpactSection from './DarkImpactSection';

export default function FarmHeroLanding({ onNavigate, onGetStarted }) {
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
      <HeroCreamSection onExploreClick={handleExploreClick} onGetStarted={onGetStarted} />
      <ForestGreenPeelSection onExploreClick={handleExploreClick} />
      <CreamValueSection onExploreClick={handleExploreClick} onNavigate={onNavigate} />
      <DarkImpactSection onExploreClick={handleExploreClick} onNavigate={onNavigate} onGetStarted={onGetStarted} />
    </div>
  );
}
