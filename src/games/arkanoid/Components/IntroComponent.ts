import { Component } from 'colfio';
import { ATTR_MODEL, MSG_GAME_STARTED, ATTR_FACTORY } from '../Constants';
import { Factory } from '../Factory';
import { Model } from '../Model';

export class IntroComponent extends Component {
	private model!: Model;
	private factory!: Factory;

	onInit() {
		this.model = this.scene.getGlobalAttribute(ATTR_MODEL);
		this.sendMessage(MSG_GAME_STARTED);
		this.factory = this.scene.getGlobalAttribute(ATTR_FACTORY);

		this.scene.callWithDelay(5000, () => {
			this.model.currentLevel = 1;
			this.factory.resetGame(this.scene, this.model);
		});
	}
}
