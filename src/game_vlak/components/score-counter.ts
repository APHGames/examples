import * as ECS from '../../../libs/pixi-ecs';
import { Messages, SCORE_INCREMENT } from '../constants';
import { Selectors } from '../selectors';

/**
 * Component that updates score with every picked item
 */
export class ScoreCounter extends ECS.Component {

	onInit() {
		this.subscribe(Messages.STATE_CHANGE_ITEM_PICKED);
	}

	onMessage(msg: ECS.Message) {
		if(msg.action === Messages.STATE_CHANGE_ITEM_PICKED) {
			Selectors.gameStateSelector(this.scene).currentScore += SCORE_INCREMENT;
		}
	}

	onUpdate() {
		// okay - we don't actually need to set this text every single time, but
		// it's better to do it this way in case we'd decide to introduce some
		// other components that could modify the score,
		const gameState = Selectors.gameStateSelector(this.scene);
		this.owner.asBitmapText().text = `${gameState.currentScore}`;
	}
}