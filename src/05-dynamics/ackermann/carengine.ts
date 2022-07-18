/**
 * A helper class that keeps car engine parameters
 */
export class CarEngine {
	maxPower: number;
	maxPowerInReverse: number;
	power = 0;
	trottle = 0;
	friction = 0;
	reverse = false;
	// current braking power
	brakingPower = 0;
	velocity = 0;

	constructor(maxPower = 1, maxPowerInReverse = 0.2, friction = 0.95) {
		this.maxPower = maxPower;
		this.maxPowerInReverse = maxPowerInReverse;
		this.friction = friction;
	}

	setTrottle(amount: number) {
		this.trottle = amount;
		this.updatePower();
	}

	updatePower() {
		if (this.trottle >= 0) {
			this.power = this.maxPower * this.trottle;
		} else {
			this.power = this.maxPowerInReverse * this.trottle;
		}
	}

	/**
	 * Brake while reverse gear is on
 	*/
	brakeReverse(power: number) {
		if (!this.reverse) {
			this.trottleDownToZero(0.1);
			this.brakingPower = power;

			if (this.velocity < 0.01) {
				this.reverse = true;
			}
		} else {
			this.trottleDown(power);
		}
	}

	brake(power: number) {
		this.trottleDownToZero(0.3);
		this.brakingPower = power;

		if (this.velocity < 0.001) {
			this.velocity = 0;
		}
	}

	trottleUp(amount: number) {
		if (this.trottle + amount <= 1) {
			this.trottle += amount;
		} else {
			this.trottle = 1;
		}
		this.updatePower();
	}

	trottleDown(amount: number) {
		if (this.trottle - amount >= 0) {
			this.trottle -= amount;
		} else {
			if (this.trottle - amount > -1) {
				this.trottle -= amount;
			}
		}

		this.updatePower();
	}

	trottleDownToZero(amount: number) {
		if (this.trottle - amount >= 0) {
			this.trottle -= amount;
		} else {
			this.trottle = 0;
		}
		this.updatePower();
	}

	update(delta: number) {
		if (this.trottle > 0) {
			this.trottleDownToZero(0.0001 * 16);
		} else if (this.trottle < 0) {
			this.trottleUp(0.0001 * 16);
		}

		if (this.reverse && this.velocity > 0.01) {
			this.reverse = false;
		}

		if (this.brakingPower > 0) {
			// slow down a little bit
			this.velocity *= 0.95;
			this.brakingPower -= 1;
		}

		this.velocity += this.power;
		this.velocity *= this.friction;
	}
}