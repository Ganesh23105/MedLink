import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  User,
  Wallet,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Send,
  Shield,
  Clock,
  Loader2,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  X,
  AlertTriangle
} from 'lucide-react';
import { ethers } from 'ethers';
import MedVaultABI from '../abis/MedVaultAbi.json';
import HealthIDABI from '../abis/HealthIdAbi.json';
import { Button } from './button';
import {
  fetchAndDecryptFile,
  createDownloadableUrl,
  downloadDecryptedFile
} from "../utils/ipfsUtils";

const PatientRecordsTab = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { patient } = location.state || {};

  const [medicalReports, setMedicalReports] = useState([]);
  const [userHealthID, setUserHealthID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasEmergencyAccess, setHasEmergencyAccess] = useState(false);
  const [emergencyExpiry, setEmergencyExpiry] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [contract, setContract] = useState(null);
  const [healthIDContract, setHealthIDContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");

  const MEDVAULT_CONTRACT_ADDRESS = import.meta.env.VITE_MED_VAULT_CONTRACT_ADDRESS;
  const HEALTHID_CONTRACT_ADDRESS = import.meta.env.VITE_HEALTH_ID_CONTRACT_ADDRESS;

  useEffect(() => {
    const initializeBlockchain = async () => {
      try {
        if (!window.ethereum) {
          setError('Please install MetaMask to use this feature');
          return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accounts = await provider.listAccounts();

        const medVaultABI = MedVaultABI.abi || MedVaultABI;
        const healthIDABI = HealthIDABI.abi || HealthIDABI;

        const medVaultContract = new ethers.Contract(
          MEDVAULT_CONTRACT_ADDRESS,
          medVaultABI,
          signer
        );

        const healthIDContractInstance = new ethers.Contract(
          HEALTHID_CONTRACT_ADDRESS,
          healthIDABI,
          signer
        );

        setContract(medVaultContract);
        setHealthIDContract(healthIDContractInstance);
        setAccount(accounts[0].address);
      } catch (err) {
        console.error('Blockchain initialization error:', err);
        setError('Failed to connect to blockchain. Please check MetaMask.');
      }
    };

    initializeBlockchain();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      if (!contract || !healthIDContract || !account || !patient?.walletAddress)
        return;

      try {
        // Check standard doctor permission
        const access = await contract.doctorPermissions(
          patient.walletAddress,
          account
        );
        setHasAccess(access);

        // Check emergency access
        const emerAccess = await contract.hasEmergencyAccess(patient.walletAddress, account);
        setHasEmergencyAccess(emerAccess);
        
        if (emerAccess) {
          const expiry = await contract.emergencyAccessExpiry(patient.walletAddress);
          setEmergencyExpiry(Number(expiry));
        }

        // Check pending request
        const pending = await contract.pendingAccessRequests(
          patient.walletAddress,
          account
        );
        setHasPendingRequest(pending);

        // Check HealthID
        const balance = await healthIDContract.balanceOf(
          patient.walletAddress
        );
        if (BigInt(balance) > BigInt(0)) setUserHealthID('Available');
      } catch (err) {
        console.error('Error checking status:', err);
      }
    };

    checkStatus();
  }, [contract, healthIDContract, account, patient]);

  useEffect(() => {
    if (!patient) {
      navigate('/doc-dashboard');
      return;
    }
    
    if (patient.walletAddress) {
      const pAddress = patient.walletAddress;
      setEncryptionKey(`medlink_${pAddress.slice(0, 8)}_${pAddress.slice(-8)}`);
    } else {
      setEncryptionKey("12345678");
    }
    
    fetchPatientReports();
  }, [patient, contract, account, hasAccess, hasEmergencyAccess]);

  const fetchPatientReports = async () => {
    if (!contract || !account || !patient?.walletAddress) return;

    try {
      setLoading(true);
      
      // In the new contract, getReports handles permissions internally
      // It will return either:
      // 1. All reports (if full access or emergency access)
      // 2. Specific shared reports (record-level)
      // 3. Revert (if no access at all)
      
      const reports = await contract.getReports(patient.walletAddress);
      setMedicalReports(
        reports.map((ipfsHash, i) => ({
          ipfsHash,
          fileName: `Medical Report ${i + 1}`,
          date: new Date().toLocaleDateString(),
          description: 'Medical report stored on IPFS'
        }))
      );
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      if (err.message.includes("Unauthorized")) {
        setError('You do not have permission to view this patient\'s records. Please request access or ask for specific record sharing.');
      } else {
        setError('Failed to fetch reports. Please ensure you have permission.');
      }
      setMedicalReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      setRequestingAccess(true);
      const tx = await contract.requestAccess(patient.walletAddress);
      await tx.wait();
      setHasPendingRequest(true);
      alert('Access request sent successfully! The patient will receive a notification.');
    } catch (err) {
      console.error('Access request error:', err);
      alert('Access request failed. Please try again.');
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPatientReports();
    setRefreshing(false);
  };

  const handleDownload = async (hash, name) => {
    try {
      await downloadDecryptedFile(hash, encryptionKey, name);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download the report');
    }
  };

  const handleView = async (hash) => {
    try {
      setDecrypting(true);
      const result = await fetchAndDecryptFile(hash, encryptionKey);
      
      if (result.isBinary) {
        const url = createDownloadableUrl(result.data, result.mimeType);
        window.open(url, "_blank");
      } else {
        setDecryptedContent(result.data);
        setViewingReport(hash);
      }
    } catch (err) {
      console.error('View error:', err);
      alert('Failed to view the report');
    } finally {
      setDecrypting(false);
    }
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-danger-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-500 mb-8">The patient information could not be loaded. Please go back and try again.</p>
          <Button onClick={() => navigate('/doc-dashboard')} className="w-full">
            <ArrowLeft size={18} /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Medical Records</h1>
              <p className="text-gray-500 font-medium">Patient: {patient.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            {!hasAccess && !hasEmergencyAccess && !hasPendingRequest && (
              <Button
                onClick={handleRequestAccess}
                disabled={requestingAccess}
                className="flex items-center gap-2"
              >
                {requestingAccess ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Request Full Access
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12 space-y-8">
        {hasEmergencyAccess && (
          <div className="p-6 bg-danger-50 border-2 border-danger-100 rounded-3xl flex items-center justify-between shadow-lg shadow-danger-100/20 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-danger-500 shadow-sm">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-danger-900 font-black uppercase tracking-widest text-sm">Emergency Access Active</p>
                <p className="text-danger-700 font-bold text-xs">You have full temporary access to this patient's records.</p>
              </div>
            </div>
            {emergencyExpiry && (
              <div className="text-right">
                <p className="text-[10px] font-black text-danger-400 uppercase tracking-widest">Expires At</p>
                <p className="text-sm font-black text-danger-700">{new Date(emergencyExpiry * 1000).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Patient Information Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-primary-600 border-2 border-primary-200">
                  {patient.name?.charAt(0) || '👤'}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{patient.name}</h2>
                  <p className="text-gray-500 font-medium">{patient.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  hasAccess || hasEmergencyAccess ? 'bg-success-50 text-success-600 border border-success-100' : 'bg-warning-50 text-warning-600 border border-warning-100'
                }`}>
                  {hasAccess || hasEmergencyAccess ? <Unlock size={14} /> : <Lock size={14} />}
                  {hasAccess ? 'Full Access' : hasEmergencyAccess ? 'Emergency Access' : 'Limited Access'}
                </div>
                {hasPendingRequest && !hasAccess && (
                  <div className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary-100">
                    <Clock size={14} /> Pending Approval
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Records Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <FileText className="text-primary-500" />
              Available Records
              <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                {medicalReports.length}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 animate-pulse space-y-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                  <div className="h-6 bg-gray-100 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white p-12 rounded-[3rem] border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 bg-warning-50 text-warning-500 rounded-full flex items-center justify-center mx-auto">
                <Shield size={32} />
              </div>
              <h4 className="text-xl font-black text-gray-900">Access Restricted</h4>
              <p className="text-gray-500 mx-auto font-medium">{error}</p>
            </div>
          ) : medicalReports.length === 0 ? (
            <div className="bg-white p-12 rounded-[3rem] border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
                <FileText size={32} />
              </div>
              <h4 className="text-xl font-black text-gray-900">No Records Found</h4>
              <p className="text-gray-500 font-medium">This patient hasn't shared any records with you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicalReports.map((report, index) => (
                <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all">
                      <FileText size={28} />
                    </div>
                    <div className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      IPFS
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-black text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{report.fileName}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                    <Calendar size={14} /> {report.date}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleView(report.ipfsHash)}
                      disabled={decrypting}
                      className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all"
                    >
                      {decrypting ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} View
                    </button>
                    <button
                      onClick={() => handleDownload(report.ipfsHash, report.fileName)}
                      className="flex items-center justify-center gap-2 py-3 bg-primary-50 text-primary-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all"
                    >
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Viewing Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900">Decrypted Record</h3>
              <button onClick={() => setViewingReport(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 max-h-[60vh] overflow-y-auto">
                <pre className="text-sm font-bold text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {decryptedContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordsTab;
