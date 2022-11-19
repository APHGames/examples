import * as PIXI from 'pixi.js';
import * as ECS from '../../libs/pixi-ecs';
import { ECSExample, getBaseUrl } from '../utils/APHExample';

type FileData = {
	url: string;
	alias: string;
	size: number;
}

/**
 * Interface that can be used to replace MockLoader with the actual PIXI loader
 */
interface Loader {
	add(alias: string, url: string, onFinish: () => void);
}

/**
 * Mocked loader, that will load all files in parallel
 * The duration of the loading is the amount of MBs (1 MB/s)
 */
class MockLoader implements Loader {

	data: FileData[];

	constructor(data: FileData[]) {
		this.data = data;
	}

	add(alias: string, url: string, onFinish: () => void) {
		const file = this.data.find(f => f.alias === alias);
		if (!file) {
			throw new Error('File not found in the array that was initialized with this object!');
		} else {
			setTimeout(() => onFinish(), file.size / 1024 / 1024 * 1000);
		}
	}
}

/**
 * A class that will use a loader internally to load data
 * either sequentially or in parallel (can be used with the actual PIXI.Loader too)
 */
export class LoadingManager {
	allLoaded = false;
	progress = 0;
	files: Array<FileData> = [];

	private running = false;
	private onComplete: () => void;
	private loader: Loader;
	private loadedFiles = 0;
	private loadedAmount = 0;
	private totalAmount = 0;

	constructor(loader: Loader, onComplete?: () => void) {
		this.loader = loader;
		this.onComplete = onComplete;
	}

	add(alias: string, url: string, size: number) {
		if (this.running) {
			throw new Error('This loader is already running');
		}
		this.files.push({
			alias,
			url,
			size
		});
	}

	/**
	 * Loads files in parallel
	 * The number of parallel loading depends on the internal loader
	 */
	loadParallel() {
		this.reset();
		this.loadParallelInternal();
	}

	/**
	 * Loads files sequentially
	 */
	loadSequentially() {
		this.reset();
		this.loadSequentiallyInternal(0);
	}

	private reset() {
		this.loadedFiles = 0;
		this.loadedAmount = 0;
		this.running = true;
		this.totalAmount = this.files.reduce((prev, next) => prev + next.size, 0);
	}

	private loadParallelInternal() {
		for (let file of this.files) {
			this.loader.add(file.alias, file.url, () => {
				this.loadedFiles++;
				this.loadedAmount += file.size;
				this.progress = Math.floor(this.loadedAmount / this.totalAmount * 100);
				if (this.loadedFiles === this.files.length) {
					this.onComplete?.();
					this.running = false;
				}
			});
		}
	}

	private loadSequentiallyInternal(index: number) {
		const file = this.files[index];
		this.loader.add(file.alias, file.url, () => {
			this.loadedFiles++;
			this.loadedAmount += file.size;
			this.progress = Math.floor(this.loadedAmount / this.totalAmount * 100);
			if (this.loadedFiles === this.files.length) {
				this.onComplete?.();
				this.running = false;
			} else {
				this.loadSequentiallyInternal(index + 1);
			}
		});
	}
}

export class ProgressSequential extends ECSExample {

	generateFiles(num: number, minSize: number, maxSize: number) {
		const files: FileData[] = [];
		for (let i = 0; i < num; i++) {
			let size = 0;
			let divPoint = maxSize - (maxSize - minSize) * 0.2;
			if(Math.random() < 0.1) {
				// 20% probablity of having a file in the highest 20%
				size = Math.floor(Math.random() * (maxSize - divPoint) + divPoint);
			} else {
				size = Math.floor(Math.random() * (divPoint - minSize) + minSize);
			}
			files.push({
				url: `file_${i}`,
				alias: `file_${i}`,
				size,
			});
		}
		return files;
	}

	/**
	 * A little lame, will be refactored with new approach on how to configure
	 * the examples
	 */
	isSequential() {
		return true;
	}

	load() {
		// init the scene and run your game
		let scene = this.engine.scene;

		// generate 100 files with varying size (from 100kB to 4MB)
		const data = this.generateFiles(100, 1024 * 100, 1024 * 1024 * 4);
		const pixiLoader = new MockLoader(data);

		const loader = new LoadingManager(pixiLoader, () => {

		});


		for (let file of data) {
			loader.add(file.alias, file.url, file.size);
		}

		const width = 600;
		const height = 100;
		const lineWidth = 10;

		let currentProgress = 0;
		let animatedProgress = 0;

		new ECS.Builder(scene)
			.asGraphics()
			.localPos(scene.width / 2 - width / 2, scene.height / 2 - height / 2)
			.withParent(scene.stage)
			.withComponent(new ECS.FuncComponent('').doOnUpdate((cmp, delta, absolute) => {
				// main loop -> draw the progress bar from the 'progress' attribute taken from the loader
				const gfx = cmp.owner.asGraphics();
				gfx.clear();

				gfx.lineStyle({
					width: lineWidth,
					color: 0xEEEEEE
				});

				gfx.drawRect(0, 0, width, height);
				gfx.lineStyle({
					width: 0
				});

				currentProgress = loader.progress / 100;

				// a sleek animation that will try to catch up with the current value
				if (animatedProgress < currentProgress) {
					const increment = Math.max(0.001, (currentProgress - animatedProgress) / 10);
					animatedProgress = Math.min(animatedProgress + increment, currentProgress);
				}

				gfx.beginFill(0x2831ef);
				gfx.drawRect(lineWidth / 2, lineWidth / 2, animatedProgress * (width - lineWidth), height - lineWidth);
				gfx.endFill();
			}))
			.build();

		if(this.isSequential()) {
			loader.loadSequentially();
		} else {
			loader.loadParallel();
		}
	}
}

export class ProgressParallel extends ProgressSequential {
	isSequential() {
		return false;
	}
}