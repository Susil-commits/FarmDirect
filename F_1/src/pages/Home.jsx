import { ArrowRight, Leaf } from 'lucide-react';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Button from '../components/common/Button';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import LazySection from '../components/common/LazySection';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';
import { useParticleEffect, useRippleEffect } from '../hooks/useParticleEffect';
import api from '../services/api';
import ErrorBoundary from '../components/common/ErrorBoundary';

const FeaturesSection = lazy(() => import('./home/FeaturesSection'));
const HowItWorksSection = lazy(() => import('./home/HowItWorksSection'));
const FaqsSection = lazy(() => import('./home/FaqsSection'));
const CommunitySection = lazy(() => import('./home/CommunitySection'));
const TestimonialsSection = lazy(() => import('./home/TestimonialsSection'));

export default function Home() {
  const { navigate } = useRouter();
  const { _user } = useAuth();
  const heroRef = useRef(null);
  const { ref: particleRef, triggerBurst } = useParticleEffect({
    particleCount: 15,
    particleColor: '#22c55e',
    particleSize: 6,
    duration: 600,
  });
  const { ref: rippleRef } = useRippleEffect({
    rippleColor: 'rgba(34, 197, 94, 0.4)',
    duration: 600,
  });

  const [stats, setStats] = useState({
    farmers: null,
    customers: null,
    varieties: null,
    orders: null,
    deliveryDays: '3-5',
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [gradientAngle, setGradientAngle] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset scroll position to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animate gradient background
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientAngle((prev) => (prev + 1) % 360);
    }, 50); // Smooth gradient rotation

    return () => clearInterval(interval);
  }, []);

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/users/community/stats');
        
        if (response?.success && response?.data) {
          setStats({
            farmers: response.data.users?.farmers ?? null,
            customers: response.data.users?.buyers ?? null,
            varieties: response.data.crops?.total ?? null,
            orders: response.data.orders?.total ?? null,
            deliveryDays: '3-5',
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Safe navigation with error handling
  const handleNavigation = (path) => {
    try {
      if (!path || typeof path !== 'string') {
        console.error('Invalid navigation path:', path);
        return;
      }
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <ErrorBoundary>
    <PageTransition>
      <div className="min-h-screen bg-white" style={{
        backgroundImage: `linear-gradient(${gradientAngle}deg, #dcfce7 0%, #f0fdfa 35%, #d1fae5 70%, #dcfce7 100%)`,
        backgroundAttachment: 'fixed',
      }}>
        <style>{`
          @media (prefers-color-scheme: dark) {
            .home-page-background {
              background: linear-gradient(${gradientAngle}deg, #1f2937 0%, #111827 35%, #0f172a 70%, #1f2937 100%) !important;
            }
          }
        `}</style>
        {/* Hero Section - Enhanced with Animated Gradient */}
        <section ref={heroRef} className="pt-8 pb-20 px-4 relative overflow-hidden min-h-screen flex items-center">
          {/* Animated gradient overlay */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: `linear-gradient(${gradientAngle}deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)`,
              animation: 'gradientFlow 8s ease-in-out infinite',
            }}
          ></div>

          {/* Floating particles background - reduced on mobile for performance */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`absolute animate-float ${i > 1 ? 'hidden sm:block' : ''}`}
                style={{
                  width: '100px',
                  height: '100px',
                  opacity: 0.05,
                  left: `${20 + i * 15}%`,
                  top: `${10 + i * 15}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <Leaf className="w-full h-full text-green-600" />
              </div>
            ))}
          </div>

          <div ref={particleRef} className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <ScrollAnimation className="scroll-slide">
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  <span className="inline-block animate-slide-in-left">Farm to Table</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700 inline-block animate-gradient-text">
                    Directly
                  </span>
                </h1>
                <p className="text-xl text-gray-700 mb-8 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                  Connect with local farmers and get fresh produce at fair prices. No middlemen, just honest trade.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                  <Button 
                    ref={rippleRef}
                    variant="primary" 
                    size="lg" 
                    className="flex items-center gap-2 justify-center neon-glow"
                    onClick={(e) => {
                      try {
                        triggerBurst(e.currentTarget.clientWidth / 2, e.currentTarget.clientHeight / 2);
                        handleNavigation('/start-shopping');
                      } catch (error) {
                        console.error('Button click error:', error);
                      }
                    }}
                    aria-label="Start buying fresh produce"
                  >
                    Start Buying <ArrowRight size={20} />
                  </Button>
                </div>
              </div>
            </ScrollAnimation>

            {/* Hero Image Banner */}
            <div className="rounded-2xl h-64 md:h-80 flex items-center justify-center animate-slide-in-right overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 relative group bg-gray-200">
              {imageError ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Leaf size={48} className="text-green-600 mb-2" />
                  <p className="text-gray-600">Fresh Produce Available</p>
                </div>
              ) : (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
                  )}
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop&fm=webp&q=80"
                    alt="Fresh produce from farmers"
                    width="800"
                    height="600"
                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    loading="eager"
                    fetchPriority="high"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    decoding="async"
                  />
                  {/* Animated glow overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <LazySection height="600px">
          <Suspense fallback={<div style={{ height: '600px' }} />}>
            <FeaturesSection />
          </Suspense>
        </LazySection>

        {/* How It Works */}
        <LazySection height="1200px">
          <Suspense fallback={<div style={{ height: '1200px' }} />}>
            <HowItWorksSection />
          </Suspense>
        </LazySection>

        {/* FAQs Section */}
        <LazySection height="500px">
          <Suspense fallback={<div style={{ height: '500px' }} />}>
            <FaqsSection />
          </Suspense>
        </LazySection>

        <LazySection height="600px">
          <Suspense fallback={<div style={{ height: '600px' }} />}>
            <CommunitySection stats={stats} statsLoading={statsLoading} />
          </Suspense>
        </LazySection>

        {/* Testimonials */}
        <LazySection height="400px">
          <Suspense fallback={<div style={{ height: '400px' }} />}>
            <TestimonialsSection />
          </Suspense>
        </LazySection>
      </div>
    </PageTransition>
    </ErrorBoundary>
  );
}
