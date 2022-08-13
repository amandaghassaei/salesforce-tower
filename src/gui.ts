import * as dat from 'dat.gui';
import { GROUND_OFFSET, PARAMS } from './globals';
import {
	ambientLights,
	bloomPass,
	controls,
	copyVideoMaterial,
} from './three';
import { video } from './video';

const gui = new dat.GUI();

const callbacks = {
	restartVideo: () => {
		video.currentTime = 0;
		video.play();
	}
}

const videoFolder = gui.addFolder('Video Settings');
videoFolder.open();

videoFolder.add(PARAMS, 'horizontalOffset', 0, Math.PI * 2, 0.01).name('Horiz Offset').onChange((value) => {
	copyVideoMaterial.uniforms.uOffset.value = value / (Math.PI * 2);
});

videoFolder.add(PARAMS, 'verticalOffset', 0, 1, 0.01).name('Vertical Offset').onChange((value) => {
	copyVideoMaterial.uniforms.vOffset.value = value;
});

videoFolder.add(PARAMS, 'zoom', 0.1, 5, 0.01).name('Scale').onChange((value) => {
	copyVideoMaterial.uniforms.uZoom.value = value;
});

videoFolder.add(PARAMS, 'speedFactor', 0.1, 5, 0.01).name('Playback Speed').onChange((value => {
	video.playbackRate = value;
}));

videoFolder.add(PARAMS, 'gamma', 0.1, 2, 0.01).name('Gamma').onChange((value => {
	copyVideoMaterial.uniforms.uGamma.value = value;
}));

videoFolder.add(callbacks, 'restartVideo').name('Restart Video');

const renderingFolder = gui.addFolder('Rendering Settings');
renderingFolder.open();

renderingFolder.add(PARAMS, 'showBuildings').name('Show Buildings').onChange(() => {
	PARAMS.needFullRender = true;
});

renderingFolder.add(PARAMS, 'moveAlongGround').name('Ground View').onChange((value) => {
	controls.yOffset = value ? GROUND_OFFSET + 10 : 0;
	controls.minDistance = value ? 350 : 50;
	PARAMS.needFullRender = true;
});
controls.minDistance = PARAMS.moveAlongGround ? 350 : 50;

renderingFolder.add(PARAMS, 'bloomStrength', 0.0, 3).name('Bloom Strength').onChange((value) => {
	bloomPass.strength = Number(value);
});

// renderingFolder.add(PARAMS, 'bloomRadius', 0.0, 2).name('Bloom Radius').onChange((value) => {
// 	bloomPass.radius = Number(value);
// });

renderingFolder.add(PARAMS, 'brightness', 0.1, 3).name('Brightness').onChange((value) => {
	copyVideoMaterial.uniforms.uBrightness.value = value;
});

renderingFolder.add(PARAMS, 'ambientLightLevel', 0, 1).name('AmbientLight').onChange((value) => {
	ambientLights.forEach(light => {
		light.intensity = value;
	});
	PARAMS.needFullRender = true;
});