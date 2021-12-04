/* eslint-disable no-use-before-define */
import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { ATTR_VELOCITY, ATTR_SCENE_MODEL, ATTR_BOTMODEL } from './constants';
import { BotModel } from './botmodel';
import { SceneModel } from './scenemodel';
import { SteeringComponent, WanderSteering, PursuitSteering } from './steering';

export class BotNoAIComponent extends ECS.Component {

	sceneModel: SceneModel;
	botModel: BotModel;

	onInit() {
		this.sceneModel = this.scene.getGlobalAttribute<SceneModel>(ATTR_SCENE_MODEL);
		this.botModel = this.owner.getAttribute<BotModel>(ATTR_BOTMODEL);
	}

	onUpdate(delta: number, absolute: number) {
		const direction = this.owner.getAttribute<ECS.Vector>(ATTR_VELOCITY).normalize();
		const position = new ECS.Vector(this.owner.position.x, this.owner.position.y);
		const mapPosition = this.sceneModel.worldToMap(position.x, position.y);
		this.botModel.updateAttributes(mapPosition, direction);
		this.botModel.updateViewCone();
	}
}
