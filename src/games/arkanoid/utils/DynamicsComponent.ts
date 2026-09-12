import { Component } from 'colfio';
import Dynamics from './Dynamics';

export const ATTR_DYNAMICS = 'DYNAMICS';

export class DynamicsComponent extends Component {
	protected dynamics!: Dynamics;
	protected gameSpeed: number;

	constructor(gameSpeed: number = 1) {
		super();
		this.gameSpeed = gameSpeed;
	}

	onInit() {
		this.dynamics = this.owner.getAttribute(ATTR_DYNAMICS);
		if (this.dynamics == null) {
			this.dynamics = new Dynamics();
			this.owner.assignAttribute(ATTR_DYNAMICS, this.dynamics);
		}
	}

	onUpdate(delta: number, _absolute: number) {
		this.dynamics.applyVelocity(delta, this.gameSpeed);
		const deltaPos = this.dynamics.calcPositionChange(delta, this.gameSpeed);
		this.owner.pixiObj.position.x += deltaPos.x;
		this.owner.pixiObj.position.y += deltaPos.y;
	}
}
