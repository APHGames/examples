import { Vector} from '../../../libs/pixi-component';
import { BrickTypes } from './constants';

/**
 * Brick entity defined by type and position index
 * Be advised that the position is NOT a position on a game screen but
 * a 2D index of a 2D array the level is represented by
 */
export class Brick {
  type: number;
  position: Vector;
}

// number of columns of each level
export const COLUMNS_NUM = 11;

/**
 * Entity that stores metadata about each sprite as loaded from JSON file
 */
export class SpriteInfo {
  name: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  frames: number;

  constructor(name: string, offsetX: number, offsetY: number, width: number, height: number, frames: number) {
    this.name = name;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.width = width;
    this.height = height;
    this.frames = frames;
  }
}

export class Model {

  // bricks mapped by their indices
  bricks = new Map<number, Brick>();
  // brick sprites mapped by their IDs
  brickSprites = new Map<number, Brick>();
  // metadata of all sprites as loaded from JSON file
  sprites: Array<SpriteInfo>;
  // 2D arrays of levels as loaded from JSON file
  levels: Array<Array<Array<number>>>;

  maxLevel = 0;
  ballOffset = 1;
  paddleSpeed = 0.02;
  maxLives;
  ballInitSpeed = 0.03; // initial speed of the ball

  //=============== dynamic attributes (changed as the game is played)
  ballReleased = false;
  remainingBricks = 0;
  currentRound = 0;
  currentLevel = 0;
  ballSpeed;
  ballSpeedMultiplier;
  currentLives = 0;

  /**
   * Loads model from a JSON structure
   */
  loadModel(data: any) {
    this.sprites = new Array<SpriteInfo>();

    for (let spr of data.sprites) {
      this.sprites.push(new SpriteInfo(spr.name, spr.offset_px_x, spr.offset_px_y, spr.sprite_width, spr.sprite_height, spr.frames));
    }

    this.maxLives = data.max_lives;
    this.ballSpeed = data.ball_speed;
    this.ballSpeedMultiplier = data.ball_speed_multiplier;
    this.maxLevel = data.levels_total;

    this.levels = new Array();

    for (let level of data.levels_maps) {
      this.levels.push(level);
    }
  }

  /**
   * Initializes the current level
   */
  initLevel() {
    this.bricks.clear();
    this.remainingBricks = 0;
    this.currentRound = 0;
    this.ballReleased = false;
    this.currentLives = this.maxLives;
    this.loadBricks();
  }

  getSpriteInfo(name: string): SpriteInfo {
    for (let spr of this.sprites) {
      if (spr.name === name) {
        return spr;
      }
    }
    return null;
  }

  getBrick(position: Vector): Brick {
    let index = position.y * COLUMNS_NUM + position.x;
    return this.bricks.get(index);
  }

  removeBrick(position: Vector) {
    let index = position.y * COLUMNS_NUM + position.x;
    return this.bricks.delete(index);
  }


  /**
   * Fills map of bricks from an array the level is represented by
   */
  protected loadBricks() {
    for (let row = 0; row < this.levels[this.currentLevel - 1].length; row++) {
      for (let col = 0; col < COLUMNS_NUM; col++) {

        let brickIndex = this.levels[this.currentLevel - 1][row][col];

        if (brickIndex !== BrickTypes.DEFAULT) {
          // add a new brick
          let brick = new Brick();
          brick.position = new Vector(col, row);
          brick.type = brickIndex;
          let index = row * COLUMNS_NUM + col;
          this.bricks.set(index, brick);
          if (brickIndex !== BrickTypes.INDESTRUCTIBLE) {
            this.remainingBricks++;
          }
        }
      }
    }
  }
}
