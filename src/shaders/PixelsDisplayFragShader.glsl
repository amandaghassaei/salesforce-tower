varying vec2 v_uv;
uniform sampler2D tDiffuse1;
uniform vec2 uDim;
uniform vec2 uSize;

const float SCALE = 2.0;
const int NUM_HORIZ_BARS = 7;
const int NUM_VERTICAL_BARS = 64;
float horizBars[NUM_HORIZ_BARS];

void main() {
	// Add horizontal bars.
	horizBars[0] = 7.0;
	horizBars[1] = 15.0;
	horizBars[2] = 24.0;
	horizBars[3] = 33.0;
	horizBars[4] = 42.0;
	horizBars[5] = 51.0;
	horizBars[6] = 60.0;
	vec2 pos = floor(uSize * v_uv);
	vec2 px = pos;
	for (int i = 0; i < NUM_HORIZ_BARS; i++) {
		float position = horizBars[i];
		if (px.y == position * SCALE + 1.0) {
			gl_FragColor = vec4(0, 0, 0, 1);
			return;
		}
		if (px.y > position * SCALE) {
			if (i < 1) px.y -= SCALE;
		}
	}

	// Add vertical bars.
	float numBarsPerQuadrant = float(NUM_VERTICAL_BARS / 4);
	for (int i = 0; i < NUM_VERTICAL_BARS; i++) {
		float position = float(i + 1) * uDim.x / float(NUM_VERTICAL_BARS);
		float quadrantPosition = mod(float(i), numBarsPerQuadrant);
		if (quadrantPosition < 4.0 || quadrantPosition > 10.0) {
			if (mod(float(i), 2.0) == 1.0) {
				continue;
			}
		}
		if (px.x == position + 1.0) {
			gl_FragColor = vec4(0, 0, 0, 1);
			return;
		}
		if (px.x > position) {
			px.x -= SCALE;
		}
	}

	for (int i = 0; i < 4; i++) {
		float center = float(i) * uDim.x / 4.0;
		if (px.x == center + 7.0 || px.x == center - 7.0 || px.x == center - 7.0 + uDim.x / 2.0) {
			gl_FragColor = vec4(0, 0, 0, 1);
			return;
		}
	}
	
	
	// Add spacing between pixels.
	if (mod(px.x, 2.0) == 0.0 || mod(px.y, 2.0) == 0.0) {
		gl_FragColor = vec4(0, 0, 0, 1);
		return;
	}
	// Calculate texture uvs.
	vec2 uv = (px + 0.5) / uDim;
	gl_FragColor = texture2D(tDiffuse1, uv);
}