export const SCENE_WIDTH = 320;
export const SCENE_HEIGHT = 200;
export const SCENE_RESOLUTION = 3; // 3-multiplied pixel art

export const SPRITE_SIZE = 16;
// default frequency of all animated objects
export const ANIM_FREQUENCY = 10;

export const LEVEL_COLUMNS = 20;
export const LEVEL_ROWS = 12;

export const TEXT_COLOR_A = 0x53fb53;
export const TEXT_COLOR_B = 0xfbfb53;
export const TEXT_COLOR_C = 0xfc5454;
export const TEXT_COLOR_D = 0x5454fc;

export const SCORE_INCREMENT = 10;
export const GAME_SPEED = 1;

export const DEFAULT_FONT = 'DOSSenior';
export const FONT_SIZE_PX = 8;

export enum Assets {
	SPRITESHEET = 'spritesheet',
	LEVELS = 'levels',
	SOUND_CRASH = 'snd_crash',
	SOUND_LEVEL_COMPLETD = 'snd_level_completed',
	SOUND_PICK = 'snd_pick',
	SOUND_MOVE = 'snd_move'
}

export enum Tags {
	GAMEOBJECT = 'gameobject',
	DOOR = 'door',
	TRAIN = 'train',
	PASSWORD = 'password'
}

export enum Attributes {
	GAME_DATA = 'GAME_DATA',
	GAME_STATE = 'GAME_STATE'
}

export enum Messages {
	// in-component messages
	LEVEL_COMPLETED = 'level_completed',

	// messages for mutable state structures
	STATE_CHANGE_LEVEL = 'state_change_level',
	STATE_CHANGE_INIT_SCORE = 'state_change_init_score',
	STATE_CHANGE_CURRENT_SCORE = 'state_change_current_score',
	STATE_CHANGE_PAUSED = 'state_change_paused',

	STATE_CHANGE_TRAIN_CRASHED = 'state_change_train_crashed',
	STATE_CHANGE_TRAIN_POSITION = 'state_change_train_position',
	STATE_CHANGE_TRAIN_DIRECTION = 'state_change_direction',
	STATE_CHANGE_ITEM_PICKED = 'state_change_item_picked',
	STATE_CHANGE_DOOR_OPEN = 'state_change_door_open'
}
