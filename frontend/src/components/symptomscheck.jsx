import React, { useState } from "react";
import {
  Send,
  AlertTriangle,
  Heart,
  Clock,
  Loader2,
  Info,
  CheckCircle2,
  Activity
} from "lucide-react";
import { Button } from "./button.jsx";

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTextSubmit = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8001/api/process-text",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error("No analysis data received");
      }
    } catch (error) {
      console.error(error);
      alert("Error processing symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyStyles = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return "bg-danger-50 text-danger-600 border-danger-200";
      case "high":
        return "bg-warning-50 text-warning-600 border-warning-200";
      case "moderate":
        return "bg-primary-50 text-primary-600 border-primary-200";
      case "low":
        return "bg-secondary-50 text-secondary-600 border-secondary-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
      case "high":
        return <AlertTriangle size={20} />;
      case "moderate":
        return <Activity size={20} />;
      case "low":
        return <Clock size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const renderListItems = (
    items,
    defaultMessage = "No information available"
  ) => {
    if (!items) return [defaultMessage];
    if (Array.isArray(items)) return items;
    if (typeof items === "string") return [items];
    return [defaultMessage];
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">AI Symptom Checker</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"The first wealth is health." — Ralph Waldo Emerson. Describe your symptoms for instant neural insights.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-primary-50 text-primary-700 rounded-[2rem] text-xs font-black border border-primary-100 shadow-sm shadow-primary-50">
          <Activity size={20} className="text-primary-500" />
          Neural Engine Active
        </div>
      </header>

      <section className="bg-white p-12 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
        
        <div className="space-y-6 relative z-10">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Clinical Description</label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full p-10 bg-gray-50/50 border-2 border-transparent rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-primary-50/50 focus:border-primary-100 outline-none transition-all min-h-[220px] text-gray-700 font-black text-xl tracking-tight placeholder:text-gray-200 shadow-inner"
            placeholder="Describe how you're feeling in detail... (e.g., 'I've had a persistent dull ache in my temples for 3 days, accompanied by light sensitivity')"
          />
        </div>

        <Button 
          onClick={handleTextSubmit} 
          disabled={loading || !symptoms.trim()}
          className="w-full py-7 rounded-[2.5rem] text-xl font-black shadow-2xl shadow-primary-100 relative z-10 active:scale-95 transition-all overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-4">
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={28} /> Neural Processing...
              </>
            ) : (
              <>
                <Send size={28} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" /> 
                Generate AI Health Report
              </>
            )}
          </span>
        </Button>
      </section>

      {analysis && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-12">
          <div className={`p-10 rounded-[3rem] border-4 flex flex-col md:flex-row items-center gap-8 shadow-2xl transition-all duration-500 ${getUrgencyStyles(analysis.urgency)}`}>
            <div className="p-6 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl">
              {getUrgencyIcon(analysis.urgency)}
            </div>
            <div className="text-center md:text-left space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Clinical Priority Level</p>
              <p className="text-4xl font-black tracking-tighter uppercase">{analysis.urgency || "Not specified"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 space-y-8 hover:shadow-2xl hover:border-primary-100 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl shadow-inner group-hover:rotate-6 transition-transform">
                  <Info size={28} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Clinical Overview</h3>
              </div>
              <p className="text-gray-600 font-bold text-lg leading-relaxed relative z-10">
                {analysis.detailed_description || "No detailed description available."}
              </p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 space-y-8 hover:shadow-2xl hover:border-warning-100 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 bg-warning-50 text-warning-600 rounded-2xl shadow-inner group-hover:-rotate-6 transition-transform">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Differential Diagnosis</h3>
              </div>
              <ul className="space-y-4 relative z-10">
                {renderListItems(analysis.conditions).map((condition, index) => (
                  <li key={index} className="flex items-center gap-5 p-5 bg-gray-50/50 rounded-2xl text-gray-700 font-black text-sm border border-gray-100/50 group/item hover:bg-white transition-colors">
                    <div className="w-3 h-3 bg-warning-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover/item:scale-125 transition-transform"></div>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 space-y-8 hover:shadow-2xl hover:border-secondary-100 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 bg-secondary-50 text-secondary-600 rounded-2xl shadow-inner group-hover:rotate-6 transition-transform">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recommended Tests</h3>
              </div>
              <ul className="space-y-4 relative z-10">
                {renderListItems(analysis.tests).map((test, index) => (
                  <li key={index} className="flex items-center gap-5 p-5 bg-gray-50/50 rounded-2xl text-gray-700 font-black text-sm border border-gray-100/50 group/item hover:bg-white transition-colors">
                    <div className="w-3 h-3 bg-secondary-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover/item:scale-125 transition-transform"></div>
                    {test}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 space-y-8 hover:shadow-2xl hover:border-danger-100 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-danger-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 bg-danger-50 text-danger-600 rounded-2xl shadow-inner group-hover:-rotate-6 transition-transform">
                  <Heart size={28} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Red Flags</h3>
              </div>
              <div className="p-8 bg-danger-50/50 rounded-[2rem] border-2 border-danger-100 relative z-10">
                <p className="text-danger-900 font-black text-lg leading-relaxed italic">
                  "{analysis.when_to_seek_help || "Consult with a healthcare professional immediately for proper clinical evaluation."}"
                </p>
              </div>
            </div>
          </div>

          {(analysis.home_care_tips || analysis.first_aid) && (
            <div className="bg-gray-900 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10 space-y-10">
                <h3 className="text-3xl font-black text-white tracking-tighter">Strategic Care Protocol</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {analysis.home_care_tips && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">Home Management</h4>
                      <p className="text-gray-300 text-lg font-bold leading-relaxed">{analysis.home_care_tips}</p>
                    </div>
                  )}
                  {analysis.first_aid && analysis.first_aid !== "null" && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-warning-400 uppercase tracking-[0.3em]">Immediate Response</h4>
                      <p className="text-gray-300 text-lg font-bold leading-relaxed">{analysis.first_aid}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <footer className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-gray-900 text-white rounded-2xl shadow-xl">
            <AlertTriangle size={32} />
          </div>
          <p className="text-sm text-gray-500 font-bold leading-relaxed max-w-4xl text-center md:text-left">
            <strong className="text-gray-900 uppercase tracking-widest text-xs block mb-1">Critical Medical Disclaimer:</strong> 
            This neural analysis tool provides general health information and is not a clinical diagnosis or a substitute for professional medical advice. Always seek the direct assessment of a board-certified physician for any medical concerns.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SymptomChecker;