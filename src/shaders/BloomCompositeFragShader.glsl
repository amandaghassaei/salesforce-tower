varying vec2 v_uv;
uniform sampler2D tDiffuse1;
uniform sampler2D tBloom;

void main() {
	gl_FragColor = texture2D(tDiffuse1, v_uv) + texture2D(tBloom, v_uv);
}