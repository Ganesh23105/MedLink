import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import axios from 'axios';
import MedVaultABI from '../abis/MedVaultAbi.json';
import {
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
  Key
} from "lucide-react";
import { Button } from "./button";

export const AccessRequestsPanel = () => {
  const [accessRequests, setAccessRequests] = useState([]);
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

        let contractABI;
        if (Array.isArray(MedVaultABI)) {
          contractABI = MedVaultABI;
        } else if (MedVaultABI.abi && Array.isArray(MedVaultABI.abi)) {
          contractABI = MedVaultABI.abi;
        } else {
          throw new Error("Invalid ABI format");
        }

        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        setProvider(web3Provider);
        setContract(contractInstance);
        setAccount(accounts[0].address);
        console.log("Contract initialized successfully");

      } catch (error) {
        console.error("Error initializing contract:", error);
        let errorMessage = "Failed to connect to blockchain";

        if (error.code === 4001) {
          errorMessage = "User rejected the connection request";
        } else if (error.code === -32002) {
          errorMessage = "Connection request already pending";
        } else if (error.message.includes("Invalid ABI")) {
          errorMessage = "Contract ABI configuration error";
        } else if (error.message.includes("network")) {
          errorMessage = "Network connection error. Please check your connection.";
        }

        setError(errorMessage);
      }
    };

    initializeContract();
  }, []);

  useEffect(() => {
    const fetchAccessRequests = async () => {
      if (!contract || !account || !provider) {
        console.log('Missing dependencies:', { contract: !!contract, account: !!account, provider: !!provider });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const currentBlock = await provider.getBlockNumber();
        // Query from a much earlier block to ensure we don't miss requests
        const fromBlock = Math.max(0, currentBlock - 50000); 

        console.log(`Querying events from block ${fromBlock} to ${currentBlock} for account ${account}`);

        const filter = contract.filters.AccessRequested(null, account);
        const events = await contract.queryFilter(filter, fromBlock, currentBlock);

        console.log('Found access request events:', events);

        if (events.length === 0) {
          setAccessRequests([]);
          setLoading(false);
          return;
        }

        const doctorRequestMap = new Map();

        events.forEach(event => {
          // In ethers v6, args can be accessed by name or index
          const doctorAddress = event.args.doctor || event.args[0];
          const blockNumber = event.blockNumber;

          if (!doctorRequestMap.has(doctorAddress) ||
            doctorRequestMap.get(doctorAddress).blockNumber < blockNumber) {
            doctorRequestMap.set(doctorAddress, {
              doctorAddress,
              blockNumber,
              transactionHash: event.transactionHash,
              timestamp: null
            });
          }
        });

        const doctorRequests = [];

        for (const [doctorAddress, requestInfo] of doctorRequestMap) {
          try {
            const hasAccess = await contract.doctorPermissions(account, doctorAddress);
            const isPending = await contract.pendingAccessRequests(account, doctorAddress);

            if (hasAccess || !isPending) {
              console.log(`Doctor ${doctorAddress} access status: hasAccess=${hasAccess}, isPending=${isPending}. Skipping.`);
              continue;
            }

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
              console.error(`Error fetching doctor info for ${doctorAddress}:`, apiError);

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
        console.log('Pending requests:', doctorRequests);

      } catch (error) {
        console.error("Error fetching access requests:", error);
        let errorMessage = "Failed to load access requests";

        if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timeout. Please try again.";
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (contract && account && provider) {
      fetchAccessRequests();

      const handleAccessRequested = async (doctor, patient, event) => {
        console.log('New AccessRequested event:', { doctor, patient });
        if (patient.toLowerCase() === account.toLowerCase()) {
          setTimeout(() => {
            fetchAccessRequests();
          }, 2000);
        }
      };

      const handleAccessApproved = async (doctor, patient, granted, event) => {
        console.log('AccessApproved event:', { doctor, patient, granted });
        if (patient.toLowerCase() === account.toLowerCase()) {
          fetchAccessRequests();
        }
      };

      try {
        contract.on("AccessRequested", handleAccessRequested);
        contract.on("AccessApproved", handleAccessApproved);

        return () => {
          try {
            contract.off("AccessRequested", handleAccessRequested);
            contract.off("AccessApproved", handleAccessApproved);
          } catch (error) {
            console.warn("Error removing event listeners:", error);
          }
        };
      } catch (error) {
        console.warn("Error setting up event listeners:", error);
      }
    }
  }, [contract, account, provider, token]);

  const handleApproveAccess = async (doctorAddress) => {
    if (!contract) {
      alert("Contract not initialized");
      return;
    }

    try {
      setProcessingAction(doctorAddress);

      const gasEstimate = await contract.approveAccess.estimateGas(doctorAddress, true);
      const gasLimit = gasEstimate * 120n / 100n;

      const tx = await contract.approveAccess(doctorAddress, true, {
        gasLimit: gasLimit
      });

      console.log("Approval transaction:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setAccessRequests(prev => prev.filter(req => req.doctorAddress !== doctorAddress));
      alert("Access approved successfully!");

    } catch (error) {
      console.error("Error approving access:", error);
      let errorMessage = "Failed to approve access";

      if (error.code === 4001) {
        errorMessage = "Transaction cancelled by user";
      } else if (error.code === -32603) {
        errorMessage = "Transaction failed. Please try again.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (error.message.includes("gas")) {
        errorMessage = "Gas estimation failed. Please try again.";
      } else if (error.reason) {
        errorMessage = error.reason;
      }

      alert(`Error: ${errorMessage}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectAccess = async (doctorAddress) => {
    if (!contract) {
      alert("Contract not initialized");
      return;
    }

    try {
      setProcessingAction(doctorAddress);

      const gasEstimate = await contract.approveAccess.estimateGas(doctorAddress, false);
      const gasLimit = gasEstimate * 120n / 100n;

      const tx = await contract.approveAccess(doctorAddress, false, {
        gasLimit: gasLimit
      });

      console.log("Rejection transaction:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setAccessRequests(prev => prev.filter(req => req.doctorAddress !== doctorAddress));
      alert("Access rejected successfully!");

    } catch (error) {
      console.error("Error rejecting access:", error);
      let errorMessage = "Failed to reject access";

      if (error.code === 4001) {
        errorMessage = "Transaction cancelled by user";
      } else if (error.code === -32603) {
        errorMessage = "Transaction failed. Please try again.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (error.message.includes("gas")) {
        errorMessage = "Gas estimation failed. Please try again.";
      } else if (error.reason) {
        errorMessage = error.reason;
      }

      alert(`Error: ${errorMessage}`);
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-black text-gray-900">Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-danger-50 rounded-3xl border border-danger-100 text-center">
        <div className="w-16 h-16 bg-white text-danger-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black text-danger-900">Error Loading Requests</h3>
        <p className="text-danger-700 font-medium mt-2 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} variant="danger">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Access Requests</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"Your data, your rules." — Manage who can view your medical history with precision.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-primary-50 text-primary-700 rounded-[2rem] text-xs font-black border border-primary-100 shadow-sm shadow-primary-50">
          <Shield size={20} className="text-primary-500" />
          Data Sovereignty Active
        </div>
      </header>

      {accessRequests.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {accessRequests.map((request) => (
            <div key={request.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:border-primary-100 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                <div className="flex items-center gap-10">
                  <div className="relative">
                    <div className="w-28 h-28 bg-gray-50 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                      {request.profilePicture ? (
                        <img src={request.profilePicture} alt={request.doctorName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={56} className="text-gray-200" />
                      )}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl ${request.urgency === 'high' ? 'bg-danger-500 shadow-danger-200' : 'bg-primary-500 shadow-primary-200'
                      }`}>
                      {request.urgency}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-3xl font-black text-gray-900 tracking-tight">{request.doctorName}</h4>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-black text-gray-400">
                      <span className="flex items-center gap-3 uppercase tracking-[0.2em] text-[10px]"><Activity size={18} className="text-primary-500" /> {request.specialization}</span>
                      <span className="flex items-center gap-3 uppercase tracking-[0.2em] text-[10px]"><MapPin size={18} className="text-primary-500" /> {request.hospital}</span>
                    </div>
                    <div className="flex items-center gap-4 pt-3">
                      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border border-gray-100">
                        <Calendar size={14} />
                        {new Date(request.requestDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                        VAULT ID: {request.doctorAddress.slice(0, 10)}...{request.doctorAddress.slice(-4)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  {processingAction === request.doctorAddress ? (
                    <div className="flex items-center gap-4 px-10 py-5 bg-gray-50 rounded-[2rem] text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] border border-gray-100 shadow-inner">
                      <Loader2 size={20} className="animate-spin text-primary-500" />
                      Authenticating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleRejectAccess(request.doctorAddress)}
                        className="p-5 text-gray-300 hover:text-danger-500 hover:bg-danger-50 rounded-[2rem] transition-all active:scale-90 group/btn"
                        title="Deny Access"
                      >
                        <X size={28} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                      </button>
                      <button
                        onClick={() => handleApproveAccess(request.doctorAddress)}
                        className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-600 shadow-2xl shadow-gray-200 hover:shadow-primary-100 active:scale-95 transition-all flex items-center gap-3"
                      >
                        <CheckCircle size={20} className="text-primary-400" /> Grant Access
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Key size={48} />
          </div>
          <p className="text-2xl font-black text-gray-400 tracking-tight">Vault is Locked</p>
          <p className="text-gray-300 font-bold mt-3 text-lg">No pending requests found in the authorization queue.</p>
        </div>
      )}
    </div>
  );
};