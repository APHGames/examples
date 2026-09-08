import { Assets, Color, Rectangle, Texture, type TextureSource, type UnresolvedAsset } from 'pixi.js';

/**
 * Helpers for Pixi v8 Assets (replaces the removed Application.loader).
 */
export async function loadAssets(assets: UnresolvedAsset[] | string[]): Promise<void> {
	await Assets.load(assets);
}

export async function loadTexture(src: string, alias?: string): Promise<Texture> {
	if (alias) {
		Assets.add({ alias, src });
		return await Assets.load(alias);
	}
	return await Assets.load(src);
}

export function getLoadedTexture(alias: string): Texture {
	return Assets.get(alias);
}

export function getLoadedAsset<T = unknown>(alias: string): T {
	return Assets.get(alias) as T;
}

/** Load a text file (.txt, .vert, .frag, .xml, .fnt, …) via Assets or fetch fallback. */
export async function loadTextAsset(alias: string, src: string): Promise<string> {
	try {
		const data = await Assets.load({ alias, src, loadParser: 'loadTxt' });
		if (typeof data === 'string') {
			return data;
		}
		if (data && typeof (data as { data?: unknown }).data === 'string') {
			return (data as { data: string }).data;
		}
	} catch {
		// fall through to fetch
	}
	const text = await (await fetch(src)).text();
	Assets.cache.set(alias, text);
	return text;
}

/** Create a framed texture from a base texture/source (replaces texture.clone + frame assignment). */
export function textureFromFrame(
	base: Texture | TextureSource,
	x: number,
	y: number,
	width: number,
	height: number,
): Texture {
	const source = base instanceof Texture ? base.source : base;
	return new Texture({
		source,
		frame: new Rectangle(x, y, width, height),
	});
}

/** Assign a new framed texture to a sprite (replaces mutating texture.frame). */
export function setTextureFrame(
	sprite: { texture: Texture },
	base: Texture | TextureSource,
	x: number,
	y: number,
	width: number,
	height: number,
): Texture {
	const next = textureFromFrame(base, x, y, width, height);
	sprite.texture = next;
	return next;
}

/** PIXI.utils.string2hex replacement. */
export function string2hex(color: string | number): number {
	return new Color(color).toNumber();
}

/** Convert Pixi Bounds (from getBounds) to a Rectangle. */
export function boundsToRectangle(bounds: { x: number; y: number; width: number; height: number; rectangle?: Rectangle }): Rectangle {
	return bounds.rectangle ?? new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
}
