import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { loadAssets, getLoadedTexture, setTextureFrame } from '../utils/assets';

const SPRITESHEET = `${getBaseUrl()}/assets/03-components/warrior.png`;
const SPRITESHEET_ALIAS = 'warrior-anim';

const sprite = {
	offsetMultX: 528,
	offsetMultY: 540,
	width: 528,
	height: 540
};

const FRAMES = 8;

export class Animation extends ECSExample {

	async load() {
		await loadAssets([{ alias: SPRITESHEET_ALIAS, src: SPRITESHEET }]);
		const baseTexture = getLoadedTexture(SPRITESHEET_ALIAS);
		let frame = 0, frameCounter = 0;
		new ECS.Builder(this.engine.scene)
			.asSprite(baseTexture)
			.withParent(this.engine.scene.stage)
			.localPos(this.engine.app.canvas.width / 2, this.engine.app.canvas.height / 2)
			.anchor(0.5)
			.withComponent(new ECS.FuncComponent('animator').setFixedFrequency(10)
				.doOnFixedUpdate((cmp) => {
					setTextureFrame(
						cmp.owner.asSprite(),
						baseTexture,
						(frame % 4) * sprite.offsetMultX,
						Math.floor(frame / 4) * sprite.offsetMultY,
						sprite.width,
						sprite.height,
					);
					frame = (frameCounter++) % FRAMES;
				}))
			.build();
	}

	update() {
		// no-op
	}
}
