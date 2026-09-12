/**
 * All object types
 * Pickable items have two sprites -> one for the item itself and one for a loaded car
 */
export enum ObjectTypes {
	EMPTY = 0,
	WALL = 1,
	DOOR = 2,
	DIAMOND = 3,
	CROWN = 4,
	TREE = 5,
	APPLE = 6,
	COW = 7,
	CHERRY = 8,
	POND = 9,
	GIRAFFE = 10,
	ICECREAM = 11,
	CAKE = 12,
	PC = 13,
	CAR = 14,
	BALOON = 15,
	CLOCK = 16,
	ELEPHANT = 17,
	DRINK = 18,
	MONEY = 19,
	PLANE = 20,
	LEMMING = 21
}

/**
 * Collection of all sprites that can be loaded on the train
 */
export const RAILCAR_ITEMS: ObjectTypes[] = [ObjectTypes.DIAMOND, ObjectTypes.CROWN, ObjectTypes.TREE, ObjectTypes.APPLE, ObjectTypes.COW,
	ObjectTypes.CHERRY, ObjectTypes.POND, ObjectTypes.GIRAFFE, ObjectTypes.ICECREAM, ObjectTypes.CAKE, ObjectTypes.PC, ObjectTypes.CAR,
	ObjectTypes.BALOON, ObjectTypes.CLOCK, ObjectTypes.CLOCK, ObjectTypes.ELEPHANT, ObjectTypes.DRINK, ObjectTypes.MONEY, ObjectTypes.PLANE,
	ObjectTypes.LEMMING];

/**
 * A single sprite descriptor for items on the map
 */
export class MapObject {
	readonly type: ObjectTypes;
	// if true, it a pickable item
	readonly isItem: boolean;
	readonly column: number;
	readonly row: number;

	/**
	 *
	 * @param type type of sprite
	 * @param column column on the map
	 * @param row row on the map
	 */
	constructor(type: ObjectTypes, column: number, row: number) {
		this.type = type;
		this.isItem = RAILCAR_ITEMS.indexOf(type) !== -1;
		this.column = column;
		this.row = row;
	}
}

export type Direction = 'l' | 'r' | 'u' | 'd'; // left, right, up, down

/**
 * Position on the map
 */
export type MapPosition = {
	column: number;
	row: number;
	direction: Direction;
}

/**
 * Static structure of a level, containing all objects and initial position of the train
 */
export type LevelData = {
	name: string;
	allObjects: MapObject[];
	trainInitPos: MapPosition;
}

/**
 * Data for the whole game
 */
export type GameData = {
	levels: LevelData[];
	intro: LevelData;
}