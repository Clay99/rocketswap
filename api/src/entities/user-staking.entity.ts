import { IContractingTime, IKvp } from "src/types/misc.types";
import { IUserYieldInfo } from "src/types/websocket.types";
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn } from "typeorm";
import { StakingEpochEntity } from "./staking-epoch.entity";
import { StakingMetaEntity } from "./staking-meta.entity";

@Entity()
export class UserStakingEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	vk: string;

	@Column()
	staking_contract: string;

	@Column({ nullable: true, type: "simple-json" })
	deposits: IStakingDeposit[];

	@Column({ nullable: true })
	withdrawals: number;

	@Column({ nullable: true, type: "simple-json" })
	yield_info: IUserYieldInfo;
}

// current_yield, yield_per_sec, time_updated, epoch_updated

export interface IStakingDeposit {
	amount: { __fixed__: string };
	starting_epoch: number;
	time: IContractingTime;
}

export async function updateUserStakingInfo(args: {
	deposits: IKvp | undefined;
	withdrawals: IKvp | undefined;
	staking_contract: string;
	fn: string;
}) {
	// console.log("UPDATE USER STAKING INFO");
	// console.log(args);
	const { deposits, withdrawals, staking_contract, fn } = args;
	const vk = deposits ? deposits.key.split(":")[1] : withdrawals.key.split(":")[1];
	let entity = await UserStakingEntity.findOne({ where: { vk, staking_contract } });
	// console.log(entity)
	if (!entity) {
		entity = new UserStakingEntity();
		entity.deposits = [];
		entity.withdrawals = 0;
		entity.vk = vk;
		entity.staking_contract = staking_contract;
	}
	if (deposits) {
		// console.log(deposits);
		entity.deposits = deposits.value;
	}
	if (withdrawals) {
		// console.log(withdrawals)
		entity.withdrawals = withdrawals.value.__fixed__ ? parseFloat(withdrawals.value.__fixed__) : 0;
	}
	if (fn === "withdrawTokensAndYield") {
		entity.withdrawals = 0;
		entity.deposits = [];
	}

	// console.log(entity)

	return await entity.save();
}

// const current_yield = getUserYield({ meta: meta_entity, user: user_entity, epochs: epoch_entity });
// const yield_per_sec = getUserYieldPerSecond(meta_entity, total_staked);
// const time_updated = Date.now();
// const epoch_updated = meta_entity.Epoch.index;

export function getUserYield(args: { meta: StakingMetaEntity; user: UserStakingEntity; epochs: StakingEpochEntity[] }) {
	let { meta, user, epochs } = args;
	let { DevRewardPct } = meta;
	let { deposits, withdrawals } = user;

	let harvestable_yield = 0;

	for (let d of deposits) {
		// console.log(d);
		harvestable_yield += calculateYield({
			starting_epoch_index: d.starting_epoch,
			amount: d.amount,
			deposit_start_time: d.time,
			current_epoch_index: meta.Epoch.index,
			epochs,
			meta
		});
	}


	if (harvestable_yield <= 0) {
		return 0
	}

	console.log("Harvestable Yield", harvestable_yield);
	// if (typeof withdrawals === 'object') withdrawals = 0
	harvestable_yield -= withdrawals;

	// console.log(typeof harvestable_yield, harvestable_yield);
	// console.log(typeof withdrawals, withdrawals);
	// console.log(withdrawals);
	// console.log(typeof DevRewardPct);

	const dev_share = harvestable_yield * DevRewardPct;

	return harvestable_yield - dev_share;

	// # Determine maximum amount of yield user can withdraw
	// harvestable_yield -= withdrawn_yield

	// yield_to_harvest = amount if amount < harvestable_yield else harvestable_yield

	// assert yield_to_harvest > 0, 'There is no yield to harvest right now :('

	// # Take % of Yield Tokens, send it to dev fund
	// dev_share = yield_to_harvest * DevRewardPct.get()
}

function calculateYield(args: {
	starting_epoch_index: number;
	amount: any;
	deposit_start_time: IContractingTime;
	current_epoch_index: number;
	epochs: StakingEpochEntity[];
	meta: StakingMetaEntity;
}): number {
	console.log("CALCULATE YIELD CALLED");
	let { starting_epoch_index, amount, deposit_start_time, current_epoch_index, epochs, meta } = args;

	// console.log(epochs);
	let start_time = datetimeToUnix(meta.StartTime);
	let end_time = datetimeToUnix(meta.EndTime);

	const fitTime = (time: number): number => {
		if (time < start_time) time = start_time;
		else if (time > end_time) time = end_time;
		return time;
	};

	amount = parseFloat(amount.__fixed__);
	// console.log("amount", amount);
	let this_epoch_index = starting_epoch_index;
	// console.log("EPOCH INDEXES:", this_epoch_index, starting_epoch_index);
	let y = 0;

	while (this_epoch_index <= current_epoch_index) {
		let this_epoch = epochs[this_epoch_index];
		let next_epoch = epochs[this_epoch_index + 1];

		let delta = 0;

		if (starting_epoch_index === current_epoch_index) {
			// console.log(1);
			delta = fitTime(Date.now()) - fitTime(datetimeToUnix(deposit_start_time));
		} else if (this_epoch_index === starting_epoch_index) {
			// console.log(2);
			delta = fitTime(datetimeToUnix(next_epoch.time)) - fitTime(datetimeToUnix(deposit_start_time));
			// console.log(next_epoch.time, start_time);
		} else if (this_epoch_index === current_epoch_index) {
			// console.log(3);
			delta = fitTime(Date.now()) - fitTime(datetimeToUnix(this_epoch.time));
		} else {
			// console.log(4);
			delta = fitTime(datetimeToUnix(next_epoch.time)) - fitTime(datetimeToUnix(this_epoch.time));
		}
		const delta_seconds = delta / 1000;
		// console.log("DELTA", delta_seconds);
		let pct_share_of_stake = amount / this_epoch.amount_staked;
		let global_yield_this_epoch = delta_seconds * getEmissionRatePerSecond(meta.EmissionRatePerHour);
		let deposit_yield_this_epoch = global_yield_this_epoch * pct_share_of_stake;

		y += deposit_yield_this_epoch;
		this_epoch_index += 1;
	}
	console.log("CALCULATED YIELD: ", y);
	return y;
}

export function getUserYieldPerSecond(meta: StakingMetaEntity, total_staked: number) {
	const emission_rate_per_hour = meta.EmissionRatePerHour;
	const total_emission_rate_per_second = getEmissionRatePerSecond(emission_rate_per_hour);
	const share_of_pool = total_staked / meta.StakedBalance;
	const user_emission_rate_per_second = share_of_pool * total_emission_rate_per_second;
	return user_emission_rate_per_second;
}

// def calculateYield(starting_epoch_index: int, start_time, amount: float):
//     current_epoch_index = getCurrentEpochIndex()
//     this_epoch_index = starting_epoch_index
//     y = 0
//     while this_epoch_index <= current_epoch_index:
//         this_epoch = Epochs[this_epoch_index]
//         next_epoch = Epochs[this_epoch_index+1]

//         delta = 0

//         if starting_epoch_index == current_epoch_index:
//             delta = fitTimeToRange(now) - fitTimeToRange(start_time)
//         elif this_epoch_index == starting_epoch_index:
//             delta = fitTimeToRange(
//                 next_epoch['time']) - fitTimeToRange(start_time)
//         elif this_epoch_index == current_epoch_index:
//             delta = fitTimeToRange(now) - fitTimeToRange(this_epoch['time'])
//         else:
//             delta = fitTimeToRange(
//                 next_epoch['time']) - fitTimeToRange(this_epoch['time'])

//         pct_share_of_stake = amount / this_epoch['staked']
//         # These two lines below were causing some problems, until I used the decimal method. get a python expert to review.
//         global_yield_this_epoch = delta.seconds * getEmissionRatePerSecond()
//         deposit_yield_this_epoch = decimal(
//             global_yield_this_epoch) * pct_share_of_stake
//         y += deposit_yield_this_epoch

//         this_epoch_index += 1

//     return y

function getEmissionRatePerSecond(emission_rate_per_hour: number) {
	return emission_rate_per_hour / 60 / 60;
}

// @export
// def getEmissionRatePerSecond():
//     emission_rate_per_hour = EmissionRatePerHour.get()
//     emission_rate_per_minute = emission_rate_per_hour / 60
//     emission_rate_per_second = emission_rate_per_minute / 60
//     return emission_rate_per_second

function datetimeToUnix(time: IContractingTime) {
	let arr = time.__time__;
	return new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]).getTime();
}