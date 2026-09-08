import * as ECS from 'colfio';
import { ECSExample } from '../utils/APHExample';
import { RotationAnimation, typeToFunction, InterpolationType } from '../utils/animation';
import { Interpolation } from '../../libs/aph-math';

export type TweenRotationConfig = ECS.EngineConfig & {
	interpolation: InterpolationType;
}

export class TweenRotation extends ECSExample {

	interpolation: () => number;

	constructor(config: TweenRotationConfig) {
		super(config);
		this.interpolation = (config && config.interpolation) ? typeToFunction(config.interpolation) : Interpolation.linear;
	}

	load() {
		let cmp = new RotationAnimation(0, 2 * Math.PI, 2000, true, 0);
		let graphics = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.5)
			.anchor(0.5)
			.withParent(this.engine.scene.stage)
			.withComponent(cmp)
			.build<ECS.Graphics>();

		const width = this.engine.app.canvas.width;

		graphics.rect(0, 0, width / 4, width / 4).fill({ color: 0xFF0000 });

		cmp.interpolation = this.interpolation;
	}
}
