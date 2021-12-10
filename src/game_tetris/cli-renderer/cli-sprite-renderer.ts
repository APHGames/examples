import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { Symbols, CLIProps, CLIRendererBase } from './cli-renderer-base';

export interface CLISpriteProps extends CLIProps {
	fontDefinition: XMLDocument; // content of the .fnt file
	fontTexture: PIXI.Texture;
	textColor: number;
	highlightedTextColor: number;
	highlightColor: number; // color of background behind the highlighted text
}

/**
 * Attributes for a character to draw, taken from .fnt file XML content
 */
type CharData = {
	x: number;
	y: number;
	width: number;
	height: number;
	xOffset: number;
	yOffset: number;
}

/**
 * Component that simulates CLI interface by using two layers of sprites
 * Every sprite represents a single letter
 * Supports multiple colors
 * Technically, it uses two layers - one for texts,
 * the other draws DECORATION_FILL as a background for inverted text
 */
export class CLISpriteRenderer extends CLIRendererBase<CLISpriteProps> {

	protected text: ECS.Sprite[] = [];
	protected highlights: ECS.Sprite[] = [];
	protected charDefs: Map<number, CharData> = new Map();
	protected highlighted: Set<number>;

	protected maxWidth: number;
	protected maxHeight: number;

	// current colors (can be changed any time)
	protected textColor: number;
	protected highlightColor: number;


	onInit() {
		// initialize the grid with empty spaces
		const chars = this.props.fontDefinition.getElementsByTagName('char');

		this.highlighted = new Set();
		this.maxWidth = 0;
		this.maxHeight = 0;
		this.resetColors();

		// get char data from XML
		for (let i = 0; i < chars.length; i++) {
			const char = chars.item(i);
			const id = parseInt(char.getAttribute('id'));
			const x = parseInt(char.getAttribute('x'));
			const y = parseInt(char.getAttribute('y'));
			const width = parseInt(char.getAttribute('width'));
			const height = parseInt(char.getAttribute('height'));
			const xOffset = parseInt(char.getAttribute('xoffset'));
			const yOffset = parseInt(char.getAttribute('yoffset'));

			this.maxWidth = Math.max(this.maxWidth, width);
			this.maxHeight = Math.max(this.maxHeight, height);

			this.charDefs.set(id, {
				x, y, width, height, xOffset, yOffset
			});
		}

		// put all sprites in place
		for (let i = 0; i < this.props.rows; i++) {
			for (let j = 0; j < this.props.columns; j++) {
				const index = i * this.props.columns + j;
				this.text[index] = new ECS.Sprite('', this.props.fontTexture.clone());
				this.text[index].position.set(j * this.maxWidth, i * this.maxHeight);
				this.text[index].tint = this.textColor;

				// highlight only draws █ behind the main text
				this.highlights[index] = new ECS.Sprite('', this.props.fontTexture.clone());
				this.highlights[index].position.set(j * this.maxWidth, i * this.maxHeight);
				this.highlights[index].tint = this.textColor;
				const charCode = Symbols.DECOR_FILL.charCodeAt(0);
				const charDef = this.charDefs.get(charCode);
				// the frame of highlights won't change
				this.highlights[index].texture.frame =
					new PIXI.Rectangle(charDef.x, charDef.y, charDef.width, this.maxHeight);

				// highlights must be put first
				this.owner.addChild(this.highlights[index]);
				this.owner.addChild(this.text[index]);

				// draw an empty space -> nothing, in order to initialize the second layer
				this.drawChar(' ', j, i);
			}
		}
	}

	onFinish() {
		super.onFinish();
		this.text.forEach(txt => txt.destroy());
		this.highlights.forEach(txt => txt.destroy());
	}

	revertHighlight() {
		this.disableHighlight();
		for(let index of this.highlighted.values()) {
			this.highlights[index].visible = false;
			this.text[index].tint = this.textColor;
		}
		this.highlighted.clear();
	}

	/**
	 * Changes the colors to new values
	 * @param textColor color of the text
	 * @param highlightColor color of the highlighted text
	 * @param apply if true, it will be applied to the text that has been rendered
	 */
	changeColors(textColor: number, highlightColor: number, apply = false) {
		this.textColor = textColor;
		this.highlightColor = highlightColor;

		if(apply) {
			this.text.forEach((val, index) => {
				if(this.highlighted.has(index)) {
					val.tint = highlightColor;
				} else {
					val.tint = textColor;
				}
				this.highlights[index].tint = textColor;
			});
		}
	}

	/**
	 * Resets the colors to the default values specified in PROPS entity
	 * @param apply if true, it will be applied to the text that has been rendered
	 */
	resetColors(apply = false) {
		this.changeColors(this.props.textColor, this.props.highlightColor, apply);
	}

	protected changeText(index: number, newStr: string) {
		for (let i = index; i < (index + newStr.length); i++) {
			const charCode = newStr.charCodeAt(i - index);
			let charDef = this.charDefs.get(charCode);
			if(!charDef) {
				// if not found, draw a ? by default
				charDef = this.charDefs.get('?'.charCodeAt(0));
			}
			const col = i % this.props.columns;
			const row = Math.floor(i / this.props.columns);

			this.text[i].tint = this.textColor;
			this.text[i].texture.frame = new PIXI.Rectangle(charDef.x, charDef.y, charDef.width, charDef.height);
			// adjust the position a bit by the yOffset - each character has its own offset
			this.text[i].position.set(col * 8 + charDef.xOffset, row * 16 + charDef.yOffset);

			if(this.isHighlighted) {
				// highlighted background always has the same sizing, since we render █
				this.text[i].tint = this.props.highlightedTextColor;
				this.highlights[i].visible = true;
				this.highlights[i].tint = this.highlightColor;
				this.highlighted.add(i);
			} else {
				this.highlights[i].visible = false;
				this.highlighted.delete(i);
			}
		}
	}
}