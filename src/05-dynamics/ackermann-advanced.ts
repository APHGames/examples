import * as ECS from '../../libs/pixi-ecs';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { CarComponent } from './ackermann/car-component';
import { CarRenderer } from './ackermann/car-renderer';
import { CameraController } from './ackermann/camera-controller';
import { VehicleController } from './ackermann/vehicle-controller';
import { GridRenderer } from './ackermann/grid-renderer';
import * as PIXI from 'pixi.js';

export class AckermannAdvanced extends ECSExample {

	load() {
		this.engine.app.loader
			.reset()
			.add('car', `${getBaseUrl()}/assets/05-dynamics/car.png`)
			.load(() => this.loadScene());
	}

	loadScene() {
		// load car texture
		const baseTex = PIXI.BaseTexture.from('car');
		const carTexture = new PIXI.Texture(baseTex);
		new ECS.Builder(this.engine.scene).asGraphics().withComponent(new GridRenderer())
			.withParent(this.engine.scene.stage).build();

		// this will somehow fit the car image
		const car = new CarComponent({
			trackWidth: 42,
			wheelBase: 70,
			wheelSize: 8,
			rotation: Math.PI
		});

		new ECS.Builder(this.engine.scene).asGraphics().withTag('car')
			.withComponent(car).withComponent(
				new CarRenderer({
					car: car
				}))
			.withComponent(new VehicleController(car))
			.withComponent(new CameraController())
			.localPos(this.engine.scene.width / 2, this.engine.scene.height / 2)
			.withChild(new ECS.Builder(this.engine.scene).asSprite(carTexture).anchor(0.5).withComponent(
				new ECS.FuncComponent('').doOnUpdate((cmp) => {
					// synchronization component that will rotate the sprite
					cmp.owner.rotation = -car.rotation + Math.PI;
				})
			)).withParent(this.engine.scene.stage).build();
	}
}
