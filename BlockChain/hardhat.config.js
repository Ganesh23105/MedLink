require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    // Add Ganache network
    ganache: {
      url: "http://127.0.0.1:7545", // or 8545 if using Ganache CLI
      accounts: [process.env.PRIVATE_KEY], // We'll get this from Ganache
      chainId: 1337, // Ganache default chainId
    },
    // Keep localhost option for hardhat node
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    // Optional: Keep Holesky for later production testing
    // holesky: {
    //   url: process.env.HOLESKY_RPC_URL,
    //   accounts: [process.env.PRIVATE_KEY],
    //   chainId: 17000,
    // }
  },
};