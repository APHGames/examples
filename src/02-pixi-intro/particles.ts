import * as PIXI from 'pixi.js';
import { PIXIExample, getBaseUrl } from '../utils/APHExample';
import { loadTexture } from '../utils/assets';

export class Particles extends PIXIExample {
	private static particlesNum = 250;
	container: PIXI.ParticleContainer;

	async load() {
		const texture = await loadTexture(`${getBaseUrl()}/assets/02-pixi-intro/ghost.png`);

		this.container = new PIXI.ParticleContainer({
			texture,
			dynamicProperties: {
				position: true,
				rotation: true,
			},
		});

		for (let i = 0; i < Particles.particlesNum; i++) {
			const particle = new PIXI.Particle({
				texture,
				x: Math.random() * this.app.screen.width,
				y: Math.random() * this.app.screen.height,
				anchorX: 0.5,
				anchorY: 0.5,
				rotation: Math.random() * Math.PI,
				scaleX: 0.25,
				scaleY: 0.25,
			});
			this.container.addParticle(particle);
		}

		this.app.stage.addChild(this.container);
	}

	update(delta: number) {
		for (const child of this.container.particleChildren) {
			child.rotation += 0.1 * delta;
		}
	}
}
