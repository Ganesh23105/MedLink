import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  X,
  Loader2,
  FileUp
} from "lucide-react";
import { Button } from "./button.jsx";

const MedicalReportAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const supportedFormats = ["pdf", "png", "jpg", "jpeg", "tiff", "bmp"];
  const maxFileSize = 16;
  const apiUrl = "http://localhost:8002";

  const handleFileSelect = (selectedFile) => {
    setError(null);
    setResults(null);

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (!supportedFormats.includes(fileExtension)) {
      setError(
        `File type not supported. Please upload: ${supportedFormats.join(
          ", "
        ).toUpperCase()}`
      );
      return;
    }

    if (selectedFile.size > maxFileSize * 1024 * 1024) {
      setError(`File size too large. Maximum size is ${maxFileSize}MB`);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const analyzeReport = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      setResults(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getLabValueStatus = (labValue) =>
    labValue.normal
      ? { icon: CheckCircle, color: "text-success-500", bg: "bg-success-50" }
      : { icon: AlertCircle, color: "text-danger-500", bg: "bg-danger-50" };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Report Analyze</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"Knowledge is power." — Francis Bacon. Extract deep clinical insights from your medical documents with precision AI.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-secondary-50 text-secondary-700 rounded-[2rem] text-xs font-black border border-secondary-100 shadow-sm shadow-secondary-50">
          <Activity size={20} className="text-secondary-500" />
          Precision AI Active
        </div>
      </header>

      <section
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-4 border-dashed rounded-[3.5rem] p-16 transition-all duration-500 text-center group ${
          dragOver 
            ? "border-primary-500 bg-primary-50 shadow-2xl shadow-primary-50" 
            : "border-gray-100 bg-gray-50/50 hover:border-primary-300 hover:bg-white shadow-inner"
        }`}
      >
        {file ? (
          <div className="space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-primary-50 text-primary-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl group-hover:rotate-6 transition-transform">
                <FileText size={48} />
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{file.name}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Payload Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            <div className="flex gap-6 justify-center">
              <Button onClick={analyzeReport} disabled={isAnalyzing} className="px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary-100">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin mr-3" size={20} /> Processing...
                  </>
                ) : (
                  <>
                    <Activity size={20} className="mr-3" /> Start Analysis
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={clearFile} disabled={isAnalyzing} className="px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest border-2">
                <X size={20} className="mr-3" /> Discard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-white text-gray-200 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                <FileUp size={48} />
              </div>
              <p className="text-3xl font-black text-gray-700 tracking-tighter">Drop your report here</p>
              <p className="text-gray-400 font-bold text-lg">Securely upload your clinical documents for neural extraction</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="px-12 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest border-2 shadow-sm hover:bg-gray-900 hover:text-white transition-all">
                Browse Files
              </Button>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mt-4">
                Supported: {supportedFormats.join(" • ").toUpperCase()} • Max {maxFileSize}MB
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) =>
            e.target.files && handleFileSelect(e.target.files[0])
          }
          accept={supportedFormats.map((f) => `.${f}`).join(",")}
          hidden
        />
      </section>

      {error && (
        <div className="p-8 bg-danger-50 border-2 border-danger-100 text-danger-600 rounded-[2.5rem] flex items-center gap-6 animate-in shake duration-500 shadow-xl shadow-danger-100/20">
          <div className="p-4 bg-white rounded-2xl shadow-sm">
            <AlertCircle size={28} />
          </div>
          <span className="font-black text-lg tracking-tight">System Error: {error}</span>
        </div>
      )}

      {results && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-12">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-50 pb-10 relative z-10">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Analysis Summary</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Neural Extraction Output</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-6 py-3 rounded-full border border-gray-100">
                <Clock size={16} className="text-primary-500" />
                Processed: {new Date(results.analysis_timestamp).toLocaleString()}
              </div>
            </div>
            
            <p className="text-gray-700 font-bold text-xl leading-relaxed relative z-10">{results.summary}</p>

            {results.conditions?.length > 0 && (
              <div className="space-y-6 relative z-10">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Potential Indicators</h4>
                <div className="flex flex-wrap gap-4">
                  {results.conditions.map((condition, index) => (
                    <div key={index} className="px-6 py-3 bg-warning-50 text-warning-700 rounded-2xl border border-warning-100 font-black text-sm flex items-center gap-3 shadow-sm hover:scale-105 transition-transform">
                      <span className="w-2.5 h-2.5 bg-warning-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                      {condition.replace(/_/g, " ").toUpperCase()}
                      {results.keyword_confidence?.[condition] && (
                        <span className="text-[10px] font-black opacity-50 ml-1">
                          {(results.keyword_confidence[condition] * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {results.lab_details && Object.keys(results.lab_details).length > 0 && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 relative overflow-hidden">
              <div className="space-y-1">
                <h4 className="text-3xl font-black text-gray-900 tracking-tighter">Biometric Metrics</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Quantitative Lab Analysis</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(results.lab_details).map(([labName, labValue]) => {
                  const status = getLabValueStatus(labValue);
                  const StatusIcon = status.icon;
                  return (
                    <div key={labName} className={`p-8 rounded-[2.5rem] border-2 flex items-center justify-between transition-all duration-500 group/item hover:shadow-2xl ${status.bg} ${labValue.normal ? 'border-success-50 hover:border-success-100' : 'border-danger-50 hover:border-danger-100'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform ${status.color}`}>
                          <StatusIcon size={28} />
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900 tracking-tight">{labName.replace(/_/g, " ").toUpperCase()}</p>
                          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Reading: <span className="text-gray-900">{labValue.value}</span></p>
                        </div>
                      </div>
                      <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-inner bg-white ${status.color}`}>
                        {labValue.status.replace(/_/g, " ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <footer className="bg-gray-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-10">
              <div className="p-5 bg-white/10 rounded-[2rem] text-primary-400 border border-white/10 shadow-inner group-hover:rotate-12 transition-transform">
                <AlertCircle size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-black tracking-tight mb-3">Clinical Disclaimer</h4>
                <p className="text-gray-400 text-base font-bold leading-relaxed max-w-4xl">
                  MediChain AI analysis is for informational and educational purposes only. This output is not a clinical diagnosis. Always consult with a board-certified healthcare professional for official medical assessments and treatment protocols.
                </p>
              </div>
            </div>
          </footer>
        </section>
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-32 h-32 border-8 border-white/10 rounded-full shadow-inner"></div>
            <div className="w-32 h-32 border-8 border-primary-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-3xl font-black text-white tracking-tighter">Processing Neural Data</p>
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs">Our AI is extracting clinical insights...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportAnalyzer;