import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen text-slate-100 selection:bg-zinc-500/30 selection:text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-4 lg:pt-32 lg:pb-12 relative overflow-hidden">
        {/* Decorative subtle background gradient (no gaudy glow) */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/0 to-transparent" />
        
        <div className="flex items-center justify-center mb-2">
          <img 
            src="/icon.png" 
            alt="Domainatrix Logo" 
            className="w-42 h-42 sm:w-46 sm:h-46 rounded-2xl drop-shadow-[0_0_6px_rgba(255,255,255,0.25)] mt-4 mb-4"
          />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-white">
          Domainatrix
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 font-medium">
          A self-hostable domain portfolio manager, diagnostic tracker, and real-time uptime monitor. 100% private, open-source, and developer-focused.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/docs" 
            className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-semibold text-black bg-white hover:bg-slate-200 transition-colors shadow-lg shadow-slate-500/20"
          >
            Get Started &rarr;
          </Link>
          <a 
            href="https://github.com/pinkpixel-dev/domainatrix" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-semibold text-zinc-200 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 transition-colors"
          >
            GitHub Repository
          </a>
        </div>
      </section>

      {/* Main Screenshot Preview */}
      <section className="px-4 pb-16 max-w-5xl mx-auto w-full">
        <div className="relative rounded-xl overflow-hidden border border-zinc-850 shadow-2xl bg-zinc-900/50 p-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border-b border-zinc-800 rounded-t-lg">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
            <span className="text-xs text-zinc-500 ml-2 select-none">Domainatrix Dashboard</span>
          </div>
          <img 
            src="/screenshots/screenshot1.png" 
            alt="Domainatrix Interface" 
            className="w-full h-auto object-cover rounded-b-lg select-none"
          />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-5xl mx-auto w-full px-4 py-12 border-t border-zinc-800/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">Portfolio Management</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Track domain registration details, expiry dates, annual costs, and registrars all in a single, beautiful dashboard.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">Auto-Enrichment</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Instantly fetch live WHOIS, DNS (NS, MX, TXT, A, AAAA), SSL certificates, and server location metadata.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">Uptime & Alerts</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Monitor website status in real-time. Receive notifications via Discord/Slack webhooks or SMTP email when something fails or changes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-xs text-zinc-650 border-t border-zinc-900">
        <p>&copy; {new Date().getFullYear()} Domainatrix. Open source under Apache-2.0 License.</p>
        <p className="mt-1">Made with 💖 by <a href="https://pinkpixel.dev" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Pink Pixel</a></p>
      </footer>
    </div>
  );
}
