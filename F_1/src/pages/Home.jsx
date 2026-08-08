import { ArrowRight, Leaf } from 'lucide-react';
import { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
const RawFactsSection = lazy(() => import('./home/RawFactsSection'));
const HowItWorksSection = lazy(() => import('./home/HowItWorksSection'));
const FaqsSection = lazy(() => import('./home/FaqsSection'));
const CommunitySection = lazy(() => import('./home/CommunitySection'));
const TestimonialsSection = lazy(() => import('./home/TestimonialsSection'));

export default function Home() {
  const { t } = useTranslation();
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

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <div 
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-green-300/40 to-emerald-200/20 blur-3xl animate-blob transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          ></div>
          <div 
            className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-teal-200/40 to-cyan-100/20 blur-3xl animate-blob animation-delay-2000 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          ></div>
          <div 
            className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-green-200/30 to-emerald-100/30 blur-3xl animate-blob animation-delay-4000 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * 0.05}px)` }}
          ></div>
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

        {/* Cinematic Centered Hero Section */}
        <section ref={heroRef} className="pt-32 pb-24 px-4 relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
          {/* Floating particles background - optimized */}
          <div 
            className="absolute inset-0 overflow-hidden pointer-events-none z-10 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          >
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

          {/* Centered Content */}
          <div ref={particleRef} className="max-w-5xl mx-auto text-center relative z-20 w-full px-4 sm:px-6 lg:px-8 mt-4 sm:mt-10">
            <ScrollAnimation className="scroll-slide z-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/80 shadow-sm backdrop-blur-md text-green-800 font-semibold mb-6 sm:mb-8 animate-slide-in-down mx-auto">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                100% Fresh & Local
              </div>
              
              <h1 className="text-6xl sm:text-7xl lg:text-[6.5rem] font-black text-gray-900 mb-6 sm:mb-8 leading-[1.05] tracking-tighter max-w-4xl mx-auto drop-shadow-sm">
                <span className="block animate-slide-in-down">{t('home.hero_title', 'Farm to Table Directly').split(' ')[0]} {t('home.hero_title', 'Farm to Table Directly').split(' ')[1]} {t('home.hero_title', 'Farm to Table Directly').split(' ')[2]}</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 inline-block animate-gradient-text drop-shadow-sm">
                  {t('home.hero_title', 'Farm to Table Directly').split(' ').slice(3).join(' ')}
                </span>
              </h1>
              
              <p className="text-lg sm:text-2xl text-gray-700 mb-10 sm:mb-12 animate-slide-in-up leading-relaxed font-medium max-w-2xl mx-auto" style={{ animationDelay: '0.1s' }}>
                {t('home.hero_subtitle', 'Connect directly with local farmers. Get fresh, organic produce at fair prices with zero middlemen. Just honest trade and better food.')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-slide-in-up justify-center items-center" style={{ animationDelay: '0.2s' }}>
                <Button 
                  ref={rippleRef}
                  variant="primary" 
                  size="lg" 
                  className="flex items-center gap-3 justify-center shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 rounded-full group w-full sm:w-auto"
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
                  {t('home.shop_now', 'Start Shopping')}
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center gap-2 justify-center bg-white/50 backdrop-blur-sm border-2 border-green-600/20 hover:border-green-600 hover:bg-white/80 transition-all duration-300 text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 rounded-full text-gray-800 font-semibold w-full sm:w-auto"
                  onClick={() => handleNavigation('/join-farmer')}
                >
                  {t('home.join_farmer', 'Join as Farmer')}
                </Button>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Raw Facts Data Section */}
        <LazySection height="400px">
          <Suspense fallback={<div style={{ height: '400px' }} />}>
            <RawFactsSection />
          </Suspense>
        </LazySection>

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
