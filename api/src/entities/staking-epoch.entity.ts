import { IContractingTime } from "src/types/misc.types";
import { handleClientUpdateType } from "src/types/websocket.types";
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class StakingEpochEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: string;

	@Column({ nullable: true })
	epoch_index: number;

	@Column({ type: "simple-json", nullable: true })
	time: IContractingTime;

	@Column({ nullable: true })
	amount_staked: number;

	@Column()
	staking_contract: string;
}

export async function updateEpoch(args: {
	staking_contract: string;
	epoch_index: number;
	amount_staked: any;
	time: any;
	handleClientUpdate: handleClientUpdateType;
}) {
	const { handleClientUpdate, amount_staked, time, epoch_index, staking_contract } = args;
	const entity = new StakingEpochEntity();
	entity.amount_staked = amount_staked.__fixed__;
	entity.time = time;
	entity.epoch_index = epoch_index;
	entity.staking_contract = staking_contract;

	await entity.save();
	handleClientUpdate({ action: "epoch_update", data: entity });
	// return res
}