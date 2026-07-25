import ScrollAnimation from '../../components/common/ScrollAnimation';
import Card from '../../components/common/Card';

export default function TestimonialsSection() {
  const testimonials = [
    {
      text: 'FarmDirect has revolutionized how I shop for fresh produce. Direct from farmers means fresher veggies and better prices!',
      name: 'Priya Sharma',
      role: 'Regular Customer from Mumbai',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80',
      rating: 5,
    },
    {
      text: 'As a farmer, I can finally reach customers without middlemen taking their cut. Sales have increased by 40%!',
      name: 'Rajesh Patel',
      role: 'Organic Farmer from Gujarat',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
      rating: 5,
    },
    {
      text: 'The quality of produce is exceptional. I appreciate knowing exactly where my food comes from.',
      name: 'Anjali Desai',
      role: 'Health-conscious Buyer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollAnimation className="scroll-slide mb-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-slide-in-down">What People Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Join thousands of satisfied farmers and buyers who are transforming agriculture</p>
          </div>
        </ScrollAnimation>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {testimonials.map((testi, i) => (
            <ScrollAnimation key={i} className="scroll-slide" style={{ animationDelay: `${i * 0.1}s` }}>
              <Card hover className="h-full bg-gradient-to-br from-white to-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
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
                    <span className="text-3xl text-green-600 font-bold leading-none animate-fade-in">"</span>
                    <span>{testi.text}</span>
                    <span className="text-3xl text-green-600 font-bold leading-none animate-fade-in">"</span>
                  </p>
                  
                  {/* Animated Divider */}
                  <div className="h-1 w-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded mb-6 group-hover:w-20 transition-all duration-500"></div>
                  
                  {/* User Info with Animated Avatar */}
                  <div className="flex items-center gap-4">
                    <img 
                      src={testi.avatar} 
                      alt={testi.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-green-200 shadow-md group-hover:shadow-green-200/50 hover:scale-110 transition-all duration-300 animate-bounce-soft"
                    />
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
  );
}
