/* eslint-disable no-use-before-define */
import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { ATTR_VELOCITY, ATTR_SCENE_MODEL, ATTR_BOTMODEL } from './constants';
import { BotModel } from './botmodel';
import { SceneModel } from './scenemodel';
import { SteeringComponent, WanderSteering, PursuitSteering, FollowSteering } from './steering';

export class BotAIComponent extends ECS.Component {

	sceneModel: SceneModel;
	botModel: BotModel;
	currentSteering: SteeringComponent;
	isInSight = false;

	onInit() {
		this.sceneModel = this.scene.getGlobalAttribute<SceneModel>(ATTR_SCENE_MODEL);
		this.botModel = this.owner.getAttribute<BotModel>(ATTR_BOTMODEL);

		this.wander();
	}

	clearSteering() {
		if(this.currentSteering && !this.currentSteering.isCompleted) {
			this.currentSteering.finish();
		}
	}

	wander() {
		this.clearSteering();
		this.currentSteering = new WanderSteering(0, 10, 0.1);
		this.owner.addComponent(this.currentSteering);
	}

	pursueBot(bot: BotModel) {
		const targetObj = this.scene.findObjectById(bot.id);
		const realPos = new ECS.Vector(targetObj.position.x, targetObj.position.y);

		if(this.currentSteering && this.currentSteering.name !== PursuitSteering.name) {
			this.clearSteering();
		}

		if(this.currentSteering && this.currentSteering.name === PursuitSteering.name) {
			(this.currentSteering as PursuitSteering).target = realPos;
		} else {
			const velocity = this.owner.getAttribute<ECS.Vector>(ATTR_VELOCITY);
			this.currentSteering = new PursuitSteering(velocity, realPos);
			this.owner.addComponent(this.currentSteering);
			this.botModel.pursueBot(bot);
		}
	}

	checkSpot(spot: ECS.Vector) {
		if(this.currentSteering) {
			this.clearSteering();
		}

		this.currentSteering = new FollowSteering(this.sceneModel.map, this.botModel.position, spot);
		this.owner.addComponent(this.currentSteering);
		this.botModel.pursuedPosition =	spot;

	}

	onUpdate(delta: number, absolute: number) {
		const velocity = this.owner.getAttribute<ECS.Vector>(ATTR_VELOCITY);
		const direction = velocity.normalize();
		const position = new ECS.Vector(this.owner.position.x, this.owner.position.y);
		const mapPosition = this.sceneModel.worldToMap(position.x, position.y);
		this.botModel.updateAttributes(mapPosition, direction);
		this.botModel.updateViewCone();

		if(!this.botModel.pursuedBot) {
			// look for a bot to pursue
			const targetBot = this.botModel.lookForBotsInSight(this.sceneModel.bots.filter(bot => bot.id !== this.botModel.id));
			if(targetBot) {
				this.isInSight = true;
				this.pursueBot(targetBot);
			}
		} else {
			if(this.botModel.targetBotInSight()) {
				// update pursuing pos
				this.isInSight = true;
				this.pursueBot(this.botModel.pursuedBot);
			} else {
				if(this.isInSight) {
					// we have just lost the sight -> initiate particle filtering
					this.botModel.searchForBot();
				}
				this.isInSight = false;
				if(this.currentSteering.isCompleted || (this.currentSteering.name !== WanderSteering.name && this.botModel.targetSpotInSight())) {
					const hotSpot = this.botModel.findNextHotSpot();
					if(hotSpot) {
						this.checkSpot(hotSpot);
					} else {
						if(this.botModel.searchingAttempt < 5) {
							this.botModel.searchForBot();
						} else {
							this.wander();
						}
					}
				}
			}
		}
	}
}
