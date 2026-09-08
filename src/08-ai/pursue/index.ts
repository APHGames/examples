/* eslint-disable no-use-before-define */
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { MAP } from './constants';
import { Factory } from './factory';
import { loadAssets } from '../../utils/assets';

export class Pursue extends ECSExample {

	async load() {
		await loadAssets([{ alias: 'pathfinding', src: `${getBaseUrl()}/assets/07-graphics/vision.png` }]);
		this.onAssetsLoaded();
	}

	onAssetsLoaded() {
		new Factory().loadScene(this.engine.scene, MAP);
	}
}
