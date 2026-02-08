import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  DollarSign, 
  Clock, 
  Save, 
  X,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "./button";

export const ProfileForm = () => {
  const { user } = useContext(AuthContext);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    experience: '',
    location: '',
    fee: '',
    nextAvailable: '',
    email: '',
    phone: '',
    bio: '',
    education: '',
    certifications: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found. Please log in.");
        return;
      }

      if (!user || !user._id) {
        alert("User information not available. Please log in again.");
        return;
      }

      const requestData = {
        ...formData,
        userId: user._id
      };

      const response = await fetch("http://localhost:5000/api/doctors/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
        
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center shadow-sm">
            <User size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Doctor Profile</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your professional identity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Full Name</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Dr. John Doe"
                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Specialization</label>
              <div className="relative group">
                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none appearance-none"
                >
                  <option value="">Select specialization</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="psychiatry">Psychiatry</option>
                  <option value="general">General Medicine</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Experience (Yrs)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="10"
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Consultation Fee ($)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={16} />
                  <input
                    type="number"
                    name="fee"
                    value={formData.fee}
                    onChange={handleInputChange}
                    placeholder="100"
                    className="w-full pl-10 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="doctor@medlink.com"
                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Location</label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="New York, USA"
                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="md:col-span-2 space-y-8 mt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Professional Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about your medical background and approach..."
                className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-4xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Education</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-6 top-8 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Medical School, Residency..."
                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border border-transparent rounded-4xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none resize-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Certifications</label>
                <div className="relative group">
                  <Award className="absolute left-6 top-8 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <textarea
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Board Certifications, Licenses..."
                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border border-transparent rounded-4xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <CheckCircle2 size={16} className="text-success-500" />
            All changes are encrypted and secure
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button variant="outline" className="flex-grow sm:flex-grow-0 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">
              <X size={18} className="mr-2" /> Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving}
              className="flex-grow sm:flex-grow-0 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-100"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              Update Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
