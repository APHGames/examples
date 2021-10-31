import * as ECS from '../../../libs/pixi-ecs';
import { KeyInputComponent, Keys } from '../../../libs/pixi-ecs/components/key-input-component';
import { SPRITE_SIZE, Attributes, Tags, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_B, TEXT_COLOR_D } from '../constants';
import * as PIXI from 'pixi.js';
import { Actions } from '../actions';
import { Selectors } from '../selectors';

/**
 * Component for typing the password
 */
export class PasswordComponent extends ECS.Component {

	// isActive is internal to this component, therefore we don't need to put it
	// into the game state (it only indicates that we are currently typing the password).
	isActive = false;
	hintText: ECS.BitmapText;
	inputText: ECS.BitmapText;
	pointer: ECS.Graphics;
	password: string;
	pointerPos = 0;
	keyCmp: KeyInputComponent;

	onInit() {
		this.keyCmp = this.scene.findGlobalComponentByName<KeyInputComponent>(KeyInputComponent.name);
	}

	onUpdate() {
		if (this.keyCmp.isKeyPressed(Keys.KEY_H) && !this.isActive) {
			this.hintText = this.scene.findObjectByTag(Tags.PASSWORD).asBitmapText();
			this.hintText.visible = false;
			this.keyCmp.handleKey(Keys.KEY_H);
			// put the name of the current level
			this.createInputText(Selectors.gameStateSelector(this.scene).currentLevel.levelData.name);
			// pause the game state
			Selectors.gameStateSelector(this.scene).paused = true;
			this.isActive = true;
		}

		// ESCAPE -> reset
		if (this.keyCmp.isKeyPressed(27) && this.isActive) {
			this.keyCmp.handleKey(27);
			this.cleanup();
		}

		if (this.isActive) {
			// a small hack. ECSLite doesn't expose the list of keys and we need it here
			const keys = (this.keyCmp as any).keys as Set<number>;

			if (keys.size !== 0) {
				// handle first key
				const first = keys.keys().next().value;
				this.keyCmp.handleKey(first);
				if (first === 8 || first === Keys.KEY_LEFT) {
					// backspace
					this.pointerPos = Math.max(0, this.pointerPos - 1);
				} else if (first === Keys.KEY_RIGHT) {
					this.pointerPos = Math.min(4, this.pointerPos + 1);
				} else if (first === Keys.KEY_ENTER) {
					// search for the level
					const levelIndex = Selectors.gameDataSelector(this.scene).levels.findIndex(lvl => lvl.name.toUpperCase() === this.password.toUpperCase());
					if (levelIndex !== -1) {
						// load the level
						this.scene.addGlobalComponent(Actions.loadLevelByIndex(this.scene, levelIndex));
						this.finish();
					} else {
						this.cleanup();
					}
					return;
				} else {
					// we can put only alphabet characters
					if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(String.fromCharCode(first)) !== -1) {
						// update the current password string and move the pointer
						this.password = this.password.substr(0, this.pointerPos) + String.fromCharCode(first).toUpperCase() + this.password.substr(this.pointerPos + 1);
						this.pointerPos = Math.min(4, this.pointerPos + 1);
					}
				}
				this.updateInputText();
			}
		}
	}

	cleanup() {
		this.isActive = false;
		this.inputText.destroy();
		this.pointer.destroy();
		this.hintText.visible = true;
		Selectors.gameStateSelector(this.scene).paused = false;
	}

	updateInputText() {
		this.pointer.position.set(this.inputText.position.x + ('heslo '.length + this.pointerPos) * 8, SPRITE_SIZE * 12 + 1);
		this.inputText.text = 'heslo ' + this.password.toUpperCase();
	}

	createInputText(password: string) {
		this.password = password;
		this.pointerPos = 0;
		const content = 'heslo ' + password.toUpperCase();

		// since this is internal to this component only, we don't need to put this into builders.ts
		this.inputText = new ECS.BitmapText('', content, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_B);
		this.inputText.position.x = FONT_SIZE_PX * (40 / 2 - Math.ceil((content.length) / 2));
		this.inputText.position.y = SPRITE_SIZE * 12 + 1;
		this.inputText.zIndex = 25;
		this.scene.stage.addChild(this.inputText);
		this.pointer = new ECS.Graphics();
		this.pointer.zIndex = 24;
		this.pointer.beginFill(TEXT_COLOR_D);
		this.pointer.drawRect(0, 0, FONT_SIZE_PX, FONT_SIZE_PX);
		this.pointer.endFill();

		this.scene.stage.addChild(this.pointer);
		this.updateInputText();
	}
}