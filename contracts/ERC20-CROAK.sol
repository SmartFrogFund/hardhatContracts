// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MyToken is ERC20Upgradeable {
    uint256 private initialSupply;

    function initialize(uint256 _initialSupply) public initializer {
        initialSupply = _initialSupply;
        _mint(msg.sender, initialSupply * 10**decimals());
        uint total = totalSupply();
        if (total == 0) {
            // only excute once
            _mint(msg.sender, initialSupply * 10**decimals());
        }
    }
}
