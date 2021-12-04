import * as ECS from '../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { ECSExample } from '../utils/APHExample';

export class CollisionsRaycasting extends ECSExample {

	props = {
		sizeRect: 30,
		sizeBall: 10,
	};

	currentSpeedX: number;
	currentSpeedY: number;
	gfx: ECS.Graphics;

	collides = false;

	xSpeed = 12;
	ySpeed = 4;

	makeStep(delta: number, obj: ECS.Container, boundsArray: PIXI.Rectangle[], cmp: ECS.Component) {
		const pos = cmp.owner.position;

		let incrementX = this.xSpeed * delta * 0.1;
		let incrementY = this.ySpeed * delta * 0.1;

		for (let bounds of boundsArray) {
			const posX = obj.position.x;
			const posY = obj.position.y;

			const cornerX = posX + this.props.sizeBall + Math.sign(this.xSpeed) * this.props.sizeBall;
			const cornerY = posY + this.props.sizeBall + Math.sign(this.ySpeed) * this.props.sizeBall;

			// raycast: Ray := (cornerX, cornerY) + (incrementX, incrementY) * t
			// x = cornerX + incrementX * t
			// y = cornerY + incrementY * t
			// if we know Y:
			// x = cornerX + incrementX * (y - cornerY) / incrementY
			// if we know X:
			// y = cornerY + incrementY * (x - cornerX) / incrementX

			// if t is < 0, it is beyond the ball
			// if t is > 0, it is beyond the target
			const at = Math.max(0, Math.min(1, (bounds.y - cornerY) / incrementY));
			const bt = Math.max(0, Math.min(1, ((bounds.y + bounds.height) - cornerY) / incrementY));
			const ct = Math.max(0, Math.min(1, (bounds.x - cornerX) / incrementX));
			const dt = Math.max(0, Math.min(1, ((bounds.x + bounds.width) - cornerX) / incrementX));

			const s1 = Math.min(at, bt);
			const s2 = Math.max(at, bt);
			const t1 = Math.min(ct, dt);
			const t2 = Math.max(ct, dt);
			this.collides = (Math.min(s2, t2) - Math.max(s1, t1)) > 0;

			if (this.collides) {
				const closest = Math.min(at > 0 ? at : 10000, bt > 0 ? bt : 10000, ct > 0 ? ct : 10000, dt > 0 ? dt : 10000);

				if (closest === at || closest === bt) {
					this.ySpeed *= -1;
				}
				if(closest === ct || closest === dt) {
					this.xSpeed *= -1;
				}

				incrementX = incrementX * closest;
				incrementY = incrementY * closest;

				pos.x += incrementX;
				pos.y += incrementY;

				const remainingFrame = delta * closest;
				if(remainingFrame !== delta) {
					this.makeStep(remainingFrame, obj, [bounds], cmp);
				}
				return true;
			}
		}

		pos.x += incrementX;
		pos.y += incrementY;
	}

	load() {
		let { sizeBall, sizeRect } = this.props;

		const rectPos = [[0.25, 0.3], [0.5, 0.3], [0.7, 0.5], [0.2, 0.6], [0.3, 0.8], [0.5, 0.9], [0.1, 0.4], [0.8, 0.2], [0.7, 0.8]];
		const rectangles = [];

		for(const pos of rectPos) {
			const rect = new ECS.Builder(this.engine.scene)
				.asGraphics()
				.relativePos(pos[0], pos[1])
				.withParent(this.engine.scene.stage)
				.withComponent(new ECS.FuncComponent('')
					.doOnUpdate((cmp, delta, absolute) => {
						const gfx = cmp.owner.asGraphics();
						gfx.clear();
						if (this.collides) {
							gfx.beginFill(0xFF0000);
						} else {
							gfx.beginFill(0xCDCDCD);
						}
						gfx.drawRect(-sizeRect / 2, -sizeRect / 2, sizeRect, sizeRect);
						gfx.endFill();
					})).build();

			rectangles.push(rect);
		}

		const ball = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.25, 0.25)
			.withParent(this.engine.scene.stage)
			.withComponent(new ECS.FuncComponent('')
				.doOnInit((cmp) => {
					const gfx = cmp.owner.asGraphics();
					gfx.clear();
					gfx.beginFill(0xEFEFEF);
					gfx.drawCircle(sizeBall, sizeBall, sizeBall);
					gfx.endFill();
				}).doOnUpdate((cmp, delta, absolute) => {
					const rectBounds = rectangles.map(r => r.getBounds());
					const top = new PIXI.Rectangle(0, -10, cmp.scene.width, 10);
					const left = new PIXI.Rectangle(-10, -10, 10, cmp.scene.height + 10);
					const right = new PIXI.Rectangle(cmp.scene.width, 0, 10, cmp.scene.height);
					const bottom = new PIXI.Rectangle(-10, cmp.scene.height, cmp.scene.width + 10, 10);

					this.makeStep(delta, ball, [...rectBounds, top, left, right, bottom], cmp);
				})).build();

		this.gfx = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.withParent(this.engine.scene.stage)
			.build();
	}
}