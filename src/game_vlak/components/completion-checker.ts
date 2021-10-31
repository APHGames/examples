import * as ECS from '../../../libs/pixi-ecs';
import { Messages } from '../constants';
import * as PIXI from 'pixi.js';
import { ObjectTypes, MapPosition } from '../model/game-structs';
import { Actions } from '../actions';
import { LevelState, GameState } from '../model/state-structs';
import { Selectors } from '../selectors';


/**
 * Component that checks if all items have been collected
 */
export class CompletionChecker extends ECS.Component {

	onInit() {
		this.subscribe(Messages.STATE_CHANGE_TRAIN_POSITION, Messages.STATE_CHANGE_ITEM_PICKED);
	}

	onMessage(msg: ECS.Message) {
		const levelState = Selectors.gameStateSelector(this.scene).currentLevel;

		if(msg.action === Messages.STATE_CHANGE_TRAIN_POSITION) {
			const pos = msg.data as MapPosition;
			const targetObject = levelState.getMapObject(pos.column, pos.row);

			// for more coupled solution, we could also put this into Actions.moveTrain
			// and create two simple if-checks
			if(targetObject && targetObject.type === ObjectTypes.DOOR) {
				this.scene.addGlobalComponentAndRun(Actions.completeLevel(this.scene));
			}
		} else if(msg.action === Messages.STATE_CHANGE_ITEM_PICKED) {
			if (levelState.allItemsPicked()) {
				this.scene.addGlobalComponentAndRun(Actions.openDoor(this.scene));
			}
		}
	}
}