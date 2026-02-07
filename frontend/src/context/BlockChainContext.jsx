// src/context/MedLinkContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import HealthIDAbi from "../abis/HealthIdAbi.json";
import MedVaultAbi from "../abis/MedVaultAbi.json";
import GuardianAbi from "../abis/GuardianAbi.json";

// Updated contract addresses - CHANGE THE MEDVAULT ADDRESS AFTER REDEPLOYMENT
const CONTRACT_ADDRESSES = {
  healthID: import.meta.env.VITE_HEALTH_ID_CONTRACT_ADDRESS || "0x840Af108761519EE0fA15C56621B877837512452",
  medVault: import.meta.env.VITE_MED_VAULT_CONTRACT_ADDRESS || "0x652c5Ae2b16B0717F5B0D2f95C9eA2ad2D96b973",
  guardian: import.meta.env.VITE_GUARDIAN_CONTRACT_ADDRESS || "0x317809481694FA03014b511657bFFFFf7157dBf3"
};

// Create the context
const MedLinkContext = createContext();

// Provider component
export const MedLinkProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [healthID, setHealthID] = useState(null);
  const [medVault, setMedVault] = useState(null);
  const [guardian, setGuardian] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userHealthID, setUserHealthID] = useState(null);
  const [medicalReports, setMedicalReports] = useState([]);
  const [doctorAccess, setDoctorAccess] = useState({});

  // Connect wallet and initialize contracts
  const connectWallet = async () => {
    if (!window.ethereum) {
      console.error("MetaMask not found");
      return;
    }
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setProvider(_provider);

      const accounts = await _provider.send("eth_accounts", []);
      setAccount(accounts[0]);

      const signer = await _provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("BlockChainContext - signer address:", signerAddress);
      try {
        const network = await _provider.getNetwork();
        console.log("BlockChainContext - provider network:", network);
      } catch (e) {
        console.log("BlockChainContext - could not get network info", e.message);
      }
      
      // Initialize all contracts
      const _healthID = new ethers.Contract(
        CONTRACT_ADDRESSES.healthID, 
        HealthIDAbi, 
        signer
      );
      console.log("BlockChainContext - healthID contract address:", CONTRACT_ADDRESSES.healthID);
      setHealthID(_healthID);

      const _medVault = new ethers.Contract(
        CONTRACT_ADDRESSES.medVault,
        MedVaultAbi,
        signer
      );
      console.log("BlockChainContext - medVault contract address:", CONTRACT_ADDRESSES.medVault);
      setMedVault(_medVault);

      const _guardian = new ethers.Contract(
        CONTRACT_ADDRESSES.guardian,
        GuardianAbi,
        signer
      );
      setGuardian(_guardian);

      // Check if user has HealthID
      await checkHealthID(_healthID, accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Check if user has HealthID
  const checkHealthID = async (contract, address) => {
    try {
      console.log("BlockChainContext - checkHealthID called for address:", address);
      const balance = await contract.balanceOf(address);
      console.log("BlockChainContext - balance:", balance.toString());
      // In ethers v6, balance is a BigInt. Comparison with 0 works, but be explicit.
      if (BigInt(balance) > BigInt(0)) {
        const tokenId = await contract.addressToTokenId(address);
        console.log("BlockChainContext - tokenId found:", tokenId.toString());
        setUserHealthID(tokenId.toString());
      } else {
        console.log("BlockChainContext - No HealthID found for this address (balance is 0)");
        setUserHealthID(null);
      }
    } catch (error) {
      console.error("BlockChainContext - Error checking HealthID:", error.message);
      // If there's an error (like BAD_DATA), assume they don't have a HealthID yet
      console.log("BlockChainContext - Setting userHealthID to null due to contract error");
      setUserHealthID(null);
    }
  };

  // Mint HealthID (onlyOwner)
  const mintHealthID = async (userAddress) => {
    if (!healthID) return;
    try {
      setLoading(true);
      const tx = await healthID.mintHealthID(userAddress);
      await tx.wait();
      await checkHealthID(healthID, userAddress);
      setLoading(false);
    } catch (error) {
      console.error("Error minting HealthID:", error);
      setLoading(false);
    }
  };

  // 🔧 UPDATED: Upload medical report with string IPFS hash
  const uploadReport = async (ipfsHash) => {
    if (!medVault) return;
    try {
      setLoading(true);
      // Now accepts string directly (no bytes32 conversion)
      const tx = await medVault.uploadReport(ipfsHash);
      await tx.wait();
      setLoading(false);
      await fetchMedicalReports();
      return tx.hash;
    } catch (error) {
      console.error("Error uploading report:", error);
      setLoading(false);
      throw error;
    }
  };

  // 🔧 UPDATED: Fetch user's medical reports using new getReports function
  const fetchMedicalReports = async (targetAddress = null) => {
    if (!medVault || !account) return;
    try {
      const addressToQuery = targetAddress || account;
      console.log("BlockChainContext - fetching reports for:", addressToQuery);
      
      // Use the new getReports function that returns string[] 
      const reports = await medVault.getReports(addressToQuery);
      
      // Only update the global medicalReports state if we're fetching for the current user
      // This prevents doctor's view of patient reports from overwriting their own reports state
      if (!targetAddress || targetAddress.toLowerCase() === account.toLowerCase()) {
        setMedicalReports(reports);
      }
      
      return reports;
    } catch (error) {
      console.error("Error fetching reports:", error);
      // Only clear if it's the current user's reports
      if (!targetAddress || targetAddress.toLowerCase() === account.toLowerCase()) {
        setMedicalReports([]);
      }
      return [];
    }
  };

  // 🔧 NEW: Get report count
  const getReportCount = async (targetAddress = null) => {
    if (!medVault || !account) return 0;
    try {
      const addressToQuery = targetAddress || account;
      const count = await medVault.getReportCount(addressToQuery);
      // In ethers v6, BigInt doesn't have .toNumber(), use Number() or toString()
      return typeof count === 'bigint' ? Number(count) : count;
    } catch (error) {
      console.error("Error getting report count:", error);
      return 0;
    }
  };

  // 🔧 NEW: Get specific report by index
  const getReportByIndex = async (targetAddress, index) => {
    if (!medVault || !account) return null;
    try {
      const report = await medVault.getReportByIndex(targetAddress, index);
      return report;
    } catch (error) {
      console.error("Error getting report by index:", error);
      return null;
    }
  };

  // Request doctor access
  const requestDoctorAccess = async (patientAddress) => {
    if (!medVault || !provider) return;
    try {
      setLoading(true);
      
      // Check if we already have a pending request to avoid duplicates
      // Use a limited block range for the query
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10000 blocks
      
      const tx = await medVault.requestAccess(patientAddress);
      await tx.wait();
      setLoading(false);
      return tx.hash;
    } catch (error) {
      console.error("Error requesting access:", error);
      setLoading(false);
      throw error;
    }
  };

  // Approve/deny doctor access
  const manageDoctorAccess = async (doctorAddress, grant) => {
    if (!medVault) return;
    try {
      setLoading(true);
      const tx = await medVault.approveAccess(doctorAddress, grant);
      await tx.wait();
      setLoading(false);
      await fetchDoctorAccess();
      return tx.hash;
    } catch (error) {
      console.error("Error managing doctor access:", error);
      setLoading(false);
      throw error;
    }
  };

  // 🔧 UPDATED: Check doctor permissions using public mapping
  const checkDoctorPermission = async (patientAddress, doctorAddress) => {
    if (!medVault) return false;
    try {
      // Use the public doctorPermissions mapping
      const hasPermission = await medVault.doctorPermissions(patientAddress, doctorAddress);
      return hasPermission;
    } catch (error) {
      console.error("Error checking doctor permission:", error);
      return false;
    }
  };

  // 🔧 NEW: Fetch all doctor permissions for current user
  const fetchDoctorAccess = async () => {
    if (!medVault || !account || !provider) return;
    try {
      // Instead of querying from block 0, get the current block number and go back a reasonable number of blocks
      const currentBlock = await provider.getBlockNumber();
      // Use a reasonable block range (e.g., 10000 blocks or about 1-2 days of blocks)
      const fromBlock = Math.max(0, currentBlock - 10000);
      
      // For now, we'll store doctor addresses that we want to check
      // In a real app, you'd get this from events or a separate tracking system
      const permissions = {};
      setDoctorAccess(permissions);
      return permissions;
    } catch (error) {
      console.error("Error fetching doctor access:", error);
      setDoctorAccess({});
      return {};
    }
  };

  // Guardian functions (unchanged)
  const requestUnlock = async (patientAddress, guardians) => {
    if (!guardian) return;
    try {
      setLoading(true);
      const tx = await guardian.requestUnlock(patientAddress, guardians);
      await tx.wait();
      setLoading(false);
      return tx.hash;
    } catch (error) {
      console.error("Error requesting unlock:", error);
      setLoading(false);
      throw error;
    }
  };

  const approveUnlock = async (patientAddress) => {
    if (!guardian) return;
    try {
      setLoading(true);
      const tx = await guardian.approveUnlock(patientAddress);
      await tx.wait();
      setLoading(false);
      return tx.hash;
    } catch (error) {
      console.error("Error approving unlock:", error);
      setLoading(false);
      throw error;
    }
  };

  // 🔧 NEW: Listen to contract events
  const listenToEvents = async () => {
    if (!medVault || !provider) return;
    
    try {
      // Get current block number and calculate a reasonable fromBlock
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10000 blocks
      
      // Remove any existing listeners to avoid duplicates
      medVault.removeAllListeners();
      
      // Set up event listeners with queryFilter to limit block range
      // For ReportUploaded events
      medVault.queryFilter(
        medVault.filters.ReportUploaded(),
        fromBlock
      ).then(events => {
        // Process past events if needed
        // Then set up listener for new events
        medVault.on(medVault.filters.ReportUploaded(), (user, ipfsHash, event) => {
          // In ethers v6, the arguments are passed directly, but if they are undefined, 
          // we can try to get them from the event object itself
          const actualUser = user || (event && event.args ? event.args[0] : null);
          const actualIpfsHash = ipfsHash || (event && event.args ? event.args[1] : null);
          
          console.log("Report uploaded event received:", { 
            user: actualUser, 
            ipfsHash: actualIpfsHash 
          });
          
          if (actualUser && account && actualUser.toLowerCase() === account.toLowerCase()) {
            console.log("Current user uploaded a report, refreshing list...");
            fetchMedicalReports();
          }
        });
      }).catch(error => {
        console.error("Error querying ReportUploaded events:", error);
      });

      // For AccessRequested events
      medVault.queryFilter(
        medVault.filters.AccessRequested(),
        fromBlock
      ).then(events => {
        // Process past events if needed
        // Then set up listener for new events
        medVault.on(medVault.filters.AccessRequested(), (doctor, patient, event) => {
          console.log("Access requested:", { doctor, patient });
          if (patient.toLowerCase() === account?.toLowerCase()) {
            // Notify user of access request
            console.log(`Doctor ${doctor} requested access to your records`);
          }
        });
      }).catch(error => {
        console.error("Error querying AccessRequested events:", error);
      });

      // For AccessApproved events
      medVault.queryFilter(
        medVault.filters.AccessApproved(),
        fromBlock
      ).then(events => {
        // Process past events if needed
        // Then set up listener for new events
        medVault.on(medVault.filters.AccessApproved(), (doctor, patient, granted, event) => {
          console.log("Access approved:", { doctor, patient, granted });
          fetchDoctorAccess();
        });
      }).catch(error => {
        console.error("Error querying AccessApproved events:", error);
      });
    } catch (error) {
      console.error("Error setting up event listeners:", error);
    }
  };

  // Initialize when provider changes
  useEffect(() => {
    if (provider && account && medVault) {
      fetchMedicalReports();
      fetchDoctorAccess();
      // Call the async function properly
      listenToEvents().catch(error => {
        console.error("Error in listenToEvents:", error);
      });
    }
    
    // Cleanup function to remove listeners when component unmounts
    return () => {
      if (medVault) {
        medVault.removeAllListeners();
      }
    };
  }, [provider, account, medVault]);

  // Add a new function to fetch patients with HealthID
  // This function will be used in the HealthIDPatientsTab component
  const fetchPatientsWithHealthID = async (patientAddresses) => {
    if (!healthID || !medVault) return [];
    
    try {
      const patientsWithHealthID = [];
      
      for (const address of patientAddresses) {
        try {
          // Check if address has a HealthID
          const balance = await healthID.balanceOf(address);
          
          if (BigInt(balance) > BigInt(0)) {
            // Get the tokenId
            const tokenId = await healthID.addressToTokenId(address);
            
            // Check if the current user (doctor) has permission
            const hasPermission = await medVault.doctorPermissions(address, account);
            
            patientsWithHealthID.push({
              address,
              tokenId: tokenId.toString(),
              hasPermission
            });
          }
        } catch (error) {
          console.error(`Error checking HealthID for address ${address}:`, error);
        }
      }
      
      return patientsWithHealthID;
    } catch (error) {
      console.error('Error fetching patients with HealthID:', error);
      return [];
    }
  };

  // Add this function to the context provider value
  return (
    <MedLinkContext.Provider
      value={{
        // State
        account,
        provider,
        healthID,
        medVault,
        guardian,
        loading,
        userHealthID,
        medicalReports,
        doctorAccess,
        
        // Basic functions
        connectWallet,
        mintHealthID,
        
        // Report functions
        uploadReport,
        fetchMedicalReports,
        getReportCount,
        getReportByIndex,
        
        // Access control functions
        requestDoctorAccess,
        manageDoctorAccess,
        checkDoctorPermission,
        fetchDoctorAccess,
        fetchPatientsWithHealthID,
        
        // Guardian functions
        requestUnlock,
        approveUnlock
      }}
    >
      {children}
    </MedLinkContext.Provider>
  );
};

// Custom hook
export const useMedLink = () => useContext(MedLinkContext);