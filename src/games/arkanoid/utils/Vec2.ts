export default class Vec2 {
	x: number;
	y: number;

	constructor(x: number, y?: number) {
		this.x = x;
		this.y = y == null ? this.x : y;
	}

	add(other: Vec2): Vec2 {
		return new Vec2(this.x + other.x, this.y + other.y);
	}

	subtract(other: Vec2): Vec2 {
		return new Vec2(this.x - other.x, this.y - other.y);
	}

	multiply(scalar: number): Vec2 {
		return new Vec2(scalar * this.x, scalar * this.y);
	}

	divide(scalar: number): Vec2 {
		return new Vec2(this.x / scalar, this.y / scalar);
	}

	distance(other: Vec2): number {
		return new Vec2(this.x - other.x, this.y - other.y).magnitude();
	}

	manhattanDistance(other: Vec2): number {
		return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
	}

	normalize(): Vec2 {
		const magnitude = this.magnitude();
		return new Vec2(this.x / magnitude, this.y / magnitude);
	}

	magnitudeSquared(): number {
		return this.dot(this);
	}

	magnitude(): number {
		return Math.sqrt(this.magnitudeSquared());
	}

	angle(): number {
		let result = Math.atan2(this.y, this.x);
		if (result < 0) {
			result += 2 * Math.PI;
		}
		return result;
	}

	dot(other: Vec2): number {
		return this.x * other.x + this.y * other.y;
	}

	cross(other: Vec2): number {
		return this.x * other.y - other.x * this.y;
	}

	limit(magnitude: number): Vec2 {
		const mag = this.magnitudeSquared();
		if (magnitude < mag) {
			return new Vec2(this.x / Math.sqrt(mag / magnitude), this.y / Math.sqrt(mag / magnitude));
		}
		return this.clone();
	}

	equals(other: Vec2): boolean {
		return this.x == other.x && this.y == other.y;
	}

	clone(): Vec2 {
		return new Vec2(this.x, this.y);
	}
}
