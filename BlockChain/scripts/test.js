const hre = require("hardhat");

async function mint() {
  const [admin] = await hre.ethers.getSigners();

  const HealthID = await hre.ethers.getContractFactory("HealthID");
  const healthID = HealthID.attach("0xE5CD1EC56eBdb94AcFe3142Ac7902424B05b5EE5"); // your deployed contract

  const tx = await healthID.mintHealthID(admin.address);
  await tx.wait();
  console.log("HealthID minted for:", admin.address);
}

mint();
