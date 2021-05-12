import { IContractingTime, ITimeRampValue, StakingType } from "../types/misc.types";
import { Entity, Column, BaseEntity, PrimaryColumn } from "typeorm";

@Entity()
export class StakingMetaEntity extends BaseEntity {
	@PrimaryColumn()
	contract_name: string;

	@Column({ nullable: true })
	DevRewardWallet: string;

	@Column({ nullable: true })
	StakedBalance: number;

	@Column({ nullable: true, type: "simple-json" })
	meta: { type: StakingType; version: string; YIELD_TOKEN: string; STAKING_TOKEN: string }; // Version Number of the staking contract

	@Column({ nullable: true })
	EmissionRatePerHour: number;

	@Column({ nullable: true })
	EmissionRatePerTauYearly: number;

	@Column({ nullable: true })
	EmissionRatePerSecond: number;

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

	@Column({ nullable: true })
	EpochMaxRatioIncrease: string;

	@Column({ nullable: true })
	WithdrawnBalance: string;

	@Column({ nullable: true })
	UseTimeRamp: boolean;

	@Column({ nullable: true, type: "simple-json" })
	TimeRampValues: ITimeRampValue[];

	@Column({ nullable: true, type: "simple-json" })
	Epoch: {
		index: number;
		staked: number;
		time: IContractingTime;
		amt_per_hr?: number;
	};

	@Column({ nullable: true })
	ROI_yearly: number = 0;
}
