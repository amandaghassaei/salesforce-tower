
export const DISPLAY_WIDTH = 256
export const DISPLAY_HEIGHT = 70;

export const PARAMS = {
	horizontalOffset: 0,
	verticalOffset: 0,
	zoom: 1,
	speedFactor: 1,
	bloomStrength: 2,
	bloomRadius: 0.4,
	brightness: 1.5,
	needFullRender: true,
	showBuildings: true,
	ambientLightLevel: 0.7,
	moveAlongGround: false,
	videoWidth: DISPLAY_WIDTH,
	videoHeight: DISPLAY_HEIGHT,
	gamma: 1,
};

export const BUILDING_OPACITY = 0.8;
export const GROUND_OFFSET = -320;

export const badFileAlert = (error = 'Unsupported file') => {
	alert(`${error}: Please upload an mp4 video.`);
}