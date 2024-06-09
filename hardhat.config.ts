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
    // typechain: {
    //     // outDir: "typechain",
    //     // target: "ethers-v5",
    // },
    networks: {
        sepolia: {
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: [`0x${process.env.PRIVATE_KEY}`]  // 你的私钥，需要将其保存到环境变量中
        },
        lineaSepolia: {
            url: `https://linea-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: [`0x${process.env.PRIVATE_KEY}`]  // 你的私钥，需要将其保存到环境变量中
        },
    },
};

export default config;
