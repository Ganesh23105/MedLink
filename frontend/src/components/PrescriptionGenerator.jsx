import React, { useState } from 'react';
import {
  Download,
  Plus,
  Trash2,
  User,
  FileText,
  Pill
} from 'lucide-react';
import Navbar from './Navbar';

const PrescriptionGenerator = () => {
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
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Prescription Generated', 20, 20);
    doc.save('prescription.pdf');
  };

  return (
    <>
      <Navbar />

      <div>
        <div>
          <h1>Digital Prescription Generator</h1>
          <p>Create professional medical prescriptions instantly</p>
        </div>

        <div>
          {/* Doctor Information */}
          <div>
            <div>
              <User />
              <h2>Doctor Information</h2>
            </div>

            <input
              type="text"
              placeholder="Doctor Name"
              value={doctorInfo.name}
              onChange={(e) =>
                setDoctorInfo(prev => ({ ...prev, name: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Specialization"
              value={doctorInfo.specialization}
              onChange={(e) =>
                setDoctorInfo(prev => ({
                  ...prev,
                  specialization: e.target.value
                }))
              }
            />

            <input
              type="text"
              placeholder="Clinic Name"
              value={doctorInfo.clinic}
              onChange={(e) =>
                setDoctorInfo(prev => ({ ...prev, clinic: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="License Number"
              value={doctorInfo.license}
              onChange={(e) =>
                setDoctorInfo(prev => ({ ...prev, license: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Phone"
              value={doctorInfo.phone}
              onChange={(e) =>
                setDoctorInfo(prev => ({ ...prev, phone: e.target.value }))
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={doctorInfo.email}
              onChange={(e) =>
                setDoctorInfo(prev => ({ ...prev, email: e.target.value }))
              }
            />

            <textarea
              placeholder="Clinic Address"
              value={doctorInfo.address}
              onChange={(e) =>
                setDoctorInfo(prev => ({ ...prev, address: e.target.value }))
              }
            />
          </div>

          {/* Patient & Prescription */}
          <div>
            <div>
              <FileText />
              <h2>Patient & Prescription</h2>
            </div>

            <input
              type="text"
              placeholder="Patient Name"
              value={prescription.patientName}
              onChange={(e) =>
                setPrescription(prev => ({
                  ...prev,
                  patientName: e.target.value
                }))
              }
            />

            <input
              type="number"
              placeholder="Age"
              value={prescription.age}
              onChange={(e) =>
                setPrescription(prev => ({ ...prev, age: e.target.value }))
              }
            />

            <select
              value={prescription.gender}
              onChange={(e) =>
                setPrescription(prev => ({
                  ...prev,
                  gender: e.target.value
                }))
              }
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <textarea
              placeholder="Symptoms"
              value={prescription.symptoms}
              onChange={(e) =>
                setPrescription(prev => ({
                  ...prev,
                  symptoms: e.target.value
                }))
              }
            />

            <textarea
              placeholder="Diagnosis"
              value={prescription.diagnosis}
              onChange={(e) =>
                setPrescription(prev => ({
                  ...prev,
                  diagnosis: e.target.value
                }))
              }
            />

            {/* Medications */}
            <div>
              <button onClick={addMedication}>
                <Plus />
                Add Medication
              </button>

              {prescription.medications.map((med, index) => (
                <div key={index}>
                  <div>
                    <Pill />
                    <span>Medication {index + 1}</span>

                    {prescription.medications.length > 1 && (
                      <button onClick={() => removeMedication(index)}>
                        <Trash2 />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Medication Name"
                    value={med.name}
                    onChange={(e) =>
                      updateMedication(index, 'name', e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) =>
                      updateMedication(index, 'dosage', e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Frequency"
                    value={med.frequency}
                    onChange={(e) =>
                      updateMedication(index, 'frequency', e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Duration"
                    value={med.duration}
                    onChange={(e) =>
                      updateMedication(index, 'duration', e.target.value)
                    }
                  />

                  <textarea
                    placeholder="Instructions"
                    value={med.instructions}
                    onChange={(e) =>
                      updateMedication(index, 'instructions', e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <textarea
              placeholder="Notes & Advice"
              value={prescription.notes}
              onChange={(e) =>
                setPrescription(prev => ({
                  ...prev,
                  notes: e.target.value
                }))
              }
            />

            <input
              type="text"
              placeholder="Next Visit"
              value={prescription.nextVisit}
              onChange={(e) =>
                setPrescription(prev => ({
                  ...prev,
                  nextVisit: e.target.value
                }))
              }
            />
          </div>
        </div>

        <button onClick={generatePDF}>
          <Download />
          Generate Prescription PDF
        </button>
      </div>
    </>
  );
};

export default PrescriptionGenerator;
