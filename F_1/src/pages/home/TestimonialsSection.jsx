import ScrollAnimation from '../../components/common/ScrollAnimation';

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
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-green-50/30 to-transparent">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            What People Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Join thousands of satisfied farmers and buyers who are transforming agriculture.
          </p>
        </ScrollAnimation>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testi, i) => (
            <ScrollAnimation key={i} className="h-full" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-300 group hover:-translate-y-2 flex flex-col relative">
                {/* Decorative Quote Mark */}
                <div className="absolute top-6 right-8 text-6xl text-green-100 font-serif opacity-50 group-hover:opacity-100 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">
                  "
                </div>

                {/* Animated Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testi.rating)].map((_, idx) => (
                    <span 
                      key={idx} 
                      className="text-amber-400 text-lg group-hover:animate-bounce-up"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-gray-700 italic mb-8 leading-relaxed font-medium relative z-10 flex-grow">
                  "{testi.text}"
                </p>
                
                {/* Animated Divider */}
                <div className="h-1 w-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded mb-6 group-hover:w-full transition-all duration-700 ease-in-out opacity-50 group-hover:opacity-100"></div>
                
                {/* User Info with Animated Avatar */}
                <div className="flex items-center gap-4 mt-auto">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <img loading="lazy" 
                      src={testi.avatar} 
                      alt={testi.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm relative z-10 transform group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base tracking-tight">{testi.name}</p>
                    <p className="text-gray-500 text-sm font-medium">{testi.role}</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
