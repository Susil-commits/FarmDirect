import { ArrowRight, Leaf, TrendingUp, Users, MapPin, Sparkles, TrendingUp as StatsIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useParticleEffect, useRippleEffect } from '../hooks/useParticleEffect';

export default function Home() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const heroRef = useRef(null);
  const { ref: particleRef, triggerBurst } = useParticleEffect({
    particleCount: 15,
    particleColor: '#22c55e',
    particleSize: 6,
    duration: 600,
  });
  const { ref: rippleRef, triggerRipple } = useRippleEffect({
    rippleColor: 'rgba(34, 197, 94, 0.4)',
    duration: 600,
  });

  const [stats, setStats] = useState({
    farmers: 2400,
    customers: 5800,
    varieties: 150,
    deliveryDays: '3-5',
  });

  const [gradientAngle, setGradientAngle] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Animate gradient background
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientAngle((prev) => (prev + 1) % 360);
    }, 50); // Smooth gradient rotation

    return () => clearInterval(interval);
  }, []);

  // Get stats from localStorage (updated on each registration/purchase)
  useEffect(() => {
    const savedStats = localStorage.getItem('farmStats');
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setStats(prev => ({ ...prev, ...parsedStats }));
      } catch (e) {
        console.log('Using default stats');
      }
    }
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

  // Handle hero image errors with fallback
  const handleImageError = () => {
    setImageError(true);
    console.warn('Hero image failed to load, showing fallback');
  };

  const features = [
    { icon: <Leaf className="w-8 h-8 text-green-600" />, title: 'Fresh Produce', desc: 'Direct from farms to your doorstep' },
    { icon: <TrendingUp className="w-8 h-8 text-green-600" />, title: 'Better Prices', desc: 'No middlemen, farmers get more' },
    { icon: <Users className="w-8 h-8 text-green-600" />, title: 'Community', desc: 'Support local farmers & agriculture' },
    { icon: <MapPin className="w-8 h-8 text-green-600" />, title: 'Local Supply', desc: 'Know where your food comes from' },
  ];

  const testimonials = [
    {
      text: 'FarmDirect has revolutionized how I shop for fresh produce. Direct from farmers means fresher veggies and better prices!',
      name: 'Priya Sharma',
      role: 'Regular Customer from Mumbai',
      avatar: 'P',
      rating: 5,
    },
    {
      text: 'As a farmer, I can finally reach customers without middlemen taking their cut. Sales have increased by 40%!',
      name: 'Rajesh Patel',
      role: 'Organic Farmer from Gujarat',
      avatar: 'R',
      rating: 5,
    },
    {
      text: 'The quality of produce is exceptional. I appreciate knowing exactly where my food comes from.',
      name: 'Anjali Desai',
      role: 'Health-conscious Buyer',
      avatar: 'A',
      rating: 5,
    },
  ];

  return (
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

          {/* Floating particles background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float"
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

          <div ref={particleRef} className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <ScrollAnimation className="scroll-slide">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  <span className="inline-block animate-slide-in-left">Farm to Table</span>{' '}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-green-500 to-emerald-600 inline-block animate-gradient-text">
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

            {/* Hero Image with Enhanced Effects */}
            <div className="rounded-2xl h-64 md:h-80 flex items-center justify-center animate-slide-in-right hover-lift overflow-hidden glass premium-glow relative group bg-gray-200">
              {imageError ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Leaf size={48} className="text-green-600 mb-2" />
                  <p className="text-gray-600">Fresh Produce Available</p>
                </div>
              ) : (
                <>
                  <img 
                    src="https://t4.ftcdn.net/jpg/12/50/32/05/360_F_1250320539_mSBEKgn75R0ITYmIU0euFdPaWRw8tsnO.jpg" 
                    alt="Fresh produce from farmers" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={handleImageError}
                    decoding="async"
                  />
                  {/* Animated glow overlay on hover */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                </>
              )}
            </div>
          </div>
        </section>



        {/* Features */}
        <section id="features" className="py-16 px-4 relative">
          <div className="absolute inset-0 premium-gradient"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center animate-slide-in-down">Why Choose FarmDirect?</h2>
            </ScrollAnimation>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feat, i) => (
                <Card key={i} variant="green" animated={true}>
                  <div className="p-8 text-center">
                    <div className="flex justify-center mb-4">{feat.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{feat.title}</h3>
                    <p className="text-gray-600">{feat.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - User Guide */}
        <section className="py-20 px-4 relative bg-linear-to-br from-white via-green-50 to-white">
          <div className="max-w-6xl mx-auto relative z-10">
            <ScrollAnimation className="scroll-slide mb-16">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works - Simple Steps</h2>
                <p className="text-lg text-gray-600">A beginner's guide to buying fresh produce directly from farmers</p>
              </div>
            </ScrollAnimation>

            {/* For Buyers */}
            <div className="mb-20">
              <ScrollAnimation className="scroll-slide mb-12">
                <h3 className="text-3xl font-bold text-green-600 text-center mb-8 flex items-center justify-center gap-2">
                  👥 For Buyers - 3 Simple Steps
                </h3>
              </ScrollAnimation>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <ScrollAnimation className="scroll-slide">
                  <Card hover className="h-full bg-linear-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                    <div className="p-8">
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                        1
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Sign Up (1 minute)</h4>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Click <strong>"Start Buying"</strong> button</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Enter your name, email, and phone</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Create a password</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Select "Buyer" role and continue</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-blue-100 rounded-lg text-sm text-blue-800">
                        ℹ️ No technical knowledge needed - just basic info required
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>

                {/* Step 2 */}
                <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.1s' }}>
                  <Card hover className="h-full bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <div className="p-8">
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                        2
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Browse Products (5 minutes)</h4>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Go to <strong>Marketplace</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>See fresh fruits & vegetables</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>View farmer info and prices</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Read product details & reviews</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Click "Add to Cart" for items you like</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-green-100 rounded-lg text-sm text-green-800">
                        💡 Tip: Check farmer ratings before purchasing
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>

                {/* Step 3 */}
                <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.2s' }}>
                  <Card hover className="h-full bg-linear-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
                    <div className="p-8">
                      <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                        3
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Checkout & Delivery (2-3 days)</h4>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Go to <strong>Shopping Cart</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Review your items</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Click <strong>"Proceed to Checkout"</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Enter delivery address</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Complete payment</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Get fresh produce in 3-5 days!</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-orange-100 rounded-lg text-sm text-orange-800">
                        🚚 Free delivery on orders above ₹500
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              </div>
            </div>

            {/* For Farmers */}
            <div>
              <ScrollAnimation className="scroll-slide mb-12">
                <h3 className="text-3xl font-bold text-green-600 text-center mb-8 flex items-center justify-center gap-2">
                  🌾 For Farmers - 3 Simple Steps
                </h3>
              </ScrollAnimation>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Farmer Step 1 */}
                <ScrollAnimation className="scroll-slide">
                  <Card hover className="h-full bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                    <div className="p-8">
                      <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                        1
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Register (3 minutes)</h4>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Click <strong>"Join as Farmer"</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Enter basic information</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Add farm location</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Create your account</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-purple-100 rounded-lg text-sm text-purple-800">
                        ℹ️ Your profile gets verified within 24 hours
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>

                {/* Farmer Step 2 */}
                <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.1s' }}>
                  <Card hover className="h-full bg-linear-to-br from-red-50 to-pink-50 border-2 border-red-200">
                    <div className="p-8">
                      <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                        2
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">List Your Products (5 minutes)</h4>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Go to <strong>My Farm Dashboard</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Click <strong>"Add Crop"</strong></span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Enter crop name and quantity</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Set your price</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Add photos and description</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-red-100 rounded-lg text-sm text-red-800">
                        💡 Tip: Competitive pricing = more sales
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>

                {/* Farmer Step 3 */}
                <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.2s' }}>
                  <Card hover className="h-full bg-linear-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
                    <div className="p-8">
                      <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                        3
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Get Orders & Earn (Ongoing)</h4>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Customers order your products</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Get order notifications instantly</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Prepare and pack your produce</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Arrange courier pickup</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Get paid directly (no commission!)</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-yellow-100 rounded-lg text-sm text-yellow-800">
                        ✅ Keep 100% of your earnings - no middlemen
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center">Common Questions Answered</h2>
            </ScrollAnimation>
            <div className="space-y-4">
              {[
                { q: "Is it really fresh?", a: "Yes! Products ship directly from farmers to you within 3-5 days. No storage, no middlemen - just farm fresh." },
                { q: "What if I don't know how to use online shopping?", a: "No problem! Our simple interface is designed for everyone. Just fill basic info, browse, click add to cart, and checkout - that's it!" },
                { q: "What if the product arrives in bad condition?", a: "We have a quality guarantee. If products arrive damaged, we'll replace them or refund your money." },
                { q: "Is payment safe?", a: "Absolutely. We use secure payment gateways. Your card information is encrypted and never stored on our servers." },
                { q: "How do I know the farmer is trustworthy?", a: "All farmers are verified. You can see their ratings, reviews, and years of experience before ordering." },
              ].map((faq, i) => (
                <ScrollAnimation key={i} className="scroll-slide" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Card className="p-6 bg-white">
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">❓ {faq.q}</h4>
                    <p className="text-gray-600">{faq.a}</p>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 relative bg-white">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-16">
              <h2 className="text-4xl font-bold text-gray-900 text-center animate-slide-in-down mb-2">Our Growing Community</h2>
              <p className="text-center text-gray-600 text-lg">Real farmers, real customers, real impact</p>
            </ScrollAnimation>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Farmers Card */}
              <ScrollAnimation className="scroll-slide">
                <div className="bg-green-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
                  <div className="text-5xl font-bold text-green-600 mb-4 text-center">
                    <AnimatedNumber 
                      value={stats.farmers} 
                      duration={2000}
                      animateOnVisible={true}
                      suffix="+"
                    />
                  </div>
                  <p className="text-gray-700 font-bold text-lg text-center mb-2">Active Farmers</p>
                  <p className="text-gray-600 text-sm text-center">Growing their business with fair prices</p>
                  <div className="mt-4 pt-4 border-t border-green-200 text-center">
                    <span className="text-2xl">🌾</span>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Customers Card */}
              <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.1s' }}>
                <div className="bg-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
                  <div className="text-5xl font-bold text-blue-600 mb-4 text-center">
                    <AnimatedNumber 
                      value={stats.customers} 
                      duration={2000}
                      animateOnVisible={true}
                      suffix="+"
                    />
                  </div>
                  <p className="text-gray-700 font-bold text-lg text-center mb-2">Happy Customers</p>
                  <p className="text-gray-600 text-sm text-center">Trust us for quality produce</p>
                  <div className="mt-4 pt-4 border-t border-blue-200 text-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Varieties Card */}
              <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.2s' }}>
                <div className="bg-orange-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-orange-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
                  <div className="text-5xl font-bold text-orange-600 mb-4 text-center">
                    <AnimatedNumber 
                      value={stats.varieties} 
                      duration={2000}
                      animateOnVisible={true}
                      suffix="+"
                    />
                  </div>
                  <p className="text-gray-700 font-bold text-lg text-center mb-2">Crop Varieties</p>
                  <p className="text-gray-600 text-sm text-center">Various fresh produce</p>
                  <div className="mt-4 pt-4 border-t border-orange-200 text-center">
                    <span className="text-2xl">🥬</span>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Delivery Card */}
              <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.3s' }}>
                <div className="bg-purple-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:scale-105 animate-bounce-soft h-full flex flex-col">
                  <div className="text-5xl font-bold text-purple-600 mb-4 text-center">{stats.deliveryDays}</div>
                  <p className="text-gray-700 font-bold text-lg text-center mb-2">Days Delivery</p>
                  <p className="text-gray-600 text-sm text-center">Fast & reliable service</p>
                  <div className="mt-4 pt-4 border-t border-purple-200 text-center">
                    <span className="text-2xl">🚚</span>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Testimonials - Premium Section */}
        <section className="py-20 px-4 relative bg-linear-to-br from-gray-50 via-green-50 to-gray-50">
          <div className="max-w-6xl mx-auto relative z-10">
            <ScrollAnimation className="scroll-slide mb-16">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-slide-in-down">What People Say</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">Join thousands of satisfied farmers and buyers who are transforming agriculture</p>
              </div>
            </ScrollAnimation>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testi, i) => (
                <ScrollAnimation key={i} className="scroll-slide" style={{ animationDelay: `${i * 0.1}s` }}>
                  <Card hover className="h-full bg-linear-to-br from-white to-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                    <div className="p-8">
                      {/* Animated Stars */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(testi.rating)].map((_, idx) => (
                          <span 
                            key={idx} 
                            className="text-yellow-400 text-lg animate-bounce-up"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      
                      {/* Quote */}
                      <p className="text-gray-700 italic mb-6 leading-relaxed flex gap-3">
                        <span className="text-3xl text-green-600 font-bold leading-none animate-fade-in">\"</span>
                        <span>{testi.text}</span>
                        <span className="text-3xl text-green-600 font-bold leading-none animate-fade-in">\"</span>
                      </p>
                      
                      {/* Animated Divider */}
                      <div className="h-1 w-12 bg-linear-to-r from-green-400 to-emerald-400 rounded mb-6 group-hover:w-20 transition-all duration-500"></div>
                      
                      {/* User Info with Animated Avatar */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-green-200/50 hover:scale-110 transition-all duration-300 animate-bounce-soft">
                          {testi.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base group-hover:text-green-600 transition-colors">{testi.name}</p>
                          <p className="text-gray-500 text-sm">{testi.role}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

