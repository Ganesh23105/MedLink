import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { useMedLink } from '../context/BlockChainContext';
import { ethers } from 'ethers';
import MedVaultAbi from '../abis/MedVaultAbi.json';

const EmergencyBanner = () => {
  const { account, provider, revokeEmergencyAccess } = useMedLink();
  const [emergencyStatus, setEmergencyStatus] = useState({ active: false, expiry: null });

  useEffect(() => {
    const checkEmergency = async () => {
      if (!account || !provider) return;
      try {
        const medVaultAddress = import.meta.env.VITE_MED_VAULT_CONTRACT_ADDRESS;
        const medVault = new ethers.Contract(
          medVaultAddress,
          MedVaultAbi.abi || MedVaultAbi,
          provider
        );
        
        const expiry = await medVault.emergencyAccessExpiry(account);
        const now = Math.floor(Date.now() / 1000);
        const expiryNum = Number(expiry);
        
        if (expiryNum > now) {
          setEmergencyStatus({
            active: true,
            expiry: expiryNum
          });
        } else {
          setEmergencyStatus({ active: false, expiry: null });
        }
      } catch (e) {
        console.error("Banner check error:", e);
      }
    };

    checkEmergency();
    const interval = setInterval(checkEmergency, 5000); // Check every 5s for better responsiveness
    return () => clearInterval(interval);
  }, [account, provider]);

  if (!emergencyStatus.active) return null;

  const timeLeft = Math.max(0, emergencyStatus.expiry - Math.floor(Date.now() / 1000));
  const hoursLeft = Math.floor(timeLeft / 3600);
  const minsLeft = Math.floor((timeLeft % 3600) / 60);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200 w-[90%] max-w-4xl animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-danger-600 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-danger-200 flex items-center justify-between border-4 border-white/20 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h4 className="text-xl font-black uppercase tracking-tighter">Emergency Access Active</h4>
            <div className="flex items-center gap-3 text-xs font-bold text-white/80 uppercase tracking-widest mt-1">
              <Clock size={14} />
              Expires in {hoursLeft}h {minsLeft}m • {new Date(emergencyStatus.expiry * 1000).toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={revokeEmergencyAccess}
            className="px-8 py-3 bg-white text-danger-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-danger-50 transition-all shadow-lg active:scale-95"
          >
            Revoke Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyBanner;
