/* eslint-disable no-use-before-define */
import * as ECS from 'colfio';
import * as PIXI from 'pixi.js';
import { MAP_CELL_SIZE, ATTR_BOTMODEL, ATTR_SCENE_MODEL, MAP } from './constants';
import { BotModel } from './botmodel';
import { SceneModel } from './scenemodel';

export class ConeRenderer extends ECS.Component {
	bot: ECS.Container;
	coneColor: number;

	constructor(bot: ECS.Container, coneColor: number) {
		super();
		this.coneColor = coneColor;
		this.bot = bot;
	}

	onUpdate(delta: number, absolute: number) {
		const sceneModel = this.scene.getGlobalAttribute<SceneModel>(ATTR_SCENE_MODEL);
		const botModel = this.bot.getAttribute<BotModel>(ATTR_BOTMODEL);

		let render = this.owner.asGraphics();
		render.clear();
		const color = botModel.targetBotInSight() ? 0xFF6822 : this.coneColor;

		for (let block of botModel.visibleBlocks) {
			const blockVector = sceneModel.map.vectorMapper(block);
			const worldPos = sceneModel.mapToWorld(blockVector.x, blockVector.y);
			render.rect(worldPos.x, worldPos.y, MAP_CELL_SIZE, MAP_CELL_SIZE);
		}

		render.fill({ color, alpha: 0.2 });
	}
}
