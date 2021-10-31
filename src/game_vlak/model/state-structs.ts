import { MapObject, ObjectTypes, MapPosition, GameData, LevelData, Direction } from './game-structs';
import { LEVEL_COLUMNS, LEVEL_ROWS, Messages } from '../constants';
import * as ECS from '../../../libs/pixi-ecs';
import { getIndex, dirToCoordIncrement } from '../helpers';

/**
 * Base class for a mutable state that can send notification upon modification
 */
class ObservableState {
	protected scene: ECS.Scene;

	constructor(scene: ECS.Scene) {
		this.scene = scene;
	}

	public sendMessage(type: Messages, data?: any) {
		this.scene.sendMessage(new ECS.Message(type, null, null, data));
	}
}

/**
 * State of a car, MUTABLE
 */
export type CarState = {
	position: MapPosition;
	type: ObjectTypes;
}

/**
 * State of the train, MUTABLE
 */
export class TrainState extends ObservableState {
	// current loaded cars
	private readonly _cars: CarState[] = [];
	// crash indicator, set immediately before the crash animation even starts
	private _crashed = false;
	// current position on the map
	private _position: MapPosition;

	constructor(scene: ECS.Scene, initPosition: MapPosition) {
		super(scene);
		this._position = initPosition;
	}

	get cars() {
		return this._cars;
	}

	get position() {
		return this._position;
	}

	get crashed() {
		return this._crashed;
	}

	changeDirection(direction: Direction) {
		this._position = {
			...this._position,
			direction,
		};
		this.sendMessage(Messages.STATE_CHANGE_TRAIN_DIRECTION, direction);
	}

	/**
	 * Will apply the movement and reorders all cars
	 * Doesn't check for collisions, this is handled by the controlling component
	 */
	applyMovement() {
		const currentPos = this._position;
		let { x: colIncrement, y: rowIncrement } = dirToCoordIncrement(currentPos.direction);

		// move the cars
		for(let i = this._cars.length - 1; i >= 0; i--) {
			const car = this._cars[i];
			// get new position (and direction)
			const newPos = (i === 0) ?  currentPos : this._cars[i-1].position;
			// since the car state is immutable, we need to replace it completely
			this._cars[i].position = newPos;
		}

		// move the train
		this._position = {
			...currentPos, // copy other attributes
			column: currentPos.column + colIncrement,
			row: currentPos.row + rowIncrement,
		};

		this.sendMessage(Messages.STATE_CHANGE_TRAIN_POSITION, this._position);
	}

	crashTrain() {
		this._crashed = true;
		this.sendMessage(Messages.STATE_CHANGE_TRAIN_CRASHED);
	}

	addItemToTail(type: ObjectTypes) {
		const lastCarPos = this.cars.length === 0 ? this.position : this.cars[this.cars.length - 1].position;

		const newCar: CarState = {
			position: {
				...lastCarPos // clone it
			},
			type
		};
		this.cars.push(newCar);
		return newCar;
	}
}

/**
 * State of the current level, MUTABLE
 */
export class LevelState extends ObservableState {
	// all items yet to be picked up
	private readonly _itemsToPick: Map<number, MapObject> = new Map();
	private readonly _levelData: LevelData;
	private readonly _trainState: TrainState;
	private readonly _allObjects: MapObject[] = [];
	private _doorOpen = false;

	constructor(scene: ECS.Scene, levelData: LevelData) {
		super(scene);
		this._levelData = levelData;
		// place all items
		this._allObjects = [...levelData.allObjects]; // shallow copy
		this._allObjects.forEach((val, index) => {
			// put pickable items in a separate collection
			if(val.isItem) {
				this._itemsToPick.set(index, val);
			}
		});
		this._trainState = new TrainState(scene, levelData.trainInitPos);
	}

	// ================================================================
	// It is important to state here that the following functions do not
	// contain any business logic, apart from simple assertions.
	// State can only contain helper functions that make modifying it easier (+ notification facility)
	// ================================================================

	get levelData() {
		return this._levelData;
	}

	get doorOpen() {
		return this._doorOpen;
	}

	get trainState() {
		return this._trainState;
	}

	pickItem(column: number, row: number) {
		const index = getIndex(column, row);
		const olditem = this.allItemsPicked[index];
		// replace it with an empty object
		this._allObjects[index] = new MapObject(ObjectTypes.EMPTY, column, row);
		this._itemsToPick.delete(index);
		this.sendMessage(Messages.STATE_CHANGE_ITEM_PICKED, olditem);
	}

	openDoor() {
		this._doorOpen = true;
		this.sendMessage(Messages.STATE_CHANGE_DOOR_OPEN, true);
	}

	allItemsPicked() {
		return this._itemsToPick.size === 0;
	}

	getMapObject(column: number, row: number): MapObject {
		if (column >= LEVEL_COLUMNS || row >= LEVEL_ROWS || column < 0 || row < 0) {
			throw new Error(`Coordinates outside bounds: [${column}, ${row}]`);
		}
		const index = getIndex(column, row);
		return this._allObjects[index];
	}
}

/**
 * State of the game, MUTABLE
 */
export class GameState extends ObservableState {
	private _currentLevel: LevelState;
	// score in the beginning of the level
	private _initScore: number = 0;
	// current score (is reset whenever we lose)
	private _currentScore: number = 0;
	// indicator if the game is put on pause
	private _paused: boolean;
	private _gameData: GameData;

	constructor(scene: ECS.Scene, gameData: GameData) {
		super(scene);
		this._gameData = gameData;
	}

	get currentLevel() {
		return this._currentLevel;
	}

	get currentLevelIndex() {
		return this.gameData.levels.findIndex(lvl => lvl.name === this.currentLevel.levelData.name);
	}

	get gameData() {
		return this._gameData;
	}

	get initScore() {
		return this._initScore;
	}

	set initScore(score: number) {
		this._initScore = score;
		this.sendMessage(Messages.STATE_CHANGE_INIT_SCORE, score);
	}

	get currentScore() {
		return this._currentScore;
	}

	set currentScore(score: number) {
		this._currentScore = score;
		this.sendMessage(Messages.STATE_CHANGE_CURRENT_SCORE, score);
	}

	get paused() {
		return this._paused;
	}

	set paused(paused: boolean) {
		this._paused = paused;
		this.sendMessage(Messages.STATE_CHANGE_PAUSED, paused);
	}

	changeLevel(levelData: LevelData) {
		this._currentLevel = new LevelState(this.scene, levelData);
		this._initScore = this._currentScore;
		this._paused = false;
		this.sendMessage(Messages.STATE_CHANGE_LEVEL, levelData);
	}

	reloadLevel() {
		this._currentScore = this._initScore;
		this._paused = false;
		this._currentLevel = new LevelState(this.scene, this._currentLevel.levelData);
	}
}
