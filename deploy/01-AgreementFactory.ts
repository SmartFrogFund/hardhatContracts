import {
	developmentChains,
	VERIFICATION_BLOCK_CONFIRMATIONS,
	ContractNames,
} from '../helper-hardhat-config';
import verify from '../utils/verfy';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployBasicNft: DeployFunction = async (
	hre: HardhatRuntimeEnvironment
) => {
	const { deployments, getNamedAccounts, network, ethers } = hre;
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const waitConfirmations = developmentChains.includes(network.name)
		? 1
		: VERIFICATION_BLOCK_CONFIRMATIONS;

	log('----------------------------------------------------');
	const args: any[] = [];
	const basicNft = await deploy(ContractNames.AgreementFactory, {
		from: deployer,
		args: args,
		log: true,
		waitConfirmations,
	});

	// Verify the deployment
	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		log('Verifying...');
		await verify(basicNft.address, args);
	}
};
deployBasicNft.tags = ['all', ContractNames.AgreementFactory, 'main'];
export default deployBasicNft;
