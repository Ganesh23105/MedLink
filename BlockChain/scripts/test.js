const hre = require("hardhat");

async function mint() {
  const [admin] = await hre.ethers.getSigners();

  const HealthID = await hre.ethers.getContractFactory("HealthID");
  const healthID = HealthID.attach(
    "0x8c22300f3443779fE0354176d2F1273cD145F452",
  ); // your deployed contract

  const tx = await healthID.mintHealthID(admin.address);
  await tx.wait();
  console.log("HealthID minted for:", admin.address);
}

mint();
