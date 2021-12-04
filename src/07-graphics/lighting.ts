import { ThreeJSExample, getBaseUrl } from '../utils/APHExample';
import * as THREE from 'three';

export class Lighting extends ThreeJSExample {

	camera: THREE.PerspectiveCamera;
	uniforms: any;
	material: THREE.ShaderMaterial;
	mesh: THREE.Mesh;

	load() {
		const vertexProm = fetch(`${getBaseUrl()}/assets/07-graphics/shaders/lighting.vert`);
		const fragmentProm = fetch(`${getBaseUrl()}/assets/07-graphics/shaders/lighting.frag`);

		// async/await is not support in this version. Hence, we need to use a chain of promises
		Promise.all([vertexProm, fragmentProm])
			.then(([res1, res2]) => Promise.all([res1.text(), res2.text()]))
			.then(([vertexSh, fragmentSh]) => {
				this.renderer.setPixelRatio(window.devicePixelRatio);
				this.renderer.setClearColor(new THREE.Color(0, 0, 0));

				console.log(fragmentSh);
				// Initialize the camera
				this.camera = new THREE.PerspectiveCamera(75, this.canvas.width / this.canvas.height, 0.1, 5000);
				this.camera.position.z = 30;


				// Define the shader uniforms
				this.uniforms = {
					u_time: {
						type: 'f',
						value: 0.0
					},
					u_frame: {
						type: 'f',
						value: 0.0
					},
					u_resolution: {
						type: 'v2',
						value: new THREE.Vector2(this.canvas.width, this.canvas.height).multiplyScalar(window.devicePixelRatio)
					},
					u_mouse: {
						type: 'v2',
						value: new THREE.Vector2(0.7 * this.canvas.width, this.canvas.height).multiplyScalar(window.devicePixelRatio)
					}
				};

				// Create the shader material
				this.material = new THREE.ShaderMaterial({
					uniforms: this.uniforms,
					vertexShader: vertexSh as any,
					fragmentShader: fragmentSh as any,
					side: THREE.DoubleSide,
					transparent: true,
					extensions: {
						derivatives: true
					}
				});

				// Create the mesh and add it to the scene
				this.addMeshToScene();

				// Add the event listeners
				this.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false);
				this.renderer.domElement.addEventListener('touchstart', this.onTouchMove, false);
				this.renderer.domElement.addEventListener('touchmove', this.onTouchMove, false);
			});
	}

	destroy() {
		this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
		this.renderer.domElement.addEventListener('touchstart', this.onTouchMove);
		this.renderer.domElement.removeEventListener('touchmove', this.onTouchMove);
		super.destroy();
	}

	update() {
		if (this.uniforms) {
			this.uniforms.u_time.value = this.clock.getElapsedTime();
			this.uniforms.u_frame.value += 1.0;
			this.renderer.render(this.scene, this.camera);
		}
	}

	/*
	 * Adds the mesh to the scene
	 */
	addMeshToScene() {
		// Remove any previous mesh from the scene
		if (this.mesh) {
			this.scene.remove(this.mesh);
		}

		// Create the desired geometry
		const geometry = new THREE.TorusKnotGeometry(6.5, 2.3, 256, 32);

		// Create the mesh and add it to the scene
		this.mesh = new THREE.Mesh(geometry, this.material);
		this.scene.add(this.mesh);
	}

	/*
	 * Updates the uniforms when the mouse moves
	 */
	onMouseMove = (event) => {
		// Update the mouse uniform
		this.uniforms.u_mouse.value.set(event.pageX, this.canvas.height - event.pageY).multiplyScalar(
			window.devicePixelRatio);
	}

	/*
	 * Updates the uniforms when the touch moves
	 */
	onTouchMove = (event) => {
		// Update the mouse uniform
		this.uniforms.u_mouse.value.set(event.touches[0].pageX, this.canvas.height - event.touches[0].pageY).multiplyScalar(
			window.devicePixelRatio);
	}
}