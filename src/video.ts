import 'sweetalert2';
import { NearestFilter, RepeatWrapping, VideoTexture } from 'three';
import { badFileAlert, PARAMS } from './globals';

// Init video texture.
export const video = document.createElement('video');
video.width = PARAMS.videoWidth;
video.height = PARAMS.videoHeight;
video.muted = true;
video.loop = true;
video.src = './assets/demo.mp4';
video.play();
// @ts-ignore
window.video = video;

export const videoTexture = new VideoTexture(video);
videoTexture.minFilter = NearestFilter;
videoTexture.magFilter = NearestFilter;
videoTexture.wrapS = RepeatWrapping;
videoTexture.wrapT = RepeatWrapping;

// Keyboard events.
window.addEventListener('keydown', (e) => {
	switch(e.key) {
		case ' ':
			video.paused ? video.play() : video.pause();
			break;
	} 
});

function loadFile(file: File) {
	if (file.type !== "video/mp4") {
		return false;
	}
	reader.onload = (e) => {
		// Get data url.
		const dataUrl = e.target?.result as string | undefined;
		if (!dataUrl) return;
		video.src = dataUrl;
		video.play();
		video.playbackRate = PARAMS.speedFactor;
	}; 
	reader.readAsDataURL(file);
	return true;
}

// Paste event.
const reader = new FileReader();
window.addEventListener('paste', e => {
    e.preventDefault();
	// @ts-ignore
    const files = ((e as ClipboardEvent).clipboardData || e.originalEvent.clipboardData).items as DataTransferItemList | null;
	if (!files || files.length === 0) return;
	for (let index in files) {
		const item = files[index];
		if (item.kind === 'file') {
			const file = item.getAsFile();
			if (!file) continue;
			if (loadFile(file)) return;
		}
	}
	badFileAlert();
});

// Drop event.
window.addEventListener("dragover",(e) => {
  e.preventDefault();
}, false);
window.addEventListener('drop', (e: DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const files = e.dataTransfer?.files; // Array of all files
	if (!files || files.length === 0) return;
	for (let index in files) {
		const file = files[index];
		if (loadFile(file)) return;
	}
	badFileAlert();
}, false);