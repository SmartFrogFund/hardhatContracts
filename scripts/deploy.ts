// npx hardhat run scripts/deploy.ts --network lineaSepolia

import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  const Token = await hre.ethers.getContractFactory("MyToken");
  const token = await Token.deploy(1000000); // Initial supply: 1,000,000 tokens
  console.log("Token deployed to:", token.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
