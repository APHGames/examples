import * as ECS from 'colfio';
import { ECSExample } from '../utils/APHExample';
import { TranslateAnimation, typeToFunction, InterpolationType } from '../utils/animation';
import { Interpolation } from '../../libs/aph-math';

export type TweenTranslationConfig = ECS.EngineConfig & {
	interpolation: InterpolationType;
}

export class TweenTranslation extends ECSExample {

	interpolation: () => number;

	constructor(config: TweenTranslationConfig) {
		super(config);
		this.interpolation = (config && config.interpolation) ? typeToFunction(config.interpolation) : Interpolation.linear;
	}

	load() {
		let cmp = new TranslateAnimation(0, 0, this.engine.app.canvas.clientWidth - 200, this.engine.app.canvas.clientHeight - 200, 3000, true, 0);
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
