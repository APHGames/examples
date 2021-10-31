import { TrainController } from './train-controller';
import * as ECS from '../../../libs/pixi-ecs';
import { Direction } from '../model/game-structs';
import { Builders } from '../builders';

// intro direction sequence
const sequence = 'rrrrrrrrrrrrrrrrrrruuuuuuuullllllllllllllllllldrrrrrrrrrrrrrrrrrrrdllllllllllllllllllldrrrrrrrrrrrrrrrrrrrdllllllllllllllllllldrrrrrrrrrrrrrrrrrrrdllllllllllllllllllldddrrrrrrrrrd';

/**
 * Controller that navigates the train to follow the path above
 */
export class TrainIntroController extends TrainController {

	currentPointer = 0;

	onFixedUpdate() {
		const currentSeq = sequence[this.currentPointer++];
		this.changeDirection(currentSeq as Direction);

		// uncover intro sprites. Harcoded, but whatever... internal to this component only
		if(this.props.position.row === 9 && this.props.position.column >= 2 && this.props.position.column <= 18) {
			Builders.introTextBuilder(this.scene, this.props.position.column, this.owner.position.x, this.owner.position.y).build();
		}

		this.moveForward();
	}
}


