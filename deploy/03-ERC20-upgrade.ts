import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { MY_TOKEN_PROXY } from "./02-ERC20-create"

export const CONTRACT_NAME = 'MyToken';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, upgrades } = hre;
  const { log } = deployments;
  const { address: proxyAddress } = await deployments.get(MY_TOKEN_PROXY);

  const MyTokenV2 = await ethers.getContractFactory(CONTRACT_NAME);
  log('Upgrading MyToken...');

  const myTokenV2 = await upgrades.upgradeProxy(proxyAddress, MyTokenV2);

  log('MyToken upgraded to new implementation at:', await myTokenV2.getAddress());
  log('You can still use proxy at:', proxyAddress);
};

export default func;
func.tags = ['MyTokenUpgrade', 'all'];
func.dependencies = ["MyTokenCreate"];