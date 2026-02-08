import { Plus, X, Loader2, ShieldCheck, AlertTriangle, Users, Clock, History } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useMedLink } from "../context/BlockChainContext";
import { ethers } from "ethers";
import guardianAbi from "../abis/GuardianAbi.json";
import medVaultAbi from "../abis/MedVaultAbi.json";
import { Button } from "./button";

const GuardianManagement = () => {
  const { account, provider, setEmergencyDuration, revokeEmergencyAccess: contextRevokeEmergency } = useMedLink();

  const [guardians, setGuardians] = useState([]);
  const [newGuardian, setNewGuardian] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [patientAddress, setPatientAddress] = useState("");
  const [isGuardianForPatient, setIsGuardianForPatient] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [isPatientEmergencyActive, setIsPatientEmergencyActive] = useState(false);
  const [emergencyExpiry, setEmergencyExpiry] = useState(null);
  const [customDuration, setCustomDuration] = useState(24); // hours

  const [guardianContract, setGuardianContract] = useState(null);
  const [medVaultContract, setMedVaultContract] = useState(null);
  const [contractInitialized, setContractInitialized] = useState(false);

  // Helper function to safely parse contract results
  const parseContractResult = (result, expectedType = "array") => {
    try {
      if (!result) return expectedType === "array" ? [] : null;
      if (result._isIndexed !== undefined || result.toArray) {
        return result.toArray ? result.toArray() : Array.from(result);
      }
      if (Array.isArray(result)) return result;
      if (expectedType === "boolean") return Boolean(result);
      if (expectedType === "array") {
        try {
          return Array.from(result);
        } catch (e) {
          return [];
        }
      }
      return result;
    } catch (error) {
      console.error("Error parsing contract result:", error);
      return expectedType === "array" ? [] : null;
    }
  };

  useEffect(() => {
    const initContracts = async () => {
      if (!provider || !account) {
        setContractInitialized(false);
        return;
      }

      try {
        const signer = await provider.getSigner();
        
        const guardianAddress = import.meta.env.VITE_GUARDIAN_CONTRACT_ADDRESS || "0x317809481694FA03014b511657bFFFFf7157dBf3";
        const medVaultAddress = import.meta.env.VITE_MED_VAULT_CONTRACT_ADDRESS || "0x652c5Ae2b16B0717F5B0D2f95C9eA2ad2D96b973";

        const guardian = new ethers.Contract(
          guardianAddress,
          guardianAbi.abi || guardianAbi,
          signer
        );

        const medVault = new ethers.Contract(
          medVaultAddress,
          medVaultAbi.abi || medVaultAbi,
          signer
        );

        try {
          const currentGuardians = await guardian.getGuardians(account);
          setGuardians(parseContractResult(currentGuardians));
          
          const expiry = await medVault.emergencyAccessExpiry(account);
          const now = Math.floor(Date.now() / 1000);
          const expiryNum = Number(expiry);
          setIsPatientEmergencyActive(expiryNum > now);
          setEmergencyExpiry(expiryNum > 0 ? expiryNum : null);

          const duration = await guardian.patientEmergencyDuration(account);
          if (Number(duration) > 0) {
            setCustomDuration(Number(duration) / 3600);
          }
        } catch (e) {
          console.warn("Could not fetch initial data:", e);
        }

        setGuardianContract(guardian);
        setMedVaultContract(medVault);
        setContractInitialized(true);
        setError("");
      } catch (err) {
        console.error("Guardian init error:", err);
        setError("Contract connection failed: " + err.message);
        setContractInitialized(false);
      }
    };

    initContracts();
  }, [provider, account]);

  const addGuardian = () => {
    if (!ethers.isAddress(newGuardian)) {
      setError("Invalid Ethereum address");
      return;
    }
    if (guardians.some(g => g.toLowerCase() === newGuardian.toLowerCase())) {
      setError("Guardian already added");
      return;
    }
    if (newGuardian.toLowerCase() === account.toLowerCase()) {
      setError("Cannot add yourself as guardian");
      return;
    }
    if (guardians.length >= 10) {
      setError("Maximum 10 guardians allowed");
      return;
    }

    setGuardians([...guardians, newGuardian]);
    setNewGuardian("");
    setError("");
  };

  const removeGuardian = (index) => {
    setGuardians(guardians.filter((_, i) => i !== index));
  };

  const handleSetDuration = async () => {
    try {
      setLoading(true);
      const durationSeconds = customDuration * 3600;
      await setEmergencyDuration(durationSeconds);
      alert(`Emergency access duration set to ${customDuration} hours`);
    } catch (err) {
      console.error(err);
      setError("Failed to set duration: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const assignGuardians = async () => {
    if (!guardianContract || guardians.length < 2) {
      setError("Minimum 2 guardians required");
      return;
    }

    try {
      setLoading(true);
      const tx = await guardianContract.assignGuardians(guardians);
      await tx.wait();
      alert("Guardians assigned successfully!");
    } catch (err) {
      console.error(err);
      setError("Transaction failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const checkGuardianStatus = async () => {
    if (!guardianContract || !medVaultContract || !ethers.isAddress(patientAddress)) {
      setError("Invalid patient address");
      return;
    }

    try {
      setLoading(true);
      const guardiansList = await guardianContract.getGuardians(patientAddress);
      const parsedGuardians = parseContractResult(guardiansList);
      const isGuardian = parsedGuardians.some(g => g.toLowerCase() === account.toLowerCase());
      setIsGuardianForPatient(isGuardian);
      
      const status = await guardianContract.getRequestStatus(patientAddress);
      setRequestStatus({
        approvalsNeeded: Number(status[0]),
        currentApprovals: Number(status[1]),
        unlockTime: Number(status[2]),
        executed: status[3],
        active: status[4]
      });

      const expiry = await medVaultContract.emergencyAccessExpiry(patientAddress);
      const now = Math.floor(Date.now() / 1000);
      setEmergencyActive(Number(expiry) > now);
      
      if (!isGuardian) {
        setError("You are not a guardian for this patient");
      } else {
        setError("");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to check status");
    } finally {
      setLoading(false);
    }
  };

  const requestUnlock = async () => {
    try {
      setLoading(true);
      const tx = await guardianContract.requestUnlock(patientAddress);
      await tx.wait();
      alert("Unlock request initiated!");
      await checkGuardianStatus();
    } catch (err) {
      console.error(err);
      alert("Request failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const approveUnlock = async () => {
    try {
      setLoading(true);
      const tx = await guardianContract.approveUnlock(patientAddress);
      await tx.wait();
      alert("Unlock approved!");
      await checkGuardianStatus();
    } catch (err) {
      console.error(err);
      alert("Approval failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const revokeEmergency = async () => {
    try {
      setLoading(true);
      await contextRevokeEmergency();
      alert("Emergency access revoked! Your records are now private again.");
      setIsPatientEmergencyActive(false);
      setEmergencyExpiry(null);
    } catch (err) {
      console.error("Revocation error:", err);
      alert("Revocation failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Wallet Not Connected</h2>
        <p className="text-gray-500 mt-2">Please connect your wallet to manage your guardians.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Guardian Management</h2>
          <p className="text-gray-500 font-medium text-xl leading-relaxed">"Trust is the glue of life." — Designate your emergency medical contacts for decentralized safety.</p>
        </div>
        {isPatientEmergencyActive && (
          <div className="flex items-center gap-3 px-6 py-3 bg-danger-50 text-danger-700 rounded-[2rem] text-xs font-black border border-danger-100 shadow-sm shadow-danger-50 animate-pulse">
            <AlertTriangle size={20} className="text-danger-500" />
            EMERGENCY ACCESS ACTIVE
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* GUARDIANS SETTINGS */}
        <section className="bg-white p-12 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your Trusted Circle</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configure emergency access</p>
            </div>
          </div>

          {/* Emergency Duration Setting */}
          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-6 relative z-10">
            <div className="flex items-center gap-3 text-gray-900 font-black uppercase tracking-widest text-xs">
              <Clock size={18} className="text-primary-500" />
              Access Expiry Window
            </div>
            <div className="flex gap-4">
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="flex-grow px-6 py-4 bg-white border-2 border-transparent rounded-xl text-lg font-bold focus:border-primary-100 outline-none transition-all"
                placeholder="Hours (e.g. 24)"
              />
              <Button 
                onClick={handleSetDuration} 
                disabled={loading}
                className="px-8 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600"
              >
                Set
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 font-bold italic">Default is 24 hours. Max is 7 days.</p>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Guardian Wallet Address (0x...)"
                value={newGuardian}
                onChange={(e) => setNewGuardian(e.target.value)}
                className="flex-grow px-8 py-5 bg-gray-50 border-2 border-transparent rounded-2xl text-lg font-bold focus:bg-white focus:border-primary-100 outline-none transition-all shadow-inner"
              />
              <button
                onClick={addGuardian}
                className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-primary-600 transition-all active:scale-95 shadow-xl"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {guardians.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <span className="font-mono text-sm font-bold text-gray-600">{g.slice(0, 10)}...{g.slice(-8)}</span>
                  </div>
                  <button onClick={() => removeGuardian(i)} className="p-3 text-gray-300 hover:text-danger-500 hover:bg-danger-50 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {error && <p className="text-danger-500 text-xs font-black uppercase tracking-widest bg-danger-50 p-4 rounded-xl border border-danger-100">{error}</p>}

            <Button
              onClick={assignGuardians}
              disabled={loading || guardians.length < 2}
              className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />} Update Guardians
            </Button>

            {isPatientEmergencyActive && (
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="p-6 bg-danger-50 rounded-2xl border border-danger-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-danger-700 font-black text-xs uppercase tracking-widest">Active Emergency Access</p>
                    {emergencyExpiry && (
                      <p className="text-danger-600 font-bold text-[10px]">
                        Expires: {new Date(emergencyExpiry * 1000).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={revokeEmergency}
                    disabled={loading}
                    className="w-full py-4 bg-danger-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-danger-700"
                  >
                    Revoke Immediately
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ACT AS GUARDIAN */}
        <section className="bg-white p-12 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Guardian Portal</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Authorize emergency access</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Patient Address</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="0x..."
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  className="flex-grow px-8 py-5 bg-gray-50 border-2 border-transparent rounded-2xl text-lg font-bold focus:bg-white focus:border-primary-100 outline-none transition-all shadow-inner"
                />
                <button
                  onClick={checkGuardianStatus}
                  disabled={loading}
                  className="px-8 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-600 transition-all shadow-xl"
                >
                  Check
                </button>
              </div>
            </div>

            {requestStatus && (
              <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Current Status</p>
                    <div className="flex items-center gap-3">
                      {emergencyActive ? (
                        <span className="flex items-center gap-2 text-success-600 font-black text-sm uppercase tracking-widest">
                          <ShieldCheck size={18} /> Access Active
                        </span>
                      ) : requestStatus.active ? (
                        <span className="flex items-center gap-2 text-warning-600 font-black text-sm uppercase tracking-widest">
                          <Clock size={18} /> Approval Pending
                        </span>
                      ) : (
                        <span className="text-gray-400 font-black text-sm uppercase tracking-widest">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Progress</p>
                    <p className="text-2xl font-black text-gray-900">{requestStatus.currentApprovals} / {requestStatus.approvalsNeeded}</p>
                  </div>
                </div>

                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-1000" 
                    style={{ width: `${(requestStatus.currentApprovals / requestStatus.approvalsNeeded) * 100}%` }}
                  ></div>
                </div>

                {!emergencyActive && isGuardianForPatient && (
                  <div className="grid grid-cols-1 gap-4">
                    {!requestStatus.active && (
                      <Button
                        onClick={requestUnlock}
                        disabled={loading}
                        className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all"
                      >
                        Request Emergency Unlock
                      </Button>
                    )}
                    {requestStatus.active && !requestStatus.executed && (
                      <Button
                        onClick={approveUnlock}
                        disabled={loading}
                        className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all shadow-xl shadow-primary-100"
                      >
                        Approve Unlock
                      </Button>
                    )}
                  </div>
                )}
                
                {requestStatus.active && (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <History size={16} className="text-primary-400" />
                    Window Closes: {new Date(requestStatus.unlockTime * 1000).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GuardianManagement;
