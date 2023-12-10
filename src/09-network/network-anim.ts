import * as ECS from '../../libs/pixi-ecs';
import { TranslateAnimation } from '../utils/animation';
import * as Net from '../../libs/network-emulator';
import { NetworkBehavior } from './network-basic';
import { ECSExample, SECONDARY_CANVAS_ID } from '../utils/APHExample';
import * as PIXI from 'pixi.js';
import { Interpolation } from '../../libs/aph-math';


enum NetworkType {
	NONE, CLIENT, SERVER
}

export type NetworkAnimConfig = ECS.EngineConfig & {
	netType: NetworkType;
	lag?: number;
	packetLoss?: number;
}

class NetworkAnimBase extends ECSExample {
	netType: NetworkType;
	lag: number;
	packetLoss: number;

	constructor(config: NetworkAnimConfig) {
		super(config);
		this.netType = config.netType;
		this.lag = config.lag || 0;
		this.packetLoss = config.packetLoss || 0;
	}

	load() {
		Net.UDPEmulator.reset();
		let client = this.netType === NetworkType.CLIENT ? new Net.NetworkClient() : null;
		let host = this.netType === NetworkType.SERVER ? new Net.NetworkHost() : null;
		if(this.netType === NetworkType.CLIENT) {
			this.engine.scene.addGlobalComponentAndRun(client);
		} else {
			this.engine.scene.addGlobalComponentAndRun(host);
		}
		const keyInput = new ECS.KeyInputComponent();
		this.engine.scene.addGlobalComponentAndRun(keyInput);

		let networkBehavior = new NetworkBehavior(this.netType, keyInput, client, host, this.lag, this.packetLoss);
		let cmp = new TranslateAnimation(0, 0, this.canvas.clientWidth - 200, this.canvas.clientHeight - 200, 1500, true, 0);
		let graphics = new ECS.Builder(this.engine.scene)
			.asGraphics()
			.relativePos(0.5)
			.anchor(0.5)
			.withComponent(networkBehavior)
			.withParent(this.engine.scene.stage)
			.build<ECS.Graphics>();
		if (this.netType === NetworkType.SERVER) {
			graphics.addComponent(cmp);
		}

		graphics.beginFill(0xFF0000);
		graphics.drawRect(0, 0, 200, 200);
		graphics.endFill();

		new ECS.Builder(this.engine.scene)
			.withParent(this.engine.scene.stage)
			.asText('text', new PIXI.TextStyle({ fontSize: 35, fill: '#0F0' }))
			.withComponent(new ECS.FuncComponent('').doOnUpdate((cmp) => {
				if (this.netType === NetworkType.SERVER) {
					cmp.owner.asText().text = 'Update Frequency: ' + networkBehavior.updateFrequency;
				} else {
					cmp.owner.asText().text = client.networkState + '';
				}
			}))
			.build();

		cmp.interpolation = Interpolation.expoIn;
	}

}

export class NetworkAnim extends ECSExample {
	server: NetworkAnimBase;
	client: NetworkAnimBase;

	constructor(config: NetworkAnimConfig) {
		super(config);
		// a tricky workaround, as we will use 2 canvases
		this.server = new NetworkAnimBase({
			...config,
			canvasId: config?.canvasId || SECONDARY_CANVAS_ID,
			netType: NetworkType.SERVER,
		});

		this.client = new NetworkAnimBase({
			...config,
			netType: NetworkType.CLIENT,
			canvasId: undefined,
		});
	}

	init(canvas: HTMLCanvasElement | string) {
		this.client.init(canvas);
		this.server.init(canvas); // will use canvasId from config
	}

	destroy() {
		this.client.destroy();
		this.server.destroy();
	}

	load() {
		// no-op
	}
}


/*
export class NetworkAnimClient extends NetworkAnim {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.CLIENT, 0, 0);
	}
}

export class NetworkAnimClientLagged extends NetworkAnim {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.CLIENT, 500, 0);
	}
}

export class NetworkAnimServer extends NetworkAnim {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.SERVER, 0, 0);
	}
}

export class NetworkAnimPacketLossClient extends NetworkAnim {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.CLIENT, 0, 0.25);
	}
}

export class NetworkAnimPacketLossLaggedClient extends NetworkAnim {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.CLIENT, 500, 0.75);
	}
}

export class NetworkAnimPacketLossServer extends NetworkAnim {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.SERVER, 0, 0);
	}
}*/