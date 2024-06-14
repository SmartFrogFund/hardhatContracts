import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployERC20: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts,ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();


  log(`Deploying ERC20 deployer:`,deployer);

  const erc20 = await deploy("MyToken", {
    from: deployer,
    args: [1000000],
    log: true,
  });

  log(`ERC20 address: ${erc20.address}`);
};

deployERC20.tags = ["ERC20"];
export default deployERC20;
