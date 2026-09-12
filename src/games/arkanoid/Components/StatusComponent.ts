import { FuncComponent } from 'colfio';
import type { Text } from 'pixi.js';
import { Model } from '../Model';
import {
	ATTR_MODEL,
	MSG_LEVEL_STARTED,
	MSG_ROUND_STARTED,
	MSG_GAME_OVER,
	MSG_LEVEL_COMPLETED,
	MSG_GAME_COMPLETED,
} from '../Constants';

export class StatusComponent extends FuncComponent {
	private model!: Model;

	constructor() {
		super(StatusComponent.name);
		this.doOnMessage(MSG_LEVEL_STARTED, () => this.showText(`LEVEL ${this.model.currentLevel}`));
		this.doOnMessage(MSG_ROUND_STARTED, () => this.showText(`ROUND ${this.model.currentRound}`));
		this.doOnMessage(MSG_GAME_OVER, () => this.showText(`GAME OVER`));
		this.doOnMessage(MSG_LEVEL_COMPLETED, () => this.showText(`LEVEL COMPLETED`));
		this.doOnMessage(MSG_GAME_COMPLETED, () => this.showText(`!!YOU FINISHED THE GAME!!`));
	}

	onInit() {
		super.onInit();
		this.model = this.scene.getGlobalAttribute(ATTR_MODEL);
	}

	protected showText(text: string) {
		const textObj = this.owner.pixiObj as Text;
		textObj.text = text;
		textObj.visible = true;

		this.scene.callWithDelay(1000, () => {
			textObj.visible = false;
		});
	}
}
