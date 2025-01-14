export const config = {

	appName: "Rocketswap",
	contractName: process.env.CONTRACT_NAME || "con_amm_v9",
	identityContract: process.env.IDENTITY_CONTRACT || "con_ipseity_5",
	buy: 150,
	currencySymbol: process.env.CURRENCY_SYMBOL || "dTau",
	blockExplorer: process.env.BLOCK_EXPLORER_URL || "https://testnet.lamden.io/api",
	masternode: process.env.MASTERNODE_URL || "https://testnet-master-1.lamden.io",
	networkType: process.env.NETWORK_TYPE || "testnet" // or 'mainnet'
};

export const staking_contracts = process.env.STAKING_CONTRACTS
	? process.env.STAKING_CONTRACTS.split(",")
	: ["con_staking_dtau_rswp_lst001_4", "con_staking_rswp_doug", "con_simple_staking_rswp"];