import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "./button.jsx";
import { 
  ShieldCheck, 
  BrainCircuit, 
  Activity, 
  Lock, 
  Search, 
  Users, 
  LineChart, 
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Globe,
  Zap
} from 'lucide-react';

export const HeroSection = ({ userType }) => {
  const heroContent = {
    patient: {
      badge: "AI-Powered Healthcare",
      title: "Your Health Intelligence, Secured by Blockchain",
      subtitle: "Take command of your medical journey with advanced AI diagnostics and tamper-proof health records. Privacy isn't a feature—it's our foundation.",
      cta: "Begin Health Assessment",
      secondaryCta: "Learn More",
      features: ["Instant AI Analysis", "Encrypted Data Vault", "Early Risk Detection"],
      route: "/pat-dashboard"
    },
    doctor: {
      badge: "Clinical Intelligence",
      title: "Precision Medicine for the Modern Practice",
      subtitle: "Empower your clinical decisions with blockchain-verified patient data and state-of-the-art AI diagnostic assistance. Built for the future of care.",
      cta: "Enter Clinical Portal",
      secondaryCta: "View Documentation",
      features: ["AI-Driven Diagnostics", "Verified Patient Access", "Real-time Analytics"],
      route: "/doc-dashboard"
    }
  };

  const content = heroContent[userType];
  if (!content) return null;

  return (
    <div className="relative min-h-[90vh] flex items-center bg-white overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-secondary-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-5 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-bold border border-primary-100">
            <Zap size={16} className="text-primary-500" />
            {content.badge}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
            {content.title.split(',').map((part, i) => (
              <span key={i} className={i === 1 ? "text-primary-600 block" : "block"}>
                {part}{i === 0 && ','}
              </span>
            ))}
          </h1>
          
          <p className="text-xl text-gray-500 leading-relaxed">
            {content.subtitle}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to={content.route}>
              <Button className="px-8 py-4 text-lg rounded-2xl shadow-xl shadow-primary-200 hover:shadow-2xl hover:shadow-primary-300 transition-all group">
                {content.cta}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Button>
            </Link>
            <Button variant="outline" className="px-8 py-4 text-lg rounded-2xl border-2">
              {content.secondaryCta}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4">
            {content.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-500 font-medium">
                <CheckCircle2 size={18} className="text-secondary-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block animate-in fade-in zoom-in duration-1000">
          <div className="relative z-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-[40px] p-8 shadow-2xl border border-white/50">
            <div className="bg-white rounded-[32px] p-8 shadow-inner space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-danger-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-warning-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-success-400 rounded-full"></div>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Node</div>
              </div>
              
              <div className="space-y-4">
                <div className="h-4 w-3/4 bg-gray-100 rounded-full"></div>
                <div className="h-4 w-1/2 bg-gray-100 rounded-full"></div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="h-20 bg-primary-50 rounded-2xl border border-primary-100 flex flex-col items-center justify-center gap-2">
                    <Activity size={20} className="text-primary-500" />
                    <div className="h-2 w-10 bg-primary-200 rounded-full"></div>
                  </div>
                  <div className="h-20 bg-secondary-50 rounded-2xl border border-secondary-100 flex flex-col items-center justify-center gap-2">
                    <ShieldCheck size={20} className="text-secondary-500" />
                    <div className="h-2 w-10 bg-secondary-200 rounded-full"></div>
                  </div>
                  <div className="h-20 bg-accent-50 rounded-2xl border border-accent-100 flex flex-col items-center justify-center gap-2">
                    <BrainCircuit size={20} className="text-accent-500" />
                    <div className="h-2 w-10 bg-accent-200 rounded-full"></div>
                  </div>
                </div>
                <div className="h-32 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Encrypted Stream</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative floating elements */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-accent-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl animate-pulse delay-700"></div>
        </div>
      </div>
    </div>
  );
};

export const FeaturesGrid = ({ userType }) => {
  const patientFeatures = [
    { title: "Smart Symptom Analysis", description: "Advanced neural networks evaluate your symptoms in real-time with clinical-grade precision.", icon: <BrainCircuit size={28} />, color: "bg-primary-50 text-primary-600" },
    { title: "Immutable Health Vault", description: "Your medical history is cryptographically secured on the blockchain, accessible only by you.", icon: <Lock size={28} />, color: "bg-secondary-50 text-secondary-600" },
    { title: "Predictive Diagnostics", description: "Early detection algorithms analyze imaging and lab data to identify risks before they manifest.", icon: <Search size={28} />, color: "bg-accent-50 text-accent-600" },
    { title: "Universal Health ID", description: "A single, secure digital identity that carries your verified medical credentials globally.", icon: <ShieldCheck size={28} />, color: "bg-warning-50 text-warning-600" }
  ];

  const doctorFeatures = [
    { title: "Patient Ecosystem", description: "Seamlessly manage your patient panel with granular, blockchain-verified permission controls.", icon: <Users size={28} />, color: "bg-primary-50 text-primary-600" },
    { title: "AI Clinical Support", description: "Leverage state-of-the-art AI models to cross-reference symptoms and suggest potential diagnoses.", icon: <Stethoscope size={28} />, color: "bg-secondary-50 text-secondary-600" },
    { title: "Verified Audit Trail", description: "Every record access and update is logged on a tamper-proof ledger for complete transparency.", icon: <Activity size={28} />, color: "bg-accent-50 text-accent-600" },
    { title: "Advanced Analytics", description: "Visualize health trends and outcomes with powerful data processing and real-time reporting.", icon: <LineChart size={28} />, color: "bg-warning-50 text-warning-600" }
  ];

  const features = userType === 'patient' ? patientFeatures : doctorFeatures;

  return (
    <div className="py-32 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              {userType === 'patient' ? 'The Future of Personal Health' : 'Next-Gen Clinical Tools'}
            </h2>
            <p className="text-xl text-gray-500 leading-relaxed">
              {userType === 'patient' 
                ? 'We combine the power of Artificial Intelligence with the security of Blockchain to put you back in control.'
                : 'Enhance your clinical workflow with secure data access and intelligent diagnostic assistance.'
              }
            </p>
          </div>
          <Button variant="ghost" className="text-primary-600 font-bold group">
            Explore All Features <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StatsSection = ({ userType }) => {
  const patientStats = [
    { number: '99.2%', label: 'AI Precision', icon: <BrainCircuit size={20} /> },
    { number: '24/7', label: 'Global Access', icon: <Globe size={20} /> },
    { number: '100%', label: 'Data Sovereignty', icon: <Lock size={20} /> },
    { number: '50+', label: 'Medical Models', icon: <Activity size={20} /> }
  ];

  const doctorStats = [
    { number: '10k+', label: 'Verified Records', icon: <ShieldCheck size={20} /> },
    { number: '95%', label: 'Diagnostic Lift', icon: <Zap size={20} /> },
    { number: '40%', label: 'Workflow Efficiency', icon: <LineChart size={20} /> },
    { number: '100%', label: 'HIPAA Compliant', icon: <Lock size={20} /> }
  ];

  const stats = userType === 'patient' ? patientStats : doctorStats;

  return (
    <div className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/20 rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-xl text-primary-400 mb-2">
                {stat.icon}
              </div>
              <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stat.number}</div>
              <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CTASection = ({ userType }) => {
  return (
    <div className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-primary-600 rounded-[48px] p-12 md:p-20 text-center text-white shadow-2xl shadow-primary-200 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 mx-auto space-y-10">
            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              {userType === 'patient' ? 'Ready to Own Your Health Data?' : 'Elevate Your Medical Practice'}
            </h2>
            <p className="text-xl text-primary-100 leading-relaxed">
              {userType === 'patient' 
                ? 'Join thousands of users who have already secured their medical future with MedLink AI.'
                : 'Integrate the most advanced AI and blockchain healthcare platform into your daily workflow.'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button variant="primary" className="px-12 py-5 text-xl bg-gray text-primary-600 hover:bg-white hover:text-black border-none rounded-2xl shadow-xl">
                {userType === 'patient' ? 'Get Started Now' : 'Request Access'}
              </Button>
              <Button variant="outline" className="px-12 py-5 text-xl border-white/30 text-white hover:bg-white/10 rounded-2xl">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-2xl font-black text-gray-900">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                <Stethoscope size={24} />
              </div>
              MedLink AI
            </div>
            <p className="text-gray-500 leading-relaxed text-lg">
              The world's first decentralized health intelligence platform. Bridging the gap between AI diagnostics and blockchain security.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-current rounded-sm opacity-20"></div>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-8">Ecosystem</h3>
            <ul className="space-y-4">
              {['AI Diagnostics', 'Health Vault', 'Symptom Checker', 'Doctor Portal'].map((item) => (
                <li key={item}><a href="#" className="text-gray-500 hover:text-primary-600 transition-colors font-medium">{item}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-8">Resources</h3>
            <ul className="space-y-4">
              {['Whitepaper', 'API Documentation', 'Help Center', 'Community'].map((item) => (
                <li key={item}><a href="#" className="text-gray-500 hover:text-primary-600 transition-colors font-medium">{item}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-8">Company</h3>
            <ul className="space-y-4">
              {['About Us', 'Privacy Policy', 'Terms of Service', 'HIPAA Compliance'].map((item) => (
                <li key={item}><a href="#" className="text-gray-500 hover:text-primary-600 transition-colors font-medium">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-400 font-medium">&copy; 2026 MedLink AI Global. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-xs font-bold text-success-600 bg-success-50 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></div>
              Network Status: Operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
