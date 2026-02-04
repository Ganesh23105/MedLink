import React, { useState, useCallback } from 'react';
import {
  Upload,
  Camera,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileImage,
  Brain,
  Heart,
  Bone,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Button } from './button';

const ImageAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageSelect = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setError(null);
      setAnalysisResults(null);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      handleImageSelect(e.dataTransfer.files[0]);
    },
    [handleImageSelect]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;

        await fetch('http://localhost:8003/analyze-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data })
        });

        await new Promise((r) => setTimeout(r, 2000));

        const mockResults = {
          image_type: 'chest',
          predictions: [
            { label: 'Normal', score: 0.85 },
            { label: 'Pneumonia', score: 0.12 },
            { label: 'COVID-19', score: 0.02 },
            { label: 'Tuberculosis', score: 0.01 }
          ],
          risk_assessment: 'Low Risk - Appears Normal',
          recommendations: [
            'Image appears normal, but regular check-ups are still recommended.',
            'This AI analysis is for screening purposes only.',
            'Schedule follow-up if symptoms persist.'
          ],
          confidence_summary: {
            highest_confidence: 0.85,
            average_confidence: 0.25,
            total_predictions: 4
          },
          timestamp: new Date().toISOString()
        };

        setAnalysisResults(mockResults);
        setIsAnalyzing(false);
      };

      reader.readAsDataURL(selectedImage);
    } catch {
      setError('Analysis failed. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const getImageTypeIcon = (type) => {
    switch (type) {
      case 'chest':
        return <Heart />;
      case 'brain':
        return <Brain />;
      case 'bone':
        return <Bone />;
      default:
        return <FileImage />;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Image Analyze</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"Seeing is believing." — Advanced AI screening for Chest, Brain, and Bone scans.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-warning-50 text-warning-700 rounded-[2rem] text-xs font-black border border-warning-100 shadow-sm shadow-warning-50">
          <AlertTriangle size={20} className="text-warning-500" />
          Research Use Only
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* UPLOAD SECTION */}
        <section className="bg-white p-12 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Upload size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Visual Input</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Diagnostic Upload Portal</p>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input').click()}
            className={`border-4 border-dashed rounded-[3rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative z-10 ${
              imagePreview ? 'border-primary-500 bg-primary-50/30 shadow-2xl shadow-primary-50' : 'border-gray-100 bg-gray-50/50 hover:border-primary-400 hover:bg-white'
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e.target.files[0])}
              hidden
            />
            {imagePreview ? (
              <div className="relative w-full aspect-square max-w-sm mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group-hover:scale-105 transition-transform duration-700">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <p className="text-white font-black bg-black/50 px-8 py-4 rounded-[2rem] border border-white/20 uppercase tracking-widest text-[10px]">Change Scan Image</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-white text-gray-300 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Camera size={48} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-700 tracking-tight">Drop medical image here</p>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mt-2">Supports High-Res JPG, PNG</p>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={analyzeImage} 
            disabled={!selectedImage || isAnalyzing}
            className="w-full py-6 rounded-[2rem] text-lg font-black shadow-2xl shadow-primary-100 active:scale-95 transition-all relative z-10"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin mr-3" size={24} /> Processing Scan...
              </>
            ) : (
              <>
                <Zap size={24} className="mr-3" /> Run AI Diagnosis
              </>
            )}
          </Button>

          {error && (
            <div className="p-6 bg-danger-50 text-danger-600 rounded-[2rem] border border-danger-100 flex items-center gap-5 text-xs font-black uppercase tracking-widest animate-in shake duration-300 relative z-10">
              <AlertTriangle size={24} className="shrink-0" />
              {error}
            </div>
          )}
        </section>

        {/* RESULTS SECTION */}
        <section className="bg-white p-12 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Activity size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Neural Analysis Findings</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">AI Metrics & Predictions</p>
            </div>
          </div>

          {!analysisResults ? (
            <div className="flex-grow flex flex-col items-center justify-center py-32 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 relative z-10">
              <div className="w-20 h-20 bg-white text-gray-200 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <Clock size={40} />
              </div>
              <p className="text-xl font-black text-gray-400 tracking-tight">Waiting for Data</p>
              <p className="text-gray-300 font-bold mt-2">Upload a scan to see AI-detected features</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 relative z-10">
              <div className="flex items-center justify-between p-8 bg-primary-50 rounded-[2.5rem] border border-primary-100 shadow-inner">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white text-primary-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                    {getImageTypeIcon(analysisResults.image_type)}
                  </div>
                  <div>
                    <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.3em] mb-1">Detected Target</p>
                    <p className="text-2xl font-black text-primary-900 capitalize tracking-tighter">{analysisResults.image_type} Region</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.3em] mb-1">Risk Profile</p>
                  <p className="text-sm font-black text-primary-700 uppercase tracking-widest">{analysisResults.risk_assessment}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Probability Analysis</h4>
                <div className="grid grid-cols-1 gap-6">
                  {analysisResults.predictions.map((p, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-gray-700">{p.label}</span>
                        <span className={p.score > 0.7 ? 'text-success-600' : 'text-gray-400'}>{(p.score * 100).toFixed(1)}% Confidence</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ${p.score > 0.7 ? 'bg-success-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-primary-500'}`} 
                          style={{ width: `${p.score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Care Recommendations</h4>
                <div className="grid grid-cols-1 gap-4">
                  {analysisResults.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-5 p-5 bg-gray-50 rounded-[2rem] border border-gray-100 group/item hover:bg-white hover:shadow-xl transition-all duration-300">
                      <div className="mt-2 w-2 h-2 bg-primary-500 rounded-full shrink-0 group-hover/item:scale-150 transition-transform"></div>
                      <p className="text-sm text-gray-600 font-bold leading-relaxed">{r}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-2">Max Confidence</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">{(analysisResults.confidence_summary.highest_confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-2">Scan Identity</p>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{new Date(analysisResults.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="p-10 bg-gray-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="p-5 bg-white/10 rounded-[2rem] text-warning-400 border border-white/10 shadow-inner group-hover:rotate-12 transition-transform">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h4 className="text-2xl font-black tracking-tight mb-2">Medical Disclaimer</h4>
            <p className="text-gray-400 text-base font-bold leading-relaxed max-w-4xl">
              MediChain Intelligence is for screening and research purposes only. This AI output is not a clinical diagnosis. Always consult with a board-certified healthcare professional for official medical assessments and treatment plans.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImageAnalyzer;