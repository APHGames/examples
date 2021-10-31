import { LEVEL_COLUMNS } from './constants';
import { Direction, ObjectTypes } from './model/game-structs';

/**
 * Maps 2D coordinate into 1D index on the map
 * @param column x-coord
 * @param row y-coord
 * @returns index on the map
 */
export const getIndex = (column: number, row: number) => {
	return LEVEL_COLUMNS * row + column;
};

/**
 * Transforms direction to col-row/xy increment
 * @param dir direction
 */
export const dirToCoordIncrement = (dir: Direction) =>  {
	switch(dir) {
		case 'l':
			return { x: -1, y: 0 };
		case 'r':
			return { x: 1, y: 0 };
		case 'u':
			return { x: 0, y: -1 };
		case 'd':
			return { x: 0, y: 1 };
	}
	return { x: 0, y: 0 };
};

/**
 * Generates a unique tag for each pickable item - will be used for navigation
 * @param column column of the item on the map
 * @param row row of the item on the map
 */
export const getItemTag = (column: number, row: number) => {
	return `${column}_${row}`;
};

export const getCarTexOffset = (type: ObjectTypes) => {
	switch (type) {
		case ObjectTypes.DIAMOND:
			return { x: 0, y: 3 };
		case ObjectTypes.CROWN:
			return { x: 1, y: 3 };
		case ObjectTypes.TREE:
			return { x: 2, y: 3 };
		case ObjectTypes.APPLE:
			return { x: 3, y: 3 };
		case ObjectTypes.COW:
			return { x: 4, y: 3 };
		case ObjectTypes.CHERRY:
			return { x: 5, y: 3 };
		case ObjectTypes.POND:
			return { x: 6, y: 3 };
		case ObjectTypes.GIRAFFE:
			return { x: 7, y: 3 };
		case ObjectTypes.ICECREAM:
			return { x: 8, y: 3 };
		case ObjectTypes.CAKE:
			return { x: 9, y: 3 };
		case ObjectTypes.PC:
			return { x: 10, y: 3 };
		case ObjectTypes.CAR:
			return { x: 11, y: 3 };
		case ObjectTypes.BALOON:
			return { x: 12, y: 3 };
		case ObjectTypes.CLOCK:
			return { x: 13, y: 3 };
		case ObjectTypes.ELEPHANT:
			return { x: 14, y: 3 };
		case ObjectTypes.DRINK:
			return { x: 15, y: 3 };
		case ObjectTypes.MONEY:
			return { x: 16, y: 3 };
		case ObjectTypes.PLANE:
			return { x: 17, y: 3 };
		case ObjectTypes.LEMMING:
			return { x: 18, y: 3 };
		default:
			throw new Error('No such train car!');
	}
};

export const isOppositeDirection = (dir1: Direction, dir2: Direction) => {
	return ((dir1 === 'l' && dir2 === 'r') ||
			(dir1 === 'r' && dir2 === 'l') ||
			(dir1 === 'd' && dir2 === 'u') ||
			(dir1 === 'u' && dir2 === 'd'));
};

export const getItemTexOffset = (type: ObjectTypes) => {
	switch (type) {
		case ObjectTypes.DIAMOND:
			return { x: 0, y: 0 };
		case ObjectTypes.CROWN:
			return { x: 1, y: 0 };
		case ObjectTypes.TREE:
			return { x: 2, y: 0 };
		case ObjectTypes.APPLE:
			return { x: 3, y: 0 };
		case ObjectTypes.COW:
			return { x: 4, y: 0 };
		case ObjectTypes.CHERRY:
			return { x: 5, y: 0 };
		case ObjectTypes.POND:
			return { x: 6, y: 0 };
		case ObjectTypes.GIRAFFE:
			return { x: 7, y: 0 };
		case ObjectTypes.ICECREAM:
			return { x: 8, y: 0 };
		case ObjectTypes.CAKE:
			return { x: 9, y: 0 };
		case ObjectTypes.PC:
			return { x: 10, y: 0 };
		case ObjectTypes.CAR:
			return { x: 11, y: 0 };
		case ObjectTypes.BALOON:
			return { x: 12, y: 0 };
		case ObjectTypes.CLOCK:
			return { x: 13, y: 0 };
		case ObjectTypes.ELEPHANT:
			return { x: 14, y: 0 };
		case ObjectTypes.DRINK:
			return { x: 15, y: 0 };
		case ObjectTypes.MONEY:
			return { x: 16, y: 0 };
		case ObjectTypes.PLANE:
			return { x: 17, y: 0 };
		case ObjectTypes.LEMMING:
			return { x: 18, y: 0 };
		case ObjectTypes.WALL:
			return { x: 18, y: 7 };
		case ObjectTypes.DOOR:
			return { x: 12, y: 7 };
	}
};