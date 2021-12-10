// CLI is 80x20 columns
export const SCENE_WIDTH = 320;
export const CLI_COLS = 80;
export const CLI_ROWS = 25;
export const GAME_COLUMNS = 10;
export const GAME_ROWS = 20;
export const GAME_EXTRA_ROWS = 2;

export enum Messages {
	CONTROLLER_BLOCK = 'CONTROLLER_BLOCK', // blocks any user input
	CONTROLLER_RUN = 'CONTROLLER_RUN', // unblocks user input
	ROW_CLEARED = 'ROW_CLEARED', // sent when a row has been cleared
	GAME_OVER = 'GAME_OVER', // sent when game ends
	LEVEL_UP = 'LEVEL_UP', // level incremented
	MOVE_DOWN_BEGIN = 'MOVE_DOWN_BEGIN', // player is holding button down
	MOVE_DOWN_END = 'MOVE_DOWN_END', // player released the key
	TETROMINO_PLACED = 'TETROMINO_PLACED', // tetromino has been placed
	TETROMINO_ROTATED = 'TETROMINO_ROTATED' // tetromino rotation of any kind
}

export enum Assets {
	FONT_DOS = 'FONT_DOS',
	FONT_DOS_TEXTURE = 'FONT_DOS_TEXTURE',
	SOUND_GAMEOVER = 'SOUND_GAMEOVER',
	SOUND_LEVELUP = 'SOUND_LEVELUP',
	SOUND_MOVEDOWN = 'SOUND_MOVEDOWN',
	SOUND_PLACE = 'SOUND_PLACE',
	SOUND_ROTATE = 'SOUND_ROTATE',
	SOUND_ROWCLEAR = 'SOUND_ROWCLEAR',
	MUSIC = 'MUSIC',
}

export const GAME_CONFIG = {
	// ms after we go to the next row, multiplied by game speed
	moveDownAutoDelay: 500,
	// ms after we go to the next row manually
	moveDownManualDelay: 30,
	// delay after we move aside for the first time
	moveAsideFirstDelay: 200,
	// delay after we move aside for the 2nd+ time
	moveAsideOtherDelay: 50,
	// number of tetrominos before we switch to the next level
	tetrominosPerLevel: 20,
	gameSpeedMultiplier: 0.6,
	maxLevel: 10,
	maxScorePlaces: 10,
};