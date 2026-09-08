import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { SeekComponent } from './steering-base';
import { colors } from '../utils/colors';
import { string2hex } from '../utils/assets';

export class SteeringSeek extends ECSExample {

	load() {
		let scene = this.engine.scene;
		let target = new ECS.Graphics('TARGET');
		target.circle(0, 0, 40).fill({ color: 0xe96f6f });
		target.position.x = scene.app.screen.width / 2;
		target.position.y = scene.app.screen.height / 2;
		scene.stage.addChild(target);
		let seekBoid = new ECS.Graphics('SEEK');
		seekBoid.poly([-10, -10, -10, 10, 15, 0]).fill({ color: string2hex(colors.tomatoLight) });
		seekBoid.scale.set(3);
		scene.stage.addChild(seekBoid);
		seekBoid.addComponent(new SeekComponent({
			target: target,
			speed: 10,
			initialVelocity: new ECS.Vector(100, 25)
		}));
	}
}
