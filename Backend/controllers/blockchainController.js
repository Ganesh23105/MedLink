import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the ABI file
const healthIdAbiPath = path.join(__dirname, '..', 'abis', 'HealthIdAbi.json');
const rawAbi = JSON.parse(fs.readFileSync(healthIdAbiPath, 'utf8'));
const HealthIDAbi = Array.isArray(rawAbi) ? rawAbi : rawAbi.abi; // ensure it's ABI array

// Contract address from deployment
const HEALTH_ID_CONTRACT_ADDRESS = "0xE5CD1EC56eBdb94AcFe3142Ac7902424B05b5EE5";

// Create a provider and wallet using the owner's private key
const setupProvider = () => {
  const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545");
  const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  return { provider, ownerWallet };
};

// Mint a HealthID for a user
export const mintHealthID = async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    const { ownerWallet } = setupProvider();

    // Create contract instance with the owner wallet
    const healthIDContract = new ethers.Contract(
      HEALTH_ID_CONTRACT_ADDRESS,
      HealthIDAbi,
      ownerWallet
    );

    // Check if user already has a HealthID
    const balance = await healthIDContract.balanceOf(walletAddress);

    if (balance > 0) {
      const tokenId = await healthIDContract.addressToTokenId(walletAddress);
      return res.status(200).json({
        message: 'User already has a HealthID',
        tokenId: tokenId.toString(),
        alreadyMinted: true
      });
    }

    // Mint a new HealthID
    const tx = await healthIDContract.mintHealthID(walletAddress);
    const receipt = await tx.wait();

    const tokenId = await healthIDContract.addressToTokenId(walletAddress);

    res.status(201).json({
      message: 'HealthID minted successfully',
      tokenId: tokenId.toString(),
      transactionHash: receipt.hash,
      alreadyMinted: false
    });
  } catch (error) {
    console.error('Mint failed:', error);
    res.status(500).json({
      error: 'Failed to mint HealthID',
      details: error.message
    });
  }
};

// Check if a user has a HealthID
export const checkHealthID = async (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    const { provider } = setupProvider();

    const healthIDContract = new ethers.Contract(
      HEALTH_ID_CONTRACT_ADDRESS,
      HealthIDAbi,
      provider
    );

    const balance = await healthIDContract.balanceOf(walletAddress);

    if (balance > 0) {
      const tokenId = await healthIDContract.addressToTokenId(walletAddress);
      return res.status(200).json({
        hasHealthID: true,
        tokenId: tokenId.toString()
      });
    }

    res.status(200).json({ hasHealthID: false });
  } catch (error) {
    console.error('Check HealthID failed:', error);
    res.status(500).json({
      error: 'Failed to check HealthID',
      details: error.message
    });
  }
};
