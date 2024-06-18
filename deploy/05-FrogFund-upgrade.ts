import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { MY_TOKEN_PROXY } from "./02-ERC20-create";
import { FROG_FUND_PROXY } from "./04-FrogFund-create";

export const FROG_FUND_UPGRADE = 'FrogFund';

const deployFrogFund: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, ethers, upgrades, artifacts } = hre;
  const { log, get } = deployments;
  const erc20 = await get(MY_TOKEN_PROXY);
  const args = [erc20.address];
  const { address: proxyAddress } = await deployments.get(FROG_FUND_PROXY);
//   const args = ["0x3422a9e6e1ac3609ea844c886ad4a3bd612f5e33"];
  log(`Deploying 03-FrogFund args:`, args);
  const frogFundFactory = await ethers.getContractFactory(FROG_FUND_UPGRADE);
  const frogFund = await upgrades.upgradeProxy(proxyAddress, frogFundFactory);

  log(`Deploying 03-FrogFund address : ${frogFund.address}`);
  log('You can still use proxy at:', proxyAddress);
};

deployFrogFund.tags = ["FrogFundUpgrade", "all"];
deployFrogFund.dependencies = ["MyTokenCreate, FrogFundCreat"];
export default deployFrogFund;