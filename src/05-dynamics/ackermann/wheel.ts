export class Wheel {
	// offsets from the center of the car
	yOffset: number;
	xOffset: number;
	radius = 0;

	// current rotation
	rotation = 0;

	constructor(radius: number, xOffset: number, yOffset: number) {
		this.xOffset = xOffset;
		this.yOffset = yOffset;
		this.radius = radius;
	}
}