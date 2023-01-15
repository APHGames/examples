import { MapTileType, LEVEL_BLOCK_EMPTY, LEVEL_BLOCK_PLAYER, LEVEL_BLOCK_WALL, LEVEL_BLOCK_BOX } from './constants';

export type Level = {
	name: string;
	width: number;
	height: number;
	tiles: MapTileType[][];
	platforms: number[][];
}


export const LEVEL_DEFAULT = [
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
	1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];

export const LEVEL_DEFAULT_WIDTH = 21;

export class LevelBuilder {

	buildLevel(name: string, arr: number[], width: number): Level {
		const height = arr.length / width;
		const tiles: MapTileType[][] = [[]];
		const platforms: number[][] = [[]];

		const MapTileMapper = {
			[LEVEL_BLOCK_EMPTY]: MapTileType.EMPTY,
			[LEVEL_BLOCK_PLAYER]: MapTileType.PLAYER,
			[LEVEL_BLOCK_WALL]: MapTileType.WALL,
			[LEVEL_BLOCK_BOX]: MapTileType.BOX,
		};

		for (let i = 0; i < arr.length; i++) {
			const tile = arr[i];
			let type = MapTileMapper[tile];
			const x = i % width;
			const y = Math.floor(i / width);
			if (!tiles[y]) {
				tiles[y] = [];
				platforms[y] = [];
			}
			tiles[y][x] = type;

			if (tile === LEVEL_BLOCK_WALL) {
				platforms[y][x] = 1;
			} else {
				platforms[y][x] = 0;
			}
		}

		return {
			name,
			width,
			height,
			tiles,
			platforms,
		};
	}
}