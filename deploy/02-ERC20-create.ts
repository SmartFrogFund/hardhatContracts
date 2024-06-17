import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

export const MY_TOKEN_PROXY = 'MyTokenProxy';
export const MY_TOKEN = 'MyToken';

const deployERC20: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, ethers, upgrades, artifacts } = hre;
  const { log } = deployments;
  const MyToken = await ethers.getContractFactory(MY_TOKEN);
  const MyTokenProxy = await upgrades.deployProxy(MyToken, [1000000], { initializer: 'initialize' });
  log('MyToken deployed to:', MyTokenProxy.address);

  // 保存代理合约地址到 deployments 中
  await deployments.save(MY_TOKEN_PROXY, {
    address: await MyTokenProxy.getAddress(),
    abi: (await artifacts.readArtifact(MY_TOKEN)).abi
  });
};

deployERC20.tags = ["MyTokenCreate"];
export default deployERC20;
