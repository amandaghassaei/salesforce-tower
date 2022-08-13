import { WebGLRenderer, WebGLRenderTarget } from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';

export class ClearColorPass extends Pass {
	constructor() {
		super();
		this.needsSwap = false;
	}

	render(renderer: WebGLRenderer,
        writeBuffer: WebGLRenderTarget,
        readBuffer: WebGLRenderTarget,
		/*, deltaTime, maskActive */
	) {
		renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
		renderer.clear(true, false, false);
	}
}