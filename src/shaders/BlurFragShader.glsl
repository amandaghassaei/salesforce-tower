varying vec2 v_uv;
uniform vec2 uPxSize;
uniform sampler2D tDiffuse;
uniform float uRatio;

void main() {
	vec4 center = texture2D(tDiffuse, v_uv);
	// Each of these values represents two pixels.
	vec4 n = 2.0 * texture2D(tDiffuse, v_uv + vec2(0, uPxSize.y * 1.5));
	vec4 s = 2.0 * texture2D(tDiffuse, v_uv + vec2(0, -uPxSize.y * 1.5));
	vec4 e = 2.0 * texture2D(tDiffuse, v_uv + vec2(uPxSize.x * 1.5, 0));
	vec4 w = 2.0 * texture2D(tDiffuse, v_uv + vec2(-uPxSize.x * 1.5, 0));
	// Each of these values represents four pixels.
	vec4 ne = 4.0 * texture2D(tDiffuse, v_uv + vec2(uPxSize.x * 1.5, uPxSize.y * 1.5));
	vec4 nw = 4.0 * texture2D(tDiffuse, v_uv + vec2(-uPxSize.x * 1.5, uPxSize.y * 1.5));
	vec4 se = 4.0 * texture2D(tDiffuse, v_uv + vec2(uPxSize.x * 1.5, -uPxSize.y * 1.5));
	vec4 sw = 4.0 * texture2D(tDiffuse, v_uv + vec2(-uPxSize.x * 1.5, -uPxSize.y * 1.5));
	gl_FragColor = uRatio * center + (1.0 - uRatio) * (n + s + e + w + nw + ne + sw + se) / 24.0;
	// gl_FragColor = center;
}