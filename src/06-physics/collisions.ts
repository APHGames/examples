import * as ECS from '../../libs/pixi-ecs';
import { ECSExample } from '../utils/APHExample';


export class CollisionsBall extends ECSExample {

	props = {
		xSpeed: 5,
		ySpeed: 4,
		radius: 50
	};

	load() {
		let { xSpeed, ySpeed, radius } = this.props;

		const ball = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.5, 0.5)
			.withParent(this.engine.scene.stage)
			.withComponent(new ECS.FuncComponent('')
				.doOnInit((cmp) => {
					const gfx = cmp.owner.asGraphics();
					gfx.beginFill(0xCDCDCD);
					gfx.drawCircle(0, 0, radius);
					gfx.endFill();
				}).doOnUpdate((cmp, delta, absolute) => {
					const pos = cmp.owner.position;
					const bbox = cmp.owner.getBounds();

					pos.x += xSpeed * delta * 0.1;
					pos.y += ySpeed * delta * 0.1;

					if ((bbox.x < 0 && xSpeed < 0) || (bbox.right >= cmp.scene.width && xSpeed >= 0)) {
						xSpeed *= -1;
					}
					if ((bbox.y < 0 && ySpeed < 0) || (bbox.bottom >= cmp.scene.height && ySpeed >= 0)) {
						ySpeed *= -1;
					}
				})).build();
	}
}

export class CollisionsBalls extends ECSExample {

	props = {
		xSpeed: 5,
		ySpeed: 9,
		radiusA: 50,
		radiusB: 30,
	};

	load() {
		let { xSpeed, ySpeed, radiusA, radiusB } = this.props;

		const ballA = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.5, 0.5)
			.withParent(this.engine.scene.stage)
			.withComponent(new ECS.FuncComponent('')
				.doOnInit((cmp) => {
					const gfx = cmp.owner.asGraphics();
					gfx.beginFill(0xCDCDCD);
					gfx.drawCircle(0, 0, radiusA);
					gfx.endFill();
				})).build();

		const ballB = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.25, 0.25)
			.withParent(this.engine.scene.stage)
			.withComponent(new ECS.FuncComponent('')
				.doOnInit((cmp) => {
					const gfx = cmp.owner.asGraphics();
					gfx.beginFill(0xEFEFEF);
					gfx.drawCircle(0, 0, radiusB);
					gfx.endFill();
				}).doOnUpdate((cmp, delta, absolute) => {
					const pos = cmp.owner.position;
					const bbox = cmp.owner.getBounds();

					if ((bbox.x < 0 && xSpeed < 0) || (bbox.right >= cmp.scene.width && xSpeed >= 0)) {
						xSpeed *= -1;
					}
					if ((bbox.y < 0 && ySpeed < 0) || (bbox.bottom >= cmp.scene.height && ySpeed >= 0)) {
						ySpeed *= -1;
					}

					// ball-ball collision
					const ballBox = ballA.getBounds();
					const centerAX = bbox.x + bbox.width / 2;
					const centerBX = ballBox.x + ballBox.width / 2;
					const centerAY = bbox.y + bbox.height / 2;
					const centerBY = ballBox.y + ballBox.height / 2;

					let incrementX = xSpeed * delta * 0.1;;
					let incrementY = ySpeed * delta * 0.1;

					// even if the balls are colliding in each axis, it doesn't mean there is an actual collision, due to the shape of a circle
					const isInCollisionX = Math.abs(centerAX - centerBX) <= (radiusA + radiusB);
					const isInCollisionY = Math.abs(centerAY - centerBY) <= (radiusA + radiusB);
					const isInCollision = new ECS.Vector(centerAX, centerAY).distance(new ECS.Vector(centerBX, centerBY)) <= (radiusA + radiusB);

					const willBeInCollision = new ECS.Vector(centerAX + incrementX, centerAY + incrementY).distance(new ECS.Vector(centerBX, centerBY)) <= (radiusA + radiusB);
					const willBeInCollisionX = Math.abs(centerAX + incrementX - centerBX) <= (radiusA + radiusB);
					const willBeInCollisionY = Math.abs(centerAY + incrementY - centerBY) <= (radiusA + radiusB);

					if (!isInCollision && willBeInCollision) {
						if (isInCollisionX && willBeInCollisionY) {
							incrementY *= -1;
							ySpeed *= -1;
						}
						if (isInCollisionY && willBeInCollisionX) {
							incrementX *= -1;
							xSpeed *= -1;
						}
					}


					pos.x += incrementX;
					pos.y += incrementY;

				})).build();
	}
}

export class CollisionsRectangles extends ECSExample {

	props = {
		xSpeed: 5,
		ySpeed: 9,
		sizeA: 150,
		sizeB: 30,
	};

	load() {
		let { xSpeed, ySpeed, sizeA, sizeB } = this.props;

		const rectA = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.5, 0.5)
			.withParent(this.engine.scene.stage)
			.withComponent(new ECS.FuncComponent('')
				.doOnInit((cmp) => {
					const gfx = cmp.owner.asGraphics();
					gfx.beginFill(0xCDCDCD);
					gfx.drawRect(-sizeA/2, -sizeA/2, sizeA, sizeA);
					gfx.endFill();
				})).build();

		const rectB = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.25, 0.25)
			.withParent(this.engine.scene.stage)
			.withComponent(new ECS.FuncComponent('')
				.doOnInit((cmp) => {
					const gfx = cmp.owner.asGraphics();
					gfx.beginFill(0xEFEFEF);
					gfx.drawRect(0, 0, sizeB, sizeB);
					gfx.endFill();
				}).doOnUpdate((cmp, delta, absolute) => {
					const pos = cmp.owner.position;
					const bboxA = cmp.owner.getBounds();

					if ((bboxA.x < 0 && xSpeed < 0) || (bboxA.right >= cmp.scene.width && xSpeed >= 0)) {
						xSpeed *= -1;
					}
					if ((bboxA.y < 0 && ySpeed < 0) || (bboxA.bottom >= cmp.scene.height && ySpeed >= 0)) {
						ySpeed *= -1;
					}

					const bboxB = rectA.getBounds();

					let incrementX = xSpeed * delta * 0.1;;
					let incrementY = ySpeed * delta * 0.1;

					const willBeInCollisionX = (bboxA.x + bboxA.width + incrementX) > bboxB.x &&
						(bboxA.x + incrementX) < (bboxB.x + bboxB.width) &&
						(bboxA.y + bboxA.height) > bboxB.y && bboxA.y < (bboxB.y + bboxB.height);

					const willBeInCollisionY = (bboxA.y + bboxA.height + incrementY) > bboxB.y &&
						(bboxA.y + incrementY) < (bboxB.y + bboxB.height) &&
						(bboxA.x + bboxA.width) > bboxB.x && bboxA.x < (bboxB.x + bboxB.width);

					if (willBeInCollisionX) {
						incrementX *= -1;
						xSpeed *= -1;
					}
					if (willBeInCollisionY) {
						incrementY *= -1;
						ySpeed *= -1;
					}


					pos.x += incrementX;
					pos.y += incrementY;

				})).build();
	}
}