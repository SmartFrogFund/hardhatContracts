import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';
import 'hardhat-deploy';
import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-deploy-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-verify';
const config: HardhatUserConfig = {
	solidity: '0.8.24',
};

export default config;
