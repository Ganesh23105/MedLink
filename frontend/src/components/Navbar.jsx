import React, { useContext, useState, useEffect } from "react";
import { Button } from "./button.jsx";
import { connectWallet, disconnectWallet } from "../utils/wallet";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { useMediChain } from "../context/BlockChainContext.jsx";
import axios from "axios";
import { Stethoscope, Wallet, LogOut, User, ShieldCheck, Activity } from 'lucide-react';

const Navbar = () => {
  const [wallet, setWallet] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const navigate = useNavigate();

  const [mintStatus, setMintStatus] = useState({
    loading: false,
    error: null,
    success: false,
    tokenId: null
  });
  
  const { user, logout } = useContext(AuthContext);
  const { userHealthID, connectWallet: connectBlockchainWallet } = useMediChain();

  const handleWalletConnect = async () => {
    const address = await connectWallet();
    setWallet(address);
    
    if (address) {
      await connectBlockchainWallet();
      
      try {
        const response = await axios.get(`http://localhost:5000/api/blockchain/check-health-id/${address}`);
        if (response.data.hasHealthID) {
          setMintStatus({
            loading: false,
            error: null,
            success: true,
            tokenId: response.data.tokenId
          });
        }
      } catch (error) {
        console.error("Error checking HealthID:", error);
      }
    }
  };

  const handleWalletDisconnect = () => {
    disconnectWallet();
    setWallet(null);
    setMintStatus({
      loading: false,
      error: null,
      success: false,
      tokenId: null
    });
  };

  const handleMintHealthID = async () => {
    if (!wallet) return;
    
    setMintStatus({
      loading: true,
      error: null,
      success: false,
      tokenId: null
    });
    
    try {
      const token = localStorage.getItem('token') || (user && user.token);
      const response = await axios.post('http://localhost:5000/api/blockchain/mint-health-id', {
        walletAddress: wallet
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      setMintStatus({
        loading: false,
        error: null,
        success: true,
        tokenId: response.data.tokenId
      });
    } catch (error) {
      console.error("Error minting HealthID:", error);
      setMintStatus({
        loading: false,
        error: error.response?.data?.error || "Failed to mint HealthID",
        success: false,
        tokenId: null
      });
    }
  };

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (user && user._id) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/api/doctors/${user._id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (response.data?.name) {
            setDoctorName(response.data.name);
          }
        } catch (error) {
          console.error("Error fetching doctor name:", error);
        }
      }
    };
  
    fetchDoctorInfo();
  }, [user]);

  return (
    <nav className="w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-[100]">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform">
          <Stethoscope size={24} />
        </div>
        <span className="text-2xl font-black text-gray-900 tracking-tight">MedLink <span className="text-primary-600">AI</span></span>
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <User size={16} className="text-primary-500" />
            <span className="text-sm font-bold text-gray-700">
              {user.name}
            </span>
          </div>
        )}

        {wallet && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-sm font-bold border border-primary-100">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <Wallet size={16} />
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </div>
        )}

        {(userHealthID || mintStatus.tokenId) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary-50 text-secondary-700 rounded-xl text-sm font-bold border border-secondary-100">
            <ShieldCheck size={16} />
            ID: #{userHealthID || mintStatus.tokenId}
          </div>
        )}

        <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block"></div>

        <div className="flex items-center gap-3">
          {user ? (
            <Button
              variant="ghost"
              className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-danger-600 hover:bg-danger-50"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="px-5 py-2 text-sm font-bold">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="px-5 py-2 text-sm font-bold rounded-xl shadow-md shadow-primary-100">Sign Up</Button>
              </Link>
            </div>
          )}

          {!wallet ? (
            <Button 
              variant="outline" 
              className="px-5 py-2 text-sm font-bold rounded-xl border-2" 
              onClick={handleWalletConnect}
            >
              <Wallet size={18} className="mr-2" />
              Connect
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              className="px-4 py-2 text-sm font-bold text-gray-500" 
              onClick={handleWalletDisconnect}
            >
              Disconnect
            </Button>
          )}

          {wallet && !userHealthID && !mintStatus.success && (
            <Button 
              variant="primary" 
              className="px-5 py-2 text-sm font-bold rounded-xl animate-pulse"
              onClick={handleMintHealthID}
              disabled={mintStatus.loading}
            >
              {mintStatus.loading ? "Minting..." : "Mint HealthID"}
            </Button>
          )}
        </div>

        {mintStatus.error && (
          <div className="absolute top-full right-8 mt-2 p-3 bg-danger-50 text-danger-600 text-xs font-bold rounded-xl border border-danger-100 shadow-xl animate-in slide-in-from-top-2">
            {mintStatus.error}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
