import { MapLoader } from './map-loader';
import { GameMap } from './map';
import { GameUnit } from './game-unit';
import { Vector } from '../../../libs/pixi-component';
import { SpecFunctions, GameState, UnitState } from './constants';

export default class PacmanModel {

  private _spiders: Map<number, GameUnit>;
  private pacdots: Set<number>;
  private pellets: Set<number>;
  private _map: GameMap;
  private _pacman: GameUnit;
  private _gatePos: Vector;
  private _spiderSpawnPos: Vector;
  private _spiderGatePos: Vector;
  private _easternTunnelPos: Vector;
  private _westernTunnelPos: Vector;
  private _gameSpeed: number;
  private _state: GameState;
  private _keyPosition: Vector;
  private _keyTaken: boolean;
  private _livesNum: number;

  public get allPacdotsEaten() {
    return this.pacdots.size === 0;
  }

  public get keyTaken(): boolean {
    return this._keyTaken;
  }

  public get keyPos() {
    return this._keyPosition;
  }

  public get state() {
    return this._state;
  }

  public set state(state: GameState) {
    this._state = state;
  }

  public get map() {
    return this._map;
  }

  public get pacman() {
    return this._pacman;
  }

  public get spiders() {
    return this._spiders;
  }

  public get gatePos() {
    return this._gatePos;
  }

  public get spiderSpawnPos() {
    return this._spiderSpawnPos;
  }

  public get spiderGatePos() {
    return this._spiderGatePos;
  }

  public get easternTunnelPos() {
    return this._easternTunnelPos;
  }

  public get westernTunnelPos() {
    return this._westernTunnelPos;
  }

  public get isRushMode() {
    return this.state === GameState.RUSH_MODE;
  }

  public get gameSpeed() {
    return this._gameSpeed;
  }

  public get livesNum() {
    return this._livesNum;
  }

  public initLevel(gameSpeed: number) {
    if (!this._map) {
      throw new Error('Map is not loaded!');
    }
    this._gameSpeed = gameSpeed;
    this._state = GameState.DEFAULT;
    this._keyTaken = false;
    this._keyPosition = new Vector(-1, -1);
    this._map.init();
    this._livesNum = 4;

    this._pacman = new GameUnit(this.map.getTileByFunction(SpecFunctions.PACMAN_SPAWNER).pos.clone(), this.map);

    // store indices of all pacdots and power-pellets
    this.pacdots = new Set<number>();
    let allPacdots = this.map.getTilesByFunction(SpecFunctions.PACDOT);
    allPacdots.forEach(pd => this.pacdots.add(this.mapToIndex(pd.pos)));

    this.pellets = new Set<number>();
    let allPellets = this.map.getTilesByFunction(SpecFunctions.PELLET);
    allPellets.forEach(pd => this.pellets.add(this.mapToIndex(pd.pos)));

    let gate = this.map.getTileByFunction(SpecFunctions.GATE);
    this._gatePos = gate.pos;

    let tunnels = this.map.getTilesByFunction(SpecFunctions.TUNNEL);
    this._easternTunnelPos = tunnels[0].pos.x > tunnels[1].pos.x ? tunnels[0].pos : tunnels[1].pos;
    this._westernTunnelPos = tunnels[0].pos.x > tunnels[1].pos.x ? tunnels[1].pos : tunnels[0].pos;

    this._spiders = new Map();
    this._spiderGatePos = this.map.getTileByFunction(SpecFunctions.SPIDER_GATE).pos;
    this._spiderSpawnPos = this.map.getTileByFunction(SpecFunctions.SPIDER_SPAWNER).pos;
  }

  public spawnSpider(): GameUnit {
    let spider = new GameUnit(this.spiderSpawnPos.clone(), this.map);
    this._spiders.set(spider.id, spider);
    return spider;
  }

  public killSpider(spider: GameUnit) {
    spider.state = UnitState.DEAD;
    this._spiders.delete(spider.id);
  }

  public killPacman() {
    this.pacman.state = UnitState.DEAD;
    this._livesNum--;
  }

  public spawnKey(): Vector {
    if(!this.keyTaken) {
      let allPacdots = this.map.getTilesByFunction(SpecFunctions.PACDOT);
      let remainingPacdots = this.pacdots;
      let dotsEaten = allPacdots.length - remainingPacdots.size;
      if(dotsEaten > 10) {
        // more than 10 pacdots eaten -> spawn key
        let randomIndex = Math.floor(Math.random() * allPacdots.length);
        let randomPos = allPacdots[randomIndex];
        this._keyPosition = randomPos.pos;
        return this._keyPosition;
      }
    }
    return null;
  }

  public loadMap(mapData: string | GameMap) {
    if (typeof (mapData) === 'string') {
      let loader = new MapLoader();
      let map = loader.loadMap(mapData);
      this._map = map;
    } else {
      this._map = mapData;
    }
  }

  public isSomethingEatable(pos: Vector): boolean {
    let index = this.mapToIndex(pos);
    return this.pacdots.has(index) || this.pellets.has(index) || this.mapToIndex(this._keyPosition) === index;
  }

  public eatPacDot(pos: Vector): boolean {
    let index = this.mapToIndex(pos);
    if (this.pacdots.has(index)) {
      this.pacdots.delete(index);
      return true;
    }
    return false;
  }

  public eatPellet(pos: Vector, enableRushMode: boolean = true): boolean {
    let index = this.mapToIndex(pos);
    if (this.pellets.has(index)) {
      this.pellets.delete(index);
      if (enableRushMode) {
        this.state = GameState.RUSH_MODE;
      }
      return true;
    }
    return false;
  }

  public fetchKey() {
    this._keyTaken = true;
    this._keyPosition = new Vector(-1, -1);
  }


  public mapToIndex(pos: Vector) {
    return (pos.y * this.map.gridWidth + pos.x);
  }
}