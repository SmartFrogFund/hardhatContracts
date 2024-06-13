import hre from "hardhat";
const { ethers } = hre;
import { MyToken } from "../typechain-types";
async function main() {
  // 错误数据
  const errorData = "0xe450d38c00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021e19e0c9bab2400000";

  // 错误标识符
  const errorSelector = errorData.slice(0, 10);
  console.log("Error Selector:", errorSelector);

  // 创建一个 Interface 实例来解码错误数据
  const iface = new ethers.Interface([
    "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)"
  ]);

  // 解码错误参数
  const decodedError = iface.decodeErrorResult(errorSelector, errorData);
  console.log("Decoded Error:", decodedError);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
