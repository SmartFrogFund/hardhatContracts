// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RentalAgreement {
    error NotTenantError(string);
    enum AgreementStatus {
        Ongoing,
        Finished
    }
    AgreementStatus public status;
    address public landlord; // 房东
    address public tenant; // 租客
    uint public rent; // 每次的租金
    uint public deposit; // 押金
    uint public leaseStart; // 开始时间
    uint public leaseEnd; // 结束时间
    uint public times; // 支付次数

    constructor(
        address _landlord,
        address _tenant,
        uint _rent,
        uint _deposit,
        uint _leaseStart,
        uint _leaseEnd,
        uint _times
    ) {
        landlord = _landlord;
        tenant = _tenant;
        rent = _rent;
        deposit = _deposit;
        leaseStart = _leaseStart;
        leaseEnd = _leaseEnd;
        times = _times;
        status = AgreementStatus.Ongoing;
    }

    function payRent() public payable {
        require(msg.sender == tenant, "Only tenant can pay rent");
        require(msg.value == rent, "Rent amount is incorrect");
        require(
            block.timestamp >= leaseStart && block.timestamp <= leaseEnd,
            "Lease not active"
        );
        (bool sent, ) = landlord.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        times--;
        if (times == 0) {
            status = AgreementStatus.Finished;
        }
    }

    function returnDeposit() public payable {
        require(msg.sender == landlord, "Only landlord can return deposit");
        (bool sent, ) = landlord.call{value: deposit}("");
        require(sent, "Fail to return deposit");
    }
}
