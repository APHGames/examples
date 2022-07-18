import * as ECS from '../../libs/pixi-ecs';
import { ECSExample } from '../utils/APHExample';

type CarEngineProps = {
	// distance between front and back wheels (l)
	wheelBase: number;
	// distance between the left and the right wheel (w)
	trackWidth: number;
}

class CarEngine extends ECS.Component<CarEngineProps> {
	speed = 0;
	// current steering value, from -1 (-30°) to 1 (30°)
	steering = 0;
	// rotation of the car
	theta = -Math.PI / 2;
	// steering speed, in degrees per second
	steerSpeed = 0;

	// center angle (radians)
	phi = 0;
	// front left (radians)
	phiI = 0;
	// front right (radians)
	phiO = 0;

	/**
	 * Max steering angle in radians
	 */
	get steerLock() {
		// 30 is the maximum
		return 30 / 180 * Math.PI;
	}

	move(accel: number) {
		this.speed = accel;
	}

	/**
	 * Will steer the car
	 * @param steering: a relative value from -1 to 1, limited by steerlock
	 */
	steer(steering: number) {
		this.steering = steering;
		this.phi = this.steerLock * this.steering;
		// atan2(2l*sin(phi), 2l*cos(phi) - w*sin(phi))
		this.phiI = Math.atan2(2 * this.props.wheelBase * Math.sin(this.phi),
			2 * this.props.wheelBase * Math.cos(this.phi) - this.props.trackWidth * Math.sin(this.phi));
		// atan2(2l*sin(phi), 2l*cos(phi) + w*sin(phi))
		this.phiO = Math.atan2(2 * this.props.wheelBase * Math.sin(this.phi),
			2 * this.props.wheelBase * Math.cos(this.phi) + this.props.trackWidth * Math.sin(this.phi));
	}

	onUpdate(delta: number, absolute: number) {
		const diff = this.speed * delta * 0.25; // slow it down a little bit
		this.owner.position.x += diff * Math.cos(this.theta);
		this.owner.position.y += diff * Math.sin(this.theta);
		this.theta += diff / this.props.wheelBase * Math.tan(this.phi);
		this.owner.rotation = this.theta - Math.PI / 2;
	}
}

type CarRendererProps = {
	wheelColor?: number;
	trackColor?: number;
	frontWheelWidth?: number;
	frontWheelHeight?: number;
	backWheelWidth?: number;
	backWheelHeight?: number;
}

const defaultProps: CarRendererProps = {
	wheelColor: 0x2C57DF,
	trackColor: 0x7893EA,
	frontWheelWidth: 10,
	frontWheelHeight: 30,
	backWheelWidth: 15,
	backWheelHeight: 30
};

class CarRenderer extends ECS.Component<CarRendererProps> {

	// front wheels use a separate Graphics objects, as they thave their own rotations
	frontLeft: ECS.Graphics;
	frontRight: ECS.Graphics;
	carEngine: CarEngine;

	constructor(props: CarRendererProps, engine: CarEngine) {
		super({
			...defaultProps,
			...props
		});
		this.carEngine = engine;
	}

	onInit() {
		this.frontLeft = new ECS.Graphics();
		this.owner.addChild(this.frontLeft);
		this.frontRight = new ECS.Graphics();
		this.owner.addChild(this.frontRight);
	}

	onUpdate(delta: number, absolute: number) {
		const wheelBase = this.carEngine.props.wheelBase;
		const trackWidth = this.carEngine.props.trackWidth;

		const {
			wheelColor,
			trackColor,
			frontWheelWidth,
			frontWheelHeight,
			backWheelWidth,
			backWheelHeight
		} = this.props;

		const gfx = this.owner.asGraphics();

		gfx.clear();
		gfx.lineStyle({
			width: 8,
			color: trackColor
		});

		// Middle axis
		gfx.moveTo(0, 0);
		gfx.lineTo(0, wheelBase);

		gfx.lineStyle({
			width: 3,
			color: trackColor
		});

		// Back axis
		gfx.moveTo(-trackWidth / 2, 0);
		gfx.lineTo(trackWidth / 2, 0);

		// Front axis
		gfx.moveTo(-trackWidth / 2, wheelBase);
		gfx.lineTo(trackWidth / 2, wheelBase);

		// Backwheels
		gfx.lineStyle();
		gfx.beginFill(wheelColor);
		gfx.drawRect(-trackWidth / 2 - backWheelWidth / 2, -backWheelHeight / 2, backWheelWidth, backWheelHeight);
		gfx.drawRect(trackWidth / 2 - backWheelWidth / 2, -backWheelHeight / 2, backWheelWidth, backWheelHeight);


		// Front wheels
		this.frontLeft.position.set(-trackWidth / 2, wheelBase);
		this.frontLeft.rotation = this.carEngine.phiI;
		this.frontLeft.beginFill(wheelColor);
		this.frontLeft.drawRect(-frontWheelWidth / 2, -frontWheelHeight / 2, frontWheelWidth, frontWheelHeight);
		this.frontLeft.endFill();

		this.frontRight.position.set(trackWidth / 2, wheelBase);
		this.frontRight.rotation = this.carEngine.phiO;
		this.frontRight.beginFill(wheelColor);
		this.frontRight.drawRect(-frontWheelWidth / 2, -frontWheelHeight / 2, frontWheelWidth, frontWheelHeight);
		this.frontRight.endFill();
	}
}


class CarController extends ECS.Component {
	keyInput: ECS.KeyInputComponent;
	car: CarEngine;

	constructor(car: CarEngine) {
		super();
		this.car = car;
	}

	onInit() {
		this.keyInput = this.owner.findComponentByName(ECS.KeyInputComponent.name);
	}

	onUpdate() {
		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_UP)) {
			this.car.move(1);
		} else if (this.keyInput.isKeyPressed(ECS.Keys.KEY_DOWN)) {
			this.car.move(-1);
		} else {
			this.car.move(0);
		}

		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT)) {
			this.car.steer(-1);
		} else if (this.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
			this.car.steer(1);
		} else {
			this.car.steer(0);
		}
	}
}

export class AckermannSimple extends ECSExample {

	load() {
		const carEngine = new CarEngine({
			wheelBase: 100,
			trackWidth: 80
		});

		new ECS.Builder(this.engine.scene)
			.asGraphics()
			.localPos(800 / 2, 600 / 2)
			.withComponent(carEngine)
			.withComponent(new CarRenderer({}, carEngine))
			.withComponent(new ECS.KeyInputComponent())
			.withComponent(new CarController(carEngine))
			.withParent(this.engine.scene.stage)
			.build();
	}
}
