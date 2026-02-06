const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedLink System Test", function () {
  let healthID, medVault, guardian;
  let owner, doctor, patient, guardian1, guardian2;

  before(async function () {
    [owner, doctor, patient, guardian1, guardian2] = await ethers.getSigners();

    // Deploy fresh contracts for testing
    const HealthID = await ethers.getContractFactory("HealthID");
    healthID = await HealthID.deploy(owner.address);
    await healthID.waitForDeployment();
    
    const Guardian = await ethers.getContractFactory("Guardian");
    guardian = await Guardian.deploy();
    await guardian.waitForDeployment();
    const guardianAddress = await guardian.getAddress();

    const MedVault = await ethers.getContractFactory("MedVault");
    medVault = await MedVault.deploy(await healthID.getAddress(), guardianAddress);
    await medVault.waitForDeployment();
    const medVaultAddress = await medVault.getAddress();

    await guardian.setMedVaultContract(medVaultAddress);
    
    console.log("Contracts deployed for testing:");
    console.log(`HealthID: ${await healthID.getAddress()}`);
    console.log(`MedVault: ${await medVault.getAddress()}`);
    console.log(`Guardian: ${await guardian.getAddress()}`);
  });

  describe("HealthID", function () {
    it("Should mint a HealthID for a patient", async function () {
      await healthID.connect(owner).mintHealthID(patient.address);
      expect(await healthID.balanceOf(patient.address)).to.equal(1);
    });

    it("Should prevent transferring HealthID", async function () {
      const tokenId = await healthID.addressToTokenId(patient.address);
      await expect(
        healthID.connect(patient).transferFrom(patient.address, doctor.address, tokenId)
      ).to.be.revertedWith("Soulbound: Non-Transferable");
    });

    it("Should prevent duplicate HealthIDs", async function () {
      await expect(
        healthID.connect(owner).mintHealthID(patient.address)
      ).to.be.revertedWith("Already has HealthID");
    });
  });

  describe("MedVault", function () {
    it("Should allow uploading medical reports", async function () {
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes("test-report"));
      await expect(medVault.connect(patient).uploadReport(ipfsHash))
        .to.emit(medVault, "ReportUploaded")
        .withArgs(patient.address, ipfsHash);
    });

    it("Should prevent non-HealthID holders from uploading reports", async function () {
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes("unauthorized"));
      await expect(
        medVault.connect(guardian1).uploadReport(ipfsHash)
      ).to.be.revertedWith("No HealthID");
    });

    it("Should handle doctor access requests", async function () {
      // Grant doctor role
      await medVault.connect(owner).grantRole(await medVault.DOCTOR_ROLE(), doctor.address);
      
      // Request access
      await expect(medVault.connect(doctor).requestAccess(patient.address))
        .to.emit(medVault, "AccessRequested")
        .withArgs(doctor.address, patient.address);
      
      // Approve access
      await expect(medVault.connect(patient).approveAccess(doctor.address, true))
        .to.emit(medVault, "AccessApproved")
        .withArgs(doctor.address, patient.address, true);
    });
  });

  describe("Guardian", function () {
    it("Should assign guardians", async function () {
      const guardians = [guardian1.address, guardian2.address];
      await expect(guardian.connect(patient).assignGuardians(guardians))
        .to.emit(guardian, "GuardiansAssigned")
        .withArgs(patient.address, guardians);
    });

    it("Should create emergency unlock request", async function () {
      await expect(guardian.connect(guardian1).requestUnlock(patient.address))
        .to.emit(guardian, "UnlockRequested");
    });

    it("Should process guardian approvals", async function () {
      // First approval
      await expect(guardian.connect(guardian1).approveUnlock(patient.address))
        .to.emit(guardian, "UnlockApproved")
        .withArgs(patient.address, guardian1.address);
      
      // Second approval (should trigger execution)
      await expect(guardian.connect(guardian2).approveUnlock(patient.address))
        .to.emit(guardian, "UnlockExecuted")
        .withArgs(patient.address);
    });

    it("Should grant emergency access in MedVault", async function () {
      expect(await medVault.emergencyAccessActive(patient.address)).to.be.true;
      expect(await medVault.emergencyAccessPermissions(patient.address, guardian1.address)).to.be.true;
    });
  });

  describe("Integration", function () {
    it("Should verify system interoperability", async function () {
      // Verify HealthID is required for MedVault access
      expect(await healthID.balanceOf(patient.address)).to.equal(1);
      
      // Verify guardian system is operational
      const request = await guardian.emergencyRequests(patient.address);
      expect(request.executed).to.be.true;
      
      // Verify doctor permissions in MedVault
      expect(await medVault.doctorPermissions(patient.address, doctor.address)).to.be.true;
    });
  });
});