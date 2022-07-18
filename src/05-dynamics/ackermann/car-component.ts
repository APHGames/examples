import * as ECS from '../../../libs/pixi-ecs';
import { CarEngine } from './carengine';
import { Wheel } from './wheel';
import { calcAbsPos } from './utils';

export type CarComponentProps = {
	// min radius of a circle around which the car can rotate
	minSteeringRadius?: number;
	maxSteeringRadius?: number;
	// original rotation
	rotation: number;
	wheelSize: number;
	// distance between front and back wheels (l)
	wheelBase: number;
	// distance between the left and the right wheel (w)
	trackWidth: number;
}

const defaultProps = {
	minSteeringRadius: 80,
	maxSteeringRadius: 1000,
	rotation: 0,
};

type Wheels = {
	frontLeft: Wheel;
	frontRight: Wheel;
	backLeft: Wheel;
	backRight: Wheel;
}

export class CarComponent extends ECS.Component<CarComponentProps> {
	rotation = 0;

	wheels: Wheels = {
		frontLeft: null,
		frontRight: null,
		backLeft: null,
		backRight: null
	}
	// precalculated center of back wheels along x axis
	centerOfBackWheelsX = 0;
	// current steering radius
	steerRadius = 0;
	// current steering angle
	steerAngle = 0.5 * Math.PI;
	engine = new CarEngine();

	newSteerAngle = 0;

	constructor(props: CarComponentProps) {
		// merge with defaults
		super({
			...defaultProps,
			...props
		});
		this._name = 'CarComponent';
		this.rotation = this.props.rotation;
	}

	onInit() {
		this.wheels.frontLeft = new Wheel(this.props.wheelSize, this.props.wheelBase / 2, -(this.props.trackWidth / 2));
		this.wheels.frontRight = new Wheel(this.props.wheelSize, this.props.wheelBase / 2, this.props.trackWidth / 2);
		this.wheels.backLeft = new Wheel(this.props.wheelSize, -(this.props.wheelBase / 2), -(this.props.trackWidth / 2));
		this.wheels.backRight = new Wheel(this.props.wheelSize, -(this.props.wheelBase / 2), this.props.trackWidth / 2);

		this.centerOfBackWheelsX = (this.wheels.backLeft.xOffset + this.wheels.backRight.xOffset) / 2;
	}

	trottleUp(amount: number) {
		this.engine.trottleUp(amount);
	}

	/**
	 * Brake while reverse gear is on
	 */
	brakeReverse(power: number) {
		this.engine.brakeReverse(power);
	}

	brake(power: number) {
		this.engine.brake(power);
	}

	/**
	 * Applies steering
	 * @angleDelta delta angle in radians
	 */
	steer(angleDelta: number) {
		if (this.steerAngle + angleDelta > Math.PI) {
			this.newSteerAngle = -this.steerAngle + angleDelta;
		} else {
			this.newSteerAngle = this.steerAngle + angleDelta;
		}
		// calculate ackermann rotation
		const steeringRadius = Math.tan(this.newSteerAngle) * this.props.wheelBase;

		if (Math.abs(steeringRadius) > this.props.minSteeringRadius) {
			this.steerAngle = this.newSteerAngle;
			this.steerRadius = steeringRadius;

			// every front wheel will have a slightly different angle
			for (let wheel of [this.wheels.frontLeft, this.wheels.frontRight]) {
				const targetAngle = Math.atan((this.centerOfBackWheelsX - wheel.xOffset) / (wheel.yOffset - steeringRadius));
				wheel.rotation = targetAngle;
			}
		}
	}

	onUpdate(delta: number, absolute: number) {
		this.engine.update(delta);

		if (Math.abs(this.steerRadius) > 0 && Math.abs(this.steerRadius) < this.props.maxSteeringRadius) {
			// the car is rotating around a circle -> we need to use Ackermann equations
			const ackPos = calcAbsPos(this.owner.position.x, this.owner.position.y, this.rotation, this.centerOfBackWheelsX, this.steerRadius);
			const ackCenter = Math.sqrt(this.centerOfBackWheelsX * this.centerOfBackWheelsX + this.steerRadius * this.steerRadius);

			// calculate offsets and angular speed
			const angle = Math.atan2(this.owner.position.x - ackPos.x, this.owner.position.y - ackPos.y);
			const distance = this.engine.velocity;

			let angularSpeed = Math.sign(this.steerRadius) * distance / ackCenter;

			// change position and rotation
			const targetX = ackPos.x + ackCenter * Math.sin(angle + angularSpeed);
			const targetY = ackPos.y + ackCenter * Math.cos(angle + angularSpeed);
			this.owner.position.set(targetX, targetY);
			this.rotation += angularSpeed;
		} else {
			// the car is going straight ahead
			this.owner.position.x += this.engine.velocity * Math.sin(this.rotation);
			this.owner.position.y += this.engine.velocity * Math.cos(this.rotation);
		}
	}
}