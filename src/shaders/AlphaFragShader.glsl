varying vec2 v_uv;
uniform float opacity;
uniform sampler2D tDiffuse1;

void main() {
	vec4 value = texture2D(tDiffuse1, v_uv);
	gl_FragColor = vec4(value.rgb, opacity * value.a);
}