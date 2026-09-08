import * as PIXI from 'pixi.js';
import { PIXIExample } from '../utils/APHExample';

export class Text extends PIXIExample {

	text: PIXI.Text;
	directionLeft = false;

	load() {
		const style = new PIXI.TextStyle({
			fontFamily: 'Arial',
			fontSize: 36,
			fill: '#ffffff',
			stroke: { color: '#4a1850', width: 5 },
		});

		this.text = new PIXI.Text({ text: 'Hello World', style });
		this.text.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
		this.text.anchor.set(0.5);
		this.app.stage.addChild(this.text);
	}

	update(deltaTime: number) {
		if (this.directionLeft) {
			this.text.position.x -= deltaTime * 2;
		} else {
			this.text.position.x += deltaTime * 2;
		}

		const bounds = this.text.getBounds();
		if (bounds.left < 0) {
			this.directionLeft = false;
		} else if (bounds.right > this.app.screen.width) {
			this.directionLeft = true;
		}
	}
}
