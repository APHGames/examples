import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { loadTextAsset } from '../utils/assets';
import * as PIXI from 'pixi.js';

export class ShaderWave extends ECSExample {

	async load() {
		const geometry = new PIXI.MeshGeometry({
			positions: new Float32Array([
				-1.0, -1.0,
				1.0, -1.0,
				-1.0, 1.0,
				-1.0, 1.0,
				1.0, -1.0,
				1.0, 1.0,
			]),
			uvs: new Float32Array([
				-1.0, -1.0,
				1.0, -1.0,
				-1.0, 1.0,
				-1.0, 1.0,
				1.0, -1.0,
				1.0, 1.0,
			]),
			indices: new Uint32Array([0, 1, 2, 3, 4, 5]),
		});

		let vertexShader = await loadTextAsset('wave_vert', `${getBaseUrl()}/assets/07-graphics/shaders/wave.vert`);
		const fragmentShader = await loadTextAsset('wave_frag', `${getBaseUrl()}/assets/07-graphics/shaders/wave.frag`);

		vertexShader = vertexShader
			.replace(/aVertexPosition/g, 'aPosition')
			.replace(/aTexturePosition/g, 'aUV');

		const shader = PIXI.Shader.from({
			gl: {
				vertex: vertexShader,
				fragment: fragmentShader,
			},
			resources: {
				waveUniforms: {
					u_resolution: {
						value: [this.engine.app.screen.width, this.engine.app.screen.height],
						type: 'vec2<f32>',
					},
					u_time: { value: 0, type: 'f32' },
				},
			},
		});

		new ECS.Builder(this.engine.scene)
			.asMesh(geometry, shader)
			.withComponent(new ECS.FuncComponent('updater').doOnUpdate((cmp) => {
				(cmp.owner.asMesh().shader as any).resources.waveUniforms.uniforms.u_time += 0.1;
			}))
			.withParent(this.engine.scene.stage)
			.build();
	}
}
