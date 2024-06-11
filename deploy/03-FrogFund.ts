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
const args = ['0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512']
  const erc20 = await deploy("FrogFund", {
    from: deployer,
    args,
    log: true,
  });

  log(`03-FrogFund token deployed at ${erc20.address}`);
};

deployFrogFund.tags = ["FrogFund"];
export default deployFrogFund;
