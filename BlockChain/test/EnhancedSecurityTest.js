const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Enhanced Security Features Test", function () {
  let healthID, medVault, guardian;
  let owner, doctor, patient, guardian1, guardian2;

  before(async function () {
    [owner, doctor, patient, guardian1, guardian2] = await ethers.getSigners();

    const HealthID = await ethers.getContractFactory("HealthID");
    healthID = await HealthID.deploy(owner.address);
    await healthID.waitForDeployment();
    
    const Guardian = await ethers.getContractFactory("Guardian");
    guardian = await Guardian.deploy();
    await guardian.waitForDeployment();

    const MedVault = await ethers.getContractFactory("MedVault");
    medVault = await MedVault.deploy(await healthID.getAddress(), await guardian.getAddress());
    await medVault.waitForDeployment();

    await guardian.setMedVaultContract(await medVault.getAddress());
    
    // Setup: Mint HealthID for patient
    await healthID.connect(owner).mintHealthID(patient.address);
  });

  describe("Record-Level Permissions", function () {
    const report1 = "ipfs://hash1";
    const report2 = "ipfs://hash2";

    before(async function () {
      await medVault.connect(patient).uploadReport(report1);
      await medVault.connect(patient).uploadReport(report2);
    });

    it("Should allow patient to share specific records with a doctor", async function () {
      await medVault.connect(patient).grantRecordAccess(doctor.address, report1);
      
      const reports = await medVault.connect(doctor).getReports(patient.address);
      expect(reports).to.have.lengthOf(1);
      expect(reports[0]).to.equal(report1);
    });

    it("Should allow patient to share multiple records", async function () {
      await medVault.connect(patient).grantMultipleRecordsAccess(doctor.address, [report1, report2]);
      
      const reports = await medVault.connect(doctor).getReports(patient.address);
      expect(reports).to.have.lengthOf(2);
      expect(reports).to.include(report1);
      expect(reports).to.include(report2);
    });

    it("Should allow patient to revoke access to a specific record", async function () {
      await medVault.connect(patient).revokeRecordAccess(doctor.address, report1);
      
      const reports = await medVault.connect(doctor).getReports(patient.address);
      expect(reports).to.have.lengthOf(1);
      expect(reports[0]).to.equal(report2);
    });
  });

  describe("Time-bound Emergency Access", function () {
    it("Should allow patient to set emergency access duration", async function () {
      const duration = 3600; // 1 hour
      await expect(guardian.connect(patient).setEmergencyDuration(duration))
        .to.emit(guardian, "EmergencyDurationUpdated")
        .withArgs(patient.address, duration);
      
      expect(await guardian.patientEmergencyDuration(patient.address)).to.equal(duration);
    });

    it("Should grant emergency access for the specified duration", async function () {
      const duration = 3600;
      await guardian.connect(patient).assignGuardians([guardian1.address, guardian2.address]);
      
      await guardian.connect(guardian1).requestUnlock(patient.address);
      await guardian.connect(guardian1).approveUnlock(patient.address);
      await guardian.connect(guardian2).approveUnlock(patient.address);

      const expiry = await medVault.emergencyAccessExpiry(patient.address);
      const latestTime = await time.latest();
      
      // Expiry should be roughly latestTime + duration
      expect(Number(expiry)).to.be.closeTo(latestTime + duration, 5);
      expect(await medVault.hasEmergencyAccess(patient.address, guardian1.address)).to.be.true;
    });

    it("Should expire emergency access after the duration", async function () {
      await time.increase(3601); // Increase time by more than 1 hour
      
      expect(await medVault.hasEmergencyAccess(patient.address, guardian1.address)).to.be.false;
      
      await expect(medVault.connect(guardian1).getReports(patient.address))
        .to.be.revertedWith("Unauthorized access");
    });

    it("Should allow patient to revoke emergency access early", async function () {
      // Re-grant access
      await guardian.connect(guardian1).requestUnlock(patient.address);
      await guardian.connect(guardian1).approveUnlock(patient.address);
      await guardian.connect(guardian2).approveUnlock(patient.address);
      
      expect(await medVault.hasEmergencyAccess(patient.address, guardian1.address)).to.be.true;
      
      // Revoke early
      await medVault.connect(patient).revokeEmergencyAccess();
      
      expect(await medVault.hasEmergencyAccess(patient.address, guardian1.address)).to.be.false;
    });
  });
});
