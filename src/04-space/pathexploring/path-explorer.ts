import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { Runner } from './runner';
import { GFXRenderer } from './gfx-renderer';
import { ECSExample } from '../../utils/APHExample';
import 'regenerator-runtime/runtime';

const ITERATIONS = 1000;

export class PathExplorer extends ECSExample {
	render: ECS.Graphics;

	load() {
		const renderer = new GFXRenderer();

		new ECS.Builder(this.engine.scene)
			.asGraphics()
			.withComponent(renderer)
			.withComponent(new Runner(renderer))
			.withParent(this.engine.scene.stage)
			.build();
	}
}
