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
const args = ['0x2ac0b31bcf6091c139e5a5e968434bcd5dcc63e8']
  const erc20 = await deploy("FrogFund", {
    from: deployer,
    args,
    log: true,
  });

  log(`03-FrogFund token deployed at ${erc20.address}`);

};

deployFrogFund.tags = ["FrogFund"];
export default deployFrogFund;
