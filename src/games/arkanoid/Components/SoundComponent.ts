import { FuncComponent } from 'colfio';
import { sound } from '@pixi/sound';
import {
	MSG_GAME_STARTED,
	MSG_ROUND_STARTED,
	MSG_OBJECT_HIT,
	MSG_GAME_OVER,
	MSG_LEVEL_COMPLETED,
	MSG_LEVEL_STARTED,
	MSG_GAME_COMPLETED,
	SOUND_ROUND,
	SOUND_HIT,
	SOUND_GAMEOVER,
	SOUND_INTRO,
} from '../Constants';

export class SoundComponent extends FuncComponent {
	constructor() {
		super(SoundComponent.name);

		this.doOnMessage(MSG_ROUND_STARTED, () => this.play(SOUND_ROUND));
		this.doOnMessage(MSG_OBJECT_HIT, () => this.play(SOUND_HIT));
		this.doOnMessage(MSG_GAME_OVER, () => this.play(SOUND_GAMEOVER));
		this.doOnMessage(MSG_LEVEL_COMPLETED, () => this.play(SOUND_GAMEOVER));
		this.doOnMessage(MSG_LEVEL_STARTED, () => this.play(SOUND_ROUND));
		this.doOnMessage(MSG_GAME_STARTED, () => this.play(SOUND_INTRO));
		this.doOnMessage(MSG_GAME_COMPLETED, () => this.play(SOUND_GAMEOVER));
	}

	private play(alias: string) {
		try {
			sound.play(alias);
		} catch {
			/* autoplay / missing audio must not stop the game loop */
		}
	}
}
