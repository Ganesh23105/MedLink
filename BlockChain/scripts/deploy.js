const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts...");
  console.log(`📋 Using deployer: ${deployer.address}`);

  // =========================
  // Step 0: Deploy HealthID
  // =========================
  console.log("\n📦 Step 0: Deploying HealthID...");
  const HealthID = await hre.ethers.getContractFactory("HealthID");
  const healthID = await HealthID.deploy(deployer.address); // deployer is the initial owner
  await healthID.waitForDeployment();
  const healthIDAddress = await healthID.getAddress();
  console.log(`✅ HealthID deployed at: ${healthIDAddress}`);

  // =========================
  // Step 1: Deploy Guardian
  // =========================
  console.log("\n📦 Step 1: Deploying Guardian contract...");
  const Guardian = await hre.ethers.getContractFactory("Guardian");
  const guardian = await Guardian.deploy();
  await guardian.waitForDeployment();
  const guardianAddress = await guardian.getAddress();
  console.log(`✅ Guardian deployed at: ${guardianAddress}`);

  // =========================
  // Step 2: Deploy MedVault with HealthID and Guardian
  // =========================
  console.log("\n📦 Step 2: Deploying MedVault with Guardian integration...");
  const MedVault = await hre.ethers.getContractFactory("MedVault");
  const medVault = await MedVault.deploy(healthIDAddress, guardianAddress);
  await medVault.waitForDeployment();
  const medVaultAddress = await medVault.getAddress();
  console.log(`✅ MedVault deployed at: ${medVaultAddress}`);

  // =========================
  // Step 3: Connect Guardian to MedVault
  // =========================
  console.log("\n🔗 Step 3: Connecting Guardian to MedVault...");
  const setMedVaultTx = await guardian.setMedVaultContract(medVaultAddress);
  await setMedVaultTx.wait();
  console.log("✅ Guardian connected to MedVault");

  // =========================
  // Step 4: Verify integration
  // =========================
  console.log("\n🔍 Step 4: Verifying integration...");
  const guardianContractInMedVault = await medVault.guardianContract();
  const medVaultContractInGuardian = await guardian.medVaultContract();

  if (guardianContractInMedVault === guardianAddress && medVaultContractInGuardian === medVaultAddress) {
    console.log("✅ Integration verified - contracts properly linked");
  } else {
    console.log("❌ Integration verification failed");
    console.log(`Expected Guardian in MedVault: ${guardianAddress}, Got: ${guardianContractInMedVault}`);
    console.log(`Expected MedVault in Guardian: ${medVaultAddress}, Got: ${medVaultContractInGuardian}`);
  }

  // =========================
  // Deployment Summary
  // =========================
  console.log("\n🎉 === DEPLOYMENT COMPLETE ===");
  console.log(`HealthID  : ${healthIDAddress} (NEW)`);
  console.log(`Guardian  : ${guardianAddress} (NEW)`);
  console.log(`MedVault  : ${medVaultAddress} (NEW - with Guardian)`);
  console.log("==============================");

  console.log("\n📋 Next Steps:");
  console.log("1. Update your frontend with new contract addresses (HealthID, Guardian, MedVault)");
  console.log("2. Patients can now assign guardians using Guardian.assignGuardians()");
  console.log("3. In emergencies, guardians can request unlock via Guardian.requestUnlock()");
  console.log("4. Emergency access works automatically once majority guardians approve");

  console.log("\n🔧 Contract Functions Available:");
  console.log("Guardian Contract:");
  console.log("  - assignGuardians(address[] guardians)");
  console.log("  - requestUnlock(address patient)");
  console.log("  - approveUnlock(address patient)");
  console.log("  - getGuardians(address patient)");
  console.log("  - getRequestStatus(address patient)");

  console.log("\nMedVault Contract (All original + new):");
  console.log("  - All original functions work unchanged");
  console.log("  - grantEmergencyAccess() - called by Guardian");
  console.log("  - revokeEmergencyAccess() - patient revokes when recovered");
  console.log("  - hasEmergencyAccess() - check emergency permissions");
}

main()
  .then(() => {
    console.log("\n🎯 Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
