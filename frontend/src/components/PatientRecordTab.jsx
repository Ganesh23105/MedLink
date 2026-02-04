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
  Clock
} from 'lucide-react';
import { ethers } from 'ethers';
import MedVaultABI from '../abis/MedVaultAbi.json';
import HealthIDABI from '../abis/HealthIdAbi.json';

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

  const MEDVAULT_CONTRACT_ADDRESS = import.meta.env.VITE_MED_VAULT_CONTRACT_ADDRESS;
  const HEALTHID_CONTRACT_ADDRESS = import.meta.env.VITE_HEALTH_ID_CONTRACT_ADDRESS;

  useEffect(() => {
    const initializeBlockchain = async () => {
      try {
        if (!window.ethereum) {
          setError('Please install MetaMask');
          return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accounts = await provider.listAccounts();

        const medVaultContract = new ethers.Contract(
          MEDVAULT_CONTRACT_ADDRESS,
          MedVaultABI.abi || MedVaultABI,
          signer
        );

        const healthIDContractInstance = new ethers.Contract(
          HEALTHID_CONTRACT_ADDRESS,
          HealthIDABI.abi || HealthIDABI,
          signer
        );

        setContract(medVaultContract);
        setHealthIDContract(healthIDContractInstance);
        setAccount(accounts[0].address);
      } catch {
        setError('Failed to connect to blockchain');
      }
    };

    initializeBlockchain();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      if (!contract || !healthIDContract || !account || !patient?.walletAddress)
        return;

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
        setError('Permission denied');
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
    } catch {
      setError('Failed to fetch reports');
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
    } catch {
      alert('Access request failed');
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleDownload = async (hash, name) => {
    window.open(`https://ipfs.io/ipfs/${hash}`, '_blank');
  };

  if (!patient) {
    return (
      <div>
        <AlertCircle />
        <h2>Patient not found</h2>
        <button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <header>
        <button onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <h1>Medical Records</h1>
        <p>Patient: {patient.name}</p>

        {!hasAccess && !hasPendingRequest && (
          <button onClick={handleRequestAccess}>
            <Send /> Request Access
          </button>
        )}

        <button onClick={fetchPatientReports}>
          <RefreshCw /> Refresh
        </button>
      </header>

      <section>
        <User />
        <h2>{patient.name}</h2>
        <p>{patient.email}</p>
        <Wallet />
        <span>{patient.walletAddress}</span>
        <Shield />
        <span>
          {hasAccess
            ? 'Access Granted'
            : hasPendingRequest
              ? 'Pending'
              : 'Access Required'}
        </span>
      </section>

      <section>
        <h3>Medical Reports</h3>

        {loading && (
          <div>
            <RefreshCw /> Loading...
          </div>
        )}

        {error && (
          <div>
            <AlertCircle />
            <p>{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          medicalReports.map((report, i) => (
            <div key={i}>
              <FileText />
              <h4>{report.fileName}</h4>
              <Calendar />
              <span>{report.date}</span>
              <p>{report.description}</p>
              <p>{report.ipfsHash}</p>
              <button
                onClick={() =>
                  handleDownload(report.ipfsHash, report.fileName)
                }
              >
                <Download /> Download
              </button>
            </div>
          ))}
      </section>
    </div>
  );
};

export default PatientRecordsTab;
