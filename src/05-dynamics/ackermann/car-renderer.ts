import * as ECS from 'colfio';
import { Wheel } from './wheel';
import { CarComponent } from './car-component';
import { calcAbsPos } from './utils';

export type CarRendererProps = {
	car: CarComponent;
}

const DEFAULT_COLOR = 0xAAAAAA;

export class CarRenderer extends ECS.Component<CarRendererProps> {

	onUpdate(delta: number, absolute: number) {
		const offsetX = this.owner.position.x;
		const offsetY = this.owner.position.y;
		const ctx = this.owner.asGraphics();

		ctx.clear();
		this.renderAxis(ctx, offsetX, offsetY);

		for (let wheelKey of Object.keys(this.props.car.wheels)) {
			const wheel = this.props.car.wheels[wheelKey];
			this.renderWheel(wheel, ctx, offsetX, offsetY);
		}
		this.renderSteeringCircle(ctx, offsetX, offsetY);
	}

	renderAxis(ctx: ECS.Graphics, offsetX: number, offsetY: number) {
		const car = this.props.car;
		const xOffset = Math.sin(car.rotation) * 0.5 * car.props.wheelBase;
		const yOffset = Math.cos(car.rotation) * 0.5 * car.props.wheelBase;
		const frontCoord = new ECS.Vector(xOffset + car.owner.position.x, yOffset + car.owner.position.y);
		const backCoord = new ECS.Vector(car.owner.position.x - xOffset, car.owner.position.y - yOffset);
		ctx.moveTo(frontCoord.x - offsetX, frontCoord.y - offsetY);
		ctx.lineTo(backCoord.x - offsetX, backCoord.y - offsetY);
		ctx.stroke({ width: 2, color: DEFAULT_COLOR });
	}

	renderWheel(wheel: Wheel, ctx: ECS.Graphics, offsetX: number, offsetY: number) {
		const rotation = wheel.rotation + this.props.car.rotation;
		const rotOffsetX = Math.sin(rotation) * wheel.radius;
		const rotOffsetY = Math.cos(rotation) * wheel.radius;
		const center = this.calcAbsPosToCar(wheel.xOffset, wheel.yOffset);
		const frontCoord = new ECS.Vector(rotOffsetX + center.x, rotOffsetY + center.y);
		const backCoord = new ECS.Vector(center.x - rotOffsetX, center.y - rotOffsetY);

		ctx.moveTo(frontCoord.x - offsetX, frontCoord.y - offsetY);
		ctx.lineTo(backCoord.x - offsetX, backCoord.y - offsetY); //Draw center
		ctx.stroke({ width: 5, color: DEFAULT_COLOR });

		ctx.moveTo(center.x - offsetX, center.y - offsetY);
		ctx.lineTo(backCoord.x - offsetX, backCoord.y - offsetY); //Axel
		ctx.stroke({ width: 2, color: DEFAULT_COLOR });
		// draw center
		const centerOfParent = this.calcAbsPosToCar(wheel.xOffset, 0);
		ctx.moveTo(center.x - offsetX, center.y - offsetY);
		ctx.lineTo(centerOfParent.x - offsetX, centerOfParent.y - offsetY);
		ctx.stroke({ width: 2, color: DEFAULT_COLOR });
	}


	renderSteeringCircle(ctx: ECS.Graphics, offsetX: number, offsetY: number) {
		const car = this.props.car;
		const ackermanPos = this.calcAbsPosToCar(car.centerOfBackWheelsX, car.steerRadius);
		const ackermanRadius = Math.abs(car.steerRadius);

		if (ackermanRadius > 1 && ackermanRadius < car.props.maxSteeringRadius) {
			ctx.circle(ackermanPos.x - offsetX, ackermanPos.y - offsetY, 2)
				.fill({ color: 0xcf2f25 });

			// draw a line from the center to both front wheels
			for (let wheel of [car.wheels.frontLeft, car.wheels.frontRight]) {
				const center = this.calcAbsPosToCar(wheel.xOffset, wheel.yOffset);
				ctx.moveTo(center.x - offsetX, center.y - offsetY);
				ctx.lineTo(ackermanPos.x - offsetX, ackermanPos.y - offsetY);
			}

			ctx.circle(ackermanPos.x - offsetX, ackermanPos.y - offsetY, ackermanRadius);
			ctx.stroke({ width: 3, color: 0xcf2f25 });
		}
	}

	calcAbsPosToCar(relX: number, relY: number) {
		return calcAbsPos(this.props.car.owner.position.x, this.props.car.owner.position.y, this.props.car.rotation, relX, relY);
	}
}
