import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { ethers } from 'ethers';
import axios from 'axios';
import MedVaultABI from '../abis/MedVaultAbi.json';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Shield,
  AlertCircle,
  Calendar,
  MapPin,
  Activity,
  Loader2,
  CheckCircle,
  Key,
  AlertTriangle
} from "lucide-react";

export const AccessRequestsPanel = () => {
  const [accessRequests, setAccessRequests] = useState([]);
  const [grantedAccess, setGrantedAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  const token = localStorage.getItem('token');
  const CONTRACT_ADDRESS = import.meta.env.VITE_MED_VAULT_CONTRACT_ADDRESS;

  useEffect(() => {
    const initializeContract = async () => {
      try {
        if (typeof window.ethereum === 'undefined') {
          setError("Please install MetaMask to use this feature");
          return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        const accounts = await web3Provider.listAccounts();

        if (accounts.length === 0) {
          setError("No accounts found. Please connect your wallet.");
          return;
        }

        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          MedVaultABI.abi || MedVaultABI,
          signer
        );

        setProvider(web3Provider);
        setContract(contractInstance);
        setAccount(accounts[0].address);

      } catch (error) {
        console.error("Error initializing contract:", error);
        setError("Failed to connect to blockchain");
      }
    };

    initializeContract();
  }, []);

  useEffect(() => {
    const fetchAccessRequests = async () => {
      if (!contract || !account || !provider) return;

      try {
        setLoading(true);
        setError(null);

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50000); 

        const filter = contract.filters.AccessRequested(null, account);
        const events = await contract.queryFilter(filter, fromBlock, currentBlock);

        if (events.length === 0) {
          setAccessRequests([]);
          setLoading(false);
          return;
        }

        const doctorRequestMap = new Map();

        events.forEach(event => {
          const doctorAddress = event.args.doctor || event.args[0];
          const blockNumber = event.blockNumber;

          if (!doctorRequestMap.has(doctorAddress) ||
            doctorRequestMap.get(doctorAddress).blockNumber < blockNumber) {
            doctorRequestMap.set(doctorAddress, {
              doctorAddress,
              blockNumber,
              transactionHash: event.transactionHash
            });
          }
        });

        const doctorRequests = [];

        for (const [doctorAddress, requestInfo] of doctorRequestMap) {
          try {
            const hasAccess = await contract.doctorPermissions(account, doctorAddress);
            const isPending = await contract.pendingAccessRequests(account, doctorAddress);

            if (hasAccess || !isPending) continue;

            let requestDate = new Date().toISOString();
            try {
              const block = await provider.getBlock(requestInfo.blockNumber);
              if (block && block.timestamp) {
                requestDate = new Date(block.timestamp * 1000).toISOString();
              }
            } catch (blockError) {
              console.warn('Could not fetch block timestamp:', blockError);
            }

            try {
              const response = await axios.get(
                `http://localhost:5000/api/auth/doctors/wallet/${doctorAddress}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  timeout: 10000
                }
              );

              const doctorInfo = response.data;

              doctorRequests.push({
                id: doctorAddress,
                doctorName: doctorInfo.name || 'Unknown Doctor',
                doctorAddress: doctorAddress,
                requestDate: requestDate,
                urgency: doctorInfo.urgency || 'medium',
                specialization: doctorInfo.specialization || 'Not specified',
                email: doctorInfo.email || 'Not available',
                hospital: doctorInfo.hospital || 'Not specified',
                profilePicture: doctorInfo.profilePicture,
                transactionHash: requestInfo.transactionHash
              });

            } catch (apiError) {
              doctorRequests.push({
                id: doctorAddress,
                doctorName: `Doctor (${doctorAddress.slice(0, 8)}...)`,
                doctorAddress: doctorAddress,
                requestDate: requestDate,
                urgency: 'medium',
                specialization: 'Not available',
                email: 'Not available',
                hospital: 'Not available',
                transactionHash: requestInfo.transactionHash
              });
            }

          } catch (contractError) {
            console.error(`Error checking permissions for ${doctorAddress}:`, contractError);
          }
        }

        doctorRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
        setAccessRequests(doctorRequests);

        // also fetch currently granted access (full access and record-level)
        try {
          const approvalFilter = contract.filters.AccessApproved(null, account);
          const approvalEvents = await contract.queryFilter(approvalFilter, fromBlock, currentBlock);

          const recordGrantFilter = contract.filters.RecordAccessGranted(null, account, null);
          const recordGrantEvents = await contract.queryFilter(recordGrantFilter, fromBlock, currentBlock);

          const recordRevokeFilter = contract.filters.RecordAccessRevoked(null, account, null);
          const recordRevokeEvents = await contract.queryFilter(recordRevokeFilter, fromBlock, currentBlock);

          const doctorMap = new Map();

          // process approvals (full access)
          for (const ev of approvalEvents) {
            const doctorAddr = ev.args[0] || ev.args.doctor;
            const granted = ev.args[2] !== undefined ? ev.args[2] : ev.args.grant;
            const block = await provider.getBlock(ev.blockNumber).catch(() => null);
            const date = block && block.timestamp ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString();

            if (!doctorMap.has(doctorAddr)) doctorMap.set(doctorAddr, { doctorAddress: doctorAddr, fullAccess: false, files: new Set(), grantDate: date });
            if (granted) {
              doctorMap.get(doctorAddr).fullAccess = true;
              doctorMap.get(doctorAddr).grantDate = date;
            } else {
              // if revoked, clear full access
              doctorMap.get(doctorAddr).fullAccess = false;
            }
          }

          // process record grants
          for (const ev of recordGrantEvents) {
            const patient = ev.args[0];
            const doctorAddr = ev.args[1] || ev.args.doctor;
            const ipfsHash = ev.args[2] || ev.args.ipfsHash;
            if (!doctorMap.has(doctorAddr)) doctorMap.set(doctorAddr, { doctorAddress: doctorAddr, fullAccess: false, files: new Set(), grantDate: null });
            doctorMap.get(doctorAddr).files.add(ipfsHash);
          }

          // process record revokes
          for (const ev of recordRevokeEvents) {
            const doctorAddr = ev.args[1] || ev.args.doctor;
            const ipfsHash = ev.args[2] || ev.args.ipfsHash;
            if (doctorMap.has(doctorAddr)) doctorMap.get(doctorAddr).files.delete(ipfsHash);
          }

          // check emergency expiry for patient
          let emergencyExpiry = 0;
          try {
            const expiry = await contract.emergencyAccessExpiry(account);
            emergencyExpiry = Number(expiry.toString ? expiry.toString() : expiry) * 1000; // solidity timestamp -> ms
          } catch (e) {
            emergencyExpiry = 0;
          }

          const grantedList = [];
          for (const [addr, info] of doctorMap) {
            try {
              const resp = await axios.get(
                `http://localhost:5000/api/auth/doctors/wallet/${addr}`,
                { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
              );
              const doctorInfo = resp.data;
              grantedList.push({
                id: addr,
                doctorName: doctorInfo.name || `Doctor (${addr.slice(0,8)}...)`,
                doctorAddress: addr,
                fullAccess: info.fullAccess,
                files: Array.from(info.files || []),
                grantDate: info.grantDate,
                hospital: doctorInfo.hospital || 'Not specified',
                profilePicture: doctorInfo.profilePicture,
                emergencyExpiry: emergencyExpiry
              });
            } catch (e) {
              grantedList.push({
                id: addr,
                doctorName: `Doctor (${addr.slice(0,8)}...)`,
                doctorAddress: addr,
                fullAccess: info.fullAccess,
                files: Array.from(info.files || []),
                grantDate: info.grantDate,
                hospital: 'Not specified',
                profilePicture: null,
                emergencyExpiry: emergencyExpiry
              });
            }
          }

          setGrantedAccess(grantedList);
        } catch (e) {
          console.warn('Could not fetch granted access events:', e);
        }

      } catch (error) {
        console.error("Error fetching access requests:", error);
        setError("Failed to load access requests");
      } finally {
        setLoading(false);
      }
    };

    if (contract && account && provider) {
      fetchAccessRequests();
    }
  }, [contract, account, provider, token]);

  const handleApproveAccess = async (doctorAddress) => {
    if (!contract) return;
    try {
      setProcessingAction(doctorAddress);
      const tx = await contract.approveAccess(doctorAddress, true);
      await tx.wait();
      setAccessRequests(prev => prev.filter(req => req.doctorAddress !== doctorAddress));
      alert("Full access approved successfully!");
    } catch (error) {
      console.error("Error approving access:", error);
      alert("Failed to approve access");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRevokeAccess = async (doctorAddress) => {
    if (!contract) return;
    try {
      setProcessingAction(doctorAddress);
      const tx = await contract.revokeAccess(doctorAddress);
      await tx.wait();

      // remove doctor if they have no remaining access (full access revoked + no file-level access)
      setGrantedAccess(prev => prev.filter(a => {
        if (a.doctorAddress === doctorAddress) {
          return a.files && a.files.length > 0; // keep only if has file-level access
        }
        return true;
      }));

      alert('Full access revoked successfully');
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access');
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Access Requests</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"Privacy is not an option, it is a right." — Manage who can view your medical data.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-primary-50 text-primary-700 rounded-4xl text-[10px] font-black uppercase tracking-widest border border-primary-100 shadow-sm">
          <Shield size={18} className="text-primary-500" />
          Quantum Security Active
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
            <Loader2 size={48} className="text-primary-500 animate-spin mb-6" />
            <p className="text-xl font-black text-gray-400 uppercase tracking-widest">Scanning Blockchain...</p>
          </div>
        ) : error ? (
          <div className="p-12 bg-white rounded-[3rem] border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-xl font-black text-gray-900">Connection Error</h4>
            <p className="text-gray-500 font-medium">{error}</p>
          </div>
        ) : accessRequests.length === 0 ? (
          <div className="py-40 bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center shadow-sm group">
            <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-4xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <Key size={48} />
            </div>
            <p className="text-2xl font-black text-gray-400 tracking-tight">No Pending Requests</p>
            <p className="text-gray-300 font-bold mt-3 text-lg">Your medical data is currently secure and private.</p>
          </div>
        ) : (
          accessRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden hover:shadow-2xl transition-all duration-500 group">
              <div className="p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="relative">
                  <div className="w-24 h-24 bg-primary-50 rounded-4xl overflow-hidden border-4 border-white shadow-lg group-hover:rotate-3 transition-transform">
                    {request.profilePicture ? (
                      <img src={request.profilePicture} alt={request.doctorName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-600 text-3xl font-black uppercase">
                        {request.doctorName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                    request.urgency === 'high' ? 'bg-danger-500' : 'bg-warning-500'
                  }`}>
                    <Activity size={14} className="text-white" />
                  </div>
                </div>

                <div className="grow space-y-4 text-center md:text-left">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{request.doctorName}</h3>
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">{request.specialization}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-primary-400" /> {request.hospital}</span>
                    <span className="flex items-center gap-2"><Calendar size={14} className="text-primary-400" /> {new Date(request.requestDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <Button
                    onClick={() => handleApproveAccess(request.doctorAddress)}
                    disabled={processingAction === request.doctorAddress}
                    className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-success-600 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    {processingAction === request.doctorAddress ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                    Approve Full Access
                  </Button>
                  <Button
                    variant="outline"
                    className="px-10 py-5 border-2 border-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-danger-50 hover:text-danger-500 hover:border-danger-100 transition-all flex items-center justify-center gap-3"
                  >
                    <XCircle size={18} /> Deny Request
                  </Button>
                </div>
              </div>
              <div className="px-10 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest">
                <span>Transaction Hash: {request.transactionHash.slice(0, 20)}...</span>
                <span className="flex items-center gap-2 text-primary-400"><Shield size={12} /> Verified On Chain</span>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Granted Access Section */}
      <div className="space-y-6">
        <h3 className="text-3xl font-black text-gray-900">Granted Access</h3>
        {grantedAccess.length === 0 ? (
          <div className="p-8 bg-white rounded-4xl border border-dashed border-gray-200 text-center text-gray-400">No doctors currently have access.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {grantedAccess.filter(entry => entry.fullAccess || (entry.files && entry.files.length > 0)).map(entry => (
              <div key={entry.id} className="bg-white rounded-4xl border border-gray-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-50 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-black">
                    {entry.profilePicture ? <img src={entry.profilePicture} className="w-full h-full object-cover" /> : entry.doctorName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg font-black text-gray-900">{entry.doctorName}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">{entry.hospital}</div>
                    <div className="text-xs text-gray-400 mt-1">{entry.fullAccess ? 'Full Access' : `${entry.files.length} file(s) access`}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {entry.grantDate && <div>Granted: {new Date(entry.grantDate).toLocaleString()}</div>}
                  {entry.emergencyExpiry && entry.emergencyExpiry > Date.now() && (
                    <div className="text-danger-600">Emergency Access until: {new Date(entry.emergencyExpiry).toLocaleString()}</div>
                  )}
                  <div className="mt-3 flex items-center justify-end gap-3">
                    {entry.fullAccess && (
                      <Button
                        onClick={() => handleRevokeAccess(entry.doctorAddress)}
                        disabled={processingAction === entry.doctorAddress}
                        className="px-4 py-2 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 transition-all flex items-center gap-2"
                      >
                        {processingAction === entry.doctorAddress ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                        Revoke Full Access
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
