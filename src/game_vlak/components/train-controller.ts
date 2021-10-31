import { Direction } from '../model/game-structs';
import { Messages, GAME_SPEED } from '../constants';
import * as ECS from '../../../libs/pixi-ecs';
import Queue from '../../../libs/aph-math/structs-data/queue';
import { TrainState } from '../model/state-structs';
import { Actions } from '../actions';
import { Selectors } from '../selectors';
import { isOppositeDirection } from '../helpers';


/**
 * Controller of the train
 */
export class TrainController extends ECS.Component<TrainState> {

	// direction queue for stashing future directions
	protected directionQueue: Queue<Direction> = new Queue();
	// by default, the controller is inactive; we need to
	// explicitly switch it -> the train is waiting for the first input
	protected isActive = false;

	onInit() {
		this.subscribe(Messages.LEVEL_COMPLETED, Messages.STATE_CHANGE_TRAIN_CRASHED);
		// by default, 3 movements per second
		this.fixedFrequency = 3 * GAME_SPEED;
	}

	onFixedUpdate() {
		if(this.isActive) {
			if (!this.directionQueue.isEmpty()) {
				this.changeDirection(this.directionQueue.dequeue());
			}
			this.moveForward();
		}
	}


	onMessage(msg: ECS.Message) {
		if (msg.action === Messages.LEVEL_COMPLETED || msg.action === Messages.STATE_CHANGE_TRAIN_CRASHED) {
			this.finish();
		}
	}

	changeDirection(direction: Direction) {
		const gameState = Selectors.gameStateSelector(this.scene);
		if (gameState && gameState.paused) {
			return;
		}

		if (this.props.crashed) {
			throw new Error('Can\'t move! The train has crashed');
		}

		// the train can't go the opposite direction, if there already are some cars
		if (this.props.cars.length && isOppositeDirection(direction, this.props.position.direction)) {
			return;
		}

		// copy the position and add a new direction
		this.props.changeDirection(direction);
	}

	moveForward() {
		const gameState = Selectors.gameStateSelector(this.scene);
		if (gameState && gameState.paused) {
			return;
		}

		if (this.props.crashed) {
			throw new Error('Can\'t move! The train has crashed');
		}

		this.scene.addGlobalComponentAndRun(Actions.moveTrain(this.scene, this.props));
	}
}
