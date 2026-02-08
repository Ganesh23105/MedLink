import { Plus, X, Loader2, ShieldCheck, AlertTriangle, Users } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useMedLink } from "../context/BlockChainContext";
import { ethers } from "ethers";
import guardianAbi from "../abis/GuardianAbi.json";
import medVaultAbi from "../abis/MedVaultAbi.json";
import { Button } from "./button";

const GuardianManagement = () => {
  const { account, provider } = useMedLink();

  const [guardians, setGuardians] = useState([]);
  const [newGuardian, setNewGuardian] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [patientAddress, setPatientAddress] = useState("");
  const [isGuardianForPatient, setIsGuardianForPatient] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [isPatientEmergencyActive, setIsPatientEmergencyActive] = useState(false);

  const [guardianContract, setGuardianContract] = useState(null);
  const [medVaultContract, setMedVaultContract] = useState(null);
  const [contractInitialized, setContractInitialized] = useState(false);

  // Helper function to safely parse contract results
  const parseContractResult = (result, expectedType = "array") => {
    try {
      if (!result) return expectedType === "array" ? [] : null;

      // Handle ethers Result objects
      if (result._isIndexed !== undefined || result.toArray) {
        return result.toArray ? result.toArray() : Array.from(result);
      }

      // Handle regular arrays
      if (Array.isArray(result)) {
        return result;
      }

      // Handle single values
      if (expectedType === "boolean") {
        return Boolean(result);
      }

      // Try to convert to array if expected
      if (expectedType === "array") {
        try {
          return Array.from(result);
        } catch (e) {
          console.warn("Could not convert result to array:", result);
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

        if (!guardianAddress || !medVaultAddress) {
          setError("Contract addresses not configured");
          return;
        }

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

        // Verify connection and load initial data
        try {
          const currentGuardians = await guardian.getGuardians(account);
          setGuardians(parseContractResult(currentGuardians));
          
          // Check if emergency access is active for the current user
          const isActive = await medVault.emergencyAccessActive(account);
          setIsPatientEmergencyActive(isActive);
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
    if (guardians.includes(newGuardian)) {
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

  const assignGuardians = async () => {
    if (!guardianContract || guardians.length < 2) {
      setError("Minimum 2 guardians required");
      return;
    }

    try {
      setLoading(true);
      const tx = await guardianContract.assignGuardians(guardians, {
        gasLimit: 500000,
      });
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

      const emergency = await medVaultContract.emergencyAccessActive(patientAddress);
      setEmergencyActive(emergency);
      
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
      const tx = await medVaultContract.revokeEmergencyAccess();
      await tx.wait();
      alert("Emergency access revoked! Your records are now private again.");
      setIsPatientEmergencyActive(false);
      // If we were checking our own status, refresh it
      if (patientAddress.toLowerCase() === account.toLowerCase()) {
        await checkGuardianStatus();
      }
    } catch (err) {
      console.error("Revocation error:", err);
      const errorMessage = err.code === 'CALL_EXCEPTION' 
        ? "Revocation failed. This usually happens if you're not the patient or if emergency access isn't active for your account."
        : (err.reason || err.message);
      alert("Revocation failed: " + errorMessage);
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
        <div className="flex items-center gap-3 px-6 py-3 bg-primary-50 text-primary-700 rounded-[2rem] text-xs font-black border border-primary-100 shadow-sm shadow-primary-50">
          <ShieldCheck size={20} className="text-primary-500" />
          Emergency Protocol Active
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* GUARDIANS */}
        <section className="bg-white p-12 rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your Trusted Circle</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Designated Emergency Access</p>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors">
                  <Plus size={24} />
                </div>
                <input
                  type="text"
                  value={newGuardian}
                  onChange={(e) => setNewGuardian(e.target.value)}
                  placeholder="Guardian wallet address (0x...)"
                  disabled={loading}
                  className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-primary-500/20 focus:bg-white focus:border-primary-500 transition-all outline-none placeholder:text-gray-300 tracking-tight"
                />
              </div>
              <button
                onClick={addGuardian}
                disabled={loading}
                className="px-10 py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 active:scale-95 disabled:opacity-50"
              >
                Add Member
              </button>
            </div>
            {error && (
              <p className="text-xs text-danger-600 font-black bg-danger-50 p-5 rounded-[2rem] border border-danger-100 flex items-center gap-4 animate-in shake duration-300">
                <AlertTriangle size={20} className="shrink-0" /> {error}
              </p>
            )}
          </div>

          <div className="space-y-6 relative z-10">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Authorized Guardians ({guardians.length}/10)</h4>
            {guardians.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {guardians.map((guardian, index) => (
                  <div key={index} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:bg-white hover:shadow-2xl hover:border-primary-100 transition-all duration-500">
                    <div className="flex items-center gap-5 overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:rotate-6 transition-transform">
                        👤
                      </div>
                      <span className="text-sm font-black text-gray-700 truncate tracking-tighter">{guardian}</span>
                    </div>
                    <button
                      onClick={() => setGuardians(guardians.filter((g) => g !== guardian))}
                      disabled={loading}
                      className="p-4 text-gray-300 hover:text-danger-500 hover:bg-danger-50 rounded-2xl transition-all active:scale-90"
                    >
                      <X size={24} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Users size={32} className="text-gray-200" />
                </div>
                <p className="text-lg font-black text-gray-400">Circle is empty</p>
                <p className="text-gray-300 font-medium mt-2">Add trusted contacts to ensure safety.</p>
              </div>
            )}
          </div>

          <div className="space-y-5 relative z-10 pt-4">
            <Button
              onClick={assignGuardians}
              disabled={loading || guardians.length < 2}
              className="w-full py-6 rounded-[2rem] text-lg font-black shadow-2xl shadow-primary-100 active:scale-95 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin mr-3" /> Syncing Circle...
                </>
              ) : (
                "Finalize & Assign Guardians"
              )}
            </Button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
              <ShieldCheck size={14} className="text-success-500" />
              Decentralized consensus requires 2+ members
            </div>
          </div>
        </section>

        {/* EMERGENCY ACCESS */}
        <div className="space-y-12">
          <section className="bg-gray-900 text-white p-12 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-inner border border-white/10 group-hover:rotate-6 transition-transform">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-3xl text-white tracking-tighter">Emergency Unlock</h3>
                <p className="text-sm text-gray-400 font-black uppercase tracking-widest mt-1">Guardian Rescue Portal</p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-4">Patient Vault Identity</label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="Enter patient's blockchain address"
                  disabled={loading}
                  className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-primary-500/20 focus:bg-white/10 transition-all outline-none placeholder:text-gray-600 tracking-tight"
                />
              </div>
              <button
                onClick={checkGuardianStatus}
                disabled={loading || !patientAddress}
                className="w-full py-6 bg-white text-gray-900 rounded-[2rem] font-black text-xl hover:bg-primary-50 transition-all shadow-2xl shadow-black/40 active:scale-95 disabled:opacity-50"
              >
                Verify Guardian Authority
              </button>

              {isGuardianForPatient && (
                <div className="space-y-6 pt-4">
                  {requestStatus && (
                    <>
                      <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                        <span>Approvals</span>
                        <span>{requestStatus.currentApprovals} / {requestStatus.approvalsNeeded}</span>
                      </div>
                      <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full transition-all duration-1000" 
                          style={{ width: `${(requestStatus.currentApprovals / requestStatus.approvalsNeeded) * 100}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  
                  {(!requestStatus || (!requestStatus.active && !requestStatus.executed)) ? (
                    <button
                      onClick={requestUnlock}
                      disabled={loading}
                      className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black text-xl hover:bg-primary-700 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                    >
                      Initiate Emergency Unlock
                    </button>
                  ) : requestStatus.active && !requestStatus.executed ? (
                    <button
                      onClick={approveUnlock}
                      disabled={loading}
                      className="w-full py-6 bg-success-600 text-white rounded-[2rem] font-black text-xl hover:bg-success-700 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                    >
                      Approve Unlock Request
                    </button>
                  ) : requestStatus.executed ? (
                    <div className="p-6 bg-success-500/10 border border-success-500/20 rounded-[2rem] flex items-center gap-4">
                      <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="text-xs text-success-400 font-black uppercase tracking-widest leading-relaxed">Emergency access has been granted!</p>
                    </div>
                  ) : null}
                </div>
              )}
              {patientAddress && !isGuardianForPatient && patientAddress.toLowerCase() !== account.toLowerCase() && (
                <div className="p-6 bg-danger-500/10 border border-danger-500/20 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="w-10 h-10 bg-danger-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <X size={20} />
                  </div>
                  <p className="text-xs text-danger-400 font-black uppercase tracking-widest leading-relaxed">Identity Check Failed: You are not registered for this vault</p>
                </div>
              )}
            </div>
          </section>

          {/* Emergency Revocation Section - Only visible to the patient when emergency is active */}
          {isPatientEmergencyActive && (
            <section className="bg-danger-50 p-12 rounded-[3rem] border-4 border-danger-100 space-y-8 animate-in zoom-in-95 duration-700 shadow-2xl shadow-danger-200/40 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-danger-500/5 rounded-full"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-danger-500 text-white rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-danger-400">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-danger-900 tracking-tighter">Emergency Active</h4>
                  <p className="text-sm font-black text-danger-600 uppercase tracking-widest mt-1">Access Protocol Active</p>
                </div>
              </div>
              <p className="text-danger-900/70 font-bold text-lg leading-relaxed relative z-10">Critical data is currently accessible to authorized guardians. Revoke access immediately once the situation is stabilized.</p>
              <button
                onClick={revokeEmergency}
                disabled={loading}
                className="w-full py-6 bg-danger-600 text-white rounded-[2rem] font-black text-xl hover:bg-danger-700 transition-all shadow-2xl shadow-danger-300 active:scale-95 relative z-10"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin mx-auto" />
                ) : (
                  "Terminate Emergency Access"
                )}
              </button>
            </section>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-black text-gray-900">Syncing with Blockchain...</p>
          <p className="text-sm text-gray-500 font-medium">Please confirm the transaction in your wallet</p>
        </div>
      )}
    </div>
  );
};

export default GuardianManagement;
