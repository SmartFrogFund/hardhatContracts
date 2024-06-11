// scripts/check-balance.js
import hre from "hardhat";
const { ethers } = hre;
import { MyToken } from "../typechain-types";
async function main() {
  const [owner, otherAccount] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.attach(
    "0x091b968956756fd32e167dc3cebc9f3023817af8"
  ) as MyToken;
  console.log("token:", owner);
  const balance = await token.balanceOf(owner.address);
  const name = await token.name();
  const totalSupply = await token.totalSupply();
  console.log("Balance of owner:", ethers.formatEther(balance.toString()));
  console.log("Name of token:", name);
  console.log("Total supply of token:", ethers.formatEther(totalSupply.toString()));
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
