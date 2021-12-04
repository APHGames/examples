/* eslint-disable no-use-before-define */
import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { MAP_CELL_SIZE, ATTR_BOTMODEL, ATTR_SCENE_MODEL, MAP } from './constants';
import { BotModel, MAX_PARTICLE_WEIGHT } from './botmodel';
import { SceneModel } from './scenemodel';

export class ParticleRenderer extends ECS.Component {
	bot: ECS.Container;

	constructor(bot: ECS.Container) {
		super();
		this.bot = bot;
	}

	onUpdate(delta: number, absolute: number) {

		const sceneModel = this.scene.getGlobalAttribute<SceneModel>(ATTR_SCENE_MODEL);
		const botModel = this.bot.getAttribute<BotModel>(ATTR_BOTMODEL);

		let render = this.owner.asGraphics();
		render.clear();

		for (let elevIndex of botModel.particleMap.elevations.keys()) {
			const vector = botModel.particleMap.vectorMapper(elevIndex);
			const elevation = botModel.particleMap.getElevation(vector);
			const worldPos = sceneModel.mapToWorld(vector.x, vector.y);

			if(elevation !== 0)  {
				if(elevation < 1) {
					render.beginFill(0x6da3fc, 0.2);
				} else if (elevation < 3) {
					render.beginFill(0x0363ff, 0.2);
				} else if (elevation < 5) {
					render.beginFill(0xfffbcc, 0.2);
				} else if (elevation < 8) {
					render.beginFill(0xdb8937, 0.2);
				} else {
					render.beginFill(0xdb2a38, 0.2);
				}
				render.drawRect(worldPos.x, worldPos.y, MAP_CELL_SIZE, MAP_CELL_SIZE);
				render.endFill();
			}
		}
	}
}
