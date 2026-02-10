import React, { useState } from 'react';
import {
  Activity,
  Clipboard,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Heart,
  Droplets,
  Activity as KidneyIcon,
  User,
  ChevronRight
} from 'lucide-react';
import { Button } from './button';

const HealthMetricsAnalyzer = () => {
  const [selectedModel, setSelectedModel] = useState('metabolic_screening');
  const [formData, setFormData] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const models = {
    metabolic_screening: {
      name: 'BP & Diabetes',
      icon: <Heart className="text-red-500" />,
      description: 'Dual risk assessment with diabetes prediction informing blood pressure analysis.',
      models: ['diabetes', 'bp'],
      fields: [
        { id: 'Pregnancies', label: 'Pregnancies', type: 'number', placeholder: '0' },
        { id: 'Glucose', label: 'Glucose (mg/dL)', type: 'number', placeholder: '120' },
        { id: 'BloodPressure', label: 'Blood Pressure (mm Hg)', type: 'number', placeholder: '80' },
        { id: 'SkinThickness', label: 'Skin Thickness (mm)', type: 'number', placeholder: '20' },
        { id: 'Insulin', label: 'Insulin (mu U/ml)', type: 'number', placeholder: '80' },
        { id: 'BMI', label: 'BMI', type: 'number', placeholder: '22.5' },
        { id: 'DiabetesPedigreeFunction', label: 'Pedigree Function', type: 'number', placeholder: '0.5' },
        { id: 'Age', label: 'Age', type: 'number', placeholder: '30' }
      ]
    },
    liver: {
      name: 'Liver Function',
      icon: <Activity className="text-orange-500" />,
      description: 'Analyze bilirubin, enzymes, and proteins for liver health.',
      fields: [
        { id: 'Age', label: 'Age', type: 'number', placeholder: '40' },
        { id: 'Gender', label: 'Gender (1=M, 0=F)', type: 'number', placeholder: '1' },
        { id: 'Total_Bilirubin', label: 'Total Bilirubin', type: 'number', placeholder: '0.7' },
        { id: 'Direct_Bilirubin', label: 'Direct Bilirubin', type: 'number', placeholder: '0.1' },
        { id: 'Alkaline_Phosphotase', label: 'Alkaline Phosphotase', type: 'number', placeholder: '187' },
        { id: 'Alamine_Aminotransferase', label: 'Alamine Aminotransferase', type: 'number', placeholder: '16' },
        { id: 'Aspartate_Aminotransferase', label: 'Aspartate Aminotransferase', type: 'number', placeholder: '18' },
        { id: 'Total_Protiens', label: 'Total Proteins', type: 'number', placeholder: '6.8' },
        { id: 'Albumin', label: 'Albumin', type: 'number', placeholder: '3.3' },
        { id: 'Albumin_and_Globulin_Ratio', label: 'A/G Ratio', type: 'number', placeholder: '0.9' }
      ]
    },
    kidney: {
      name: 'Chronic Kidney Disease',
      icon: <KidneyIcon className="text-blue-500" />,
      description: 'Comprehensive renal function analysis.',
      fields: [
        { id: 'id', label: 'Patient ID', type: 'number', placeholder: '1' },
        { id: 'age', label: 'Age', type: 'number', placeholder: '50' },
        { id: 'bp', label: 'Blood Pressure', type: 'number', placeholder: '80' },
        { id: 'sg', label: 'Specific Gravity', type: 'number', placeholder: '1.020' },
        { id: 'al', label: 'Albumin (0-5)', type: 'number', placeholder: '0' },
        { id: 'su', label: 'Sugar (0-5)', type: 'number', placeholder: '0' },
        { id: 'bgr', label: 'Blood Glucose Random', type: 'number', placeholder: '120' },
        { id: 'bu', label: 'Blood Urea', type: 'number', placeholder: '36' },
        { id: 'sc', label: 'Serum Creatinine', type: 'number', placeholder: '1.2' },
        { id: 'sod', label: 'Sodium', type: 'number', placeholder: '138' },
        { id: 'pot', label: 'Potassium', type: 'number', placeholder: '4.4' },
        { id: 'hemo', label: 'Hemoglobin', type: 'number', placeholder: '15.4' },
        { id: 'pcv', label: 'Packed Cell Volume', type: 'number', placeholder: '44' },
        { id: 'wc', label: 'White Blood Cell Count', type: 'number', placeholder: '7800' },
        { id: 'rc', label: 'Red Blood Cell Count', type: 'number', placeholder: '5.2' }
      ]
    }
  };

  const handleInputChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // If metabolic_screening, run diabetes first, then use its prediction for BP model
      if (selectedModel === 'metabolic_screening') {
        const diabetesData = {
          Pregnancies: formData.Pregnancies,
          Glucose: formData.Glucose,
          BloodPressure: formData.BloodPressure,
          SkinThickness: formData.SkinThickness,
          Insulin: formData.Insulin,
          BMI: formData.BMI,
          DiabetesPedigreeFunction: formData.DiabetesPedigreeFunction,
          Age: formData.Age
        };

        try {
          // Step 1: Run Diabetes model
          const diabetesRes = await fetch('http://localhost:8004/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model_name: 'diabetes',
              data: diabetesData
            })
          });

          if (!diabetesRes.ok) {
            const errData = await diabetesRes.json();
            throw new Error(errData.detail || 'Diabetes analysis failed');
          }

          const diabetesResult = await diabetesRes.json();
          // Map prediction to 0 or 1 (Healthy=0, Diabetic=1)
          const diabetesOutcome = diabetesResult.prediction.toLowerCase().includes('diabetic') ? 1 : 0;

          // Step 2: Run BP model with diabetes outcome
          const bpData = {
            Pregnancies: formData.Pregnancies,
            Glucose: formData.Glucose,
            SkinThickness: formData.SkinThickness,
            Insulin: formData.Insulin,
            BMI: formData.BMI,
            DiabetesPedigreeFunction: formData.DiabetesPedigreeFunction,
            Age: formData.Age,
            Outcome: diabetesOutcome.toString()
          };

          const bpRes = await fetch('http://localhost:8004/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model_name: 'bp',
              data: bpData
            })
          });

          if (!bpRes.ok) {
            const errData = await bpRes.json();
            throw new Error(errData.detail || 'BP analysis failed');
          }

          const bpResult = await bpRes.json();

          setResult({
            dual: true,
            diabetes: diabetesResult,
            bp: bpResult
          });
        } catch (err) {
          throw err;
        }
      } else {
        // Single model prediction
        const response = await fetch('http://localhost:8004/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_name: selectedModel,
            data: formData
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Analysis failed');
        }

        const data = await response.json();
        setResult({
          dual: false,
          ...data
        });
      }
    } catch (err) {
      setError(err.message || 'Connection to analysis server failed. Ensure backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Health Metrics Analyzer</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">Intelligent dual-model screening where diabetes prediction informs blood pressure risk assessment.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-primary-50 text-primary-700 rounded-4xl text-xs font-black border border-primary-100 shadow-sm">
          <Clipboard size={20} className="text-primary-500" />
          Clinical Data Analysis
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* MODEL SELECTION */}
        <aside className="lg:col-span-1 space-y-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Select Assessment</h3>
          <div className="space-y-4">
            {Object.entries(models).map(([id, model]) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedModel(id);
                  setFormData({});
                  setResult(null);
                }}
                className={`w-full flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all duration-500 text-left group ${selectedModel === id
                  ? 'border-primary-500 bg-white shadow-2xl shadow-primary-100 scale-105'
                  : 'border-gray-100 bg-gray-50/50 hover:border-primary-200 hover:bg-white'
                  }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:rotate-6 ${selectedModel === id ? 'bg-primary-50' : 'bg-white'
                  }`}>
                  {model.icon}
                </div>
                <div className="flex-grow">
                  <p className={`font-black tracking-tight ${selectedModel === id ? 'text-gray-900' : 'text-gray-500'}`}>{model.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">AI Screening</p>
                </div>
                <ChevronRight size={20} className={selectedModel === id ? 'text-primary-500' : 'text-gray-300'} />
              </button>
            ))}
          </div>
        </aside>

        {/* INPUT FORM */}
        <section className="lg:col-span-2 bg-white p-12 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{models[selectedModel].name} Data</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{selectedModel === 'metabolic_screening' ? 'Single Input - Diabetes→BP Analysis' : 'Input Clinical Parameters'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {models[selectedModel].fields.map((field) => (
              <div key={field.id} className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-bold text-gray-700"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full py-6 rounded-4xl text-lg font-black shadow-2xl shadow-primary-100 active:scale-95 transition-all relative z-10"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin mr-3" size={24} /> Processing Metrics...
              </>
            ) : (
              <>
                <Zap size={24} className="mr-3" /> Run Neural Assessment
              </>
            )}
          </Button>

          {error && (
            <div className="p-6 bg-red-50 text-red-600 rounded-4xl border border-red-100 flex items-center gap-5 text-xs font-black uppercase tracking-widest animate-in shake duration-300 relative z-10">
              <AlertTriangle size={24} className="shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 relative z-10">
              {result.dual ? (
                // Dual results (Diabetes + BP)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Diabetes Result */}
                  <div className="p-10 bg-red-50 rounded-[2.5rem] border-2 border-red-100 shadow-inner">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.3em]">Diabetes Risk</p>
                        <p className="text-2xl font-black text-red-900 tracking-tighter">{result.diabetes.prediction}</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/50 h-3 rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-1000"
                        style={{ width: `${result.diabetes.confidence * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-black text-red-700 text-right">{(result.diabetes.confidence * 100).toFixed(1)}% Confidence</p>
                  </div>

                  {/* BP Result */}
                  <div className="p-10 bg-pink-50 rounded-[2.5rem] border-2 border-pink-100 shadow-inner">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-white text-pink-500 rounded-2xl flex items-center justify-center shadow-sm">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-pink-400 font-black uppercase tracking-[0.3em]">Blood Pressure</p>
                        <p className="text-2xl font-black text-pink-900 tracking-tighter">{result.bp.prediction}</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/50 h-3 rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all duration-1000"
                        style={{ width: `${result.bp.confidence * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-black text-pink-700 text-right">{(result.bp.confidence * 100).toFixed(1)}% Confidence</p>
                  </div>
                </div>
              ) : (
                // Single result (Liver or Kidney)
                <div className="p-10 bg-primary-50 rounded-[2.5rem] border-2 border-primary-100 shadow-inner">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <CheckCircle size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.3em]">Analysis Result</p>
                        <p className="text-3xl font-black text-primary-900 tracking-tighter">{result.prediction}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.3em]">Confidence</p>
                      <p className="text-2xl font-black text-primary-700">{(result.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-white/50 h-4 rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full bg-primary-500 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-1000"
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-700 font-bold leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-200">
                <span className="text-primary-600 mr-2">●</span>
                This assessment is based on the provided clinical metrics. Please consult a healthcare professional for a definitive diagnosis.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HealthMetricsAnalyzer;
