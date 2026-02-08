import {
  Plus,
  Upload,
  FileText,
  Eye,
  Download,
  X,
  Loader2,
  Shield,
  HardDrive,
  Share2,
  User,
  Check,
  Search
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useMedLink } from "../context/BlockChainContext";
import {
  uploadEncryptedFile,
  fetchAndDecryptFile,
  createDownloadableUrl,
  downloadDecryptedFile,
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
    grantRecordAccess,
    revokeRecordAccess,
    checkRecordPermission
  } = useMedLink();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("12345678");
  const [uploading, setUploading] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedMimeType, setDecryptedMimeType] = useState("");
  const fileInputRef = useRef(null);

  // Sharing state
  const [sharingReport, setSharingReport] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharingStatus, setSharingStatus] = useState({}); // doctorAddress -> boolean
  const [fileAccessMap, setFileAccessMap] = useState({}); // ipfsHash -> array of doctor objects with access
  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, x: 0, y: 0, items: [] });

  // Fetch access info for all files
  const fetchFileAccessInfo = async () => {
    if (!account || medicalReports.length === 0 || doctors.length === 0) return;

    const accessMap = {};
    for (const ipfsHash of medicalReports) {
      const accessList = [];
      for (const doc of doctors) {
        if (doc.walletAddress) {
          try {
            const hasAccess = await checkRecordPermission(account, doc.walletAddress, ipfsHash);
            if (hasAccess) {
              accessList.push(doc);
            }
          } catch (e) {
            console.warn(`Could not check access for ${doc.walletAddress}:`, e);
          }
        }
      }
      accessMap[ipfsHash] = accessList;
    }
    setFileAccessMap(accessMap);
  };

  const showTooltip = (e, ipfsHash) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({ visible: true, x: rect.right, y: rect.bottom, items: fileAccessMap[ipfsHash] || [] });
  };

  const hideTooltip = () => setTooltipInfo({ visible: false, x: 0, y: 0, items: [] });

  useEffect(() => {
    if (account && medicalReports.length === 0) {
      fetchMedicalReports();
    }
    // Also fetch doctors list on mount for access checking
    if (doctors.length === 0) {
      fetchDoctors();
    }
  }, [account]);

  useEffect(() => {
    if (account && !encryptionKey) {
      setEncryptionKey(
        `medlink_${account.slice(0, 8)}_${account.slice(-8)}`
      );
    }
  }, [account]);

  useEffect(() => {
    if (medicalReports.length > 0 && doctors.length > 0) {
      fetchFileAccessInfo();
    }
  }, [medicalReports, doctors, account]);

  // Additional effect to ensure file access is fetched when doctors load
  useEffect(() => {
    if (doctors.length > 0 && medicalReports.length > 0) {
      fetchFileAccessInfo();
    }
  }, [doctors]);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:5000/api/auth/doctors", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const openShareModal = async (ipfsHash) => {
    setSharingReport(ipfsHash);
    await fetchDoctors();
    
    // Check current permissions for each doctor
    const status = {};
    for (const doc of doctors) {
      if (doc.walletAddress) {
        const hasAccess = await checkRecordPermission(account, doc.walletAddress, ipfsHash);
        status[doc.walletAddress] = hasAccess;
      }
    }
    setSharingStatus(status);

    // Refresh file access info when modal opens
    await fetchFileAccessInfo();
  };

  const toggleShare = async (doctorAddress) => {
    if (!sharingReport) return;
    
    try {
      const isCurrentlyShared = sharingStatus[doctorAddress];
      if (isCurrentlyShared) {
        await revokeRecordAccess(doctorAddress, sharingReport);
      } else {
        await grantRecordAccess(doctorAddress, sharingReport);
      }
      
      setSharingStatus(prev => ({
        ...prev,
        [doctorAddress]: !isCurrentlyShared
      }));

      // Update fileAccessMap for this file
      const sharedDoctor = doctors.find(d => d.walletAddress === doctorAddress);
      setFileAccessMap(prev => ({
        ...prev,
        [sharingReport]: isCurrentlyShared 
          ? prev[sharingReport]?.filter(d => d.walletAddress !== doctorAddress) || []
          : [...(prev[sharingReport] || []), sharedDoctor]
      }));

      // Refetch file access info after toggle to ensure sync
      await fetchFileAccessInfo();
    } catch (error) {
      console.error("Error toggling share:", error);
      alert("Failed to update sharing permission");
    }
  };

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
      await downloadDecryptedFile(ipfsHash, encryptionKey, fileName);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download the report");
    }
  };

  const handleViewReport = async (ipfsHash) => {
    try {
      setDecrypting(true);
      const result = await fetchAndDecryptFile(ipfsHash, encryptionKey);
      
      if (result.isBinary) {
        const url = createDownloadableUrl(result.data, result.mimeType);
        window.open(url, "_blank");
      } else {
        setDecryptedContent(result.data);
        setDecryptedMimeType(result.mimeType);
        setViewingReport(ipfsHash);
      }
    } catch (error) {
      console.error("View error:", error);
      alert("Failed to view the report");
    } finally {
      setDecrypting(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          className="px-10 py-5 bg-gray-900 text-white rounded-4xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-gray-200 hover:bg-primary-600 hover:shadow-primary-100 active:scale-95 transition-all flex items-center gap-3"
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
            <p className="text-lg font-black text-warning-900 mb-1 tracking-tight uppercase">HealthID Required</p>
            <p className="text-base text-warning-700 font-bold leading-relaxed">
              You need an active <strong>HealthID</strong> to secure medical records. Please mint your ID in the dashboard settings to activate your vault.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {medicalReports.length === 0 ? (
          <div className="col-span-full py-40 bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center shadow-sm group">
            <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-4xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <FileText size={48} />
            </div>
            <p className="text-2xl font-black text-gray-400 tracking-tight">Vault is Empty</p>
            <p className="text-gray-300 font-bold mt-3 text-lg">Upload your first clinical record to start your secure history.</p>
          </div>
        ) : (
          medicalReports.map((ipfsHash, index) => (
            <div key={index} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:border-primary-100 transition-all duration-500 group relative overflow-visible">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-all duration-700"></div>
              
              <div className="flex items-start justify-between mb-10 relative z-10">
                <div className="w-16 h-16 bg-gray-50 text-primary-600 rounded-3xl flex items-center justify-center shadow-inner group-hover:bg-primary-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500">
                  <FileText size={32} />
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openShareModal(ipfsHash)}
                      className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all"
                      title="Share Record"
                    >
                      <Share2 size={18} />
                    </button>
                    <div className="px-5 py-2 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-gray-100 group-hover:bg-white transition-colors">
                      ENTRY #{index + 1}
                    </div>
                  </div>
                  {fileAccessMap[ipfsHash] && fileAccessMap[ipfsHash].length > 0 && (
                    <div className="relative">
                      <div
                        onMouseEnter={(e) => showTooltip(e, ipfsHash)}
                        onMouseLeave={hideTooltip}
                        className="px-3 py-1 bg-success-50 text-success-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-success-100 flex items-center gap-1 cursor-default"
                      >
                        <Share2 size={12} />
                        {fileAccessMap[ipfsHash].length} Doctor{fileAccessMap[ipfsHash].length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
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
                  onClick={() => handleViewReport(ipfsHash)}
                  disabled={decrypting}
                  className="flex items-center justify-center gap-3 py-4 bg-gray-50 text-gray-700 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-900 hover:text-white transition-all active:scale-95 border border-transparent hover:border-gray-900"
                >
                  {decrypting ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />} View
                </button>
                <button
                  onClick={() =>
                    handleDownloadReport(
                      ipfsHash,
                      `medical_record_${index + 1}`
                    )
                  }
                  className="flex items-center justify-center gap-3 py-4 bg-primary-50 text-primary-600 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 hover:text-white transition-all active:scale-95 shadow-sm shadow-primary-50"
                >
                  <Download size={18} /> Get File
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Share Modal */}
      {sharingReport && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative bg-white w-full max-h-[90vh] rounded-[3rem] shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-30">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Share Record</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Grant record-level permissions to doctors</p>
              </div>
              <button
                onClick={() => setSharingReport(null)}
                className="p-4 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search doctor by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-100 outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-4">
                {loadingDoctors ? (
                  <div className="flex flex-col items-center py-10">
                    <Loader2 className="animate-spin text-primary-500 mb-4" size={32} />
                    <p className="text-gray-400 font-bold">Fetching specialists...</p>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400 font-bold">No doctors found</p>
                  </div>
                ) : (
                  filteredDoctors.map(doctor => (
                    <div key={doctor._id} className="flex items-center justify-between p-6 bg-gray-50 rounded-4xl border border-transparent hover:border-primary-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                          {doctor.name?.charAt(0) || <User size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{doctor.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{doctor.walletAddress?.slice(0, 10)}...{doctor.walletAddress?.slice(-4)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleShare(doctor.walletAddress)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          sharingStatus[doctor.walletAddress]
                            ? "bg-success-50 text-success-600 border border-success-100"
                            : "bg-gray-900 text-white hover:bg-primary-600"
                        }`}
                      >
                        {sharingStatus[doctor.walletAddress] ? (
                          <span className="flex items-center gap-2"><Check size={14} /> Shared</span>
                        ) : "Share"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative bg-white w-full max-h-[90vh] rounded-[4rem] shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="p-12 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-30">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">New Vault Entry</h3>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Secure clinical data upload</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-5 hover:bg-gray-100 rounded-4xl transition-colors text-gray-400 hover:text-gray-900"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-12 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Report Classification</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent rounded-4xl text-lg font-bold focus:bg-white focus:border-primary-100 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  <option value="Blood Test">Blood Analysis</option>
                  <option value="Radiology">Radiology (X-Ray/MRI)</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Cardiology">Cardiology (ECG)</option>
                  <option value="Pathology">Pathology Report</option>
                  <option value="Other">Other Clinical Data</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Clinical Context</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter clinical observations or notes..."
                  className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2.5rem] text-lg font-bold focus:bg-white focus:border-primary-100 outline-none transition-all min-h-40 resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Secure File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50/30 hover:border-primary-200 transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 mb-4 shadow-sm group-hover:scale-110 group-hover:text-primary-500 transition-all">
                    <Upload size={28} />
                  </div>
                  <p className="text-lg font-black text-gray-900">
                    {selectedFile ? selectedFile.name : "Select Clinical File"}
                  </p>
                  <p className="text-gray-400 font-bold text-xs mt-1">MAX 10MB • PDF, JPG, PNG, TXT</p>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !reportType}
                className="w-full py-6 bg-gray-900 text-white rounded-4xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {uploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Securing on Chain...
                  </>
                ) : (
                  <>
                    <Shield size={20} className="text-primary-400" /> Commit to Vault
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewingReport && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="p-12 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-30">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Clinical Decryption</h3>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Authenticated viewing session</p>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-5 hover:bg-gray-100 rounded-4xl transition-colors text-gray-400 hover:text-gray-900"
              >
                <X size={28} />
              </button>
            </div>
            <div className="p-12">
              <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner max-h-[50vh] overflow-y-auto">
                <pre className="text-lg font-bold text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                  {decryptedContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
      {tooltipInfo.visible && createPortal(
        <div style={{ left: tooltipInfo.x, top: tooltipInfo.y, transform: 'translateY(8px)', position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white p-3 rounded-xl shadow-2xl border border-gray-100 w-48">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Shared with:</p>
            {tooltipInfo.items.map(doc => (
              <div key={doc._id} className="text-[11px] text-gray-700 font-bold mb-1">{doc.name}</div>
            ))}
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default HealthRecordsTab;
