import * as ECS from '../../../libs/pixi-ecs';

/**
 * Component that waits for ENTER || SPACE key and then ends, can be used inside ChainComponent
 * for waiting actions
 */
export class WaitInputComponent extends ECS.Component {

	keyCmp: ECS.KeyInputComponent;

	onInit() {
		this.keyCmp = this.scene.getGlobalAttribute('key_input');
	}

	onUpdate() {
		if (this.keyCmp.isKeyPressed(ECS.Keys.KEY_SPACE) || this.keyCmp.isKeyPressed(ECS.Keys.KEY_ENTER)) {
			// we don't need to send a message, as the systems wait until this component has finished
			this.finish();
		}
	}
}