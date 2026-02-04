import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWebSocket } from '../hooks/useWebSocket';
import ChatModal from './ChatModal';
import ViewRecordsButton from './Viewrecordbutton';
import { Search, MessageSquare, Activity, Calendar, Phone, User, Bell, Filter, Loader2 } from 'lucide-react';
import { Button } from './button.jsx';

export const PatientsTab = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const token = localStorage.getItem('token');
  
  const {
    isConnected,
    messages,
    notifications,
    joinChat,
    sendMessage,
    markAsRead,
    sendTyping,
    clearNotifications
  } = useWebSocket(token);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/patients", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const patientsWithRequiredFields = res.data.map(patient => ({
          ...patient,
          walletAddress: patient.walletAddress || null,
          _id: patient._id
        }));
        
        setPatients(patientsWithRequiredFields);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };


    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.usertype !== 'Doctor') {
          console.error("Access denied: Only doctors can view patients");
          return;
        }
        
        setCurrentUser(res.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUser = JSON.parse(userInfo);
          if (parsedUser.usertype === 'Doctor') {
            setCurrentUser(parsedUser);
          }
        }
      }
    };

    if (token) {
      fetchPatients();
      fetchCurrentUser();
    }
  }, [token]);

  useEffect(() => {
    if (notifications.length > 0) {
      setPatients(prev => prev.map(patient => {
        const patientNotifications = notifications.filter(n => n.senderId === patient._id);
        if (patientNotifications.length > 0) {
          const latestNotification = patientNotifications[patientNotifications.length - 1];
          return {
            ...patient,
            lastMessage: latestNotification.message,
            unreadCount: (patient.unreadCount || 0) + patientNotifications.length,
            lastMessageTime: new Date(latestNotification.timestamp),
            hasNewMessage: true
          };
        }
        return patient;
      }));
    }
  }, [notifications]);

  const openChat = (patient) => {
    setSelectedPatient(patient);
    setIsChatOpen(true);
    joinChat(patient._id);
    
    setPatients(prev => prev.map(pat => 
      pat._id === patient._id 
        ? { ...pat, unreadCount: 0, hasNewMessage: false }
        : pat
    ));
    
    const patientNotifications = notifications.filter(n => n.senderId === patient._id);
    if (patientNotifications.length > 0) {
      clearNotifications();
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedPatient(null);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
    if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
    
    const aTime = a.lastMessageTime || new Date(0);
    const bTime = b.lastMessageTime || new Date(0);
    return new Date(bTime) - new Date(aTime);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-primary-500" size={40} />
        <p className="text-gray-500 font-medium">Loading patients...</p>
      </div>
    );
  }

  if (currentUser && currentUser.usertype !== 'Doctor') {
    return (
      <div className="p-8 bg-danger-50 border border-danger-100 rounded-2xl text-danger-600 flex items-center gap-3">
        <Activity size={24} />
        <p className="font-bold">Access denied. Only doctors can view patients.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-primary-500" size={40} />
        <p className="text-gray-500 font-medium">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Patients</h2>
          <p className="text-gray-500 mt-1">Manage and communicate with your assigned patients</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
            isConnected ? 'bg-success-50 text-success-600 border border-success-100' : 'bg-danger-50 text-danger-600 border border-danger-100'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`}></span>
            {isConnected ? 'Live Chat Connected' : 'Chat Disconnected'}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search patients by name, email, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={18} /> Filters
        </Button>
        <Button className="flex items-center gap-2">
          <Activity size={18} /> Health Overview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPatients.map((patient) => (
          <div 
            key={patient._id} 
            className={`bg-white rounded-2xl shadow-md border transition-all duration-200 hover:shadow-lg overflow-hidden ${
              (patient.unreadCount || 0) > 0 ? 'border-primary-300 ring-1 ring-primary-100' : 'border-gray-100'
            }`}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl overflow-hidden border-2 border-white shadow-sm">
                      {patient.avatar ? (
                        <img src={patient.avatar} alt={patient.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-600 font-bold">{patient.name?.charAt(0) || '👤'}</span>
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                    {patient.age && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                        Age: {patient.age}
                      </span>
                    )}
                  </div>
                </div>
                
                {patient.healthScore && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-danger-500 font-bold">
                      <Activity size={16} />
                      <span>{patient.healthScore}%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Health Score</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                {patient.condition && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Condition</p>
                    <p className="text-sm font-bold text-gray-700">{patient.condition}</p>
                  </div>
                )}
                {patient.lastVisit && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Last Visit</p>
                    <p className="text-sm font-bold text-gray-700">{new Date(patient.lastVisit).toLocaleDateString()}</p>
                  </div>
                )}
                {patient.phone && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Phone</p>
                    <p className="text-sm font-bold text-gray-700">{patient.phone}</p>
                  </div>
                )}
                {patient.nextAppointment && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Next Appt</p>
                    <p className="text-sm font-bold text-primary-600">{new Date(patient.nextAppointment).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {patient.lastMessage && (
                <div className="bg-gray-50 p-4 rounded-xl relative">
                  <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wider">Latest Message</p>
                  <p className="text-sm text-gray-600 line-clamp-1 italic">"{patient.lastMessage}"</p>
                  {patient.lastMessageTime && (
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(patient.lastMessageTime).toLocaleTimeString()}</p>
                  )}
                  {(patient.unreadCount || 0) > 0 && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary-500 rounded-full"></div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <div className="flex-grow">
                  <ViewRecordsButton patient={patient} />
                </div>
                <Button 
                  variant={(patient.unreadCount || 0) > 0 ? "primary" : "outline"}
                  onClick={() => openChat(patient)}
                  className="relative px-4"
                >
                  <MessageSquare size={20} />
                  {(patient.unreadCount || 0) > 0 && (
                    <span className="absolute -top-2 -right-2 bg-danger-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {patient.unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedPatients.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">No patients found</h3>
          <p className="text-gray-500 mt-2 mx-auto">
            {searchTerm ? `We couldn't find any patients matching "${searchTerm}". Try adjusting your search terms.` : 'No patients have been assigned to your portal yet.'}
          </p>
          {searchTerm && (
            <Button variant="ghost" onClick={() => setSearchTerm('')} className="mt-6">
              Clear Search
            </Button>
          )}
        </div>
      )}

      {isChatOpen && selectedPatient && currentUser && (
        <ChatModal
          doctor={{
            _id: selectedPatient._id,
            name: selectedPatient.name,
            specialization: selectedPatient.condition || 'Patient',
            image: selectedPatient.avatar || '👤',
            ...selectedPatient
          }}
          isOpen={isChatOpen}
          onClose={closeChat}
          messages={messages}
          onSendMessage={sendMessage}
          onTyping={sendTyping}
          isConnected={isConnected}
          currentUser={{ 
            _id: currentUser._id,
            usertype: currentUser.usertype
          }}
        />
      )}
    </div>
  );
};

export default PatientsTab;
