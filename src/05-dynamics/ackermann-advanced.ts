import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { CarComponent } from './ackermann/car-component';
import { CarRenderer } from './ackermann/car-renderer';
import { CameraController } from './ackermann/camera-controller';
import { VehicleController } from './ackermann/vehicle-controller';
import { GridRenderer } from './ackermann/grid-renderer';
import { loadAssets, getLoadedTexture } from '../utils/assets';

export class AckermannAdvanced extends ECSExample {

	async load() {
		await loadAssets([{ alias: 'car', src: `${getBaseUrl()}/assets/05-dynamics/car.png` }]);
		this.loadScene();
	}

	loadScene() {
		const carTexture = getLoadedTexture('car');
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
