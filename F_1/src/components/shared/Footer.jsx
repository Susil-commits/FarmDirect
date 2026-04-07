import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

export default function Footer() {
  const { navigate } = useRouter();

  const footerLinks = {
    quickLinks: [
      { label: 'Home', path: '/' },
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'About Us', path: '/about' },
      { label: 'Contact', path: '/contact' },
    ],
    farmers: [
      { label: 'Sell Your Crops', path: '/join-farmer' },
      { label: 'How It Works', path: '/how-it-works' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'Support', path: '/support' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms & Conditions', path: '/terms' },
      { label: 'Refund Policy', path: '/refund' },
      { label: 'Contact Us', path: '/contact' },
    ]
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <button onClick={() => navigate('/')} className="mb-4 hover:opacity-80 transition cursor-pointer">
              <h3 className="text-2xl font-bold text-green-700">FarmDirect</h3>
            </button>
            <p className="text-sm">Connecting farmers directly to buyers. Fresh produce, fair prices.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.quickLinks.map((link, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="hover:text-green-400 transition cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* For Farmers */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Farmers</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.farmers.map((link, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="hover:text-green-400 transition cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.legal.map((link, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="hover:text-green-400 transition cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex gap-4 mb-4 md:mb-0">
            <button className="text-gray-400 hover:text-blue-400 hover:bg-gray-800 p-2 rounded-lg transition duration-200 cursor-pointer" title="Twitter">
              <Twitter size={20} />
            </button>
            <button className="text-gray-400 hover:text-blue-600 hover:bg-gray-800 p-2 rounded-lg transition duration-200 cursor-pointer" title="Facebook">
              <Facebook size={20} />
            </button>
            <button className="text-gray-400 hover:text-pink-500 hover:bg-gray-800 p-2 rounded-lg transition duration-200 cursor-pointer" title="Instagram">
              <Instagram size={20} />
            </button>
            <button className="text-gray-400 hover:text-blue-500 hover:bg-gray-800 p-2 rounded-lg transition duration-200 cursor-pointer" title="LinkedIn">
              <Linkedin size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-400">&copy; 2026 FarmDirect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
