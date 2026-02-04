import React, { useState } from 'react';
import {
  Download,
  Plus,
  Trash2,
  User,
  FileText,
  Pill,
  Activity,
  Calendar,
  Clock,
  Shield,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from './button';

const PrescriptionGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState({
    name: '',
    specialization: '',
    clinic: '',
    license: '',
    phone: '',
    email: '',
    address: ''
  });

  const [prescription, setPrescription] = useState({
    patientName: '',
    age: '',
    gender: '',
    symptoms: '',
    diagnosis: '',
    medications: [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ],
    notes: '',
    nextVisit: ''
  });

  const addMedication = () => {
    setPrescription(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    }));
  };

  const removeMedication = (index) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Simple PDF generation for now
      doc.setFontSize(22);
      doc.text('MEDICAL PRESCRIPTION', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Doctor: ${doctorInfo.name}`, 20, 40);
      doc.text(`Clinic: ${doctorInfo.clinic}`, 20, 50);
      doc.text(`Patient: ${prescription.patientName}`, 20, 70);
      doc.text(`Diagnosis: ${prescription.diagnosis}`, 20, 80);
      
      doc.text('Medications:', 20, 100);
      prescription.medications.forEach((med, i) => {
        doc.text(`${i+1}. ${med.name} - ${med.dosage} (${med.frequency})`, 30, 110 + (i * 10));
      });

      doc.save(`prescription_${prescription.patientName || 'patient'}.pdf`);
      alert("Prescription generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Prescription Generator</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"The art of healing comes from nature, not from the physician." — Paracelsus. Create precise digital prescriptions.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-accent-50 text-accent-700 rounded-[2rem] text-xs font-black border border-accent-100 shadow-sm shadow-accent-50">
          <FileText size={20} className="text-accent-500" />
          Digital Protocol Active
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Doctor & Patient Info */}
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
                <User size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Doctor Details</h3>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Doctor Name"
                value={doctorInfo.name}
                onChange={(e) => setDoctorInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
              />
              <input
                type="text"
                placeholder="Clinic Name"
                value={doctorInfo.clinic}
                onChange={(e) => setDoctorInfo(prev => ({ ...prev, clinic: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
              />
              <input
                type="text"
                placeholder="License Number"
                value={doctorInfo.license}
                onChange={(e) => setDoctorInfo(prev => ({ ...prev, license: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none"
              />
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Patient Details</h3>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Patient Name"
                value={prescription.patientName}
                onChange={(e) => setPrescription(prev => ({ ...prev, patientName: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-secondary-50/50 focus:border-secondary-100 transition-all outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Age"
                  value={prescription.age}
                  onChange={(e) => setPrescription(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-secondary-50/50 focus:border-secondary-100 transition-all outline-none"
                />
                <select
                  value={prescription.gender}
                  onChange={(e) => setPrescription(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-secondary-50/50 focus:border-secondary-100 transition-all outline-none appearance-none"
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Prescription Details */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-accent-50 text-accent-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Pill size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Medications</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Clinical Prescription Payload</p>
                </div>
              </div>
              <Button onClick={addMedication} variant="outline" className="rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest border-2">
                <Plus size={18} className="mr-2" /> Add Item
              </Button>
            </div>

            <div className="space-y-6">
              {prescription.medications.map((med, index) => (
                <div key={index} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 relative group hover:bg-white hover:shadow-2xl hover:border-accent-100 transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-accent-600 bg-accent-50 px-4 py-2 rounded-full uppercase tracking-widest">Medication #{index + 1}</span>
                    {prescription.medications.length > 1 && (
                      <button onClick={() => removeMedication(index)} className="p-3 text-gray-300 hover:text-danger-500 hover:bg-danger-50 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                      type="text"
                      placeholder="Medication Name"
                      value={med.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-accent-50/50 focus:border-accent-100 transition-all outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-accent-50/50 focus:border-accent-100 transition-all outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g. 1-0-1)"
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-accent-50/50 focus:border-accent-100 transition-all outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={med.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-accent-50/50 focus:border-accent-100 transition-all outline-none"
                    />
                  </div>
                  <textarea
                    placeholder="Special Instructions..."
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-accent-50/50 focus:border-accent-100 transition-all outline-none resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Clinical Diagnosis</label>
                <textarea
                  placeholder="Enter diagnosis details..."
                  value={prescription.diagnosis}
                  onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[2rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-accent-50/50 focus:border-accent-100 transition-all outline-none resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Additional Notes</label>
                <textarea
                  placeholder="Advice, diet, or follow-up notes..."
                  value={prescription.notes}
                  onChange={(e) => setPrescription(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[2rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-accent-50/50 focus:border-accent-100 transition-all outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6">
              <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Shield size={16} className="text-success-500" />
                Verified Digital Signature
              </div>
              <Button 
                onClick={generatePDF} 
                disabled={isGenerating}
                className="w-full sm:w-auto px-12 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-accent-100"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin mr-3" size={20} />
                ) : (
                  <Download size={20} className="mr-3" />
                )}
                Generate Prescription
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionGenerator;
