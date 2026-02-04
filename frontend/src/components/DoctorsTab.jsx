import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWebSocket } from '../hooks/useWebSocket';
import ChatModal from './ChatModal';
import { Search, MapPin, Star, MessageSquare, User } from 'lucide-react';
import { Button } from './button';

const DoctorsTab = () => {
  const [doctors, setDoctors] = useState([]);
  const [doctorUsers, setDoctorUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
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
    const fetchDoctors = async () => {
      try {
        const doctorUsersRes = await axios.get("http://localhost:5000/api/auth/doctors", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDoctorUsers(doctorUsersRes.data);

        const doctorDetailsRes = await axios.get("http://localhost:5000/api/doctors", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const mergedDoctors = doctorUsersRes.data.map(doctorUser => {
          const doctorDetails = doctorDetailsRes.data.find(doc => 
            doc.userId === doctorUser._id || doc.email === doctorUser.email
          );
          
          return {
            ...doctorUser,
            specialization: doctorDetails?.specialization || 'General Practice',
            experience: doctorDetails?.experience || 'N/A',
            location: doctorDetails?.location || 'Not specified',
            fee: doctorDetails?.fee || 'Contact for pricing',
            rating: doctorDetails?.rating || '4.5',
            nextAvailable: doctorDetails?.nextAvailable || 'Contact to schedule',
            image: doctorDetails?.image || doctorUser.avatar || '👨‍⚕️',
            doctorDetails: doctorDetails
          };
        });

        setDoctors(mergedDoctors);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.usertype !== 'Patient') {
          console.error("Access denied: Only patients can view doctors");
          return;
        }
        
        setCurrentUser(res.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUser = JSON.parse(userInfo);
          if (parsedUser.usertype === 'Patient') {
            setCurrentUser(parsedUser);
          }
        }
      }
    };

    if (token) {
      fetchDoctors();
      fetchCurrentUser();
    }
  }, [token]);

  useEffect(() => {
    if (notifications.length > 0) {
      setDoctors(prev => prev.map(doctor => {
        const doctorNotifications = notifications.filter(n => n.senderId === doctor._id);
        if (doctorNotifications.length > 0) {
          const latestNotification = doctorNotifications[doctorNotifications.length - 1];
          return {
            ...doctor,
            lastMessage: latestNotification.message,
            unreadCount: (doctor.unreadCount || 0) + doctorNotifications.length,
            lastMessageTime: new Date(latestNotification.timestamp)
          };
        }
        return doctor;
      }));
    }
  }, [notifications]);

  const openChat = (doctor) => {
    setSelectedDoctor(doctor);
    setIsChatOpen(true);
    joinChat(doctor._id);
    
    setDoctors(prev => prev.map(doc => 
      doc._id === doctor._id 
        ? { ...doc, unreadCount: 0 }
        : doc
    ));
    
    const doctorNotifications = notifications.filter(n => n.senderId === doctor._id);
    if (doctorNotifications.length > 0) {
      clearNotifications();
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedDoctor(null);
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
    if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
    
    const aTime = a.lastMessageTime || new Date(0);
    const bTime = b.lastMessageTime || new Date(0);
    return new Date(bTime) - new Date(aTime);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-black text-gray-900">Loading doctors...</p>
      </div>
    );
  }

  if (currentUser && currentUser.usertype !== 'Patient') {
    return (
      <div className="p-8 bg-danger-50 rounded-3xl border border-danger-100 text-center">
        <p className="text-danger-700 font-black">Access denied. Only patients can view doctors.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-black text-gray-900">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Find Doctors</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"The physician should be the minister of nature." — Hippocrates. Connect with top-tier specialists globally.</p>
        </div>
        <div className={`px-6 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${
          isConnected ? 'bg-success-50 text-success-700 border-success-100' : 'bg-danger-50 text-danger-700 border-danger-100'
        }`}>
          {isConnected ? '🟢 Neural Network Online' : '🔴 Connection Offline'}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col md:flex-row gap-6 group">
        <div className="flex-grow relative">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors">
            <Search size={24} />
          </div>
          <input
            type="text"
            placeholder="Search by name, specialization, or clinical expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-gray-50/50 border-2 border-transparent rounded-[2rem] text-lg font-bold focus:bg-white focus:ring-8 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none shadow-inner"
          />
        </div>
        <button className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
          <MapPin size={20} /> Proximity Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {sortedDoctors.map((doctor) => (
          <div key={doctor._id} className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col group">
            <div className="p-10 space-y-8 flex-grow">
              <div className="flex items-start justify-between">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl group-hover:rotate-6 transition-transform">
                    {doctor.avatar || doctor.image ? (
                      <img src={doctor.avatar || doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-primary-50 text-primary-500 font-black">
                        {doctor.name?.charAt(0) || 'D'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success-500 border-4 border-white rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 text-warning-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-warning-100 shadow-sm">
                  <Star size={14} fill="currentColor" />
                  {doctor.rating}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary-600 transition-colors tracking-tighter leading-none">{doctor.name}</h3>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">{doctor.specialization}</p>
                <p className="text-xs text-gray-400 font-bold mt-2 truncate opacity-60">{doctor.email}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-6 border-y-2 border-gray-50">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Tenure</p>
                  <p className="text-lg font-black text-gray-700">{doctor.experience}Y</p>
                </div>
                <div className="text-center border-x-2 border-gray-50 px-4 space-y-1">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Rate</p>
                  <p className="text-lg font-black text-gray-700">${doctor.fee}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Next</p>
                  <p className="text-[10px] font-black text-primary-600 leading-tight uppercase tracking-widest">{doctor.nextAvailable}</p>
                </div>
              </div>

              {doctor.lastMessage && (
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 shadow-inner">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Recent Correspondence</p>
                  <p className="text-sm text-gray-600 font-bold italic line-clamp-2 leading-relaxed">"{doctor.lastMessage}"</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50/50 border-t-2 border-gray-50 flex gap-4">
              <Button className="flex-grow py-5 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-100 rounded-[1.5rem] active:scale-95 transition-all">
                Initiate Booking
              </Button>
              <button 
                onClick={() => openChat(doctor)}
                className="p-5 bg-white text-gray-600 rounded-[1.5rem] border-2 border-gray-100 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all relative shadow-sm active:scale-90"
              >
                <MessageSquare size={24} />
                {(doctor.unreadCount || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 border-4 border-white rounded-full animate-bounce"></span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedDoctors.length === 0 && !loading && (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} />
          </div>
          <h3 className="text-2xl font-black text-gray-900">No doctors found</h3>
          <p className="text-gray-500 mt-2 font-medium">Try adjusting your search terms or filters.</p>
        </div>
      )}

      {isChatOpen && selectedDoctor && currentUser && (
        <ChatModal
          doctor={{
            _id: selectedDoctor._id,
            name: selectedDoctor.name,
            specialization: selectedDoctor.specialization,
            image: selectedDoctor.avatar || selectedDoctor.image || '👨‍⚕️',
            email: selectedDoctor.email,
            usertype: selectedDoctor.usertype,
            ...selectedDoctor
          }}
          isOpen={isChatOpen}
          onClose={closeChat}
          messages={messages}
          onSendMessage={sendMessage}
          onTyping={sendTyping}
          isConnected={isConnected}
          currentUser={{ 
            _id: currentUser._id,
            usertype: currentUser.usertype,
            name: currentUser.name,
            email: currentUser.email
          }}
        />
      )}
    </div>
  );
};

export default DoctorsTab;