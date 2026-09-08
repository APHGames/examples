import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { getLoadedTexture, loadAssets, loadTextAsset } from '../utils/assets';
import * as PIXI from 'pixi.js';

export class ShaderBasic extends ECSExample {

	async load() {
		const geometry = new PIXI.MeshGeometry({
			positions: new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
			uvs: new Float32Array([1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0]),
			indices: new Uint32Array([0, 1, 3, 0, 3, 2]),
		});

		let vertexShader = await loadTextAsset('basic_vert_v2', `${getBaseUrl()}/assets/07-graphics/shaders/basic.vert`);
		const fragmentShader = await loadTextAsset('basic_frag_v2', `${getBaseUrl()}/assets/07-graphics/shaders/basic.frag`);
		await loadAssets([{ alias: 'texture', src: `${getBaseUrl()}/assets/01-helloworld/crash.png` }]);
		const texture = getLoadedTexture('texture');

		vertexShader = vertexShader
			.replace(/aVertexPosition/g, 'aPosition')
			.replace(/aTexturePosition/g, 'aUV');

		const shader = PIXI.Shader.from({
			gl: {
				vertex: vertexShader,
				fragment: fragmentShader,
			},
			resources: {
				uSampler: texture.source,
			},
		});

		new ECS.Builder(this.engine.scene)
			.asMesh(geometry, shader)
			.scale(0.5, 1)
			.withParent(this.engine.scene.stage)
			.build();
	}
}
