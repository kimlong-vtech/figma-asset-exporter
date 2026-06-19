import { encode as encodeJpeg } from '@jsquash/jpeg';
import { png as pngCodec } from 'icodec';
import pngEncoderWasmUrl from 'icodec/png-enc.wasm?url';

const JPEG_QUALITY = 82;
const PNG_OPTIONS = {
	quality: 60,
	colors: 128,
	dithering: 1,
	speed: 3,
	level: 4,
	interlace: false,
	quantize: true,
};
let pngEncoderLoadPromise = null;

export async function compressQueuedAssetForExport(asset) {
	const extension = String(asset?.extension || '').toLowerCase().trim();

	if (extension === 'png') {
		return compressPngAsset(asset);
	}

	if (extension === 'jpeg' || extension === 'jpg') {
		return compressJpegAsset(asset);
	}

	return asset;
}

async function compressPngAsset(asset) {
	const sourceBlob = base64ToBlob(asset.base64Data, 'image/png');
	const imageData = await blobToImageData(sourceBlob);
	await ensurePngEncoderLoaded();
	const compressedBytes = pngCodec.encode(imageData, PNG_OPTIONS);
	const originalBytes = base64ByteLength(asset.base64Data);

	if (compressedBytes.byteLength >= originalBytes) {
		return asset;
	}

	return {
		...asset,
		base64Data: uint8ArrayToBase64(compressedBytes),
	};
}

async function compressJpegAsset(asset) {
	const sourceBlob = base64ToBlob(asset.base64Data, 'image/jpeg');
	const imageData = await blobToImageData(sourceBlob);
	const compressedBuffer = await encodeJpeg(imageData, {
		quality: JPEG_QUALITY,
	});

	return {
		...asset,
		base64Data: arrayBufferToBase64(compressedBuffer),
	};
}

function base64ToArrayBuffer(base64Value) {
	const binary = atob(String(base64Value || ''));
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
	return uint8ArrayToBase64(new Uint8Array(buffer));
}

function uint8ArrayToBase64(bytes) {
	let binary = '';
	const chunkSize = 0x8000;

	for (let index = 0; index < bytes.length; index += chunkSize) {
		const chunk = bytes.subarray(index, index + chunkSize);
		binary += String.fromCharCode(...chunk);
	}

	return btoa(binary);
}

function base64ByteLength(base64Value) {
	const binary = atob(String(base64Value || ''));
	return binary.length;
}

function base64ToBlob(base64Value, mimeType) {
	return new Blob([base64ToArrayBuffer(base64Value)], { type: mimeType });
}

async function blobToImageData(blob) {
	if (typeof createImageBitmap === 'function') {
		const bitmap = await createImageBitmap(blob);

		try {
			return drawToImageData(bitmap, bitmap.width, bitmap.height);
		} finally {
			bitmap.close();
		}
	}

	const dataUrl = await blobToDataUrl(blob);
	const image = await loadImage(dataUrl);
	return drawToImageData(image, image.naturalWidth || image.width, image.naturalHeight || image.height);
}

function drawToImageData(source, width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext('2d', { willReadFrequently: true });

	if (!context) {
		throw new Error('Canvas rendering is unavailable for export compression.');
	}

	context.drawImage(source, 0, 0, width, height);
	return context.getImageData(0, 0, width, height);
}

function blobToDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(new Error('Unable to read image for compression.'));
		reader.readAsDataURL(blob);
	});
}

function loadImage(src) {
	return new Promise((resolve, reject) => {
		const image = new Image();

		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('Unable to decode image for compression.'));
		image.src = src;
	});
}

function ensurePngEncoderLoaded() {
	if (!pngEncoderLoadPromise) {
		pngEncoderLoadPromise = pngCodec.loadEncoder(pngEncoderWasmUrl);
	}

	return pngEncoderLoadPromise;
}
