import * as ECS from 'colfio';
import { FontParser } from './font-parser';
import { DialogController, Assets, Attributes } from './dialog-controller';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { loadAssets, getLoadedTexture, getLoadedAsset } from '../../utils/assets';
import type { RawFontData } from './font-parser';

export class Dialog extends ECSExample {

	async load() {
		await loadAssets([
			{ alias: Assets.DIALOG_TEXTURE, src: `${getBaseUrl()}/assets/others/dialog/dialog.png` },
			{ alias: Assets.FONT, src: `${getBaseUrl()}/assets/others/dialog/font.json` },
			{ alias: Assets.FONT_TEXTURE, src: `${getBaseUrl()}/assets/others/dialog/font.png` },
			{ alias: Assets.MARKER_TEXTURE, src: `${getBaseUrl()}/assets/others/dialog/marker.png` },
		]);
		getLoadedTexture(Assets.DIALOG_TEXTURE).source.scaleMode = 'nearest';
		getLoadedTexture(Assets.FONT_TEXTURE).source.scaleMode = 'nearest';
		getLoadedTexture(Assets.MARKER_TEXTURE).source.scaleMode = 'nearest';
		this.onAssetsLoaded();
	}

	onAssetsLoaded() {
		const scene = this.engine.scene;
		const keyInput = new ECS.KeyInputComponent();
		scene.addGlobalComponent(keyInput);

		const fontData = getLoadedAsset<RawFontData>(Assets.FONT);
		const fontTxt = getLoadedTexture(Assets.FONT_TEXTURE);
		const font = new FontParser().parseFont(fontData, fontTxt);

		scene.assignGlobalAttribute(Attributes.FONT, font);

		scene.addGlobalComponent(new DialogController({
			text: 'Vanquish Thy foes, brave warrior. And prepare yourself for the greatest of challenges.',
			dialogHeight: 40,
			keyInput
		}));
	}

	onDestroy() {
		getLoadedTexture(Assets.DIALOG_TEXTURE).source.scaleMode = 'linear';
		getLoadedTexture(Assets.FONT_TEXTURE).source.scaleMode = 'linear';
		getLoadedTexture(Assets.MARKER_TEXTURE).source.scaleMode = 'linear';
	}
}
