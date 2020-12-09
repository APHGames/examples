import * as ECS from '../../../libs/pixi-ecs';
import { Interpolation } from '../../../libs/aph-math';

export type InterpolationType = 'linear' | 'easeinout' | 'quadraticEaseIn' | 'quadraticEaseOut' | 'quadraticEaseInOut' | 'sineIn' | 'sineOut' | 'expoIn';

export function typeToFunction(str: InterpolationType) {
	switch(str) {
		case 'linear': return Interpolation.linear;
		case 'easeinout': return Interpolation.easeinout;
		case 'quadraticEaseIn': return Interpolation.quadraticEaseIn;
		case 'quadraticEaseOut': return Interpolation.quadraticEaseOut;
		case 'quadraticEaseInOut': return Interpolation.quadraticEaseInOut;
		case 'sineIn': return Interpolation.sineIn;
		case 'sineOut': return Interpolation.sineOut;
		case 'expoIn': return Interpolation.expoIn;
	}
}

export class BaseAnimation extends ECS.Component {
	// TODO move into props object
	protected duration = 0;
	protected goBack = false;
	protected goingBack = false;
	protected loops = 0;
	protected currentLoop = 0;
	protected startTime = 0;
	public interpolation: any = null;

	// loops = 0 for infinite!
	constructor(duration: number, goBack: boolean = false, loops: number = 1) {
		super();
		this.duration = duration;
		this.goBack = goBack;
		this.loops = loops;
		this.interpolation = Interpolation.linear;
	}

	onUpdate(delta: number, absolute: number) {
		if (this.startTime === 0) {
			this.startTime = absolute;
		}

		if (!this.goingBack) {
			// going forward
			let percent = this.interpolation(absolute, this.startTime, this.duration);
			this.applyAnim(percent, false);

			if (percent >= 1) {
				if (this.goBack) {
					this.goingBack = true;
					this.startTime = absolute;
				} else {
					this.finish();
				}
			}
		} else {
			// going back (only if goBack == true)
			let percent = this.interpolation(absolute, this.startTime, this.duration);
			this.applyAnim(percent, true);

			if (percent >= 1) {
				if (++this.currentLoop !== this.loops) {
					this.goingBack = !this.goingBack;
					this.startTime = absolute;
				} else {
					this.finish();
				}
			}
		}
	}

	protected applyAnim(percent: number, inverted: boolean) {
		// override in child classes
	}
}

export class TranslateAnimation extends BaseAnimation {
	protected srcPosX = 0;
	protected srcPosY = 0;
	protected targetPosX = 0;
	protected targetPosY = 0;
	// TODO move into props object
	constructor(srcPosX: number, srcPosY: number, targetPosX: number, targetPosY: number, duration: number, goBack: boolean = false, loops: number = 1) {
		super(duration, goBack, loops);
		this.srcPosX = srcPosX;
		this.srcPosY = srcPosY;
		this.targetPosX = targetPosX;
		this.targetPosY = targetPosY;
	}

	onInit() {
		super.onInit();
		this.owner.position.x = this.srcPosX;
		this.owner.position.y = this.srcPosY;
	}

	protected applyAnim(percent: number, inverted: boolean) {
		if (inverted) {
			this.owner.position.x = this.targetPosX + percent * (this.srcPosX - this.targetPosX);
			this.owner.position.y = this.targetPosY + percent * (this.srcPosY - this.targetPosY);
		} else {
			this.owner.position.x = this.srcPosX + percent * (this.targetPosX - this.srcPosX);
			this.owner.position.y = this.srcPosY + percent * (this.targetPosY - this.srcPosY);
		}
	}
}

export class RotationAnimation extends BaseAnimation {
	protected srcRot = 0;
	protected targetRot = 0;
	// TODO move into props object
	constructor(srcRot: number, targetRot: number, duration: number, goBack: boolean = false, loops: number = 1) {
		super(duration, goBack, loops);
		this.srcRot = srcRot;
		this.targetRot = targetRot;
	}

	onInit() {
		super.onInit();
		this.owner.rotation = this.srcRot;
	}

	protected applyAnim(percent: number, inverted: boolean) {
		if (inverted) {
			this.owner.rotation = this.targetRot + percent * (this.srcRot - this.targetRot);
		} else {
			this.owner.rotation = this.srcRot + percent * (this.targetRot - this.srcRot);
		}
	}
}
