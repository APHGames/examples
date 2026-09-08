import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { getLoadedTexture, loadAssets, loadTextAsset } from '../utils/assets';
import * as PIXI from 'pixi.js';

export class Mandelbrot extends ECSExample {

	async load() {
		const geometry = new PIXI.MeshGeometry({
			positions: new Float32Array([
				-1.0, -1.0,
				1.0, -1.0,
				-1.0, 1.0,
				1.0, 1.0,
			]),
			uvs: new Float32Array([
				-4.0, -4.0,
				4.0, -4.0,
				-4.0, 4.0,
				4.0, 4.0,
			]),
			indices: new Uint32Array([0, 1, 3, 0, 3, 2]),
		});

		let vertexShader = await loadTextAsset('mandelbrot_vert_v2', `${getBaseUrl()}/assets/07-graphics/shaders/mandelbrot.vert`);
		const fragmentShader = await loadTextAsset('mandelbrot_frag_v2', `${getBaseUrl()}/assets/07-graphics/shaders/mandelbrot.frag`);
		await loadAssets([{ alias: 'palette', src: `${getBaseUrl()}/assets/07-graphics/shaders/mandelbrot_palette.png` }]);
		const palette = getLoadedTexture('palette');

		vertexShader = vertexShader
			.replace(/aVertexPosition/g, 'aPosition')
			.replace(/aTexturePosition/g, 'aUV');

		const shader = PIXI.Shader.from({
			gl: {
				vertex: vertexShader,
				fragment: fragmentShader,
			},
			resources: {
				colorPalette: palette.source,
				mandelbrotUniforms: {
					maxIteration: { value: 256, type: 'i32' },
				},
			},
		});

		// Keep mesh at identity transform — vertex shader writes clip-space positions directly
		new ECS.Builder(this.engine.scene)
			.withName('quad')
			.asMesh(geometry, shader)
			.withParent(this.engine.scene.stage)
			.build();
	}
}
