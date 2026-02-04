import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import NavigationTabs from '../components/NavigationTabs';
import DashboardTab from '../components/DashboardTab';
import SymptomChecker from '../components/symptomscheck';
import MedicalReportAnalyzer from '../components/MedicalReportAnalyzer';
import DoctorsTab from '../components/DoctorsTab';
import HealthRecordsTab from '../components/HealthRecordsTab';
import ZKPVerificationTab from '../components/ZKPVerificationTab';
import { AccessRequestsPanel } from '../components/AccessRequest';
import GuardianManagement from '../components/GuardianManagement';
import ImageAnalyzer from '../components/ImageAnalyzer';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wearableData, setWearableData] = useState({
    heartRate: 72,
    bloodPressure: '120/80',
    bloodOxygen: 98,
    temperature: 98.6,
    steps: 7500,
    sleep: 7.5,
    calories: 1800
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setWearableData(prev => ({
        ...prev,
        heartRate: Math.floor(Math.random() * 10) + 65,
        bloodOxygen: Math.floor(Math.random() * 3) + 96,
        steps: prev.steps + Math.floor(Math.random() * 100),
        calories: prev.calories + Math.floor(Math.random() * 50)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab wearableData={wearableData} />;
      case 'symptom-checker':
        return <SymptomChecker />;
      case 'disease-detection':
        return <MedicalReportAnalyzer />;
      case 'doctors':
        return <DoctorsTab />;
      case 'health-records':
        return <HealthRecordsTab />;
      case 'access-requests':
        return <AccessRequestsPanel />;
      case 'zkp-verification':
        return <ZKPVerificationTab />;
      case 'guardian-management':
        return <GuardianManagement />;
      case 'image-analyze':
        return <ImageAnalyzer />;
      default:
        return <DashboardTab wearableData={wearableData} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      <div className="relative z-[100]"><Navbar /></div>
      
      <div className="flex">
        <main className="flex-grow max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 py-16 relative z-10">
          <header className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary-100/50">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                Live Health Intelligence
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                Patient <span className="text-primary-600">Dashboard</span>
              </h1>
              <p className="text-gray-400 font-bold text-lg md:text-xl leading-relaxed">
                "The greatest wealth is health." — Empowering your wellness journey with AI-driven insights and blockchain security.
              </p>
            </div>
            
            <div className="flex items-center gap-6 p-5 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-primary-100 transition-all duration-300 group">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Session Active</p>
                <p className="text-sm font-black text-gray-800 group-hover:text-primary-600 transition-colors">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-white p-1 shadow-lg group-hover:rotate-3 transition-transform">
                  <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-primary-600 font-black text-2xl shadow-inner">
                    JD
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </header>
          
          <div className="sticky top-[88px] z-40 bg-[#F8FAFC]/80 backdrop-blur-xl py-4 -mx-2 px-2 rounded-[2.5rem] mb-12">
            <div className="bg-white/50 p-2 rounded-[2.5rem] shadow-xl shadow-gray-200/20 border border-white/50">
              <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>
          
          <div className="min-h-[600px]">
            {renderContent()}
          </div>

          <footer className="mt-32 pt-16 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-black text-xs">M</div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">© 2026 MedLink Intelligence • Secure • Private • Decentralized</p>
            </div>
            <div className="flex items-center gap-10">
              <a href="#" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-colors">Privacy Protocol</a>
              <a href="#" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-colors">System Status</a>
            </div>
          </footer>
        </main>
      </div>
      
      {/* Background decoration */}
      <div className="fixed top-0 right-0 -z-0 w-[60vw] h-[60vh] bg-primary-50/40 blur-[140px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-0 left-0 -z-0 w-[50vw] h-[50vh] bg-secondary-50/40 blur-[120px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default PatientDashboard;