import {
  Plus,
  Upload,
  FileText,
  Eye,
  Download,
  X,
  Loader2,
  Shield,
  HardDrive
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useMediChain } from "../context/BlockChainContext";
import {
  uploadEncryptedFile,
  fetchAndDecryptFile,
  createDownloadableUrl,
  downloadFile,
  viewDecryptedImage,
} from "../utils/ipfsUtils";
import { Button } from "./button";

const HealthRecordsTab = () => {
  const {
    account,
    medicalReports,
    loading,
    uploadReport,
    fetchMedicalReports,
    userHealthID,
  } = useMediChain();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("12345678");
  const [uploading, setUploading] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (account && medicalReports.length === 0) {
      fetchMedicalReports();
    }
  }, [account]);

  useEffect(() => {
    if (account && !encryptionKey) {
      setEncryptionKey(
        `medichain_${account.slice(0, 8)}_${account.slice(-8)}`
      );
    }
  }, [account]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !reportType || !encryptionKey) {
      alert("Please fill in all required fields");
      return;
    }

    if (!userHealthID) {
      alert("You need a HealthID to upload medical records");
      return;
    }

    try {
      setUploading(true);

      const metadata = {
        patientId: userHealthID,
        reportType,
        description: reportDescription,
        timestamp: Date.now(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      };

      const ipfsHash = await uploadEncryptedFile(
        selectedFile,
        encryptionKey,
        metadata
      );

      await uploadReport(ipfsHash);

      setSelectedFile(null);
      setReportType("");
      setReportDescription("");
      setShowUploadModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      alert("Medical record uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload medical record. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadReport = async (ipfsHash, fileName) => {
    try {
      const result = await fetchAndDecryptFile(ipfsHash, "12345678");
      const url = createDownloadableUrl(result.data, result.mimeType);
      downloadFile(url, `${fileName}.${getExtensionFromMime(result.mimeType)}`);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download the report");
    }
  };

  const getExtensionFromMime = (mime) => {
    if (!mime) return "bin";
    if (mime.includes("png")) return "png";
    if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("txt")) return "txt";
    return "bin";
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mb-6">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Wallet Not Connected</h2>
        <p className="text-gray-500 mt-2 font-medium">Please connect your wallet to view your health records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Health Records</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"Your history is your future." — Securely manage your medical legacy on the blockchain.</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          disabled={!userHealthID}
          className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-gray-200 hover:bg-primary-600 hover:shadow-primary-100 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={20} className="text-primary-400" /> Add New Entry
        </Button>
      </header>

      {!userHealthID && (
        <div className="p-8 bg-warning-50 border-2 border-warning-100 rounded-[2.5rem] flex items-start gap-6 shadow-xl shadow-warning-100/20">
          <div className="p-4 bg-white rounded-2xl text-warning-500 shadow-sm shrink-0">
            <Shield size={28} />
          </div>
          <div>
            <p className="text-lg font-black text-warning-900 mb-1 tracking-tight uppercase tracking-widest">HealthID Required</p>
            <p className="text-base text-warning-700 font-bold leading-relaxed">
              You need an active <strong>HealthID</strong> to secure medical records. Please mint your ID in the dashboard settings to activate your vault.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {medicalReports.length === 0 ? (
          <div className="col-span-full py-40 bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center shadow-sm group">
            <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <FileText size={48} />
            </div>
            <p className="text-2xl font-black text-gray-400 tracking-tight">Vault is Empty</p>
            <p className="text-gray-300 font-bold mt-3 text-lg">Upload your first clinical record to start your secure history.</p>
          </div>
        ) : (
          medicalReports.map((ipfsHash, index) => (
            <div key={index} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:border-primary-100 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-all duration-700"></div>
              
              <div className="flex items-start justify-between mb-10 relative z-10">
                <div className="w-16 h-16 bg-gray-50 text-primary-600 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:bg-primary-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500">
                  <FileText size={32} />
                </div>
                <div className="px-5 py-2 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-gray-100 group-hover:bg-white transition-colors">
                  ENTRY #{index + 1}
                </div>
              </div>
              
              <div className="space-y-3 relative z-10">
                <h4 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors">Clinical Report</h4>
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <HardDrive size={14} className="text-primary-400" />
                  <span className="truncate">BLOCK HASH: {ipfsHash.slice(0, 16)}...</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mt-10 relative z-10">
                <button
                  onClick={() =>
                    viewDecryptedImage(ipfsHash, encryptionKey, "image/jpeg")
                  }
                  className="flex items-center justify-center gap-3 py-4 bg-gray-50 text-gray-700 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-900 hover:text-white transition-all active:scale-95 border border-transparent hover:border-gray-900"
                >
                  <Eye size={18} /> View
                </button>
                <button
                  onClick={() =>
                    handleDownloadReport(
                      ipfsHash,
                      `medical_record_${index + 1}`
                    )
                  }
                  className="flex items-center justify-center gap-3 py-4 bg-primary-50 text-primary-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 hover:text-white transition-all active:scale-95 shadow-sm shadow-primary-50"
                >
                  <Download size={18} /> Get File
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative bg-white w-full rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="p-12 border-b border-gray-50 flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Vault Encryption</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">End-to-End Secure Protocol</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-4 bg-gray-50 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-[2rem] transition-all active:scale-90">
                <X size={32} />
              </button>
            </div>
            
            <div className="p-12 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div 
                className={`border-4 border-dashed rounded-[3rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative group/drop ${selectedFile ? 'border-primary-500 bg-primary-50 shadow-2xl shadow-primary-50' : 'border-gray-100 bg-gray-50/50 hover:border-primary-400 hover:bg-white'}`}
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl transition-all duration-500 group-hover/drop:scale-110 group-hover/drop:rotate-6 ${selectedFile ? 'bg-primary-600 text-white' : 'bg-white text-gray-300'}`}>
                  <Upload size={40} />
                </div>
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900 truncate max-w-[320px] tracking-tight">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Payload: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-700 tracking-tight">Drop clinical document</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-3">PDF • JPG • PNG • MAX 10MB</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Classification</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-black focus:bg-white focus:ring-8 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select record type...</option>
                    <option>Lab Results</option>
                    <option>X-Ray / Imaging</option>
                    <option>Blood Analysis</option>
                    <option>ECG / Cardiac</option>
                    <option>Prescription</option>
                    <option>Surgical Report</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Clinical Context</label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows="3"
                    placeholder="Enter diagnostic details or medical context..."
                    className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-black focus:bg-white focus:ring-8 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none placeholder:text-gray-300 tracking-tight"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Vault Passphrase</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors">
                      <Shield size={24} />
                    </div>
                    <input
                      type="password"
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                      placeholder="Enter security key"
                      className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-black focus:bg-white focus:ring-8 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-12 bg-gray-50 border-t border-gray-100 flex gap-6">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-5 px-8 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleUpload} 
                disabled={uploading || !selectedFile || !reportType || !encryptionKey}
                className="flex-[2] py-5 px-10 bg-gray-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-primary-600 hover:shadow-primary-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin inline-block mr-3" /> Encrypting...
                  </>
                ) : (
                  <>
                    <Upload size={24} className="inline-block mr-3" /> Finalize Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed bottom-8 right-8 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3 z-50 animate-in slide-in-from-right-8">
          <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
            <Loader2 size={20} className="text-primary-600 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900">Blockchain Syncing</p>
            <p className="text-xs text-gray-500 font-medium">Updating your records...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecordsTab;