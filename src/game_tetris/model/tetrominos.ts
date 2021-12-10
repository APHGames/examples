// empty cell
export const CELL_EMPTY = 0;
// cell that contains tetromino not owned by player
export const CELL_PLACED = 1;
// cell that contains tetromino owned by player
// (it should be one single tetromino)
export const CELL_PLAYER = 2;

export type Tetromino = 'TRI' | 'LTETR' | 'RTETR' | 'SKEWL' | 'SKEWR' | 'SQUARE' | 'STRAIGHT';

/**
 * Shape that defines a tetromino with all rotations
 */
export type ShapeData = {
	name: Tetromino;
	data: number[][];
	// offsets against the first
	// (default) rotation, important for correct placement
	offsetRight?: [number, number];
	offsetBottom?: [number, number];
	offsetLeft?: [number, number];
}

export const SHAPES: ShapeData[] = [
	{
		name: 'TRI',
		data: [
			[0,1,0],
			[1,1,1]
		],
		offsetRight: [1, 0],
		offsetBottom: [0, 1],
		offsetLeft: [0, 0],
	},
	{
		name: 'LTETR',
		data: [
			[1,1,1],
			[0,0,1]
		],
		offsetRight: [0, -1],
		offsetBottom: [0, -1],
		offsetLeft: [1, -1],
	},
	{
		name: 'SKEWL',
		data: [
			[1,1,0],
			[0,1,1]
		],
	},
	{
		name: 'SQUARE',
		data: [
			[1,1],
			[1,1]
		],
	},
	{
		name: 'SKEWR',
		data: [
			[0,1,1],
			[1,1,0]
		],
		// weird, but SKEWR rotates differently than SKEWL
		offsetRight: [1, -1],
		offsetLeft: [1, -1],
	},
	{
		name: 'STRAIGHT',
		data: [
			[1,1,1,1],
		],
		offsetRight: [2, -2],
		offsetLeft: [2, -2],
	},
	{
		name: 'RTETR',
		data: [
			[1,1,1],
			[1,0,0]
		],
		offsetRight: [0, -1],
		offsetBottom: [0, -1],
		offsetLeft: [1, -1],
	},
];

export enum Direction {
	LEFT = 'LEFT',
	RIGHT = 'RIGHT',
	DOWN = 'DOWN',
}

export enum Rotation {
	TOP = 'TOP', // 12, default rotation
	RIGHT = 'RIGHT', // 3
	BOTTOM = 'BOTTOM', // 6
	LEFT = 'LEFT', // 9
}