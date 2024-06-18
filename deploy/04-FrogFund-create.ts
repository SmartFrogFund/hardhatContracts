import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { MY_TOKEN_PROXY } from "./02-ERC20-create";

export const FROG_FUND_PROXY = 'FrogFundProxy';
export const FROG_FUND = 'FrogFund';

const deployFrogFund: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts, ethers, upgrades, artifacts } = hre;
  const { log, get } = deployments;
  const erc20 = await get(MY_TOKEN_PROXY);
  const args = [erc20.address];
//   const args = ["0x3422a9e6e1ac3609ea844c886ad4a3bd612f5e33"];
  log(`Deploying 03-FrogFundProxy args:`, args);
  const frogFundFactory = await ethers.getContractFactory(FROG_FUND);
  const frogFundProxy = await upgrades.deployProxy(frogFundFactory, args);
  await deployments.save(FROG_FUND_PROXY, {
    address: await frogFundProxy.getAddress(),
    abi: (await artifacts.readArtifact(FROG_FUND)).abi
  });

  log(`Deploying 03-FrogFundProxy address : ${frogFundProxy.address}`);
};

deployFrogFund.tags = ["FrogFundCreat", "all"];
deployFrogFund.dependencies = ["MyTokenCreate"];
export default deployFrogFund;