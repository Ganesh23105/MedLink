import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../context/AuthContext";
import { useMediChain } from "../context/BlockChainContext";
import axios from "axios";

const DashboardTab = ({ wearableData }) => {
  const { user } = useContext(AuthContext);
  const { userHealthID, userWallet } = useMediChain();
  
  const appointments = [
    { date: "Today", time: "2:30 PM", doctor: "Dr. Sarah Johnson", type: "Cardiology Checkup", status: "Confirmed" },
    { date: "Tomorrow", time: "10:00 AM", doctor: "Dr. Michael Chen", type: "General Consultation", status: "Pending" },
    { date: "Thu, May 29", time: "3:00 PM", doctor: "Dr. Emily Davis", type: "Skin Examination", status: "Confirmed" }
  ];

  const quickActions = [
    { label: 'Symptom Check', icon: '🔍', color: 'bg-primary-50 text-primary-600', action: () => {} },
    { label: 'Upload Scan', icon: '📤', color: 'bg-secondary-50 text-secondary-600', action: () => {} },
    { label: 'Find Doctor', icon: '👨‍⚕️', color: 'bg-accent-50 text-accent-600', action: () => {} },
    { label: 'Book Appointment', icon: '📅', color: 'bg-warning-50 text-warning-600', action: () => {} }
  ];

  const [healthIdInfo, setHealthIdInfo] = useState({
    hasHealthID: false,
    tokenId: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchHealthIdInfo = async () => {
      if (!userWallet) {
        setHealthIdInfo({
          hasHealthID: false,
          tokenId: null,
          loading: false,
          error: null
        });
        return;
      }

      try {
        setHealthIdInfo(prev => ({ ...prev, loading: true }));
        const response = await axios.get(`/api/blockchain/check-health-id/${userWallet}`);
        
        setHealthIdInfo({
          hasHealthID: response.data.hasHealthID,
          tokenId: response.data.tokenId,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error("Error fetching HealthID info:", error);
        setHealthIdInfo({
          hasHealthID: false,
          tokenId: null,
          loading: false,
          error: "Failed to fetch HealthID information"
        });
      }
    };

    fetchHealthIdInfo();
  }, [userWallet, userHealthID]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Welcome back, {user?.name || 'User'}! 👋</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"The groundwork of all happiness is health." — Leigh Hunt. Your wellness journey continues here.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 flex items-center gap-5 hover:shadow-2xl hover:border-primary-100 transition-all duration-500 group">
            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-6 transition-transform">🆔</div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">HealthID</p>
              {healthIdInfo.loading ? (
                <div className="h-5 w-24 bg-gray-100 animate-pulse rounded-full"></div>
              ) : healthIdInfo.error ? (
                <p className="text-xs font-black text-danger-500 uppercase tracking-widest">Network Err</p>
              ) : healthIdInfo.hasHealthID || userHealthID ? (
                <p className="text-sm font-black text-primary-600 tracking-widest">#{healthIdInfo.tokenId || userHealthID}</p>
              ) : (
                <p className="text-xs font-black text-warning-500 uppercase tracking-widest">Pending Mint</p>
              )}
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 flex items-center gap-5 hover:shadow-2xl hover:border-secondary-100 transition-all duration-500 group">
            <div className="w-14 h-14 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:-rotate-6 transition-transform">🦊</div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Wallet</p>
              <p className="text-sm font-black text-gray-900 tracking-widest">
                {userWallet ? `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}` : 'DISCONNECTED'}
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:shadow-2xl hover:border-danger-100 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
          <div className="w-16 h-16 bg-danger-50 text-danger-500 rounded-[1.5rem] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">❤️</div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{wearableData?.heartRate || '72'} <span className="text-base font-black text-gray-400 tracking-normal ml-1">BPM</span></p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Heart Rate</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-success-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-[10px] font-black text-success-600 uppercase tracking-widest">Normal Range</span>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:shadow-2xl hover:border-primary-100 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
          <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-[1.5rem] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">📊</div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{wearableData?.oxygenLevel || '98'}<span className="text-base font-black text-gray-400 tracking-normal ml-1">%</span></p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">O2 Saturation</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-success-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="text-[10px] font-black text-success-600 uppercase tracking-widest">Stable</span>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:shadow-2xl hover:border-accent-100 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
          <div className="w-16 h-16 bg-accent-50 text-accent-500 rounded-[1.5rem] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-inner">📈</div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{wearableData?.bloodPressure || '120/80'}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Blood Pressure</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-warning-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
            <span className="text-[10px] font-black text-warning-600 uppercase tracking-widest">Optimal</span>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:shadow-2xl hover:border-secondary-100 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
          <div className="w-16 h-16 bg-secondary-50 text-secondary-500 rounded-[1.5rem] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shadow-inner">👟</div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{wearableData?.steps?.toLocaleString() || '5,280'}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Steps Taken</p>
          <div className="mt-8 w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
            <div className="bg-secondary-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
          <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Clinical Schedule</h3>
            <button className="text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary-700 transition-colors">Full Calendar</button>
          </div>
          <div className="divide-y divide-gray-50">
            {appointments.map((apt, index) => (
              <div key={index} className="p-10 hover:bg-gray-50 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-8 group">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-3xl shadow-xl group-hover:rotate-6 transition-transform">👨‍⚕️</div>
                  <div>
                    <p className="text-xl font-black text-gray-900 tracking-tight">{apt.doctor}</p>
                    <p className="text-xs font-black text-primary-500 uppercase tracking-[0.2em] mt-1">{apt.type}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-10">
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{apt.date}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{apt.time}</p>
                  </div>
                  <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border-2 ${
                    apt.status === 'Confirmed' ? 'bg-success-50 text-success-600 border-success-100' : 'bg-warning-50 text-warning-600 border-warning-100'
                  }`}>
                    {apt.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Command Center</h3>
            <div className="grid grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex flex-col items-center justify-center p-8 bg-white rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:shadow-2xl hover:border-primary-100 hover:-translate-y-2 transition-all duration-500 group"
                >
                  <div className={`w-16 h-16 ${action.color} rounded-[1.5rem] flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                    {action.icon}
                  </div>
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] text-center leading-relaxed">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <h4 className="text-3xl text-white mb-4 tracking-tighter leading-tight">Need Medical Assistance?</h4>
              <p className="text-gray-400 text-base font-bold mb-10 leading-relaxed">Our advanced AI health assistant is available 24/7 to answer your clinical queries with precision.</p>
              <button className="w-full py-6 bg-primary-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-primary-500 transition-all shadow-2xl shadow-primary-900/40 active:scale-95">
                Launch AI Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;