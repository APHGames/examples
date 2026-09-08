precision highp float;

attribute vec2 aVertexPosition;
attribute vec2 aTexturePosition;

varying vec2 v_TextureCoord;

void main() {
	v_TextureCoord = aTexturePosition;
	gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
