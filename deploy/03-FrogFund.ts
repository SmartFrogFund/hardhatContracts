import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFrogFund: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log,get } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`Deploying 03-FrogFund deployer:`, deployer);
  const erc20 = await get("MyToken");
  const args = [erc20.address];
//   const args = ["0x3422a9e6e1ac3609ea844c886ad4a3bd612f5e33"];
   log(`Deploying 03-FrogFund args:`, args);
  const frogFund = await deploy("FrogFund", {
    from: deployer,
    args,
    log: true,
  });
  // 获取部署交易的交易对象
  const deployTx = await ethers.provider.getTransaction(frogFund.transactionHash as string);
  
  // 等待交易被挖掘
  const receipt = await deployTx?.wait();
  
  // 获取区块高度
  const blockNumber = receipt?.blockNumber;
  log(`Deploying 03-FrogFund address : ${frogFund.address}`);
  log(`Deployed at block number: ${blockNumber}`);
};

deployFrogFund.tags = ["FrogFund"];
deployFrogFund.dependencies = ["ERC20"];
export default deployFrogFund;