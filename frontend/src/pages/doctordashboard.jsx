import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AccessRequestsPanel } from '../components/AccessRequest';
import { ProfileForm } from '../components/ProfileForm';
import { Sidebar } from '../components/Sidebar';
import Header from '../components/DocHeader';
import { PatientsTab } from '../components/PatientTab';
import Navbar from '../components/Navbar';
import { 
  Users, 
  Calendar, 
  Clock, 
  Activity, 
  Plus, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const StatsCards = () => {
  const stats = [
    { title: 'Total Patients', value: '1,247', change: '+12%', icon: <Users className="text-primary-500" /> },
    { title: "Today's Appointments", value: '18', change: '+3', icon: <Calendar className="text-secondary-500" /> },
    { title: 'Pending Requests', value: '7', change: '+2', icon: <AlertCircle className="text-warning-500" /> },
    { title: 'AI Diagnoses', value: '156', change: '+24%', icon: <Activity className="text-accent-500" /> }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              {stat.icon}
            </div>
            <span className="text-[10px] font-black text-success-600 bg-success-50 px-2 py-1 rounded-lg">
              {stat.change}
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

const AppointmentsPanel = () => {
  const todayAppointments = [
    { id: 1, time: '09:00 AM', patient: 'Sarah Johnson', type: 'Follow-up', status: 'confirmed' },
    { id: 2, time: '10:30 AM', patient: 'Mike Davis', type: 'Consultation', status: 'pending' },
    { id: 3, time: '02:00 PM', patient: 'Lisa Wong', type: 'Check-up', status: 'confirmed' },
    { id: 4, time: '03:30 PM', patient: 'Robert Miller', type: 'Emergency', status: 'urgent' }
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Today's Schedule</h3>
        <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">View Calendar</button>
      </div>
      <div className="space-y-4">
        {todayAppointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg hover:border-primary-100 border border-transparent transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900">{appointment.patient}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{appointment.type} • {appointment.time}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
              appointment.status === 'urgent' ? 'bg-danger-50 text-danger-600' : 
              appointment.status === 'confirmed' ? 'bg-success-50 text-success-600' : 
              'bg-warning-50 text-warning-600'
            }`}>
              {appointment.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const OverviewPanel = () => {
  return (
    <div className="space-y-8">
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Patients</h3>
              <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">Manage All</button>
            </div>
            <PatientsTab />
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-xl text-white mb-6 relative z-10">Quick Actions</h3>
            <div className="space-y-3 relative z-10">
              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group/btn">
                <div className="flex items-center gap-3">
                  <Plus size={18} className="text-primary-400" />
                  <span className="text-sm font-bold">Add New Patient</span>
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group/btn">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-secondary-400" />
                  <span className="text-sm font-bold">Schedule Appointment</span>
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
              </button>
              <Link to="/prescription" className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group/btn">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-accent-400" />
                  <span className="text-sm font-bold">Prescription Generator</span>
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
              </Link>
            </div>
          </div>
          
          <AppointmentsPanel />

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-6">Health Insights</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-danger-500 rounded-full"></div>
                  <span className="text-sm font-bold text-gray-600">Critical Cases</span>
                </div>
                <span className="text-lg font-black text-gray-900">3</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span className="text-sm font-bold text-gray-600">Improving Cases</span>
                </div>
                <span className="text-lg font-black text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span className="text-sm font-bold text-gray-600">Stable Cases</span>
                </div>
                <span className="text-lg font-black text-gray-900">28</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel />;
      case 'patients':
        return <PatientsTab />;
      case 'requests':
        return <AccessRequestsPanel />;
      case 'appointments':
        return <AppointmentsPanel />;
      case 'profile':
        return <ProfileForm />;
      case 'settings':
        return (
          <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Settings Panel</h3>
            <p className="text-gray-500 font-medium">Configuration options coming soon to your neural interface.</p>
          </div>
        );
      default:
        return <OverviewPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="relative z-[100]"><Navbar /></div>
        
        <main className="flex-grow p-8 lg:p-12 overflow-y-auto">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary-100/50">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                Doctor Neural Interface
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
                Medical <span className="text-primary-600">Dashboard</span>
              </h1>
              <p className="text-gray-400 font-bold text-lg leading-relaxed">
                Welcome back, Doctor. Your AI-assisted clinical workspace is synchronized and ready for analysis.
              </p>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">System Status</p>
                <p className="text-xs font-black text-success-600">All Nodes Operational</p>
              </div>
              <div className="w-12 h-12 bg-success-50 rounded-2xl flex items-center justify-center text-success-600">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
