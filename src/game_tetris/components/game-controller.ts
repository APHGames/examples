import * as ECS from '../../../libs/pixi-ecs';
import { GameModel } from '../model/game-model';
import { Direction } from '../model/tetrominos';
import { Messages, GAME_CONFIG } from '../constants';
import { Factory } from '../factory';

/**
 * Helper for time-based actions
 */
class TimeWatcher {
	lastInputTime = 0;
	lastProgressTime = 0;
	lastManualProgressTime = 0;
	inputNum = 0;
	gameSpeed = 1;

	private scene: ECS.Scene;

	constructor(scene: ECS.Scene) {
		this.scene = scene;
	}

	canMoveAside() {
		if ((this.inputNum === 0 || this.inputNum === 1) && this.isTime(this.lastInputTime,
			this.scene.currentAbsolute, GAME_CONFIG.moveAsideFirstDelay)) {

			this.lastInputTime = this.scene.currentAbsolute;
			this.inputNum++;
			return true;
		}

		if (this.inputNum >= 2 && this.isTime(this.lastInputTime,
			this.scene.currentAbsolute, GAME_CONFIG.moveAsideOtherDelay)) {
			this.lastInputTime = this.scene.currentAbsolute;
			this.inputNum++;
			return true;
		}
		return false;
	}

	resetMoveAside() {
		this.lastInputTime = 0;
		this.inputNum = 0;
	}

	canMoveDown() {
		if (this.isTime(this.lastManualProgressTime, this.scene.currentAbsolute,
			GAME_CONFIG.moveDownManualDelay)) {
			this.lastManualProgressTime = this.scene.currentAbsolute;
			return true;
		}
		return false;
	}


	canGameProgress() {
		if (this.isTime(this.lastProgressTime, this.scene.currentAbsolute,
			GAME_CONFIG.moveDownAutoDelay / this.gameSpeed)) {
			this.lastProgressTime = this.scene.currentAbsolute;
			return true;
		}
		return false;
	}

	private isTime(lastActionTime: number, currentTime: number, period: number) {
		return (currentTime - lastActionTime) >= period;
	}
}

/**
 * Game controller that also works as an input controller for derived classes
 */
export class GameController extends ECS.Component<GameModel> {

	moveDownCounter = 0; // we get extra score if we hold the down key
	timeWatch: TimeWatcher;
	paused: boolean; // if true, user input is blocked

	onInit() {
		this.timeWatch = new TimeWatcher(this.scene);
		this.paused = false;
		this.subscribe(Messages.CONTROLLER_BLOCK, Messages.CONTROLLER_RUN);
		this.updateGameSpeed();
	}

	onMessage(msg: ECS.Message) {
		if (msg.action === Messages.CONTROLLER_RUN) {
			this.paused = false;
		} else if (msg.action === Messages.CONTROLLER_BLOCK) {
			this.paused = true;
		}
	}

	cancelMovement() {
		this.timeWatch.resetMoveAside();
	}

	endGame() {
		this.scene.callWithDelay(0, () =>
			new Factory().loadHighScoreSaver(this.scene, this.props.currentScore));
	}

	/**
	 * Moves player along a new direction.
	 * @param direction target direction
	 * @param speedup flag for extra score calc when the player holds the DOWN key
	 */
	movePlayer(direction: Direction, speedup = false): boolean {
		if (!this.props.hasTetromino) {
			return;
		}

		if (direction === Direction.DOWN && this.timeWatch.canMoveDown()) {
			if(speedup && this.moveDownCounter === 0) {
				this.initMovementDown();
			}
			// move down
			if (!this.props.canMoveTetromino(Direction.DOWN)) {
				const currentLevel = this.props.currentLevel;
				const rowsToRemove = this.props.applyTetromino(this.moveDownCounter);
				this.resetMovementDown();
				this.sendMessage(Messages.MOVE_DOWN_END);

				if (rowsToRemove.length) {
					this.sendMessage(Messages.ROW_CLEARED, rowsToRemove);
				} else {
					this.sendMessage(Messages.TETROMINO_PLACED);
				}
				if (this.props.isGameOver) {
					this.sendMessage(Messages.GAME_OVER);
				}
				if(currentLevel !== this.props.currentLevel) {
					this.sendMessage(Messages.LEVEL_UP);
					this.updateGameSpeed();
				}
			} else {
				this.props.moveTetromino(Direction.DOWN);
				this.moveDownCounter++;
			}
		} else if (direction !== Direction.DOWN && this.timeWatch.canMoveAside()) {
			// move aside
			if (this.props.canMoveTetromino(direction)) {
				this.props.moveTetromino(direction);
			}
		}
	}

	initMovementDown() {
		this.moveDownCounter = 0;
		this.sendMessage(Messages.MOVE_DOWN_BEGIN);
	}

	resetMovementDown() {
		if(this.moveDownCounter !== 0) {
			this.moveDownCounter = 0;
			this.sendMessage(Messages.MOVE_DOWN_END);
		}
	}

	rotatePlayer(direction: Direction) {
		if (!this.props.hasTetromino) {
			return;
		}
		if (this.props.canRotate(direction)) {
			this.props.rotate(direction);
			this.sendMessage(Messages.TETROMINO_ROTATED);
		}
	}

	onUpdate(delta: number, absolute: number) {
		if (this.paused) {
			return;
		}

		if (this.props.hasTetromino && this.timeWatch.canGameProgress()) {
			this.movePlayer(Direction.DOWN);
		} else if(!this.props.hasTetromino) {
			this.props.putRandomTetromino();
		}
	}

	private updateGameSpeed() {
		this.timeWatch.gameSpeed = this.props.currentLevel * GAME_CONFIG.gameSpeedMultiplier + 1;
	}
}

/**
 * Game controller for keyboard device
 */
export class GameKeyboardController extends GameController {
	keyInput: ECS.KeyInputComponent;

	onInit() {
		super.onInit();
		this.keyInput = this.scene.findGlobalComponentByName(ECS.KeyInputComponent.name);
	}

	onUpdate(delta: number, absolute: number) {
		if (this.paused) {
			return;
		}

		// when the game ends, we need to press the spacebar to get to the highscore table
		if (this.props.isGameOver) {
			if (this.keyInput.isKeyPressed(ECS.Keys.KEY_SPACE)) {
				this.endGame();
				this.finish();
			}
			return;
		}

		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_A)) {
			this.rotatePlayer(Direction.LEFT);
			this.keyInput.handleKey(ECS.Keys.KEY_A);
		} else if (this.keyInput.isKeyPressed(ECS.Keys.KEY_S)) {
			this.rotatePlayer(Direction.RIGHT);
			this.keyInput.handleKey(ECS.Keys.KEY_S);
		} else {
			if (this.keyInput.isKeyPressed(ECS.Keys.KEY_DOWN)) {
				this.movePlayer(Direction.DOWN, true);
			} else {
				this.resetMovementDown();
			}
			if (this.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT)) {
				this.movePlayer(Direction.LEFT);
			} else if (this.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
				this.movePlayer(Direction.RIGHT);
			} else {
				this.cancelMovement();
			}
		}
		super.onUpdate(delta, absolute);
	}
}