import * as ECS from '../../../libs/pixi-ecs';
import { CLISpriteRenderer } from '../cli-renderer/cli-sprite-renderer';
import { Factory } from '../factory';

/**
 * Component that renders a box with respective levels the player can choose from
 */
export class LevelSelector extends ECS.Component {

	cli: CLISpriteRenderer;
	keyInput: ECS.KeyInputComponent;
	currentLevel = 0;

	onInit() {
		this.cli = this.scene.findGlobalComponentByName(CLISpriteRenderer.name);
		this.keyInput = this.scene.findGlobalComponentByName(ECS.KeyInputComponent.name);
	}

	onUpdate() {
		const centerX = Math.floor(this.cli.props.columns / 2);
		const centerY = Math.floor(this.cli.props.rows / 2);

		this.cli.drawBox(centerX - 12, centerY - 4, 12 * 2, 4 * 2);
		this.cli.drawText('Select level', centerX - 12, centerY - 4, 'center', 12 * 2);

		for(let i = 0; i <= 9; i++) {
			if(i === this.currentLevel) {
				this.cli.enableHighlight();
			}

			this.cli.drawText(` ${i} `, centerX - 12 + (i % 5) * 3 + 4, centerY - 1 + Math.floor(i / 5));

			if(i === this.currentLevel) {
				this.cli.disableHighlight();
			}
		}

		if(this.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT)) {
			this.keyInput.handleKey(ECS.Keys.KEY_LEFT);
			if(this.currentLevel > 0 || this.currentLevel > 5) {
				this.currentLevel--;
			}
		} else if(this.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
			this.keyInput.handleKey(ECS.Keys.KEY_RIGHT);
			if(this.currentLevel < 4 || this.currentLevel < 9) {
				this.currentLevel++;
			}
		} else if(this.keyInput.isKeyPressed(ECS.Keys.KEY_UP)) {
			this.keyInput.handleKey(ECS.Keys.KEY_UP);
			if(this.currentLevel > 4) {
				this.currentLevel-= 5;
			}
		} else if(this.keyInput.isKeyPressed(ECS.Keys.KEY_DOWN)) {
			this.keyInput.handleKey(ECS.Keys.KEY_DOWN);
			if(this.currentLevel < 5) {
				this.currentLevel+= 5;
			}
		}

		if(this.keyInput.isKeyPressed(ECS.Keys.KEY_SPACE)) {
			this.scene.callWithDelay(0, () =>
				new Factory().loadGame(this.scene, this.currentLevel));
			this.finish();
		}
	}
}