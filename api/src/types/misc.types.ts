export class BlockDTO {
	state: IKvp[];
	fn: string;
	contract: string;
	// timestamp: number;
}

export interface IKvp {
	key: string;
	value: any;
}
