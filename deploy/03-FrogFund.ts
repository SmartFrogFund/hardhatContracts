import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFrogFund: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts,ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Deploying 03-FrogFund token...");

//   log(`Deploying ERC20 token...${args}`,args,deployer);
const args = ['0x085500B2462eC1B4f3A4fc40c29de9243533F5D6']
  const erc20 = await deploy("FrogFund", {
    from: deployer,
    args,
    log: true,
  });

  log(`03-FrogFund token deployed at ${erc20.address}`);

};

deployFrogFund.tags = ["FrogFund"];
export default deployFrogFund;
