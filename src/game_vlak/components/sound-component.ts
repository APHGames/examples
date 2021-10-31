import * as ECS from '../../../libs/pixi-ecs';
import { Messages, Assets } from '../constants';
import PIXISound from 'pixi-sound';

/**
 * Event-based sound component
 */
export class SoundComponent extends ECS.Component {

	onInit() {
		this.subscribe(Messages.STATE_CHANGE_ITEM_PICKED, Messages.LEVEL_COMPLETED,
			Messages.STATE_CHANGE_TRAIN_CRASHED, Messages.STATE_CHANGE_TRAIN_POSITION);
	}

	onMessage(msg: ECS.Message) {
		if(msg.action === Messages.STATE_CHANGE_ITEM_PICKED) {
			PIXISound.play(Assets.SOUND_PICK);
		}
		if(msg.action === Messages.LEVEL_COMPLETED) {
			PIXISound.play(Assets.SOUND_LEVEL_COMPLETD);
		}
		if(msg.action === Messages.STATE_CHANGE_TRAIN_CRASHED) {
			PIXISound.play(Assets.SOUND_CRASH);
		}
		if(msg.action === Messages.STATE_CHANGE_TRAIN_POSITION) {
			PIXISound.play(Assets.SOUND_MOVE);
		}
	}
}