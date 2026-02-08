// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMedVault {
    // 🔧 UPDATED: Added duration parameter
    function grantEmergencyAccess(address patient, address[] memory guardians, uint256 duration) external;
    function hasEmergencyAccess(address patient, address accessor) external view returns (bool);
}

contract Guardian { 
    struct EmergencyRequest {
        address[] guardians;
        uint256 approvalsNeeded;
        uint256 unlockTime; // Time window for guardians to approve
        bool executed;
        mapping(address => bool) approvals;
        uint256 approvalCount; 
    }

    mapping(address => EmergencyRequest) public emergencyRequests;
    mapping(address => address[]) public patientGuardians; 
    
    // 🔧 NEW: Patient-configurable emergency access duration (default 24 hours)
    mapping(address => uint256) public patientEmergencyDuration;
    
    address public medVaultContract; 
    
    event GuardiansAssigned(address indexed patient, address[] guardians);
    event UnlockRequested(address indexed patient, address[] guardians, uint256 approvalsNeeded);
    event UnlockApproved(address indexed patient, address indexed guardian);
    event UnlockExecuted(address indexed patient, uint256 duration);
    event EmergencyDurationUpdated(address indexed patient, uint256 duration);

    function setMedVaultContract(address _medVaultContract) external {
        require(medVaultContract == address(0), "Already set");
        medVaultContract = _medVaultContract;
    }

    // 🔧 NEW: Allow patient to set their emergency access duration
    function setEmergencyDuration(uint256 _duration) external {
        require(_duration > 0, "Duration must be > 0");
        require(_duration <= 7 days, "Duration too long"); // Safety cap
        patientEmergencyDuration[msg.sender] = _duration;
        emit EmergencyDurationUpdated(msg.sender, _duration);
    }
    
    function assignGuardians(address[] memory _guardians) external {
        require(_guardians.length >= 2, "Min 2 guardians");
        require(_guardians.length <= 10, "Max 10 guardians");
        
        for (uint i = 0; i < _guardians.length; i++) {
            require(_guardians[i] != address(0), "Invalid guardian");
            require(_guardians[i] != msg.sender, "Cannot be own guardian");
        }
        
        patientGuardians[msg.sender] = _guardians;
        
        // Set default duration if not already set
        if (patientEmergencyDuration[msg.sender] == 0) {
            patientEmergencyDuration[msg.sender] = 24 hours;
        }
        
        emit GuardiansAssigned(msg.sender, _guardians);
    }

    function requestUnlock(address patient) external {
        require(patientGuardians[patient].length >= 2, "No guardians assigned");
        
        bool isGuardian = false;
        address[] memory guardians = patientGuardians[patient];
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        require(isGuardian, "Not a guardian");
        
        _clearOldRequest(patient);

        EmergencyRequest storage req = emergencyRequests[patient];
        req.guardians = guardians;
        req.approvalsNeeded = (guardians.length / 2) + 1;
        req.unlockTime = block.timestamp + 48 hours; // Approval window
        req.executed = false;
        req.approvalCount = 0; 

        emit UnlockRequested(patient, guardians, req.approvalsNeeded);
    }

    function approveUnlock(address patient) external {
        EmergencyRequest storage req = emergencyRequests[patient];
        require(req.guardians.length > 0, "No active request"); 
        require(!req.executed, "Already executed");
        require(block.timestamp < req.unlockTime, "Approval window expired");

        bool isGuardian = false;
        for (uint i = 0; i < req.guardians.length; i++) {
            if (req.guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        require(isGuardian, "Not a guardian");
        require(!req.approvals[msg.sender], "Already approved");
        
        req.approvals[msg.sender] = true;
        req.approvalCount++; 
        emit UnlockApproved(patient, msg.sender);

        _checkApprovals(patient);
    }

    function _checkApprovals(address patient) private {
        EmergencyRequest storage req = emergencyRequests[patient];
        
        if (req.approvalCount >= req.approvalsNeeded) {
            req.executed = true;
            
            uint256 duration = patientEmergencyDuration[patient];
            if (duration == 0) duration = 24 hours; // Fallback

            emit UnlockExecuted(patient, duration);
            
            if (medVaultContract != address(0)) {
                IMedVault(medVaultContract).grantEmergencyAccess(patient, req.guardians, duration);
            }
        }
    }
    
    function _clearOldRequest(address patient) private {
        EmergencyRequest storage req = emergencyRequests[patient];
        if (req.guardians.length > 0) {
            for (uint i = 0; i < req.guardians.length; i++) {
                req.approvals[req.guardians[i]] = false;
            }
        }
        delete emergencyRequests[patient];
    }
    
    function getGuardians(address patient) external view returns (address[] memory) {
        return patientGuardians[patient];
    }
    
    function getRequestStatus(address patient) external view returns (
        uint256 approvalsNeeded,
        uint256 currentApprovals,
        uint256 unlockTime,
        bool executed,
        bool active
    ) {
        EmergencyRequest storage req = emergencyRequests[patient];
        return (
            req.approvalsNeeded,
            req.approvalCount,
            req.unlockTime,
            req.executed,
            req.guardians.length > 0 && !req.executed && block.timestamp < req.unlockTime
        );
    }
    
    function hasApproved(address patient, address guardian) external view returns (bool) {
        return emergencyRequests[patient].approvals[guardian];
    }

    function revokeEmergencyAccess(address patient) external {
        require(msg.sender == medVaultContract || msg.sender == patient, "Unauthorized");
        _clearOldRequest(patient);
    }
}
