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
import FarmHeroLanding from '../components/landing/FarmHeroLanding';

const FeaturesSection = lazy(() => import('./home/FeaturesSection'));
const RawFactsSection = lazy(() => import('./home/RawFactsSection'));
const HowItWorksSection = lazy(() => import('./home/HowItWorksSection'));
const FaqsSection = lazy(() => import('./home/FaqsSection'));
const CommunitySection = lazy(() => import('./home/CommunitySection'));
const TestimonialsSection = lazy(() => import('./home/TestimonialsSection'));

export default function Home() {
  const { t: _t } = useTranslation();
  const { navigate } = useRouter();
  const { _user } = useAuth();
  const _heroRef = useRef(null);
  const { ref: _particleRef, triggerBurst: _triggerBurst } = useParticleEffect({
    particleCount: 15,
    particleColor: '#22c55e',
    particleSize: 6,
    duration: 600,
  });
  const { ref: _rippleRef } = useRippleEffect({
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

  const _particleProps = useMemo(() => {
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

        {/* FarmDirect 2.0 Landing Hero Experience */}
        <FarmHeroLanding onNavigate={handleNavigation} />


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
