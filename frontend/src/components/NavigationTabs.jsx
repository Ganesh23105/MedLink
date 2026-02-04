import React from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  FileSearch, 
  Users, 
  FileText, 
  Key, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'symptom-checker', label: 'AI Symptom Checker', icon: <Stethoscope size={18} /> },
    { id: 'disease-detection', label: 'Report Analyze', icon: <FileSearch size={18} /> },
    { id: 'doctors', label: 'Find Doctors', icon: <Users size={18} /> },
    { id: 'health-records', label: 'Health Records', icon: <FileText size={18} /> },
    { id: 'access-requests', label: 'Access Requests', icon: <Key size={18} /> },
    { id: 'guardian-management', label: 'Guardian Management', icon: <ShieldCheck size={18} /> },
    { id: 'image-analyze', label: 'Image Analyze', icon: <ImageIcon size={18} /> }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 overflow-x-auto scrollbar-hide py-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-4 px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap group relative overflow-hidden ${
            activeTab === tab.id
              ? "bg-gray-900 text-white shadow-2xl shadow-gray-200 scale-105"
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {activeTab === tab.id && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-transparent opacity-50"></div>
          )}
          <span className={`relative z-10 transition-all duration-500 ${activeTab === tab.id ? "text-primary-400 scale-125" : "text-gray-300 group-hover:text-primary-500 group-hover:scale-110"}`}>
            {tab.icon}
          </span>
          <span className="relative z-10">{tab.label}</span>
          {activeTab === tab.id && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabs;