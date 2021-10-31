import { TrainController } from './train-controller';
import * as ECS from '../../../libs/pixi-ecs';

/**
 * Keyboard controller that uses a queue if the player presses more buttons at once
 */
export class TrainKeyboardController extends TrainController {

	private keyInputCmp: ECS.KeyInputComponent;

	onInit() {
		super.onInit();
		this.keyInputCmp = this.scene.findGlobalComponentByName<ECS.KeyInputComponent>(ECS.KeyInputComponent.name);
	}

	onUpdate() {
		if (this.keyInputCmp.isKeyPressed(ECS.Keys.KEY_LEFT) && this.directionQueue.peek() !== 'l') {
			this.keyInputCmp.handleKey(ECS.Keys.KEY_LEFT);
			this.directionQueue.enqueue('l');
			this.isActive = true;
		} else if (this.keyInputCmp.isKeyPressed(ECS.Keys.KEY_DOWN) && this.directionQueue.peek() !== 'd') {
			this.keyInputCmp.handleKey(ECS.Keys.KEY_DOWN);
			this.directionQueue.enqueue('d');
			this.isActive = true;
		} else if (this.keyInputCmp.isKeyPressed(ECS.Keys.KEY_UP) && this.directionQueue.peek() !== 'u') {
			this.keyInputCmp.handleKey(ECS.Keys.KEY_UP);
			this.directionQueue.enqueue('u');
			this.isActive = true;
		} else if (this.keyInputCmp.isKeyPressed(ECS.Keys.KEY_RIGHT) && this.directionQueue.peek() !== 'r') {
			this.keyInputCmp.handleKey(ECS.Keys.KEY_RIGHT);
			this.directionQueue.enqueue('r');
			this.isActive = true;
		}
	}
}