import * as PIXI from 'pixi.js';
import { PIXIExample } from '../utils/APHExample';
export class Primitives extends PIXIExample {

	load() {
		const graphics = new PIXI.Graphics();
		graphics.rect(100, 150, 600, 250).fill({ color: 0x222222 });

		const circles = new PIXI.Graphics();

		circles.circle(250, 275, 90).stroke({ width: 1, color: 0xFFFFDD });
		circles.circle(250, 275, 70).stroke({ width: 1, color: 0xFFFFDD });
		circles.circle(250, 275, 50).fill({ color: 0xFFFFDD });

		graphics.addChild(circles);

		const circles2 = circles.clone(true);
		circles2.position.set(300, 0);
		graphics.addChild(circles2);

		graphics.moveTo(250 + 90, 275).lineTo(550 - 90, 275).stroke({ width: 1, color: 0xFFFFDD });

		this.app.stage.addChild(graphics);
	}

	update() {
		// no-op
	}
}
