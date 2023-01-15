export const LEVEL_BLOCK_EMPTY = 0;
export const LEVEL_BLOCK_WALL = 1;
export const LEVEL_BLOCK_BOX = 2;
export const LEVEL_BLOCK_PLAYER = 5;


export const SCENE_WIDTH = 25;
export const TILE_SIZE = 32; // 32x32 px
// default texture scale
export const TEXTURE_SCALE = 1 / TILE_SIZE;
export const GAME_SPEED = 1;


export const DIR_LEFT = -1;
export const DIR_RIGHT = 1;

export enum Attributes {
	DIRECTION = 'direction',
}

export enum Assets {
	SPRITESHEET = 'spritesheet',
	LEVEL_BACKGROUND = 'level background',
}

export enum Tags {
	COLLIDABLE = 'collidable'
}

export enum MapTileType {
	EMPTY = 'EMPTY',
	WALL = 'WALL',
	PLAYER = 'PLAYER',
	BOX = 'BOX',
}

export const SpritesData: Record<keyof typeof MapTileType, { x: number; y: number; w: number; h: number }> = {
	[MapTileType.EMPTY]: null,
	[MapTileType.PLAYER]: {
		x: 0, y: 32, w: 32, h: 32
	},
	[MapTileType.WALL]: {
		x: 0, y: 0, w: 32, h: 32
	},
	[MapTileType.BOX]: {
		x: 32, y: 0, w: 32, h: 32
	}
};