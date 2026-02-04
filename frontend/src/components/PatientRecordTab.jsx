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
  Unlock
} from 'lucide-react';
import { ethers } from 'ethers';
import MedVaultABI from '../abis/MedVaultAbi.json';
import HealthIDABI from '../abis/HealthIdAbi.json';
import { Button } from './button';

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
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [contract, setContract] = useState(null);
  const [healthIDContract, setHealthIDContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

        const medVaultABI = Array.isArray(MedVaultABI) ? MedVaultABI : MedVaultABI.abi;
        const healthIDABI = Array.isArray(HealthIDABI) ? HealthIDABI : HealthIDABI.abi;

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
        const access = await contract.doctorPermissions(
          patient.walletAddress,
          account
        );
        setHasAccess(access);

        const pending = await contract.hasPendingRequest(
          patient.walletAddress,
          account
        );
        setHasPendingRequest(pending);

        const balance = await healthIDContract.balanceOf(
          patient.walletAddress
        );
        if (balance > 0) setUserHealthID('Available');
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
    fetchPatientReports();
  }, [patient, contract, account, hasAccess]);

  const fetchPatientReports = async () => {
    if (!contract || !account || !patient?.walletAddress) return;

    try {
      setLoading(true);
      const allowed =
        account.toLowerCase() === patient.walletAddress.toLowerCase() ||
        hasAccess;

      if (!allowed) {
        setError('You do not have permission to view this patient\'s records. Please request access first.');
        setMedicalReports([]);
        return;
      }

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
      setError('Failed to fetch reports. Please try again.');
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
    window.open(`https://ipfs.io/ipfs/${hash}`, '_blank');
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

            {!hasAccess && !hasPendingRequest && (
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
                    Request Access
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12 space-y-8">
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
                  {patient.age && (
                    <p className="text-sm text-gray-400 mt-1">Age: {patient.age} years</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-200">
                  <Shield size={18} className="text-gray-600" />
                  <span className={`font-black text-sm ${
                    hasAccess ? 'text-success-600' : hasPendingRequest ? 'text-warning-600' : 'text-gray-600'
                  }`}>
                    {hasAccess ? 'Access Granted' : hasPendingRequest ? 'Pending Request' : 'Access Required'}
                  </span>
                </div>
              </div>
            </div>

            {/* Patient Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-primary-500" />
                  <p className="text-sm font-bold text-gray-700 truncate">{patient.walletAddress?.slice(0, 10)}...</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Health ID</p>
                <div className="flex items-center gap-2">
                  <Shield size={16} className={userHealthID ? 'text-success-500' : 'text-gray-300'} />
                  <p className="text-sm font-bold text-gray-700">{userHealthID || 'Not Available'}</p>
                </div>
              </div>

              {patient.condition && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Condition</p>
                  <p className="text-sm font-bold text-gray-700">{patient.condition}</p>
                </div>
              )}

              {patient.phone && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-bold text-gray-700">{patient.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Access Status Card */}
        {!hasAccess && (
          <div className={`rounded-3xl border-2 p-8 flex items-start gap-4 ${
            hasPendingRequest
              ? 'bg-warning-50 border-warning-200'
              : 'bg-danger-50 border-danger-200'
          }`}>
            <div className={`p-3 rounded-xl ${
              hasPendingRequest ? 'bg-warning-100' : 'bg-danger-100'
            }`}>
              {hasPendingRequest ? (
                <Clock size={24} className="text-warning-600" />
              ) : (
                <Lock size={24} className="text-danger-600" />
              )}
            </div>
            <div className="flex-grow">
              <h3 className={`font-black text-lg ${
                hasPendingRequest ? 'text-warning-900' : 'text-danger-900'
              }`}>
                {hasPendingRequest ? 'Access Request Pending' : 'Access Required'}
              </h3>
              <p className={`text-sm font-medium mt-1 ${
                hasPendingRequest ? 'text-warning-700' : 'text-danger-700'
              }`}>
                {hasPendingRequest
                  ? 'Your access request has been sent to the patient. They will receive a notification and can approve or deny your request.'
                  : 'You need to request access to view this patient\'s medical records. Click the "Request Access" button above to send a request.'}
              </p>
            </div>
          </div>
        )}

        {/* Medical Reports Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <FileText size={28} className="text-primary-500" />
              Medical Reports
            </h3>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-primary-500" size={48} />
                <p className="text-gray-500 font-medium">Loading medical reports...</p>
              </div>
            ) : error ? (
              <div className="flex items-start gap-4 p-6 bg-danger-50 border border-danger-200 rounded-2xl">
                <AlertCircle size={24} className="text-danger-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-danger-900">Error Loading Reports</h4>
                  <p className="text-sm text-danger-700 mt-1">{error}</p>
                </div>
              </div>
            ) : medicalReports.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={40} className="text-gray-300" />
                </div>
                <h4 className="text-xl font-black text-gray-900 mb-2">No Medical Reports Found</h4>
                <p className="text-gray-500 font-medium">There are no medical reports available for this patient yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicalReports.map((report, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                        <FileText size={24} className="text-primary-500" />
                      </div>
                      <button
                        onClick={() => handleDownload(report.ipfsHash, report.fileName)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="Download report"
                      >
                        <Download size={20} className="text-gray-600 hover:text-primary-600" />
                      </button>
                    </div>

                    <h4 className="font-black text-gray-900 mb-2">{report.fileName}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{report.description}</p>

                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} />
                        <span>{report.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 break-all">
                        <Lock size={14} />
                        <span className="font-mono">{report.ipfsHash.slice(0, 20)}...</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDownload(report.ipfsHash, report.fileName)}
                      className="w-full mt-4 flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientRecordsTab;
