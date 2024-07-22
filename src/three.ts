import {
	AmbientLight,
	BufferAttribute,
	BufferGeometry,
	DirectionalLight,
	Material,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	NearestFilter,
	PerspectiveCamera,
	Scene,
	ShaderMaterial,
	sRGBEncoding,
	Vector2,
	Vector3,
	WebGLRenderer,
	WebGLRenderTarget,
} from 'three';
import { OrbitControls } from './OrbitControls'; // Added a custom yOffset param and no phi rotate.
import { EffectComposer, FullScreenQuad } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { video, videoTexture } from './video';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ClearColorPass } from './ClearColorPass';
import { BUILDING_OPACITY, DISPLAY_HEIGHT, DISPLAY_WIDTH, GROUND_OFFSET, PARAMS } from './globals';
const vertShader = require('./shaders/VertShader.glsl');
const alphaFragShader = require('./shaders/AlphaFragShader.glsl');
const lowResDisplayFragShader = require('./shaders/LowResDisplayFragShader.glsl');
const pixelsDisplayFragShader = require('./shaders/PixelsDisplayFragShader.glsl');
const bloomCompositeFragShader = require('./shaders/BloomCompositeFragShader.glsl');
const blurFragShader = require('./shaders/BlurFragShader.glsl');

// Init camera with orthographic projection.
const camera = new PerspectiveCamera();
camera.near = 0.1;
camera.far = 5000;
camera.position.set(800, 0, 200);
camera.setFocalLength(100);

// Init threejs scene.
const sceneTower = new Scene();
const sceneGlow = new Scene();
const sceneOverlay = new Scene();

// Init WebGL renderer.
export const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;
renderer.autoClearColor = false;
renderer.autoClearDepth = false;
// https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
renderer.outputEncoding = sRGBEncoding;
// Add canvas to DOM.
document.getElementById('three')!.appendChild(renderer.domElement);

// Set up post processing.
// Render low resolution display to videoMaterial.
export const renderLowResDisplayTarget = new WebGLRenderTarget(DISPLAY_WIDTH, DISPLAY_HEIGHT, {
	magFilter: NearestFilter,
    minFilter: NearestFilter,
});
const lowResDisplayShader = {
	uniforms: {
		uOffset: { value: PARAMS.horizontalOffset / (Math.PI * 2) },
		vOffset: { value: PARAMS.verticalOffset },
		uZoom: { value: PARAMS.zoom },
		vScaleFactor: { value: 1 },
        uSaturation: {value: PARAMS.saturation},
		uBrightness: {value: PARAMS.brightness},
		uGamma: {value: PARAMS.gamma},
		tDiffuse1: { value: null },
	},
	fragmentShader: lowResDisplayFragShader,
	vertexShader: vertShader,
};
export const copyVideoMaterial = new ShaderMaterial(lowResDisplayShader);
copyVideoMaterial.uniforms.tDiffuse1.value = videoTexture;
const fsQuadLowRes = new FullScreenQuad(copyVideoMaterial);
export const renderPixelsDisplayTarget = new WebGLRenderTarget(DISPLAY_WIDTH * 4 + (64 - 5 * 4) * 4, DISPLAY_HEIGHT * 4 + 1 * 4);
const pixelsDisplayShader = {
	uniforms: {
		uSize: { value: [renderPixelsDisplayTarget.width / 2, renderPixelsDisplayTarget.height / 2] },
		uDim: { value: [DISPLAY_WIDTH * 2, DISPLAY_HEIGHT * 2] },
		tDiffuse1: { value: null },
	},
	fragmentShader: pixelsDisplayFragShader,
	vertexShader: vertShader,
};
const pixelMaterial = new ShaderMaterial(pixelsDisplayShader);
pixelMaterial.uniforms.tDiffuse1.value = renderLowResDisplayTarget.texture;
const fsQuadPixels = new FullScreenQuad(pixelMaterial);
const renderBlurDisplayTarget = renderPixelsDisplayTarget.clone();
const blurShader = {
	uniforms: {
		uPxSize: { value: [1 / renderPixelsDisplayTarget.width, 1 / renderPixelsDisplayTarget.height] },
		uRatio: { value: 1 },
		tDiffuse: { value: null },
	},
	fragmentShader: blurFragShader,
	vertexShader: vertShader,
};
const blurMaterial = new ShaderMaterial(blurShader);
const fsQuadBlur = new FullScreenQuad(blurMaterial);
export const videoMaterial = new MeshBasicMaterial({
	color: 0xffffff,
	map: renderBlurDisplayTarget.texture,
	polygonOffset: true,
	polygonOffsetUnits: -100,
	polygonOffsetFactor: 0,
});

const renderBuildingTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight);

// Render glowing display.
const renderGlowTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight);
const renderGlowComposer = new EffectComposer(renderer, renderGlowTarget);
renderGlowComposer.addPass(new ClearPass());
const renderGlowScenePass = new RenderPass(sceneGlow, camera);
// Clear color and depth.
renderGlowScenePass.clear = true;
renderGlowScenePass.clearDepth = true;
renderGlowComposer.addPass(renderGlowScenePass);
// Add bloom pass.
export const bloomPass = new UnrealBloomPass(
	new Vector2(window.innerWidth, window.innerHeight),
	PARAMS.bloomStrength, PARAMS.bloomRadius, 0);
bloomPass.renderToScreen = true;
renderGlowComposer.addPass(bloomPass);
// Composite.
const compositeShader = {
	uniforms: {
		tDiffuse1: { value: null },
		tBloom: { value: null },
	},
	fragmentShader: bloomCompositeFragShader,
	vertexShader: vertShader,
};
const compositePass = new ShaderPass(new ShaderMaterial(compositeShader), 'tBloom');
compositePass.uniforms.tDiffuse1.value = renderBuildingTarget.texture;
compositePass.renderToScreen = true;
renderGlowComposer.addPass(compositePass);

// Render overlay.
const overlayRenderTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight);
const overlayComposer = new EffectComposer(renderer, overlayRenderTarget);
// Render tower in overlay (to establish depth).
overlayComposer.addPass(new ClearPass());
const renderTowerPass = new RenderPass(sceneTower, camera);
renderTowerPass.clear = true;
renderTowerPass.clearDepth = true;
overlayComposer.addPass(renderTowerPass);
// Clear color.
const clearColorPass = new ClearColorPass();
overlayComposer.addPass(clearColorPass);
// Render buildings overlay.
const renderSceneOverlayPass = new RenderPass(sceneOverlay, camera);
overlayComposer.addPass(renderSceneOverlayPass);
// Render with transparency.
const mixShader = {
	uniforms: {
		opacity: { value: BUILDING_OPACITY },
		tDiffuse1: { value: null },
	},
	fragmentShader: alphaFragShader,
	vertexShader: vertShader,
};
const overlayPass = new ShaderPass(new ShaderMaterial(mixShader), 'tDiffuse1');
overlayPass.material.transparent = true;
overlayPass.renderToScreen = true;
overlayComposer.addPass(overlayPass);
// Also init a minimal composer that simply renders with transparency (in case viewing angle hasn't changed).
const minimalOverlayComposer = new EffectComposer(renderer);
const overlayPass2 = new ShaderPass(new ShaderMaterial(mixShader));
overlayPass2.uniforms.tDiffuse1.value = overlayComposer.renderTarget1.texture;
overlayPass2.material.transparent = true;
overlayPass2.renderToScreen = true;
minimalOverlayComposer.addPass(overlayPass2);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.yOffset = PARAMS.moveAlongGround ? GROUND_OFFSET + 10 : 0;
controls.maxDistance = 2300;
controls.addEventListener('change', () => {
	PARAMS.needFullRender = true;
});

const lightScene = new DirectionalLight(0xffffff, 0.4);
const lightSceneOverlay = new DirectionalLight(0xffffff, 0.4);
const ambientLight = new AmbientLight(0xffffff, PARAMS.ambientLightLevel);
export const ambientLights = [ambientLight.clone(), ambientLight.clone(), ambientLight.clone()];
sceneTower.add(lightScene, ambientLights[0]);
sceneGlow.add(ambientLights[1]);
sceneOverlay.add(lightSceneOverlay, ambientLights[2]);

const buildingMaterial = new MeshLambertMaterial({ color: 0x1c1c1c });

const loader = new STLLoader();
loader.load('./assets/sanfrancisco.stl',  geometry => {
	geometry.computeVertexNormals();
	const mesh = new Mesh(geometry, buildingMaterial);
	mesh.position.y = GROUND_OFFSET;
	sceneOverlay.add(mesh);
	PARAMS.needFullRender = true;
});

// Create SF tower geometry.
function drawTower(
	NUM_SIDE_SEGMENTS: number,
	NUM_VERTICAL_SEGMENTS: number,
	BASE_RADIUS: number,
	radiusFn: (j: number, base: number, numSegs: number) => number,
	heightFn: (j: number, base: number, numSegs: number) => number,
	material: Material,
	slots = true) {
	const geometry = new BufferGeometry();
	const NUM_RADIAL_SEGMENTS = 4 * NUM_SIDE_SEGMENTS;
	const vertices = new Float32Array(3 * (NUM_RADIAL_SEGMENTS + 1) * (NUM_VERTICAL_SEGMENTS + 1));
	const uvs = new Float32Array(2 * vertices.length / 3);
	const indices = new Uint16Array(6 * (NUM_RADIAL_SEGMENTS + 1) * NUM_VERTICAL_SEGMENTS);
	let faceIndex = 0;
	let vertexIndex = 0;
	for (let j = 0; j < NUM_VERTICAL_SEGMENTS + 1; j++) {
		for (let n = 0; n < 5; n++) {
			for (let i = 0; i < NUM_SIDE_SEGMENTS; i++) {
				if (n === 4 && i > 0) break;
				const angleIndex = n * NUM_SIDE_SEGMENTS + i;
				const angle = angleIndex / NUM_RADIAL_SEGMENTS * 2 * Math.PI + Math.PI / 4;
				let radius = radiusFn(j, BASE_RADIUS, NUM_VERTICAL_SEGMENTS);
				// Make squircle.
				const factor = 1 - Math.abs(i - NUM_SIDE_SEGMENTS / 2) / (NUM_SIDE_SEGMENTS / 2);
				radius += factor * factor * BASE_RADIUS / 12;
				vertices[3 * vertexIndex] = radius * Math.cos(angle);
				vertices[3 * vertexIndex + 1] = heightFn(j, BASE_RADIUS, NUM_VERTICAL_SEGMENTS);
				vertices[3 * vertexIndex + 2] = radius * Math.sin(angle);
				uvs[2 * vertexIndex] = angleIndex / NUM_RADIAL_SEGMENTS;
				uvs[2 * vertexIndex + 1] = j / NUM_VERTICAL_SEGMENTS;
				if (j < NUM_VERTICAL_SEGMENTS && n < 4) {
					// Draw slots.
					if (!(slots && j < 2 && i > 0 && i < NUM_SIDE_SEGMENTS - 1)) {
						const nextIndex = vertexIndex + 1;
						indices[6 * faceIndex] = vertexIndex;
						indices[6 * faceIndex + 1] = nextIndex + NUM_RADIAL_SEGMENTS + 1;
						indices[6 * faceIndex + 2] = nextIndex;
						indices[6 * faceIndex + 3] = vertexIndex;
						indices[6 * faceIndex + 4] = vertexIndex + NUM_RADIAL_SEGMENTS + 1;
						indices[6 * faceIndex + 5] = nextIndex + NUM_RADIAL_SEGMENTS + 1;
						faceIndex += 1;
					}
				}
				vertexIndex += 1;
			}
		}
	}
	geometry.setAttribute('position', new BufferAttribute(vertices, 3));
	geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
	geometry.setIndex(new BufferAttribute(indices, 1));
	geometry.computeVertexNormals();
	return new Mesh(geometry, material);
	
}
sceneGlow.add(drawTower(
	24,
	8,
	24,
	(j: number, base: number, numSegs: number) => base - j / numSegs * 7,
	(j: number, base: number, numSegs: number) => {
		// Seems like there is some vertical stretching of the video.
		const stretchFactor = 1.2;
		return j / numSegs * (base * 2 * Math.PI * stretchFactor * renderPixelsDisplayTarget.height / renderPixelsDisplayTarget.width) - 23.8;
	},
	videoMaterial,
));
sceneTower.add(drawTower(
	8,
	8,
	23.5,
	(j: number, base: number, numSegs: number) => {
		if (j > numSegs / 2) {
			const factor = (j - numSegs / 2) / (numSegs / 2);
			return base + 7.1 - factor * factor * 8.75;
		}
		return base + 7.1;
	},
	(j: number, base: number, numSegs: number) => GROUND_OFFSET - j / numSegs * (GROUND_OFFSET + 14),
	buildingMaterial,
	false,
));

// Update on resize.
resize();
function resize() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
	PARAMS.needFullRender = true;
}
window.addEventListener('load', resize);
window.addEventListener('resize', resize);

// On metadata callback, update shader uniform.
video.onloadedmetadata = () => {
	video.width = video.videoWidth;
	video.height = video.videoHeight;
    PARAMS.videoWidth = video.videoWidth;
	PARAMS.videoHeight = video.videoHeight;
	// Update video vertical scale to maintain square pixels.
	let factor = (PARAMS.videoWidth * DISPLAY_HEIGHT / DISPLAY_WIDTH) / PARAMS.videoHeight;
	if (factor > 1) factor = 1;
	copyVideoMaterial.uniforms.vScaleFactor.value = factor;
	video.play();
};

// Start animation loop.
loop();
function loop() {
	requestAnimationFrame(loop);
	lightScene.position.copy(camera.position.clone().add(new Vector3(500, 500, 500)));
	lightSceneOverlay.position.copy(lightScene.position);
	render();
	controls.update();
}

export function render() {
	// Preprocess video.
	// Downsample to display resolution.
	renderer.setRenderTarget(renderLowResDisplayTarget);
	fsQuadLowRes.render(renderer);
	// Generate pixelated look.
	renderer.setRenderTarget(renderPixelsDisplayTarget);
	fsQuadPixels.render(renderer);
	// Blur (anti-aliasing).
	const dist = camera.position.distanceTo(controls.target);
	const noBlurDist = 300;
	const fullBlurDist = 1000;
	// Ratio ranges from 0.04 - 1.
	const ratio = 1 - Math.max(Math.min((dist - noBlurDist) / (fullBlurDist - noBlurDist), 0.96), 0);
	blurMaterial.uniforms.uRatio.value = ratio;
	blurMaterial.uniforms.tDiffuse.value = renderPixelsDisplayTarget.texture;
	renderer.setRenderTarget(renderBlurDisplayTarget);
	fsQuadBlur.render(renderer);
	if (dist > noBlurDist) {
		blurMaterial.uniforms.tDiffuse.value = renderBlurDisplayTarget.texture;
		renderer.setRenderTarget(renderPixelsDisplayTarget);
		fsQuadBlur.render(renderer);
		blurMaterial.uniforms.tDiffuse.value = renderPixelsDisplayTarget.texture;
		renderer.setRenderTarget(renderBlurDisplayTarget);
		fsQuadBlur.render(renderer);
	}

	// Only update this when controls change.
	if (PARAMS.needFullRender) {
		// Render building.
		renderer.setRenderTarget(renderBuildingTarget);
		renderer.clear(true, true, true);
		renderer.render(sceneTower, camera); 
	}

	// Render glowing display to screen.
	renderGlowComposer.render();

	// Render buildings as semi-transparent overlay.
	if (PARAMS.showBuildings) {
		// Render only last step if no controls update.
		if (PARAMS.needFullRender) {
			overlayComposer.render();
		} else {
			minimalOverlayComposer.render();
		}
	}

	PARAMS.needFullRender = false;
}