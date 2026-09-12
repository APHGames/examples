import { Component, Message } from 'colfio';
import { Model } from '../Model';
import { MSG_LIFE_LOST, ATTR_MODEL } from '../Constants';

export class LifeDisplayComponent extends Component {
	private model!: Model;

	onInit() {
		this.subscribe(MSG_LIFE_LOST);
		this.model = this.scene.getGlobalAttribute(ATTR_MODEL);
	}

	onMessage(msg: Message) {
		if (msg.action == MSG_LIFE_LOST) {
			const lifeName = `life_${this.model.currentLives + 1}`;
			const life = this.scene.findObjectByName(lifeName);
			life?.destroy();
		}
	}
}
