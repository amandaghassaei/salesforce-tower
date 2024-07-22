varying vec2 v_uv;
uniform sampler2D tDiffuse1;
uniform float uOffset;
uniform float vOffset;
uniform float vScaleFactor;
uniform float uZoom;
uniform float uSaturation;
uniform float uBrightness;
uniform float uGamma;

// https://gamedev.stackexchange.com/questions/59797/glsl-shader-change-hue-saturation-brightness
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
	float u = -v_uv.x;
	float v = v_uv.y * vScaleFactor + 1.0 - vScaleFactor; // Align to top of video.
	vec2 offset = vec2(uOffset, -vOffset);
    // https://gamedev.stackexchange.com/questions/59797/glsl-shader-change-hue-saturation-brightness
	vec3 fragRGB = texture2D(tDiffuse1, vec2(u, v) / uZoom + offset).rgb;
    // Apply saturation and brightness.
    vec3 fragHSV = rgb2hsv(fragRGB).xyz;
    // fragHSV.x = modf(fragHSV.x * uHue / 360.0, 1.0);
    fragHSV.y = clamp(fragHSV.y * uSaturation, 0.0, 1.0);
    fragHSV.z = clamp(fragHSV.z * uBrightness, 0.0, 1.0);
    fragRGB = hsv2rgb(fragHSV);
    // Apply gamma.
	float exponent = 1.0 / uGamma;
	fragRGB = vec3(pow(fragRGB.x, exponent), pow(fragRGB.y, exponent), pow(fragRGB.z, exponent));
	gl_FragColor = vec4(fragRGB, 1.0);
}