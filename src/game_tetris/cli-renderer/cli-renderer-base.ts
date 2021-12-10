import * as ECS from '../../../libs/pixi-ecs';

/**
 * Visual CLI symbols
 */
export enum Symbols {
	DECOR_BOTTOMRIGHT = '╝',
	DECOR_TOPLEFT = '╔',
	DECOR_TOPRIGHT = '╗',
	DECOR_BOTTOMLEFT = '╚',
	DECOR_COL = '║',
	DECOR_ROW = '═',
	DECOR_FILL = '█',
	DECOR_FLEFT = '▌',
	DECOR_FRIGHT = '▐',
	DECOR_SEMIFILL = '▓',
}

/**
 * Colors from CGA palette
 */
export enum CGAColors {
	BLUE = 0x0000AA,
	GREEN = 0x00AA00,
	CYAN = 0x00AAAA,
	RED = 0xAA0000,
	LBLUE = 0x5555FF,
	LGREEN = 0x55FF55,
	LCYAN = 0x55FFFF,
	LRED = 0xFF5555,
	WHITE = 0xFFFFFF,
	BLACK = 0x000000
}

export interface CLIProps {
	columns: number;
	rows: number;
}

export enum CLIMode {
	NORMAL,
	HIGHLIGHTED
}

/**
 * Component that simulates CLI interface, base class for concrete implementations
 */
export abstract class CLIRendererBase<T extends CLIProps> extends ECS.Component<T> {

	protected mode: CLIMode = CLIMode.NORMAL;

	/**
	 * Clears up the whole screen
	 */
	clear() {
		this.drawRect(' ', 0, 0, this.props.columns, this.props.rows);
	}

	/**
	 * Draws a single character
	 * @param char character to draw
	 * @param col column in the grid
	 * @param row row in the grid
	 */
	drawChar(char: string, col: number, row: number) {
		if (char === '\t' || char === '\b' || char === '\r') {
			throw new Error('Tabs and returns are not supported!');
		}
		const index = this.posToIndex(col, row);
		this.changeText(index, char);
	}

	/**
	 * Draws a row of the same character
	 * @param char character to draw
	 * @param col column in the grid
	 * @param row row in the grid
	 * @param length length of the row
	 */
	drawRow(char: string, col: number, row: number, length: number) {
		const maxLength = Math.min(length, this.props.columns - col);
		const index = this.posToIndex(col, row);
		let line = '';
		for (let i = 0; i < maxLength; i++) {
			line += char.charAt(0);
		}
		this.changeText(index, line);
	}

	/**
	 * Draws a column of the same character
	 * @param char character to draw
	 * @param col column in the grid
	 * @param row row in the grid
	 * @param length length (height) of the column
	 */
	drawColumn(char: string, col: number, row: number, length: number) {
		const maxLength = Math.min(length, this.props.rows - row);
		for (let i = 0; i < maxLength; i++) {
			const index = this.posToIndex(col, row + i);
			this.changeText(index, char.charAt(0));
		}
	}

	/**
	 * Draws a pattern. You can use newline characters as well
	 * For instance:  ABC will draw ABCABCABC
	 * AB\nBA will render  ABAB...
	 *                     BABA...
	 * @param pattern pattern to draw
	 * @param col column in the grid
	 * @param row row in the grid
	 * @param width width of the rectangle
	 * @param height height of the rectangle
	 */
	drawPattern(pattern: string, col: number, row: number, width: number, height: number) {
		const maxWidth = Math.min(width, this.props.columns - col);
		const maxHeight = Math.min(height, this.props.rows - row);
		const lines = pattern.split('\n');

		for (let i = 0; i < maxWidth; i++) {
			for (let j = 0; j < maxHeight; j++) {
				const line = lines[j % lines.length];
				const char = line.charAt(i % line.length);
				this.drawChar(char, col + i, row + j);
			}
		}
	}

	/**
	 * Draws a rectangle of the same characters
	 * @param char character to draw
	 * @param col column in the grid
	 * @param row row in the grid
	 * @param width width of the rectangle
	 * @param height height of the rectangle
	 */
	drawRect(char: string, col: number, row: number, width: number, height: number) {
		const maxHeight = Math.min(height, this.props.rows - row);
		for (let i = 0; i < maxHeight; i++) {
			this.drawRow(char, col, row + i, width);
		}
	}

	/**
	 * Draws text and renders a box around it
	 * @param text text to draw
	 * @param col column of the text
	 * @param row row of the text
	 * @param align horizontal align (allowed values are left, right, center)
	 * @param margin margin of the box
	 */
	drawTextWithBox(text: string, col: number, row: number,
		align: 'left' | 'right' | 'center' = 'left', margin: number = 1) {
		const bbox = this.drawText(text, col, row, align);
		// vertical margin is lowered by 1, as the decoration symbols have some extra space
		this.drawBox(bbox.x - margin - 1, bbox.y - margin, bbox.w + margin * 2 + 2, bbox.h + margin * 2);
	}

	/**
	 * Draws a decorated box
	 * @param col column in the grid
	 * @param row row in the grid
	 * @param width width of the box
	 * @param height height of the box
	 */
	drawBox(col: number, row: number, width: number, height: number) {
		const maxWidth = Math.min(width, this.props.columns - col);
		const maxHeight = Math.min(height, this.props.rows - row);
		this.drawChar(Symbols.DECOR_TOPLEFT, col, row);
		this.drawChar(Symbols.DECOR_BOTTOMLEFT, col, row + maxHeight - 1);
		this.drawChar(Symbols.DECOR_BOTTOMRIGHT, col + maxWidth - 1, row + maxHeight - 1);
		this.drawChar(Symbols.DECOR_TOPRIGHT, col + maxWidth - 1, row);
		this.drawColumn(Symbols.DECOR_COL, col, row + 1, maxHeight - 2);
		this.drawColumn(Symbols.DECOR_COL, col + maxWidth - 1, row + 1, maxHeight - 2);
		this.drawRow(Symbols.DECOR_ROW, col + 1, row, maxWidth - 2);
		this.drawRow(Symbols.DECOR_ROW, col + 1, row + maxHeight - 1, maxWidth - 2);
	}

	/**
	 * Switches to highlight mode
	 */
	enableHighlight() {
		this.mode = CLIMode.HIGHLIGHTED;
	}

	/**
	 * Switches to normal mode
	 */
	disableHighlight() {
		this.mode = CLIMode.NORMAL;
	}

	get isHighlighted() {
		return this.mode === CLIMode.HIGHLIGHTED;
	}


	/**
	 * Draws a text and returns its bounding box
	 * Be advised that the text always starts at the top-left edge,
	 * regardless of the horizontal alignment
	 * @param text text to draw
	 * @param col column in the grid
	 * @param row row in the grid
	 * @param align horizontal alignment (allowed values are left, right, center)
	 * @param width width of the container (by default it's the
	 * remaining space before the edge of the window)
	 * @param valign vertical alignment (allowed values are top, center, bottom)
	 * @param height height of the container (by default it's the
	 * remaining space before the edge of the window)
	 * @returns bounding box of the drawn text
	 */
	drawText(text: string, col: number, row: number,
		align: 'left' | 'right' | 'center' = 'left', width: number = this.props.columns,
		valign: 'top' | 'center' | 'bottom' = 'top', height: number = this.props.rows) {

		if (text.indexOf('\t') !== -1 || text.indexOf('\b') !== -1 || text.indexOf('\r') !== -1) {
			throw new Error('Backspaces and tabs are not supported');
		}

		// PHASE 1: calculate lines with words that will fit the space
		const linesToDraw = new Array<{ line: string; col: number; row: number }>();
		// clamp values
		width = Math.min(width, this.props.columns - col);
		height = Math.min(height, this.props.rows - row);

		if (text.length <= width && text.indexOf('\n') === -1) {
			// the simplest case - the text will fit
			linesToDraw.push({ line: text, col: 0, row: 0 });
		} else {
			// split by lines
			const lines = text.split('\n');
			let lineIndex = 0;
			for (let line of lines) {
				// split by words
				const words = line.split(' ');
				let linePointer = 0;
				for (let i = 0; i < words.length; i++) {
					const word = words[i];
					if (word.length <= (width - linePointer)) {
						// word fits
						if (linesToDraw.length && linesToDraw[linesToDraw.length - 1].row === lineIndex) {
							// append to the previous line if it's the same line. Otherwise, push a new word to the collection
							// - this will be important for horizontal and vertical alignment later on
							linesToDraw[linesToDraw.length - 1].line += ' ' + word;
						} else {
							linesToDraw.push({ line: word, col: linePointer, row: lineIndex });
						}
						linePointer += (word.length + 1);
					} else if (word.length <= width) {
						// word would fit if it was on a new line -> increment the line pointer
						lineIndex++;
						linePointer = 0;
						linesToDraw.push({ line: word, col: linePointer, row: lineIndex });
						linePointer += (word.length + 1);
					} else {
						// word does not fit at all -> we need to split it (this may happen for too long words)
						const whatFits = word.substr(0, width - linePointer);
						if (linesToDraw.length && linesToDraw[linesToDraw.length - 1].row === lineIndex) {
							// append
							linesToDraw[linesToDraw.length - 1].line += ' ' + whatFits;
						} else {
							linesToDraw.push({ line: whatFits, col: linePointer, row: lineIndex });
						}
						// go to another line and add the remaining word to this collection
						lineIndex++;
						linePointer = 0;
						const whatDoesNotFit = word.substr(whatFits.length);
						words.splice(i + 1, 0, whatDoesNotFit);
					}
				}
				lineIndex++;
			}
		}
		// here, linesToDraw should contain words to render for each line separately
		// now we need to apply horizontal and vertical alignment

		// PHASE 2: draw the text and calculate bounding box of drawn text for the caller
		const boundingBox = {
			x: col + linesToDraw[0].col,
			y: row + linesToDraw[0].row,
			w: 0,
			h: linesToDraw.length
		};

		let startY = row;
		if (valign === 'center') {
			startY = row + Math.floor((height - linesToDraw.length) / 2);
		} else if (valign === 'bottom') {
			startY = row + height - linesToDraw.length;
		}

		for (let line of linesToDraw) {
			// position is stored relatively
			let index = this.posToIndex(line.col + col, line.row + startY);
			if (align === 'center') {
				index = index + Math.floor((width - line.line.length) / 2);
			} else if (align === 'right') {
				index = index + width - line.line.length;
			}
			// draw each line one by one
			this.changeText(index, line.line);
			boundingBox.w = Math.max(boundingBox.w, line.line.length);
		}

		return boundingBox;
	}

	protected posToIndex(col: number, row: number) {
		if (col < 0 || row < 0 || col >= this.props.columns || row >= this.props.rows) {
			// clamp the pos
			col = Math.min(Math.max(col, 0), this.props.columns - 1);
			row = Math.min(Math.max(row, 0), this.props.rows - 1);
		}
		return row * (this.props.columns) + col;
	}

	/**
	 * Reverts all highlighted text back to normal
	 */
	abstract revertHighlight();

	/**
	 * Will re-render text at given index with a new string
	 * Keep in mind that the text may contain new line characters
	 * @param index index to start at
	 * @param newStr new text
	 */
	protected abstract changeText(index: number, newStr: string);
}