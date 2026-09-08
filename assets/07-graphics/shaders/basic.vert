#ifdef GL_ES
precision highp float;
#endif

attribute vec2 aVertexPosition;
attribute vec2 aTexturePosition;
varying vec2 vTextureCoord;

void main() {
	vTextureCoord = aTexturePosition;
	gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
