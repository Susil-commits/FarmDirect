import { Sprout, ArrowUpRight, MapPin, Globe, MessageCircle, Share2, Mail } from 'lucide-react';

export default function GiantBrandFooter({ onNavigate }) {
  const products = [
    { label: 'FarmDirect Harvests', tag: 'Live' },
    { label: 'Direct Farmer Directory', tag: '1,450+' },
    { label: 'Harvest Notetaker & Audio', tag: 'New' },
    { label: 'Soil Traceability QR', tag: 'Certified' },
  ];

  const getStartedLinks = [
    { label: 'Browse Marketplace', href: '/marketplace' },
    { label: 'Join as a Farmer', href: '/join-farmer' },
    { label: 'Fair Pricing Charter', href: '/about' },
    { label: 'How It Works', href: '/#how-it-works' },
  ];

  const resources = [
    { label: 'Case Studies', href: '/about' },
    { label: 'Organic Soil Reports', href: '/support' },
    { label: 'Farmer Voice Logs', href: '/#hero' },
    { label: 'Direct Logistics Guide', href: '/support' },
  ];

  const company = [
    { label: 'About FarmDirect', href: '/about' },
    { label: 'Careers & Impact', href: '/about' },
    { label: 'Privacy & Security', href: '/privacy' },
    { label: 'Terms of Trade', href: '/terms' },
    { label: 'Support Center', href: '/support' },
  ];

  return (
    <footer className="relative bg-[#FBF8F3] text-[#132E20] pt-16 pb-12 overflow-hidden border-t border-[#132E20]/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        {/* Products Grid Pill Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {products.map((p) => (
            <div
              key={p.label}
              className="bg-white/80 backdrop-blur-sm border border-[#132E20]/12 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
              onClick={() => onNavigate && onNavigate('/marketplace')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#132E20] text-[#FBF8F3] flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5 text-[#D97736]" />
                </div>
                <div>
                  <span className="font-serif-display text-xl font-bold text-[#132E20] block">
                    {p.label}
                  </span>
                  <span className="font-sans-body text-xs text-[#132E20]/60">
                    Direct origin marketplace protocol
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.tag && (
                  <span className="font-sans-body text-[10px] font-extrabold bg-[#D97736]/15 text-[#D97736] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {p.tag}
                  </span>
                )}
                <ArrowUpRight className="w-4 h-4 text-[#132E20]/40 group-hover:text-[#D97736] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Structured Nav Links Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-16 border-b border-[#132E20]/10">
          <div>
            <h4 className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#132E20]/50 mb-4">
              Get Started
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              {getStartedLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (onNavigate && link.href.startsWith('/')) {
                        e.preventDefault();
                        onNavigate(link.href);
                      }
                    }}
                    className="hover:text-[#D97736] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#132E20]/50 mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              {resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (onNavigate && link.href.startsWith('/')) {
                        e.preventDefault();
                        onNavigate(link.href);
                      }
                    }}
                    className="hover:text-[#D97736] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#132E20]/50 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              {company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (onNavigate && link.href.startsWith('/')) {
                        e.preventDefault();
                        onNavigate(link.href);
                      }
                    }}
                    className="hover:text-[#D97736] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans-body text-xs font-bold uppercase tracking-wider text-[#132E20]/50 mb-4">
              Origin Headquarters
            </h4>
            <div className="space-y-3 text-xs text-[#132E20]/75">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D97736] flex-shrink-0 mt-0.5" />
                <span>FarmDirect Agritech Hub, Nashik Valley, Maharashtra 422003</span>
              </p>
              <p>Direct support: support@farmdirect.org</p>
              <div className="flex items-center gap-3 pt-2 text-[#132E20]">
                <a href="#hero" className="w-8 h-8 rounded-full bg-[#132E20]/10 flex items-center justify-center hover:bg-[#D97736] hover:text-white transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
                <a href="#hero" className="w-8 h-8 rounded-full bg-[#132E20]/10 flex items-center justify-center hover:bg-[#D97736] hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href="#hero" className="w-8 h-8 rounded-full bg-[#132E20]/10 flex items-center justify-center hover:bg-[#D97736] hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* GIANT BRAND WORDMARK (Wispr Flow style at video 0:30 & 1:08) */}
        <div className="pt-10 pb-6 text-center overflow-hidden">
          <h1 className="font-serif-display text-[15vw] sm:text-[14vw] md:text-[13vw] font-bold text-[#132E20] leading-none tracking-tighter select-none opacity-95">
            FarmDirect
          </h1>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#132E20]/60 pt-4 border-t border-[#132E20]/10 gap-2">
          <span>© Wispr FarmDirect 2026. All rights reserved.</span>
          <div className="flex items-center gap-4 font-medium">
            <a href="/privacy" className="hover:text-[#132E20]">Privacy</a>
            <a href="/terms" className="hover:text-[#132E20]">Terms</a>
            <a href="/support" className="hover:text-[#132E20]">Data Controls</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
