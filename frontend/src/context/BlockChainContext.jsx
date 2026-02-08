// src/context/MedLinkContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import HealthIDAbi from "../abis/HealthIdAbi.json";
import MedVaultAbi from "../abis/MedVaultAbi.json";
import GuardianAbi from "../abis/GuardianAbi.json";

// Updated contract addresses
const CONTRACT_ADDRESSES = {
  healthID: import.meta.env.VITE_HEALTH_ID_CONTRACT_ADDRESS || "0x840Af108761519EE0fA15C56621B877837512452",
  medVault: import.meta.env.VITE_MED_VAULT_CONTRACT_ADDRESS || "0x652c5Ae2b16B0717F5B0D2f95C9eA2ad2D96b973",
  guardian: import.meta.env.VITE_GUARDIAN_CONTRACT_ADDRESS || "0x317809481694FA03014b511657bFFFFf7157dBf3"
};

const MedLinkContext = createContext();

export const MedLinkProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [healthID, setHealthID] = useState(null);
  const [medVault, setMedVault] = useState(null);
  const [guardian, setGuardian] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userHealthID, setUserHealthID] = useState(null);
  const [medicalReports, setMedicalReports] = useState([]);

  const connectWallet = async () => {
    if (!window.ethereum) return;
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setProvider(_provider);
      const accounts = await _provider.send("eth_accounts", []);
      setAccount(accounts[0]);
      const signer = await _provider.getSigner();
      
      setHealthID(new ethers.Contract(CONTRACT_ADDRESSES.healthID, HealthIDAbi.abi || HealthIDAbi, signer));
      setMedVault(new ethers.Contract(CONTRACT_ADDRESSES.medVault, MedVaultAbi.abi || MedVaultAbi, signer));
      setGuardian(new ethers.Contract(CONTRACT_ADDRESSES.guardian, GuardianAbi.abi || GuardianAbi, signer));

      await checkHealthID(new ethers.Contract(CONTRACT_ADDRESSES.healthID, HealthIDAbi.abi || HealthIDAbi, signer), accounts[0]);
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const checkHealthID = async (contract, address) => {
    try {
      const balance = await contract.balanceOf(address);
      if (BigInt(balance) > BigInt(0)) {
        const tokenId = await contract.addressToTokenId(address);
        setUserHealthID(tokenId.toString());
      } else {
        setUserHealthID(null);
      }
    } catch (error) {
      setUserHealthID(null);
    }
  };

  const uploadReport = async (ipfsHash) => {
    if (!medVault) return;
    try {
      setLoading(true);
      const tx = await medVault.uploadReport(ipfsHash);
      await tx.wait();
      setLoading(false);
      await fetchMedicalReports();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const fetchMedicalReports = async (targetAddress = null) => {
    if (!medVault || !account) return [];
    try {
      const addressToQuery = targetAddress || account;
      const reports = await medVault.getReports(addressToQuery);
      if (!targetAddress || targetAddress.toLowerCase() === account.toLowerCase()) {
        setMedicalReports(reports);
      }
      return reports;
    } catch (error) {
      if (!targetAddress || targetAddress.toLowerCase() === account.toLowerCase()) {
        setMedicalReports([]);
      }
      return [];
    }
  };

  const requestDoctorAccess = async (patientAddress) => {
    if (!medVault) return;
    try {
      setLoading(true);
      const tx = await medVault.requestAccess(patientAddress);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const manageDoctorAccess = async (doctorAddress, grant) => {
    if (!medVault) return;
    try {
      setLoading(true);
      const tx = await medVault.approveAccess(doctorAddress, grant);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const grantRecordAccess = async (doctorAddress, ipfsHash) => {
    if (!medVault) return;
    try {
      setLoading(true);
      const tx = await medVault.grantRecordAccess(doctorAddress, ipfsHash);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const revokeRecordAccess = async (doctorAddress, ipfsHash) => {
    if (!medVault) return;
    try {
      setLoading(true);
      const tx = await medVault.revokeRecordAccess(doctorAddress, ipfsHash);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const checkRecordPermission = async (patientAddress, doctorAddress, ipfsHash) => {
    if (!medVault) return false;
    try {
      return await medVault.recordPermissions(patientAddress, doctorAddress, ipfsHash);
    } catch (error) {
      return false;
    }
  };

  const setEmergencyDuration = async (durationSeconds) => {
    if (!guardian) return;
    try {
      setLoading(true);
      const tx = await guardian.setEmergencyDuration(durationSeconds);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const revokeEmergencyAccess = async () => {
    if (!medVault) return;
    try {
      setLoading(true);
      const tx = await medVault.revokeEmergencyAccess();
      await tx.wait();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    if (provider && account && medVault) {
      fetchMedicalReports();
    }
  }, [provider, account, medVault]);

  return (
    <MedLinkContext.Provider
      value={{
        account,
        provider,
        healthID,
        medVault,
        guardian,
        loading,
        userHealthID,
        medicalReports,
        connectWallet,
        uploadReport,
        fetchMedicalReports,
        requestDoctorAccess,
        manageDoctorAccess,
        grantRecordAccess,
        revokeRecordAccess,
        checkRecordPermission,
        setEmergencyDuration,
        revokeEmergencyAccess
      }}
    >
      {children}
    </MedLinkContext.Provider>
  );
};

export const useMedLink = () => useContext(MedLinkContext);
