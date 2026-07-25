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
      <div className="min-h-screen bg-white relative">
        {/* Organic Animated Mesh Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-green-300/40 to-emerald-200/20 blur-3xl animate-blob"></div>
          <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-teal-200/40 to-cyan-100/20 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-green-200/30 to-emerald-100/30 blur-3xl animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]"></div>
        </div>

        <style>{`
          @media (prefers-color-scheme: dark) {
            .home-page-background {
              background: #0f172a !important;
            }
          }
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 15s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>

        {/* Hero Section - Premium Enhanced */}
        <section ref={heroRef} className="pt-8 pb-20 px-4 relative overflow-hidden min-h-screen flex items-center">
          {/* Floating particles background - optimized */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute animate-float ${i > 2 ? 'hidden sm:block' : ''}`}
                style={particleProps[i]}
              >
                <Leaf className="w-full h-full text-green-600/30 drop-shadow-xl" />
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
                
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 mb-6 leading-[1.05] tracking-tighter">
                  <span className="block animate-slide-in-left">Farm to Table</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 inline-block animate-gradient-text drop-shadow-sm">
                    Directly
                  </span>
                </h1>
                
                <p className="text-xl sm:text-2xl text-gray-700 mb-10 animate-slide-in-left leading-relaxed font-medium max-w-2xl" style={{ animationDelay: '0.1s' }}>
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
            <div className="relative z-10 lg:h-[650px] flex items-center justify-center animate-slide-in-right perspective-1000 mt-12 lg:mt-0">
              <div className="relative w-full max-w-lg mx-auto aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out border-4 border-white/50 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-emerald-500/10 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay"></div>
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&h=1000&fit=crop&fm=webp&q=80&auto=format"
                  alt="A happy local farmer holding fresh produce"
                  width="800"
                  height="1000"
                  className="w-full h-full object-cover rounded-[2.5rem] shadow-inner group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  priority={true}
                />
                
                {/* Floating badge 1 */}
                <div className="absolute top-12 -left-4 sm:-left-8 bg-white/80 backdrop-blur-xl border border-white/60 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-20 animate-float flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-2xl shadow-sm">
                    <Leaf className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 tracking-tight">100% Organic</p>
                    <p className="text-sm text-gray-600 font-medium">Certified Farms</p>
                  </div>
                </div>

                {/* Floating badge 2 */}
                <div className="absolute bottom-20 -right-4 sm:-right-8 bg-white/80 backdrop-blur-xl border border-white/60 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-20 animate-float hover:scale-105 transition-transform duration-300" style={{ animationDelay: '1.5s' }}>
                  <div className="flex -space-x-3 mb-2 justify-center">
                    {[1, 2, 3, 4].map((i) => (
                      <img key={i} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`User ${i}`} />
                    ))}
                  </div>
                  <p className="text-sm font-black text-gray-900 tracking-tight text-center">Join {stats.customers || '10k'}+ Buyers</p>
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
