import * as ECS from '../../libs/pixi-ecs';
import * as Net from '../../libs/network-emulator';
import { SteeringComponent } from '../08-ai/pursue/steering';
import { Steering } from '../../libs/aph-math';
import { ECSExample, SECONDARY_CANVAS_ID } from '../utils/APHExample';
import * as PIXI from 'pixi.js';

enum NetworkType {
	NONE, CLIENT, SERVER
}

const NET_MSG_UPDATE = 21;

const KEY_POSITION_X = 0;
const KEY_POSITION_Y = 1;
const KEY_ROTATION = 2;

const OBJECTS_NUM = 20;

export class RandomMovement extends SteeringComponent {
	wanderTarget = new ECS.Vector(0, 0);
	angle = 0;
	wanderDistance: number;
	wanderRadius: number;
	wanderJittering: number;

	constructor(wanderDistance: number, wanderRadius: number, wanderJittering: number) {
		super(20, new ECS.Vector(1, 1));
		this.wanderDistance = wanderDistance;
		this.wanderRadius = wanderRadius;
		this.wanderJittering = wanderJittering;
	}

	onUpdate(delta: number, absolute: number) {
		super.onUpdate(delta, absolute);
		let currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
		this.owner.rotation = currentAngle;
	}

	protected calcForce(delta: number): ECS.Vector {
		let force = Steering.wander(this.velocity, this.wanderTarget, this.wanderRadius, this.wanderDistance, this.wanderJittering, delta);
		this.wanderTarget = force[1];
		return force[0];
	}
}

/**
 * Custom networking message that stores values for all objects
 */
class NetworkExampleMessage extends Net.NetData {
	positionsX: number[] = [];
	positionsY: number[] = [];
	rotations: number[] = [];
	objectsNum: number;

	loadFromStream(reader: Net.NetReader) {
		this.objectsNum = reader.read2B();
		for (let i = 0; i < this.objectsNum; i++) {
			this.positionsX.push(reader.readFloat());
			this.positionsY.push(reader.readFloat());
			this.rotations.push(reader.readFloat());
		}
	}

	saveToStream(writer: Net.NetWriter) {
		writer.write2B(this.objectsNum);
		for (let i = 0; i < this.objectsNum; i++) {
			writer.writeFloat(this.positionsX[i]);
			writer.writeFloat(this.positionsY[i]);
			writer.writeFloat(this.rotations[i]);
		}
	}

	getDataLength() {
		return (8 + 8 + 8) * this.objectsNum + 2;
	}
}

class NetworkBehavior extends ECS.Component {
	client: Net.NetworkClient;
	host: Net.NetworkHost;
	interpolator = new Net.Interpolator();
	netType = NetworkType.NONE;
	updateFrequency = 10;
	lastSendTime = 0;
	objects: ECS.Container[];
	lag: number = 0;
	keyInput: ECS.KeyInputComponent;

	constructor(netType: NetworkType, client: Net.NetworkClient, host: Net.NetworkHost, keyInput: ECS.KeyInputComponent, lag: number = 0) {
		super();
		this.client = client;
		this.host = host;
		this.netType = netType;
		this.lag = lag;
		this.keyInput = keyInput;
	}

	onInit() {
		this.objects = this.scene.findObjectsByTag('BOT');
		this.subscribe(Net.NetworkMessages.NET_MESSAGE_RECEIVED);
		this.initNetwork(this.netType);
	}

	initNetwork(netType: NetworkType) {
		this.netType = netType;

		if (netType === NetworkType.CLIENT) {
			this.client.initClient(50, 6000, 6001);
			this.client.autoConnect = true;
			this.client.network.udpManager.lag = this.lag;
		}

		if (netType === NetworkType.SERVER) {
			this.host.initHost(50, 6001);
			this.host.network.udpManager.lag = this.lag;
		}
	}

	processMessageFromHost(netMsg: Net.NetInputMessage) {
		let updateMsg = netMsg.parseData(new NetworkExampleMessage()) as NetworkExampleMessage;
		let deltaInfo = new Net.UpdateInfo(netMsg.msgTime);
		for (let i = 0; i < this.objects.length; i++) {
			// identifier of each attribute is determined by the position of given object in the array and a key offset
			deltaInfo.continuousValues.set(i * 3 + KEY_POSITION_X, updateMsg.positionsX[i]);
			deltaInfo.continuousValues.set(i * 3 + KEY_POSITION_Y, updateMsg.positionsY[i]);
			deltaInfo.continuousValues.set(i * 3 + KEY_ROTATION, updateMsg.rotations[i]);
		}
		this.interpolator.acceptUpdateMessage(deltaInfo);
	}

	updateInterpolatedValues() {
		// set position and rotation according to the message
		let delta = this.interpolator.currentUpdate;
		if (delta) {
			for (let i = 0; i < this.objects.length; i++) {
				this.objects[i].rotation = delta.findValue(i * 3 + KEY_ROTATION);
				this.objects[i].position.x = delta.findValue(i * 3 + KEY_POSITION_X);
				this.objects[i].position.y = delta.findValue(i * 3 + KEY_POSITION_Y);
			}
		}
	}

	createMessageForClient(): NetworkExampleMessage {
		// send values to the client
		let updateInfo = new NetworkExampleMessage();
		updateInfo.objectsNum = this.objects.length;
		for (let i = 0; i < this.objects.length; i++) {
			updateInfo.rotations[i] = this.objects[i].rotation;
			updateInfo.positionsX[i] = this.objects[i].position.x;
			updateInfo.positionsY[i] = this.objects[i].position.y;
		}

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
			}
		}
	}

	onUpdate(delta: number, absolute: number) {
		this.interpolator.update(delta);

		if (this.netType === NetworkType.CLIENT) {
			// set position and rotation according to the message
			this.updateInterpolatedValues();
		} else if (this.netType === NetworkType.SERVER) {
			if (Net.checkTime(this.lastSendTime, absolute, this.updateFrequency)) {
				this.lastSendTime = absolute;

				if (!this.keyInput.isKeyPressed(ECS.Keys.KEY_R)) {
					let updateInfo = this.createMessageForClient();
					this.host.pushMessageForSending(Net.NetMsgTypes.DATA, NET_MSG_UPDATE, absolute, 0, updateInfo, true);
				}
				if (this.keyInput.isKeyPressed(ECS.Keys.KEY_W) && this.updateFrequency < 10) {
					this.updateFrequency++;
					console.log('Frequency changed to ' + this.updateFrequency);
				}
				if (this.keyInput.isKeyPressed(ECS.Keys.KEY_Q) && this.updateFrequency > 1) {
					this.updateFrequency--;
					console.log('Frequency changed to ' + this.updateFrequency);
				}
			}
		}
	}
}

export type NetworkSteeringConfig = ECS.EngineConfig & {
	netType: NetworkType;
}

export class NetworkSteeringBase extends ECSExample {
	netType: NetworkType;

	constructor(config: NetworkSteeringConfig) {
		super(config);
		this.netType = config.netType;
	}

	load() {
		Net.UDPEmulator.reset();

		let client = new Net.NetworkClient();
		let host = new Net.NetworkHost();
		const keyInput = new ECS.KeyInputComponent();
		let networkBehavior = new NetworkBehavior(this.netType, client, host, keyInput);

		this.engine.scene.addGlobalComponentAndRun(host);
		this.engine.scene.addGlobalComponentAndRun(client);
		this.engine.scene.addGlobalComponent(networkBehavior);
		this.engine.scene.addGlobalComponentAndRun(keyInput);

		for (let i = 0; i < OBJECTS_NUM; i++) {
			let wanderBoid = new ECS.Graphics('WANDER');
			wanderBoid.addTag('BOT');
			wanderBoid.beginFill(0xFF0000 + Math.floor(i / OBJECTS_NUM * 255));
			wanderBoid.drawPolygon([-10, -10, -10, 10, 15, 0]);
			wanderBoid.endFill();
			wanderBoid.scale.set(2);
			wanderBoid.position.set(Math.random() * this.canvas.clientWidth, Math.random() * this.canvas.clientHeight);
			this.engine.scene.stage.addChild(wanderBoid);
			if (this.netType !== NetworkType.CLIENT) {
				wanderBoid.addComponent(new RandomMovement(Math.random() * 20, Math.random() * 10, 0.1));
			}
		}

		new ECS.Builder(this.engine.scene)
			.withParent(this.engine.scene.stage)
			.asText('text', new PIXI.TextStyle({ fontSize: 35, fill: '#0F0' }))
			.withComponent(new ECS.FuncComponent('').doOnUpdate((cmp, delta, absolute) => {
				if (this.netType === NetworkType.SERVER) {
					cmp.owner.asText().text = 'Update Frequency: ' + networkBehavior.updateFrequency;
				} else {
					cmp.owner.asText().text = client.networkState + '';
				}
			}))
			.build();
	}
}


export class NetworkSteering extends ECSExample {
	server: NetworkSteeringBase;
	client: NetworkSteeringBase;

	constructor(config: NetworkSteeringConfig) {
		super(config);
		// a tricky workaround, as we will use 2 canvases
		this.server = new NetworkSteeringBase({
			...config,
			canvasId: config?.canvasId || SECONDARY_CANVAS_ID,
			netType: NetworkType.SERVER,
		});

		this.client = new NetworkSteeringBase({
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
export class NetworkSteeringClient extends ExampleNetworkSteering {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.CLIENT);
	}
}

export class NetworkSteeringServer extends ExampleNetworkSteering {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.SERVER);
	}
}
*/