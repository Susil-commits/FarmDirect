import { ArrowRight, Leaf } from 'lucide-react';
import { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import Button from '../components/common/Button';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import LazySection from '../components/common/LazySection';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';
import { useParticleEffect, useRippleEffect } from '../hooks/useParticleEffect';
import api from '../services/api';
import ErrorBoundary from '../components/common/ErrorBoundary';
import OptimizedImage from '../components/common/OptimizedImage';
import LiveActivityTicker from '../components/common/LiveActivityTicker';

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

  // Reset scroll position to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
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

  const particleProps = useMemo(() => {
    return [...Array(6)].map((_, i) => ({
      width: `${60 + i * 10}px`,
      height: `${60 + i * 10}px`,
      opacity: 0.1,
      // eslint-disable-next-line react-hooks/purity
      left: `${15 + Math.random() * 70}%`,
      // eslint-disable-next-line react-hooks/purity
      top: `${10 + Math.random() * 70}%`,
      animationDelay: `${i * 0.7}s`,
      animationDuration: `${3 + i}s`,
      transform: `rotate(${i * 45}deg)`,
    }));
  }, []);

  return (
    <ErrorBoundary>
    <PageTransition>
      <div className="min-h-screen bg-white" style={{
        background: `linear-gradient(135deg, #dcfce7 0%, #f0fdfa 35%, #d1fae5 70%, #dcfce7 100%)`,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        backgroundAttachment: 'fixed',
      }}>
        <style>{`
          @media (prefers-color-scheme: dark) {
            .home-page-background {
              background: linear-gradient(135deg, #1f2937 0%, #111827 35%, #0f172a 70%, #1f2937 100%) !important;
              background-size: 400% 400% !important;
              animation: gradientShift 15s ease infinite !important;
            }
          }
        `}</style>
        {/* Hero Section - Premium Enhanced */}
        <section ref={heroRef} className="pt-8 pb-20 px-4 relative overflow-hidden min-h-screen flex items-center">
          {/* Animated gradient overlay */}
          <div 
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 100%)`,
              animation: 'pulse 8s ease-in-out infinite',
            }}
          ></div>

          {/* Floating particles background - optimized */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute animate-float ${i > 2 ? 'hidden sm:block' : ''}`}
                style={particleProps[i]}
              >
                <Leaf className="w-full h-full text-green-600 drop-shadow-xl" />
              </div>
            ))}
          </div>

          <div ref={particleRef} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full px-4 sm:px-6 lg:px-8">
            <ScrollAnimation className="scroll-slide z-20">
              <div className="glass-light p-8 sm:p-10 rounded-3xl border border-white/40 shadow-2xl backdrop-blur-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-green text-green-800 font-semibold mb-6 animate-slide-in-down">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  100% Fresh & Local
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                  <span className="block animate-slide-in-left">Farm to Table</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 inline-block animate-gradient-text">
                    Directly
                  </span>
                </h1>
                
                <p className="text-xl text-gray-700 mb-8 animate-slide-in-left leading-relaxed font-medium" style={{ animationDelay: '0.1s' }}>
                  Connect directly with local farmers. Get fresh, organic produce at fair prices with zero middlemen. Just honest trade and better food.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                  <Button 
                    ref={rippleRef}
                    variant="primary" 
                    size="lg" 
                    className="flex items-center gap-3 justify-center shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 text-lg px-8 py-4 rounded-xl group"
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
                    Start Shopping
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex items-center gap-2 justify-center glass hover:bg-white/50 transition-all duration-300 text-lg px-8 py-4 rounded-xl text-gray-800 font-semibold"
                    onClick={() => handleNavigation('/join-as-farmer')}
                  >
                    Join as Farmer
                  </Button>
                </div>
                
                <div className="mt-10 pt-8 border-t border-gray-200/50 flex items-center gap-8 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.farmers || '500'}+</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">Verified Farmers</p>
                  </div>
                  <div className="w-px h-12 bg-gray-300/50"></div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.customers || '10k'}+</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">Happy Customers</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Premium Hero Image Banner */}
            <div className="relative z-10 lg:h-[600px] flex items-center justify-center animate-slide-in-right perspective-1000">
              <div className="relative w-full max-w-lg mx-auto aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out glass-deep p-3 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-400/20 to-teal-400/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay"></div>
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=1000&fit=crop&fm=webp&q=80&auto=format"
                  alt="Fresh organic produce straight from the farm"
                  width="800"
                  height="1000"
                  className="w-full h-full object-cover rounded-[2rem] shadow-inner group-hover:scale-105 transition-transform duration-700 ease-out"
                  priority={true}
                />
                
                {/* Floating badge 1 */}
                <div className="absolute top-10 -left-6 glass-deep px-5 py-3 rounded-2xl shadow-xl z-20 animate-float flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Leaf className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">100% Organic</p>
                    <p className="text-xs text-gray-600">Certified Farms</p>
                  </div>
                </div>

                {/* Floating badge 2 */}
                <div className="absolute bottom-16 -right-6 glass px-5 py-3 rounded-2xl shadow-xl z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="flex -space-x-2 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`User ${i}`} />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-900">Join {stats.customers || '10k'}+ Buyers</p>
                </div>
              </div>
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
        <LiveActivityTicker />
      </div>
    </PageTransition>
    </ErrorBoundary>
  );
}
