import { IContractingTime, IKvp } from "src/types/misc.types";
import { getVal } from "../utils";
import { Entity, Column, BaseEntity, PrimaryColumn } from "typeorm";
import { handleClientUpdateType } from "../types/websocket.types";
import { updateUserStakingInfo } from "./user-staking.entity";
import { updateEpoch } from "./staking-epoch.entity";

@Entity()
export class StakingMetaEntity extends BaseEntity {
	@PrimaryColumn()
	contract_name: string;

	@Column({ nullable: true })
	DevRewardWallet: string;

	@Column({ nullable: true })
	StakedBalance: number;

	@Column({ nullable: true, type: "simple-json" })
	meta: any; // Version Number of the staking contract

	@Column({ nullable: true })
	EmissionRatePerHour: number;

	@Column({ nullable: true })
	DevRewardPct: number;

	@Column({ nullable: true, type: "simple-json" })
	StartTime: IContractingTime;

	@Column({ nullable: true, type: "simple-json" })
	EndTime: IContractingTime;

	@Column({ nullable: true })
	OpenForBusiness: boolean;

	@Column({ nullable: true })
	__developer__: string;

	@Column({ nullable: true, type: "simple-json" })
	Epoch: {
		index: number;
		staked: number;
		time: IContractingTime;
	};
}

// [
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.Owner",
// 		value:
// 			"f8a429afc20727902fa9503f5ecccc9b40cfcef5bcba05204c19e44423e65def"
// 	},
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.DevRewardWallet",
// 		value:
// 			"f8a429afc20727902fa9503f5ecccc9b40cfcef5bcba05204c19e44423e65def"
// 	},
// 	{ key: "con_staking_dtau_rswp_lst001_2.CurrentEpochIndex", value: 0 },
// 	{ key: "con_staking_dtau_rswp_lst001_2.StakedBalance", value: 0 },
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.Epochs:0",
// 		value: { staked: 0, time: [Object] }
// 	},
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.meta:version",
// 		value: { __fixed__: "0.01" }
// 	},
// 	{ key: "con_staking_dtau_rswp_lst001_2.meta:type", value: "staking" },
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.EmissionRatePerHour",
// 		value: 6849
// 	},
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.DevRewardPct",
// 		value: { __fixed__: "0.1" }
// 	},
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.StartTime",
// 		value: { __time__: [Array] }
// 	},
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.EndTime",
// 		value: { __time__: [Array] }
// 	},
// 	{
// 		key: "con_staking_dtau_rswp_lst001_2.OpenForBusiness",
// 		value: true
// 	}
// ];

export const updateStakingContractMeta = async (args: {
	state: IKvp[];
	handleClientUpdate: handleClientUpdateType;
	staking_contract: string;
	fn: string;
}) => {
	try {
		const { state, handleClientUpdate, staking_contract, fn } = args;
		let entity = await StakingMetaEntity.findOne(staking_contract);
		if (!entity) {
			entity = new StakingMetaEntity();
			entity.contract_name = staking_contract;
		}
		for (let kvp of state) {

				switch (kvp.key) {
					case `${staking_contract}.Owner`:
						entity["Owner"] = getVal(kvp);
						break;
					case `${staking_contract}.DevRewardWallet`:
						entity["DevRewardWallet"] = getVal(kvp);
						break;
					case `${staking_contract}:CurrentEpochIndex`:
						entity["CurrentEpochIndex"] = getVal(kvp);
						break;
					case `${staking_contract}.StakedBalance`:
						entity["StakedBalance"] = getVal(kvp);
						break;
					case `${staking_contract}.meta:version`:
						entity["meta"] = updateMetaProperty(entity.meta, "version", getVal(kvp));
						break;
					case `${staking_contract}.meta:type`:
						entity["meta"] = updateMetaProperty(entity.meta, "type", getVal(kvp));
						break;
					case `${staking_contract}.meta:STAKING_TOKEN`:
						entity["meta"] = updateMetaProperty(entity.meta, "STAKING_TOKEN", getVal(kvp));
						break;
					case `${staking_contract}.meta:YIELD_TOKEN`:
						entity["meta"] = updateMetaProperty(entity.meta, "YIELD_TOKEN", getVal(kvp));
						break;
					case `${staking_contract}.meta:STAKING_TOKEN`:
						entity["meta_STAKING_TOKEN"] = getVal(kvp);
						break;
					case `${staking_contract}.EmissionRatePerHour`:
						entity["EmissionRatePerHour"] = getVal(kvp);
						break;
					case `${staking_contract}.DevRewardPct`:
						entity["DevRewardPct"] = getVal(kvp);
						break;
					case `${staking_contract}.StartTime`:
						entity["StartTime"] = getVal(kvp);
						break;
					case `${staking_contract}.EndTime`:
						entity["EndTime"] = getVal(kvp);
						break;
					case `${staking_contract}.OpenForBusiness`:
						entity["OpenForBusiness"] = getVal(kvp);
						break;
					case `${staking_contract}.__developer__`:
						entity["__developer__"] = getVal(kvp);
						break;
				}
				if (kvp.key.includes("Epochs")) {
					// {
					//     key: "con_staking_dtau_rswp_lst001_2.Epochs:0",
					//     value: { staked: 0, time: [Object] }
					// },
					const index = parseInt(kvp.key.split(":")[1]);
					const { staked, time } = kvp.value;
					await updateEpoch({ staking_contract, epoch_index: index, time, amount_staked: staked, handleClientUpdate });
					entity.Epoch = {
						index,
						staked,
						time
					};
					// console.log("EPOCH UPDATED", entity);
				}
		}
		await entity.save();

		const deposits = state.find((kvp) => kvp.key.includes("Deposits"));
		const withdrawals = state.find((kvp) => kvp.key.includes("Withdrawals"));
		if (deposits || withdrawals) {
			// console.log(deposits);
			await updateUserStakingInfo({ deposits, withdrawals, staking_contract, fn });
		}
		handleClientUpdate({ action: "staking_panel_update", data: entity });
	} catch (err) {
		console.error(err);
	}
};

const updateMetaProperty = (metadata: any, key: string, value: string) => {
	if (!metadata) metadata = {};
	metadata[key] = value;
	return metadata;
};
