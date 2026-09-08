import * as ECS from 'colfio';
import { BotModel } from '../model';
import { Attributes, BotTypes } from '../constants';
import Dynamics from '../../../utils/dynamics';
import * as PIXI from 'pixi.js';
import { setTextureFrame } from '../../../utils/assets';


/**
 * Simple agent animation component that only switches between sprite sheet frames
 */
export class BotAnim extends ECS.Component {
	changeFrequency = 10;
	lastSwitchTime = 0;
	baseTexture: PIXI.Texture;
	currentFrameX = 0;

	onInit() {
		this.baseTexture = this.owner.asSprite().texture;
		let model = this.owner.getAttribute<BotModel>(Attributes.BOT_MODEL);
		// no animation
		if (model.agentType === BotTypes.BLUE) {
			setTextureFrame(this.owner.asSprite(), this.baseTexture, 0, 0, 128, 128);
		} else {
			setTextureFrame(this.owner.asSprite(), this.baseTexture, 0, 128, 128, 128);
		}
	}

	onUpdate(delta: number, absolute: number) {
		let model = this.owner.getAttribute<BotModel>(Attributes.BOT_MODEL);
		let dynamics = this.owner.getAttribute<Dynamics>(Attributes.DYNAMICS);
		let velocity = dynamics.velocity;

		if (velocity.magnitude() < 1) {
			// no animation
			if (model.agentType === BotTypes.BLUE) {
				setTextureFrame(this.owner.asSprite(), this.baseTexture, 0, 0, 128, 128);
			} else {
				setTextureFrame(this.owner.asSprite(), this.baseTexture, 0, 128, 128, 128);
			}
		} else {
			if (this.checkTime(this.lastSwitchTime, absolute, this.changeFrequency)) {
				this.lastSwitchTime = absolute;
				this.currentFrameX = (this.currentFrameX + 1) % 4;
				if (this.currentFrameX === 0) {
					this.currentFrameX = 1;
				}
				// switch animation
				if (model.agentType === BotTypes.BLUE) {
					setTextureFrame(this.owner.asSprite(), this.baseTexture, 128 * this.currentFrameX, 0, 128, 128);
				} else {
					setTextureFrame(this.owner.asSprite(), this.baseTexture, 128 * this.currentFrameX, 128, 128, 128);
				}
			}
		}
	}

	private checkTime(lastTime: number, time: number, frequency: number) {
		return (time - lastTime) > 1000 / frequency;
	}
}
