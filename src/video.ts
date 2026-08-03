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

// Track the current object URL so we can revoke it when a new file is loaded.
let currentObjectUrl: string | undefined;

function loadFile(file: File) {
	if (file.type !== "video/mp4") {
		return false;
	}
	// Use a blob URL rather than a base64 data URL. Data URLs inflate the file
	// ~33%, must be fully buffered in memory, aren't seekable, and exceed
	// browser length limits on large videos (Safari errors, Chrome truncates).
	if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
	currentObjectUrl = URL.createObjectURL(file);
	video.src = currentObjectUrl;
	video.play();
	video.playbackRate = PARAMS.speedFactor;
	return true;
}

// Paste event.
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

const fileInput = document.getElementById('input') as HTMLInputElement;
fileInput.onchange = () => {
	const { files } = fileInput;
	if (!files || files.length === 0) return;
	const file = files[0];
	if(!loadFile(file)) badFileAlert();
}
document.getElementById('upload')!.onclick = (e) => {
	e.preventDefault();
	fileInput.click();
}