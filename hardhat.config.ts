import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';
import 'hardhat-deploy';
import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-deploy-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-verify';
import '@nomiclabs/hardhat-web3';
// import "@nomiclabs/hardhat-etherscan";

// 测试环境不需要这些api
const {
	SEPOLIA_RPC_URL,
	SEPOLIA_API_KEY,
	SEPOLIA_PRIVATE_KEY,
	COINAMARKETCAP_API_KEY,
	ETHERSCAN_API_KEY,
} = process.env;

const devConfig: HardhatUserConfig = {
	solidity: '0.8.24',
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			chainId: 31337,
		},
		 localhost: {
      url: "http://localhost:8545",
    },
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		landlord: {
			default: 1,
		},
		tenant: {
			default: 2,
		},
	},
	typechain: {
		outDir: './typechain-types',
		target: 'ethers-v6',
		alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
		externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
		dontOverrideCompile: false, // defaults to false
	},
	mocha: {
		timeout: 500000,
	},
};
const config: HardhatUserConfig = {
	solidity: '0.8.24',
	// typechain: {
	//     // outDir: "typechain",
	//     // target: "ethers-v5",
	// },
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			chainId: 31337,
		},
  localhost: {
      url: "http://localhost:8545",
    },
		sepolia: {
			chainId: 11155111,
			url: SEPOLIA_RPC_URL,
			accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
		},
		lineaSepolia: {
			url: `https://linea-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts: [`0x${process.env.SEPOLIA_PRIVATE_KEY}`], // 你的私钥，需要将其保存到环境变量中
			timeout: 200000, // 增加超时时间为200秒
            gasPrice:118770660,
            minGasPrice:0,
		},
	},
	etherscan: {
		apiKey: {
			sepolia: ETHERSCAN_API_KEY || '',
			lineaSepolia: ETHERSCAN_API_KEY || '',
		},
		customChains: [
			{
				network: 'lineaSepolia',
				chainId: 59141,
				urls: {
					apiURL: 'https://api-sepolia.lineascan.build/api',
					browserURL: 'https://api-sepolia.lineascan.build/',
				},
			},
		],
	},
	sourcify: {
		enabled: true,
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		landlord: {
			default: 1,
		},
		tenant: {
			default: 2,
		},
	},
	typechain: {
		outDir: './typechain-types',
		target: 'ethers-v6',
		alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
		externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
		dontOverrideCompile: false, // defaults to false
	},
	mocha: {
		timeout: 500000,
	},
};
console.log('！！！NODE_ENV！！！', process.env.NODE_ENV);
export default process.env.NODE_ENV == 'development' ? devConfig : config;
