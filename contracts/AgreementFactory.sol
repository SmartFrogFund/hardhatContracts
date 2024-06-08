// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RentalAgreement.sol";

contract ContractFactory {
    RentalAgreement[] public contracts;
    mapping(address => address[]) contractMap;

    function createContract(
        address _tenant,
        uint _rent,
        uint _deposit,
        uint _leaseStart,
        uint _leaseEnd,
        uint _times
    ) public returns (address agreementAddress) {
        RentalAgreement newContract = new RentalAgreement(
            msg.sender,
            _tenant,
            _rent,
            _deposit,
            _leaseStart,
            _leaseEnd,
            _times
        );
        address landlord = newContract.landlord();
        contractMap[_tenant].push(address(newContract));
        contractMap[landlord].push(address(newContract));
        agreementAddress = address(newContract);
    }

    function getContract(uint index) public view returns (RentalAgreement) {
        return contracts[index];
    }
}
