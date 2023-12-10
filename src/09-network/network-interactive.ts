import * as ECS from '../../libs/pixi-ecs';
import { TranslateAnimation, InterpolationType } from '../utils/animation';
import * as Net from '../../libs/network-emulator';
import { ECSExample, SECONDARY_CANVAS_ID } from '../utils/APHExample';
import * as PIXI from 'pixi.js';

enum NetworkType {
	NONE, CLIENT, SERVER
}

const NET_MSG_COMMAND = 20;


class NetworkMessage extends Net.NetData {
	param1: number = 0; // color
	param2: number = 0; // position X
	param3: number = 0; // position Y

	constructor(param1: number = 0, param2: number = 0, param3: number = 0) {
		super();
		this.param1 = param1;
		this.param2 = param2;
		this.param3 = param3;
	}

	loadFromStream(reader: Net.NetReader) {
		this.param1 = reader.read4B();
		this.param2 = reader.readFloat();
		this.param3 = reader.readFloat();
	}

	saveToStream(writer: Net.NetWriter) {
		writer.write4B(this.param1);
		writer.writeFloat(this.param2);
		writer.writeFloat(this.param3);
	}

	getDataLength() {
		return 4 + 8 + 8;
	}
}

abstract class SyncComponent extends ECS.Component {
	idCounter = 0;

	onInit() {
		this.subscribe(Net.NetworkMessages.NET_MESSAGE_RECEIVED);
		this.subscribe(ECS.PointerMessages.POINTER_TAP);
	}

	onMessage(msg: ECS.Message) {
		if (msg.action === Net.NetworkMessages.NET_MESSAGE_RECEIVED) {
			let netMsg = msg.data as Net.NetInputMessage;
			if (netMsg.action === NET_MSG_COMMAND) {
				this.processReceivedMessage(netMsg);
			}
		} else if (msg.action === ECS.PointerMessages.POINTER_TAP && this.canAddObjects()) {
			let posX = msg.data.mousePos.posX;
			let posY = msg.data.mousePos.posY;
			let color = Math.floor(Math.random() * 0xFFFFFF);
			this.addNewObject(color, posX, posY);
			this.notifyObjectCreated(color, posX, posY);
		}
	}

	addNewObject(color: number, posX: number, posY: number) {
		let obj = new ECS.Graphics();
		obj.beginFill(color);
		obj.drawRect(0, 0, 100, 100);
		obj.endFill();
		obj.position.x = posX;
		obj.position.y = posY;
		obj.pivot.set(50, 50);
		this.scene.stage.addChild(obj);
	}

	processReceivedMessage(netMsg: Net.NetInputMessage) {
		let cmdMsg = netMsg.parseData(new NetworkMessage()) as NetworkMessage;
		this.addNewObject(cmdMsg.param1, cmdMsg.param2, cmdMsg.param3);
	}

	abstract canAddObjects(): boolean;

	abstract notifyObjectCreated(color: number, posX: number, posY: number);

}

class ClientSyncComponent extends SyncComponent {
	client: Net.NetworkClient;
	idCounter = 10000; // start at 10000 to avoid conflicts with server

	constructor(client: Net.NetworkClient) {
		super();
		this.client = client;
	}

	onInit() {
		super.onInit();
		this.client.initClient(70, 8000, 8001);
		this.client.autoConnect = true;
	}

	canAddObjects(): boolean {
		return this.client.networkState === Net.ClientState.CONNECTED;
	}

	sendMessageToHost(message: NetworkMessage, time: number) {
		this.client.pushMessageForSending(Net.NetMsgTypes.DATA, NET_MSG_COMMAND, time, message, false, true);
	}

	notifyObjectCreated(color: number, posX: number, posY: number) {
		this.sendMessageToHost(new NetworkMessage(color, posX, posY), this.scene.currentAbsolute);
	}
}

class ServerSyncComponent extends SyncComponent {
	host: Net.NetworkHost;
	idCounter = 0;

	constructor(host: Net.NetworkHost) {
		super();
		this.host = host;
	}

	onInit() {
		super.onInit();
		this.host.initHost(70, 8001);
	}

	sendMessageToClient(message: NetworkMessage, time: number) {
		this.host.pushMessageForSending(Net.NetMsgTypes.DATA, NET_MSG_COMMAND, time, 0, message, false, true);
	}

	notifyObjectCreated(color: number, posX: number, posY: number) {
		this.sendMessageToClient(new NetworkMessage(color, posX, posY), this.scene.currentAbsolute);
	}

	canAddObjects(): boolean {
		return this.host.peers.size !== 0;
	}
}

export type NetworkInteractiveConfig = ECS.EngineConfig & {
	netType: NetworkType;
}


export class NetworkInteractiveBase extends ECSExample {
	netType: NetworkType;

	constructor(config: NetworkInteractiveConfig) {
		super(config);
		this.netType = config.netType;
	}

	load() {
		Net.UDPEmulator.reset();
		let host = new Net.NetworkHost();
		let client = new Net.NetworkClient();

		if (this.netType === NetworkType.CLIENT) {
			this.engine.scene.addGlobalComponent(new ClientSyncComponent(client));
		} else {
			this.engine.scene.addGlobalComponent(new ServerSyncComponent(host));
		}

		this.engine.scene.addGlobalComponentAndRun(host);
		this.engine.scene.addGlobalComponentAndRun(client);
		this.engine.scene.addGlobalComponentAndRun(new ECS.PointerInputComponent({
			handleClick: true
		}));

		new ECS.Builder(this.engine.scene)
			.withParent(this.engine.scene.stage)
			.asText('text', new PIXI.TextStyle({ fontSize: 35, fill: '#0F0' }))
			.withComponent(new ECS.FuncComponent('').doOnUpdate((cmp) => {
				if (this.netType === NetworkType.SERVER) {
					cmp.owner.asText().text = host.peers.size === 0 ? 'WAIT' : 'CONNECTED';
				} else {
					cmp.owner.asText().text = client.networkState === Net.ClientState.CONNECTED ? 'CONNECTED' : 'WAIT';
				}
			}))
			.build();

	}
}


export class NetworkInteractive extends ECSExample {
	server: NetworkInteractiveBase;
	client: NetworkInteractiveBase;

	constructor(config: NetworkInteractiveConfig) {
		super(config);
		// a tricky workaround, as we will use 2 canvases
		this.server = new NetworkInteractiveBase({
			...config,
			canvasId: config?.canvasId || SECONDARY_CANVAS_ID,
			netType: NetworkType.SERVER,
		});

		this.client = new NetworkInteractiveBase({
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
export class NetworkInteractiveClient extends ExampleNetworkInteractive {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.CLIENT);
	}
}

export class NetworkInteractiveServer extends ExampleNetworkInteractive {
	constructor(view: HTMLCanvasElement) {
		super(view, NetworkType.SERVER);
	}
}
*/