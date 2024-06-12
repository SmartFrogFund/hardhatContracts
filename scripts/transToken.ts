// npx hardhat run scripts/deploy.ts --network lineaSepolia

import hre from "hardhat";
const { ethers } = hre;
import { MyToken } from "../typechain-types";
async function main() {
  const [sender] = await ethers.getSigners();
  const recipient = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; // 替换为接收方的钱包地址
  const amount = ethers.parseUnits("1234", 18); // 替换为要转账的数量，这里假设代币有18位小数

  const tokenAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"; // 替换为你的代币合约地址
  const Token = await ethers.getContractFactory("MyToken");
  const token = Token.attach(tokenAddress) as MyToken;

  const tx = await token.transfer(recipient, amount);
  console.log(`Transaction hash: ${tx.hash}`);

  // 等待交易确认
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
