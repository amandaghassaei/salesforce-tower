varying vec2 v_uv;
uniform sampler2D tDiffuse1;
uniform float uOffset;
uniform float vOffset;
uniform float vScaleFactor;
uniform float uZoom;
uniform float uBrightness;
uniform float uGamma;

void main() {
	float u = -v_uv.x;
	float v = v_uv.y * vScaleFactor + 1.0 - vScaleFactor; // Align to top of video.
	vec2 offset = vec2(uOffset, -vOffset);
	vec3 color = texture2D(tDiffuse1, vec2(u, v) / uZoom + offset).rgb;
	float exponent = 1.0 / uGamma;
	vec3 gammaColor = vec3(pow(color.x, exponent), pow(color.y, exponent), pow(color.z, exponent));
	gl_FragColor = vec4(gammaColor * uBrightness, 1.0);
}