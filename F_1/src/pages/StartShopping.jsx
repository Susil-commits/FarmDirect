import { ArrowRight, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import {
  ANIMATION_DELAYS,
  HERO_IMAGE,
  BENEFITS,
  STEPS,
  QUICK_FACTS,
  FAQ_ITEMS,
  VERIFICATION_BENEFITS,
  VERIFICATION_TIMELINE,
  VERIFICATION_STATUS,
  ERROR_MESSAGES,
} from '../constants/startShoppingContent';
import { ICON_MAP } from '../constants/iconMap';

export default function StartShopping() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Safe navigation handler with error handling
  const handleNavigation = useCallback((path) => {
    try {
      if (!path || typeof path !== 'string') {
        console.error(ERROR_MESSAGES.NAVIGATION_FAILED);
        return;
      }
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigate]);

  // Check marketplace access based on verification status
  const handleMarketplaceAccess = useCallback(() => {
    try {
      if (!user) {
        // Redirect to login with marketplace as the next destination
        handleNavigation('/auth/login?next=/marketplace');
        return;
      }
      
      // Require verification to access marketplace
      if (user.kycStatus !== VERIFICATION_STATUS.VERIFIED) {
        console.warn(ERROR_MESSAGES.VERIFICATION_REQUIRED);
        // Optionally show a notification or redirect to verification page
      }
      
      handleNavigation('/marketplace');
    } catch (error) {
      console.error('Marketplace access error:', error);
    }
  }, [user, handleNavigation]);

  // Handle hero image error with fallback
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-linear-to-br from-white via-blue-50 to-white">
        {/* Back Button */}
        <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 py-2 px-4">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors duration-200 group cursor-pointer"
              title="Back to Home"
              aria-label="Go back to home page"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section 
          className="py-24 px-4 bg-linear-to-br from-blue-50 via-cyan-50 to-emerald-50 relative overflow-hidden"
          aria-label="Hero section - Fresh Produce Marketplace"
        >
          <div className="max-w-6xl mx-auto relative z-10">
            <ScrollAnimation className="scroll-slide mb-12">
              <div className="text-center">
                <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight animate-slide-in-down bg-linear-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Fresh Produce, <span className="block">Better Prices</span>
                </h1>
                <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto animate-slide-in-down font-medium" style={{ animationDelay: ANIMATION_DELAYS.STAGGER_DELAY_1 }}>
                  🌾 Shop directly from local farmers. No middlemen, no hidden costs. Just fresh, honest produce at fair prices. 🛒
                </p>
              </div>
            </ScrollAnimation>

            {/* Hero Image */}
            <ScrollAnimation className="scroll-slide mt-16">
              <div className="rounded-3xl overflow-hidden glass premium-glow h-80 md:h-96 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300 border-2 border-white/50 relative">
                {imageLoading && (
                  <div className="absolute inset-0 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
                )}
                <img
                  src={imageError ? HERO_IMAGE.fallback : HERO_IMAGE.src}
                  alt={HERO_IMAGE.alt}
                  loading="eager"
                  onLoad={() => setImageLoading(false)}
                  onError={handleImageError}
                  className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  decoding="async"
                />
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Why Shop With Us */}
        <section 
          className="py-20 px-4 relative"
          aria-labelledby="benefits-heading"
        >
          <div className="max-w-6xl mx-auto relative z-10">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 id="benefits-heading" className="text-4xl font-bold text-gray-900 text-center mb-4">Why Shop With FarmDirect?</h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                Experience the difference of buying directly from farmers. Here's what makes us special:
              </p>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {BENEFITS.map((benefit) => (
                <ScrollAnimation key={benefit.id} className="scroll-slide">
                  <Card 
                    hover 
                    className="h-full"
                    role="article"
                    aria-label={`${benefit.title}: ${benefit.desc}`}
                  >
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          {ICON_MAP[benefit.id]}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* How to Start */}
        <section 
          className="py-20 px-4 bg-linear-to-br from-green-50 via-white to-green-50"
          aria-labelledby="steps-heading"
        >
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-16">
              <h2 id="steps-heading" className="text-4xl font-bold text-gray-900 text-center mb-4">Getting Started is Easy</h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                4 simple steps to your first order of fresh produce
              </p>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <ScrollAnimation key={step.number} className="scroll-slide">
                  <div className="relative">
                    <Card 
                      className="h-full bg-white border-2 border-green-200"
                      role="article"
                      aria-label={`Step ${step.number}: ${step.title}`}
                    >
                      <div className="p-6">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                          {step.number}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{step.desc}</p>
                        <ul className="space-y-2">
                          {step.details.map((detail, j) => (
                            <li key={j} className="flex gap-2 text-sm text-gray-700">
                              <span className="text-green-600 font-bold">✓</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                    {i < STEPS.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2" aria-hidden="true">
                        <ArrowRight size={24} className="text-green-400" />
                      </div>
                    )}
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Facts */}
        <section 
          className="py-20 px-4 bg-linear-to-r from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden"
          aria-labelledby="quick-facts-heading"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <ScrollAnimation className="scroll-slide">
            <div className="max-w-6xl mx-auto relative z-10">
              <h2 id="quick-facts-heading" className="sr-only">Quick Facts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
                {QUICK_FACTS.map((fact, idx) => (
                  <div key={fact.id} role="article" aria-label={`${fact.value} ${fact.label}`} className="transform hover:scale-110 transition-transform duration-300">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-xl">
                              <div className="text-5xl font-bold mb-3 bg-linear-to-r from-white to-green-100 bg-clip-text text-transparent">{fact.value}</div>
                      <p className="text-lg font-semibold text-green-100">{fact.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollAnimation>
        </section>

        {/* FAQ */}
        <section 
          className="py-20 px-4"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 id="faq-heading" className="text-4xl font-bold text-gray-900 text-center mb-4">Common Questions</h2>
            </ScrollAnimation>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <ScrollAnimation key={item.id} className="scroll-slide">
                  <Card 
                    className="bg-white"
                    role="article"
                    aria-label={`FAQ: ${item.q}`}
                  >
                    <div className="p-6">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{item.q}</h4>
                      <p className="text-gray-600">{item.a}</p>
                    </div>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* Buyer Verification Info */}
        <section 
          className="py-20 px-4 bg-blue-50"
          aria-labelledby="verification-heading"
        >
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 id="verification-heading" className="text-4xl font-bold text-gray-900 text-center mb-4">Why We Verify Buyers</h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                Your security and trust are our priority. Here's why we verify all buyers:
              </p>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {VERIFICATION_BENEFITS.map((benefit) => (
                <ScrollAnimation key={benefit.id} className="scroll-slide">
                  <Card 
                    className="bg-white"
                    role="article"
                    aria-label={`${benefit.title}: ${benefit.desc}`}
                  >
                    <div className="p-8">
                      <div className="text-4xl mb-4" aria-hidden="true">{benefit.icon}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                      <p className="text-gray-600">
                        {benefit.desc}
                      </p>
                    </div>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>

            {/* Verification Timeline */}
            <div className="mt-16">
              <ScrollAnimation className="scroll-slide">
                <Card 
                  className="bg-linear-to-br from-blue-50 via-green-50 to-emerald-50 border-2 border-green-300 shadow-xl hover:shadow-2xl transition-shadow duration-300"
                  role="article"
                  aria-label="Verification timeline"
                >
                  <div className="p-16">
                    <div className="text-center mb-12">
                      <h3 className="text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Verification Timeline</h3>
                      <p className="text-gray-600 text-lg">Quick, secure, and transparent process</p>
                    </div>
                    <div className="relative">
                      {/* Enhanced Timeline Background */}
                      <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-linear-to-r from-green-300 via-emerald-400 to-green-300" aria-hidden="true"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {VERIFICATION_TIMELINE.map((timeline, i) => (
                          <div key={i} className="text-center relative group">
                            {/* Timeline dot - Enhanced */}
                            <div className="flex justify-center mb-8 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-linear-to-br from-green-400 to-emerald-500 opacity-20 blur-lg group-hover:opacity-30 transition-opacity"></div>
                              </div>
                              <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-green-500/40 border-4 border-white relative z-10 group-hover:scale-110 transition-transform duration-300">
                                {i + 1}
                              </div>
                            </div>
                            
                            {/* Card for timeline item */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-100 group-hover:border-green-300 group-hover:-translate-y-1">
                              <div className="text-3xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">{timeline.time}</div>
                              <p className="text-gray-800 font-bold mb-2 text-lg">{timeline.milestone}</p>
                              <p className="text-gray-600 text-sm leading-relaxed">{timeline.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Enhanced CTA Box */}
                    <div className="text-center mt-14 p-8 bg-linear-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30 border-2 border-green-400 transform hover:scale-105 transition-transform duration-300 group">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <span className="text-4xl animate-pulse">✓</span>
                        <p className="text-white font-bold text-xl md:text-2xl">Instant Marketplace Access</p>
                      </div>
                      <p className="text-green-100 text-sm md:text-base">Once verified, start shopping immediately. No waiting, no hassles!</p>
                    </div>
                  </div>
                </Card>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-24 px-4 bg-linear-to-br from-green-50 via-emerald-50 to-cyan-50 relative overflow-hidden"
          aria-labelledby="cta-heading"
        >
          {/* Decorative background elements */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-linear-to-br from-green-200 to-emerald-200 rounded-full blur-3xl opacity-20" aria-hidden="true"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-linear-to-br from-emerald-200 to-cyan-200 rounded-full blur-3xl opacity-20" aria-hidden="true"></div>
          
          <ScrollAnimation className="scroll-slide">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 id="cta-heading" className="text-5xl font-bold bg-linear-to-r from-green-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-6">Ready to Start Shopping?</h2>
              <p className="text-xl text-gray-700 mb-3 max-w-2xl mx-auto font-medium">
                Join thousands of customers already enjoying fresh, affordable produce from local farmers.
              </p>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                💚 Direct from farms. 🚀 Fast delivery. 💰 Best prices.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="flex items-center gap-2 justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold text-lg mx-auto"
                onClick={() => handleNavigation('/auth/register')}
                aria-label="Create buyer account"
              >
                <ShoppingCart size={22} />
                Start Buying Now
              </Button>
            </div>
          </ScrollAnimation>
        </section>
      </div>
    </PageTransition>
  );
}
