import * as ECS from '../../../libs/pixi-ecs';

const CAMERA_SPEED_COEFF = 0.00004;
const DISTANCE_THRESHOLD = 4;

/**
 * Smooth camera movement
 */
export class CameraController extends ECS.Component {
	car: ECS.Container;

	onInit() {
		this.car = this.scene.findObjectByTag('car');
	}

	onUpdate(delta: number, absolute: number) {
		const viewCenterX = this.scene.width / 2;
		const viewCenterY = this.scene.height / 2;
		const screenPosX = this.car.position.x + this.scene.stage.position.x;
		const screenPosY = this.car.position.y + this.scene.stage.position.y;

		const distanceX = Math.abs(screenPosX - viewCenterX);
		if (distanceX > DISTANCE_THRESHOLD) {
			// camera will slowly move to catch up with the object, X-axis
			// the higher the distance, the higher the speed
			const xspeed = delta * CAMERA_SPEED_COEFF * (distanceX * distanceX);
			const transX = xspeed * Math.sign(viewCenterX - screenPosX);
			this.scene.stage.position.x += transX;
		}

		const distanceY = Math.abs(screenPosY - viewCenterY);
		if (distanceY > DISTANCE_THRESHOLD) {
			const coeff = CAMERA_SPEED_COEFF * (this.scene.height / this.scene.width);
			// camera will slowly move to catch up with the object, Y-axis
			const yspeed = delta * coeff * Math.pow(distanceY, 2);
			const transY = yspeed * Math.sign(viewCenterY - screenPosY);
			this.scene.stage.position.y += transY;
		}
	}
}