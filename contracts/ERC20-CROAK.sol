pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Fake $CROAK", "$CROAK") {
        _mint(msg.sender, initialSupply);
    }
}