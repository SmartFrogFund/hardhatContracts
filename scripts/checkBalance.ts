// scripts/check-balance.js

import hre from "hardhat";
const { ethers } = hre;
import { MyToken } from "../typechain-types";
async function main() {
  const [owner, otherAccount] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.attach(
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  )as MyToken;
  console.log("token:", owner);
  const balance = await token.balanceOf(owner.address);
  const name = await token.name();
  const totalSupply = await token.totalSupply();
  console.log("Balance of owner:", balance.toString());
  console.log("Name of token:", name);
  console.log("Total supply of token:", totalSupply.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
