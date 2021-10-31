import * as ECS from '../../../libs/pixi-ecs';
import { SPRITE_SIZE, LEVEL_ROWS, ANIM_FREQUENCY } from '../constants';

type WallfadeAnimatorProps = {
	type: 'fadein' | 'fadeout';
}

/**
 * Component that covers the screen with brick wall
 */
export class WallfadeAnimator extends ECS.Component<WallfadeAnimatorProps> {

	currentFrame = 0;
	progress = -1;

	onInit() {
		// wall animation is faster
		this.fixedFrequency = ANIM_FREQUENCY * 3;
		this.animate();
	}

	onFixedUpdate() {
		this.animate();
	}

	private animate() {
		this.progress = Math.min(this.progress + 1, LEVEL_ROWS);
		if (this.props.type === 'fadein') {
			this.owner.height = this.progress * SPRITE_SIZE;
		} else {
			// always increment by the whole row
			this.owner.height = (LEVEL_ROWS - this.progress) * SPRITE_SIZE;
		}
		if (this.progress === LEVEL_ROWS) {
			if (this.props.type === 'fadeout') {
				this.owner.destroy();
			}
			this.finish();
		}
	}
}