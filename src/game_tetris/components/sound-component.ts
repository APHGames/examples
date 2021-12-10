import * as ECS from '../../../libs/pixi-ecs';
import { Messages, Assets } from '../constants';
import PIXISound from 'pixi-sound';

/**
 * Event-based sound component
 */
export class SoundComponent extends ECS.Component {

	onInit() {
		this.subscribe(Messages.GAME_OVER, Messages.LEVEL_UP, Messages.MOVE_DOWN_BEGIN,
			Messages.MOVE_DOWN_END, Messages.ROW_CLEARED, Messages.TETROMINO_PLACED,
			Messages.TETROMINO_ROTATED);
	}

	onAttach() {
		PIXISound.play(Assets.MUSIC, { loop: true });
	}

	onMessage(msg: ECS.Message) {
		if (msg.action === Messages.TETROMINO_ROTATED) {
			PIXISound.play(Assets.SOUND_ROTATE, { volume: 0.5 });
		} else if (msg.action === Messages.GAME_OVER) {
			PIXISound.stop(Assets.MUSIC);
			PIXISound.play(Assets.SOUND_GAMEOVER, { volume: 0.5 });
		} else if (msg.action === Messages.ROW_CLEARED) {
			PIXISound.stop(Assets.SOUND_MOVEDOWN);
			PIXISound.play(Assets.SOUND_ROWCLEAR, { volume: 0.3 });
		} else if (msg.action === Messages.TETROMINO_PLACED) {
			PIXISound.play(Assets.SOUND_PLACE, { volume: 0.5 });
		} else if (msg.action === Messages.LEVEL_UP) {
			PIXISound.play(Assets.SOUND_LEVELUP, { volume: 0.5 });
		} else if (msg.action === Messages.MOVE_DOWN_BEGIN) {
			PIXISound.play(Assets.SOUND_MOVEDOWN, { loop: true, volume: 0.5 });
		} else if (msg.action === Messages.MOVE_DOWN_END) {
			PIXISound.stop(Assets.SOUND_MOVEDOWN);
		}
	}
}