/* eslint-disable no-use-before-define */
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { MAP } from './constants';
import { Factory } from './factory';

export class Pursue extends ECSExample {

	load() {
		this.engine.app.loader
			.reset()    // necessary for hot reload
			.add('pathfinding', `${getBaseUrl()}/assets/07-graphics/vision.png`)
			.load(() => this.onAssetsLoaded());
	}

	onAssetsLoaded() {
		new Factory().loadScene(this.engine.scene, MAP);
	}
}
