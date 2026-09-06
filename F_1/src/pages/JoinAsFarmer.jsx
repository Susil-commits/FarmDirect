import { ArrowRight, Leaf, TrendingUp, Users, MapPin, Smartphone, BarChart3, Shield, Zap, CreditCard, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';

export default function JoinAsFarmer() {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8 text-[#D97736]" />,
      title: 'Increase Sales',
      desc: 'Direct access to customers without middlemen reducing your profits'
    },
    {
      icon: <Users className="w-8 h-8 text-[#D97736]" />,
      title: 'Direct Connection',
      desc: 'Build relationships directly with buyers who value your work'
    },
    {
      icon: <CreditCard className="w-8 h-8 text-[#D97736]" />,
      title: 'Better Margins',
      desc: 'Keep 85%+ of invoice value — zero middleman commissions'
    },
    {
      icon: <Smartphone className="w-8 h-8 text-[#D97736]" />,
      title: 'Voice & App Management',
      desc: 'Simple dashboard and voice logs to manage inventory and orders'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-[#D97736]" />,
      title: 'Growth Tools',
      desc: 'Analytics and harvest insights to grow your farm business'
    },
    {
      icon: <Shield className="w-8 h-8 text-[#D97736]" />,
      title: 'Secure Payouts',
      desc: 'Safe 24-hour settlement processing directly to your bank account'
    },
  ];

  const whyUs = [
    {
      metric: '650+',
      label: 'Active Farmers',
      desc: 'Growing community of successful farmers'
    },
    {
      metric: '40%+',
      label: 'Average Sales Growth',
      desc: 'Farmers report significant revenue increases'
    },
    {
      metric: '4-12h',
      label: 'Express Dispatch Window',
      desc: 'Fast logistics to keep produce fresh'
    },
    {
      metric: '24/7',
      label: 'Agronomist Support',
      desc: 'We\'re here to help your farm succeed'
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Sign Up as Farmer',
      desc: 'Create your account in 2 minutes',
      details: ['Enter farm details', 'Verify your contact info', 'Accept terms & conditions']
    },
    {
      number: 2,
      title: 'Complete Your Profile & KYC',
      desc: 'Tell buyers about your farm',
      details: ['Add farm name and location', 'Upload farm photos & Govt ID', 'Describe what you grow', 'Set your pricing']
    },
    {
      number: 3,
      title: 'List Your Produce',
      desc: 'Add crops you want to sell via voice or form',
      details: ['Choose product category', 'Set prices and quantities', 'Add photos and descriptions', 'Go live!']
    },
    {
      number: 4,
      title: 'Start Receiving Direct Orders',
      desc: 'Earn 85%+ margin from your harvest',
      details: ['Receive orders instantly', 'Manage inventory easily', 'Get paid securely', 'Grow your business']
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <section className="pt-32 pb-16 px-4 md:px-8 max-w-6xl mx-auto text-center">
          <ScrollAnimation className="scroll-slide">
            <div className="inline-flex items-center gap-2 bg-[#F4EFE6] border border-[#132E20]/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#132E20] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
              <span>DIRECT FARMER REGISTRATION</span>
            </div>

            <h1 className="font-serif-display text-5xl sm:text-6xl md:text-7xl font-normal leading-[0.98] tracking-tight max-w-4xl mx-auto">
              Grow Your Farm Business <span className="italic text-[#D97736] font-normal">Direct.</span>
            </h1>

            <p className="font-sans-body text-base md:text-lg text-[#132E20]/75 mt-6 max-w-2xl mx-auto leading-relaxed">
              Skip distributor cuts. Sell fresh produce directly to buyers. Keep 85%+ profit margin and build long-term contract relationships.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                variant="primary"
                size="lg"
                className="flex items-center gap-2 justify-center bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold rounded-xl px-8 py-3.5 shadow-lg cursor-pointer"
                onClick={() => navigate('/auth/register')}
              >
                <Leaf size={20} className="text-[#D97736]" />
                Start as a Farmer
              </Button>
            </div>
          </ScrollAnimation>
        </section>

        {}
        <section className="py-20 px-4 relative">
          <div className="max-w-6xl mx-auto relative z-10">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Why Join FarmDirect?</h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                Stop selling through middlemen. Get better prices for your hard work:
              </p>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, i) => (
                <ScrollAnimation key={i} className="scroll-slide">
                  <Card hover className="h-full">
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          {benefit.icon}
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

        {}
        <section className="py-20 px-4 bg-gradient-to-br from-green-50 via-white to-green-50">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">FarmDirect by the Numbers</h2>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {whyUs.map((stat, i) => (
                <ScrollAnimation key={i} className="scroll-slide">
                  <Card className="text-center bg-white border-2 border-green-200">
                    <div className="p-8">
                      <div className="text-4xl font-bold text-green-600 mb-2">{stat.metric}</div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{stat.label}</h4>
                      <p className="text-gray-600 text-sm">{stat.desc}</p>
                    </div>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-16">
              <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Getting Started is Simple</h2>
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                4 easy steps to start selling your farm products online
              </p>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <ScrollAnimation key={i} className="scroll-slide">
                  <div className="relative">
                    <Card className="h-full bg-white border-2 border-green-200">
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
                    {i < steps.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <ArrowRight size={24} className="text-green-400" />
                      </div>
                    )}
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="py-20 px-4 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">What Farmers Are Saying</h2>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {[
                {
                  quote: 'FarmDirect helped me increase my sales by 45%. I now deal directly with customers and earn much better margins.',
                  name: 'Rajesh Kumar',
                  farm: 'Kumar Organic Farm, Gujarat'
                },
                {
                  quote: 'The platform is so easy to use. I spend more time farming and less time on logistics. FarmDirect handles everything!',
                  name: 'Priya Singh',
                  farm: 'Fresh Harvest Farm, Punjab'
                },
                {
                  quote: 'Best decision for my farm business. The customers appreciate buying directly, and I get paid fairly for my hard work.',
                  name: 'Vikram Patel',
                  farm: 'Patel Vegetable Gardens, Maharashtra'
                },
              ].map((item, i) => (
                <ScrollAnimation key={i} className="scroll-slide">
                  <Card className="bg-white">
                    <div className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, j) => (
                          <span key={j} className="text-yellow-400 text-lg">★</span>
                        ))}
                      </div>
                      <p className="text-gray-700 italic mb-4">"{item.quote}"</p>
                      <div className="border-t border-gray-200 pt-4">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.farm}</p>
                      </div>
                    </div>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation className="scroll-slide mb-12">
              <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Farmer FAQ</h2>
            </ScrollAnimation>

            <div className="space-y-4">
              {[
                { q: 'Is there a registration fee?', a: 'No! Signing up is completely free. You only pay a small commission on successful sales.' },
                { q: 'How do I get paid?', a: 'Payments are deposited directly to your bank account within 3-5 business days after order delivery.' },
                { q: 'Can I set my own prices?', a: 'Yes! You have complete control over pricing. Set prices that work for your farm.' },
                { q: 'What if a customer has issues?', a: 'Our support team helps resolve any issues. We support both farmers and customers fairly.' },
                { q: 'How do I manage orders?', a: 'Use our simple dashboard to receive, manage, and track all orders in one place.' },
                { q: 'Can I sell multiple types of crops?', a: 'Absolutely! Add as many crop varieties as you grow. Update inventory as needed.' },
              ].map((item, i) => (
                <ScrollAnimation key={i} className="scroll-slide">
                  <Card className="bg-white">
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

        {}
        <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-emerald-600">
          <ScrollAnimation className="scroll-slide">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-white mb-6">Ready to Grow Your Farm Business?</h2>
              <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
                Join hundreds of successful farmers already earning more with FarmDirect. No middlemen, no limits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2 justify-center bg-white hover:bg-gray-100 text-green-600"
                  onClick={() => navigate('/auth/register')}
                >
                  <Leaf size={20} />
                  Register as Farmer
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white bg-white/10 hover:bg-white/20 font-semibold"
                  onClick={() => {
                    if (user && user.role === 'farmer') {
                      navigate('/farmer/dashboard');
                    } else {
                      navigate('/auth/login');
                    }
                  }}
                >
                  Already a Farmer? Login
                </Button>
              </div>
            </div>
          </ScrollAnimation>
        </section>
      </div>
    </PageTransition>
  );
}
