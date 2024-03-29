import * as ECS from '../../libs/pixi-ecs';
import { TranslateAnimation, InterpolationType } from '../utils/animation';
import * as Net from '../../libs/network-emulator';
import { ECSExample, SECONDARY_CANVAS_ID, getBaseUrl } from '../utils/APHExample';
import * as PIXI from 'pixi.js';

enum NetworkType {
	NONE, CLIENT, SERVER
}

// message ids
const NET_MSG_COMMAND = 20;
const NET_MSG_UPDATE = 21;

// attribute keys for interpolation
const KEY_POSITION_X = 0;
const KEY_POSITION_Y = 1;
const KEY_ROTATION = 2;


/**
 * Custom sync message
 */
export class NetworkExampleMessage extends Net.NetData {
	positionX: number;
	positionY: number;
	rotation: number;

	loadFromStream(reader: Net.NetReader) {
		this.positionX = reader.readFloat();
		this.positionY = reader.readFloat();
		this.rotation = reader.readFloat();
	}

	saveToStream(writer: Net.NetWriter) {
		writer.writeFloat(this.positionX);
		writer.writeFloat(this.positionY);
		writer.writeFloat(this.rotation);
	}

	getDataLength() {
		return 8 + 8 + 8;
	}
}


export class NetworkBehavior extends ECS.Component {
	client: Net.NetworkClient;
	host: Net.NetworkHost;
	interpolator = new Net.Interpolator();
	netType = NetworkType.NONE;
	updateFrequency = 10;
	lastSendTime = 0;
	lag: number;
	packetDrop: number;
	keyInputComponent: ECS.KeyInputComponent;

	constructor(netType: NetworkType, keyInputComponent: ECS.KeyInputComponent, client: Net.NetworkClient, host: Net.NetworkHost, lag: number = 0, packetDrop: number = 0) {
		super();
		this.netType = netType;
		this.lag = lag;
		this.packetDrop = packetDrop;
		this.client = client;
		this.host = host;
		this.keyInputComponent = keyInputComponent;
	}

	onInit() {
		this.subscribe(Net.NetworkMessages.NET_MESSAGE_RECEIVED);
		this.initNetwork(this.netType);
	}

	initNetwork(netType: NetworkType) {
		this.netType = netType;

		if (netType === NetworkType.CLIENT) {
			this.client.initClient(1234, Math.floor(Math.random() * 5000), 5001);
			this.client.autoConnect = true;
			this.client.network.udpManager.packetDropRatio = this.packetDrop;
			this.client.network.udpManager.lag = this.lag;
		}

		if (netType === NetworkType.SERVER) {
			this.host.initHost(1234, 5001);
		}
	}

	processMessageFromHost(netMsg: Net.NetInputMessage) {
		// insert accepted message into the interpolator
		let updateMsg = netMsg.parseData(new NetworkExampleMessage()) as NetworkExampleMessage;
		let deltaInfo = new Net.UpdateInfo(netMsg.msgTime);
		deltaInfo.continuousValues.set(KEY_POSITION_X, updateMsg.positionX);
		deltaInfo.continuousValues.set(KEY_POSITION_Y, updateMsg.positionY);
		deltaInfo.continuousValues.set(KEY_ROTATION, updateMsg.rotation);
		this.interpolator.acceptUpdateMessage(deltaInfo);
	}

	updateInterpolatedValues() {
		// set position and rotation according to the interpolator
		let delta = this.interpolator.currentUpdate;
		if (delta) {
			this.owner.rotation = delta.findValue(KEY_ROTATION);
			this.owner.position.x = delta.findValue(KEY_POSITION_X);
			this.owner.position.y = delta.findValue(KEY_POSITION_Y);
		}
	}

	createMessageForClient(): NetworkExampleMessage {
		// send values to the client
		let updateInfo = new NetworkExampleMessage();
		updateInfo.rotation = this.owner.rotation;
		updateInfo.positionX = this.owner.position.x;
		updateInfo.positionY = this.owner.position.y;
		return updateInfo;
	}

	onMessage(msg: ECS.Message) {
		if (msg.action === Net.NetworkMessages.NET_MESSAGE_RECEIVED) {
			if (this.netType === NetworkType.CLIENT) {
				// push received message to Interpolator
				let netMsg = msg.data as Net.NetInputMessage;
				if (netMsg.action === NET_MSG_UPDATE) {
					this.processMessageFromHost(netMsg);
				}
			} else {
				let netMsg = msg.data as Net.NetInputMessage;
				if (netMsg.action === NET_MSG_COMMAND) {
					// RESET COMMAND
					this.owner.rotation = 0;
				}
			}
		}
	}

	onUpdate(delta: number, absolute: number) {
		this.interpolator.update(delta);
		let keyInput = this.keyInputComponent;

		if (this.netType === NetworkType.CLIENT) {
			// send reset command to the server
			if (keyInput.isKeyPressed(ECS.Keys.KEY_R)) {
				this.client.pushMessageForSending(Net.NetMsgTypes.DATA, NET_MSG_COMMAND, absolute);
			}

			// set position and rotation according to the message
			this.updateInterpolatedValues();
		} else if (this.netType === NetworkType.SERVER) {
			if (Net.checkTime(this.lastSendTime, absolute, this.updateFrequency)) {
				this.lastSendTime = absolute;

				if (!keyInput.isKeyPressed(ECS.Keys.KEY_S)) {
					let updateInfo = this.createMessageForClient();
					this.host.pushMessageForSending(Net.NetMsgTypes.DATA, NET_MSG_UPDATE, absolute, 0, updateInfo, true);
				}
				if (keyInput.isKeyPressed(ECS.Keys.KEY_W) && this.updateFrequency < 10) {
					this.updateFrequency++;
					console.log('Frequency changed to ' + this.updateFrequency);
				}
				if (keyInput.isKeyPressed(ECS.Keys.KEY_Q) && this.updateFrequency > 1) {
					this.updateFrequency--;
					console.log('Frequency changed to ' + this.updateFrequency);
				}
			}
		}
	}
}

export type NetworkBasicConfig = ECS.EngineConfig & {
	netType: NetworkType;
}


export class NetworkBasicBase extends ECSExample {
	netType: NetworkType;

	constructor(config: NetworkBasicConfig) {
		super(config);
		this.netType = config.netType;
	}

	load() {
		Net.UDPEmulator.reset();
		let loader = this.engine.app.loader;
		loader
			.reset()
			.add('sprite', `${getBaseUrl()}/assets/01-helloworld/crash.png`)
			.load(() => {
				let host = new Net.NetworkHost();
				this.engine.scene.addGlobalComponentAndRun(host);
				let client = new Net.NetworkClient();
				this.engine.scene.addGlobalComponentAndRun(client);
				const keyInput = new ECS.KeyInputComponent();
				this.engine.scene.addGlobalComponentAndRun(keyInput);

				let networkBehavior = new NetworkBehavior(this.netType, keyInput, client, host);
				let obj = new ECS.Builder(this.engine.scene)
					.asSprite(new PIXI.Texture(PIXI.BaseTexture.from('sprite')))
					.withComponent(networkBehavior)
					.relativePos(0.5)
					.anchor(0.5)
					.withParent(this.engine.scene.stage)
					.build();

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

				if (this.netType === NetworkType.SERVER) {
					obj.addComponent(new ECS.FuncComponent('Rotation').doOnUpdate((cmp, delta) => cmp.owner.transform.rotation += 0.001 * delta));
				}
			});
	}
}


export class NetworkBasic extends ECSExample {
	server: NetworkBasicBase;
	client: NetworkBasicBase;

	constructor(config: NetworkBasicConfig) {
		super(config);
		// a tricky workaround, as we will use 2 canvases
		this.server = new NetworkBasicBase({
			...config,
			canvasId: config?.canvasId || SECONDARY_CANVAS_ID,
			netType: NetworkType.SERVER,
		});

		this.client = new NetworkBasicBase({
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
export class NetworkBasicClient extends ExampleNetworkBasic {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.CLIENT);
	}
}

export class NetworkBasicServer extends ExampleNetworkBasic {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.SERVER);
	}
}*/