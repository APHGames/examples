import * as ECS from '../../../libs/pixi-ecs';
import { CarComponent } from './car-component';

export class VehicleController extends ECS.Component {
	keyInput: ECS.KeyInputComponent;
	vehicle: CarComponent;

	constructor(carComponent: CarComponent) {
		super();
		this.vehicle = carComponent;
	}

	onInit() {
		this.keyInput = new ECS.KeyInputComponent();
		this.owner.addComponent(this.keyInput);
	}

	onUpdate() {
		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_UP)) {
			this.vehicle.trottleUp(0.003);
		}

		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_DOWN)) {
			this.vehicle.brakeReverse(0.002);
		}

		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT)) {
			this.vehicle.steer(-0.015);
		}

		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
			this.vehicle.steer(0.015);
		}
	}
}