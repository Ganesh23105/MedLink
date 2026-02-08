// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MedVault is AccessControl {
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    
    address public healthIDContract;
    address public guardianContract; 
    
    mapping(address => string[]) private userReports;
    
    // 🔧 UPDATED: Record-level permissions
    // patient => doctor => ipfsHash => hasAccess
    mapping(address => mapping(address => mapping(string => bool))) public recordPermissions;
    
    // Legacy mapping for backward compatibility or "all access" if needed
    // However, we will prioritize record-level permissions
    mapping(address => mapping(address => bool)) public doctorPermissions;
    
    mapping(address => mapping(address => bool)) public pendingAccessRequests;
    
    // 🔧 UPDATED: Emergency access tracking with expiry
    mapping(address => uint256) public emergencyAccessExpiry;
    mapping(address => mapping(address => bool)) public emergencyAccessPermissions;
    
    event ReportUploaded(address indexed user, string ipfsHash);
    event AccessRequested(address indexed doctor, address indexed patient);
    event AccessApproved(address indexed doctor, address indexed patient, bool granted);
    event RecordAccessGranted(address indexed patient, address indexed doctor, string ipfsHash);
    event RecordAccessRevoked(address indexed patient, address indexed doctor, string ipfsHash);
    event EmergencyAccessGranted(address indexed patient, address[] guardians, uint256 expiry);
    event EmergencyAccessRevoked(address indexed patient);
    
    constructor(address _healthIDContract, address _guardianContract) {
        healthIDContract = _healthIDContract;
        guardianContract = _guardianContract;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function setGuardianContract(address _guardianContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        guardianContract = _guardianContract;
    }
    
    function uploadReport(string memory _ipfsHash) external {
        require(IERC721(healthIDContract).balanceOf(msg.sender) > 0, "No HealthID");
        userReports[msg.sender].push(_ipfsHash);
        emit ReportUploaded(msg.sender, _ipfsHash);
    }
    
    function requestAccess(address patient) external {
        require(patient != address(0), "Invalid patient address");
        require(msg.sender != patient, "Cannot request access to own records");
        
        pendingAccessRequests[patient][msg.sender] = true;
        emit AccessRequested(msg.sender, patient);
    }

    // 🔧 NEW: Grant access to specific records
    function grantRecordAccess(address doctor, string memory ipfsHash) public {
        require(doctor != address(0), "Invalid doctor address");
        recordPermissions[msg.sender][doctor][ipfsHash] = true;
        emit RecordAccessGranted(msg.sender, doctor, ipfsHash);
    }

    // 🔧 NEW: Grant access to multiple records
    function grantMultipleRecordsAccess(address doctor, string[] memory ipfsHashes) external {
        for (uint i = 0; i < ipfsHashes.length; i++) {
            grantRecordAccess(doctor, ipfsHashes[i]);
        }
    }

    // 🔧 NEW: Revoke access to specific records
    function revokeRecordAccess(address doctor, string memory ipfsHash) public {
        recordPermissions[msg.sender][doctor][ipfsHash] = false;
        emit RecordAccessRevoked(msg.sender, doctor, ipfsHash);
    }
    
    // 🔧 UPDATED: approveAccess now grants "all" access via legacy mapping
    // but we encourage using grantRecordAccess for granularity
    function approveAccess(address doctor, bool grant) external {
        require(doctor != address(0), "Invalid doctor address");
        require(pendingAccessRequests[msg.sender][doctor], "No pending request");
        
        doctorPermissions[msg.sender][doctor] = grant;
        pendingAccessRequests[msg.sender][doctor] = false;
        
        emit AccessApproved(doctor, msg.sender, grant);
    }
    
    function revokeAccess(address doctor) external {
        require(doctor != address(0), "Invalid doctor address");
        doctorPermissions[msg.sender][doctor] = false;
        emit AccessApproved(doctor, msg.sender, false);
    }
    
    // 🔧 UPDATED: Emergency access with duration
    function grantEmergencyAccess(address patient, address[] memory guardians, uint256 duration) external {
        require(msg.sender == guardianContract, "Only guardian contract can call");
        
        uint256 expiry = block.timestamp + duration;
        emergencyAccessExpiry[patient] = expiry;
        
        for (uint i = 0; i < guardians.length; i++) {
            emergencyAccessPermissions[patient][guardians[i]] = true;
        }
        
        emit EmergencyAccessGranted(patient, guardians, expiry);
    }
    
    function revokeEmergencyAccess() external {
        // Patient can always revoke their own emergency access
        _clearEmergencyAccess(msg.sender);
        
        // Notify Guardian contract
        (bool success, ) = guardianContract.call(
            abi.encodeWithSignature("revokeEmergencyAccess(address)", msg.sender)
        );
        require(success, "Guardian revocation failed");
        
        emit EmergencyAccessRevoked(msg.sender);
    }

    // Internal helper to clear state
    function _clearEmergencyAccess(address patient) internal {
        emergencyAccessExpiry[patient] = 0;
        
        (bool success, bytes memory data) = guardianContract.call(
            abi.encodeWithSignature("getGuardians(address)", patient)
        );
        
        if (success) {
            address[] memory guardians = abi.decode(data, (address[]));
            for (uint i = 0; i < guardians.length; i++) {
                emergencyAccessPermissions[patient][guardians[i]] = false;
            }
        }
    }
    
    function hasEmergencyAccess(address patient, address accessor) public view returns (bool) {
        return block.timestamp < emergencyAccessExpiry[patient] && emergencyAccessPermissions[patient][accessor];
    }
    
    // 🔧 UPDATED: Filter reports based on record-level permissions
    function getReports(address patient) external view returns (string[] memory) {
        if (msg.sender == patient || hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || doctorPermissions[patient][msg.sender] || hasEmergencyAccess(patient, msg.sender)) {
            return userReports[patient];
        }

        // If it's a doctor with specific record permissions
        uint256 count = 0;
        for (uint i = 0; i < userReports[patient].length; i++) {
            if (recordPermissions[patient][msg.sender][userReports[patient][i]]) {
                count++;
            }
        }

        // If no specific records are shared and no other access, revert
        require(count > 0, "Unauthorized access");

        string[] memory allowedReports = new string[](count);
        uint256 index = 0;
        for (uint i = 0; i < userReports[patient].length; i++) {
            if (recordPermissions[patient][msg.sender][userReports[patient][i]]) {
                allowedReports[index] = userReports[patient][i];
                index++;
            }
        }
        return allowedReports;
    }
    
    function getReportCount(address patient) external view returns (uint256) {
        if (msg.sender == patient || hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || doctorPermissions[patient][msg.sender] || hasEmergencyAccess(patient, msg.sender)) {
            return userReports[patient].length;
        }

        uint256 count = 0;
        for (uint i = 0; i < userReports[patient].length; i++) {
            if (recordPermissions[patient][msg.sender][userReports[patient][i]]) {
                count++;
            }
        }
        return count;
    }
    
    function getReportByIndex(address patient, uint256 index) external view returns (string memory) {
        require(index < userReports[patient].length, "Index out of bounds");
        string memory report = userReports[patient][index];

        require(
            msg.sender == patient || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || 
            doctorPermissions[patient][msg.sender] || 
            hasEmergencyAccess(patient, msg.sender) ||
            recordPermissions[patient][msg.sender][report],
            "Unauthorized access"
        );
        
        return report;
    }
    
    function grantDoctorRole(address doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DOCTOR_ROLE, doctor);
    }
    
    function revokeDoctorRole(address doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(DOCTOR_ROLE, doctor);
    }
}
