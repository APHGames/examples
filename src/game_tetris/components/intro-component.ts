import * as ECS from '../../../libs/pixi-ecs';
import { CLISpriteRenderer } from '../cli-renderer/cli-sprite-renderer';
import { Factory } from '../factory';

const introText =
[
	[1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,0,0,1,0,0,1,1,1],
	[0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
	[0,0,1,0,0,0,1,1,0,0,0,0,1,0,0,0,1,1,1,0,0,0,1,0,0,1,1,1],
	[0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,1],
	[0,0,1,0,0,0,1,1,1,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,1,1],
];

/**
 * Component that renders TETRIS text and waits for user input
 */
export class IntroComponent extends ECS.Component {

	cli: CLISpriteRenderer;
	keyInput: ECS.KeyInputComponent;

	onInit() {
		this.cli = this.scene.getGlobalAttribute('cli');
		this.keyInput = this.scene.getGlobalAttribute('key_input');
	}

	onAttach() {
		const anim = Math.floor(this.cli.props.rows / 2) - 4;
		let rowCounter = 0;
		let contText = 'PRESS SPACEBAR TO CONTINUE';
		let currentText = '';

		// transform number array into a string
		const introTextStr = introText.reduce((str, arr) => str
			+ arr.map(it => it === 0 ? '  ' : '▐█').join('') + '\n', '');

		this.owner.addComponent(new ECS.ChainComponent()
			.beginWhile(() => (rowCounter < anim))
			.call(() => {
				this.cli.clear();
				this.cli.drawText(introTextStr, 11, rowCounter++, 'left', this.cli.props.columns);
			})
			.waitTime(150)
			.endWhile()
			.beginWhile(() => contText !== currentText)
			.call(() => {
				currentText = contText.substring(0, currentText.length + 1);
				this.cli.drawText(currentText, 0, 15, 'center', this.cli.props.columns);
			})
			.waitFrames(1)
			.endWhile());
	}

	onUpdate() {
		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_SPACE)) {
			// clear out the scene and render level selector
			this.scene.callWithDelay(0, () => new Factory().loadLevelSelector(this.scene));
			this.finish();
		}
	}
}