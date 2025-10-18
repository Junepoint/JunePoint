import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Code, Palette, Menu, X, ChevronDown, Smartphone, Globe, Zap } from 'lucide-react';

export default function JunePointLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { 
      icon: <Sparkles className="w-6 h-6" />, 
      title: "Personal Websites", 
      desc: "Custom portfolio and personal branding sites built with React, featuring stunning galleries and blog integration",
      color: "from-blue-400 to-blue-600",
      tech: "React • Next.js • Tailwind"
    },
    { 
      icon: <Code className="w-6 h-6" />, 
      title: "Business Websites", 
      desc: "Responsive, modern sites powered by full-stack technologies with seamless user experiences",
      color: "from-blue-500 to-blue-700",
      tech: "React • NeonDB • GCP"
    },
    { 
      icon: <Smartphone className="w-6 h-6" />, 
      title: "Cross-Platform Mobile Apps", 
      desc: "Native-quality iOS and Android apps from a single codebase using React Native and Expo",
      color: "from-sky-400 to-blue-600",
      tech: "React Native • Expo • Clerk"
    },
    { 
      icon: <Globe className="w-6 h-6" />, 
      title: "Full-Stack Applications", 
      desc: "Complete web and mobile solutions with authentication, databases, and cloud deployment",
      color: "from-cyan-400 to-blue-600",
      tech: "React • NeonDB • Google Cloud"
    },
    { 
      icon: <Palette className="w-6 h-6" />, 
      title: "Portfolio Websites", 
      desc: "Showcase your work with interactive case studies, project galleries, and client testimonials",
      color: "from-blue-600 to-indigo-600",
      tech: "React • Framer Motion • CMS"
    },
    { 
      icon: <Zap className="w-6 h-6" />, 
      title: "Informational Platforms", 
      desc: "Resource libraries, FAQ sections, and event calendars with real-time updates",
      color: "from-sky-500 to-blue-700",
      tech: "React • Firebase • Vercel"
    }
  ];

  const process = [
    { num: "01", title: "Discovery", desc: "Learn goals, audience, and constraints" },
    { num: "02", title: "Design", desc: "Wireframes and visual direction" },
    { num: "03", title: "Development", desc: "Implement frontend and backend" },
    { num: "04", title: "Launch", desc: "Deploy, monitor, and iterate" }
  ];

  const technologies = [
    "React", "React Native", "Expo", "Next.js", "TypeScript",
    "Clerk", "NeonDB", "Google Cloud", "Vercel", "Tailwind CSS"
  ];

  return (
    <div className="bg-white text-slate-800 min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"
          style={{ 
            top: '10%', 
            left: '10%',
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-sky-300/30 rounded-full blur-3xl"
          style={{ 
            top: '60%', 
            right: '10%',
            transform: `translate(${-scrollY * 0.08}px, ${scrollY * 0.12}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl"
          style={{ 
            bottom: '10%', 
            left: '50%',
            transform: `translate(${scrollY * 0.05}px, ${-scrollY * 0.1}px)`
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
            JunePoint
          </div>
          
          <div className="hidden md:flex gap-8 items-center">
            <a href="#services" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Services</a>
            <a href="#process" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Process</a>
            <a href="#contact" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:shadow-lg hover:shadow-blue-500/50 transition-all font-medium">
              Get Started
            </a>
          </div>

          <button 
            className="md:hidden text-slate-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/50">
            <div className="px-6 py-4 flex flex-col gap-4">
              <a href="#services" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Services</a>
              <a href="#process" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Process</a>
              <a href="#contact" className="text-center px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium">
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-6xl mx-auto text-center z-10">
          <div 
            className="inline-block mb-6 px-4 py-2 bg-blue-50 border border-blue-200/50 rounded-full text-sm text-blue-700 font-medium"
            style={{ animation: 'fadeInUp 0.6s ease-out' }}
          >
            <Sparkles className="inline w-4 h-4 mr-2 text-blue-600" />
            Full-Stack Cross-Platform Development
          </div>
          
          <h1 
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-slate-900"
            style={{ animation: 'fadeInUp 0.8s ease-out 0.2s backwards' }}
          >
            Beautiful Apps,
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              Every Platform
            </span>
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto"
            style={{ animation: 'fadeInUp 1s ease-out 0.4s backwards' }}
          >
            We build cross-platform applications for iOS, Android, and web using modern technologies like React Native, Expo, and cloud infrastructure.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            style={{ animation: 'fadeInUp 1.2s ease-out 0.6s backwards' }}
          >
            <a 
              href="#contact" 
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              Start Your Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#services" 
              className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-slate-300 text-slate-700 rounded-full font-semibold hover:bg-slate-50 transition-all"
            >
              Explore Services
            </a>
          </div>

          {/* Tech Stack */}
          <div 
            className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto mb-8"
            style={{ animation: 'fadeInUp 1.4s ease-out 0.8s backwards' }}
          >
            {technologies.map((tech, idx) => (
              <span 
                key={idx}
                className="px-4 py-2 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200/50 rounded-full text-sm font-medium text-slate-700 hover:scale-105 transition-transform"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-8 h-8 mx-auto text-blue-600" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-32 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900">
              What We <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Build</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              From mobile apps to web platforms, we craft full-stack solutions that work seamlessly across all devices.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className={`group relative p-8 bg-white border rounded-3xl hover:border-blue-300 cursor-pointer transition-all duration-300 will-change-transform ${
                  activeService === idx ? 'service-card-active shadow-2xl shadow-blue-200/50' : 'shadow-sm'
                }`}
                onMouseEnter={() => setActiveService(idx)}
                style={{ 
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
                
                <div className={`inline-flex p-4 bg-gradient-to-br ${service.color} rounded-2xl mb-6 text-white shadow-lg`}>
                  {service.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{service.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-4">{service.desc}</p>
                
                <div className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block mb-4">
                  {service.tech}
                </div>
                
                <div className="flex items-center text-blue-600 group-hover:translate-x-2 transition-transform duration-300 font-medium">
                  Learn more <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="relative py-32 px-6 bg-gradient-to-b from-slate-50 via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900">
              Our <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Process</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A collaborative approach that ensures your vision becomes reality, from concept to launch.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {process.map((step, idx) => (
              <div
                key={idx}
                className="relative h-full"
                style={{ animation: `fadeInUp 0.6s ease-out ${idx * 0.15}s backwards` }}
              >
                <div className="relative group h-full flex flex-col">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                  <div className="relative p-8 bg-white rounded-3xl flex-1 flex flex-col border border-slate-200 shadow-sm group-hover:shadow-lg transition-shadow min-h-[280px]">
                    <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-6">
                      {step.num}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">{step.title}</h3>
                    <p className="text-slate-600 flex-1">{step.desc}</p>
                  </div>
                </div>
                {idx < process.length - 1 && (
                  <div className="hidden md:block absolute top-16 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-500" />
            <div className="relative p-12 md:p-20 bg-white rounded-3xl border border-slate-200 shadow-xl">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900">
                Ready to Build Something
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Amazing?
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                Let's collaborate to create a cross-platform digital experience that works beautifully on iOS, Android, and web.
              </p>
              <a 
                href="mailto:info@junepoint.com" 
                className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all group"
              >
                Let's Talk
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
            JunePoint
          </div>
          <div className="text-slate-500">
            © 2025 JunePoint. Crafting digital excellence.
          </div>
          <div className="flex gap-6">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">LinkedIn</a>
            <a href="https://github.com/Junepoint" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
