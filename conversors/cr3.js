import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import {open} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';

// A CR3 file is an ISO base media file (the same container as MP4/MOV).
// The full-size JPEG the camera renders is stored as the single sample of
// the first video track, so the `moov` box tells us where it lives inside
// `mdat`: `stsz` gives its size and `co64`/`stco` give its byte offset.

const CR3_BRAND = 'crx ';
const JPEG_SOI = Buffer.from([0xFF, 0xD8, 0xFF]);
const CONTAINER_BOXES = new Set(['trak', 'mdia', 'minf', 'stbl']);

export async function cr3Conversor(filePath, outputPath) {
	const handle = await open(filePath, 'r');
	let jpeg;
	try {
		jpeg = await locateEmbeddedJpeg(handle);
	} finally {
		await handle.close();
	}

	await pipeline(
		fs.createReadStream(filePath, {start: jpeg.offset, end: jpeg.offset + jpeg.size - 1}),
		fs.createWriteStream(outputPath),
	);

	return {success: true, outputPath};
}

async function locateEmbeddedJpeg(handle) {
	const {size: fileSize} = await handle.stat();

	// The file must open with an `ftyp` box whose major brand is Canon's.
	const fileType = await readBytes(handle, 0, 12);
	if (fileType.length < 12 || fileType.toString('latin1', 4) !== `ftyp${CR3_BRAND}`) {
		throw new Error('Not a CR3 file');
	}

	let moov;
	let offset = 0;

	// Boxes are walked one after another on purpose: each header tells us
	// where the next one starts.
	/* eslint-disable no-await-in-loop */
	while (offset < fileSize) {
		const box = await readBoxHeader(handle, offset, fileSize);
		if (box.type === 'moov') {
			moov = await readBytes(handle, offset + box.headerSize, box.size - box.headerSize);
			break;
		}

		offset += box.size;
	}

	if (!moov) {
		throw new Error('Invalid CR3 file: missing moov box');
	}

	for (const track of findBoxes(moov, 'trak')) {
		const sample = firstSample(track);
		if (!sample || sample.offset + sample.size > fileSize) {
			continue;
		}

		const magic = await readBytes(handle, sample.offset, JPEG_SOI.length);
		if (magic.equals(JPEG_SOI)) {
			return sample;
		}
	}
	/* eslint-enable no-await-in-loop */

	throw new Error('Invalid CR3 file: no embedded JPEG found');
}

async function readBoxHeader(handle, offset, end) {
	const header = await readBytes(handle, offset, Math.min(16, end - offset));
	if (header.length < 8) {
		throw new Error('Invalid CR3 file: truncated box header');
	}

	let size = header.readUInt32BE(0);
	let headerSize = 8;
	const type = header.toString('latin1', 4, 8);

	if (size === 1) {
		size = Number(header.readBigUInt64BE(8));
		headerSize = 16;
	} else if (size === 0) {
		size = end - offset;
	}

	if (size < headerSize || offset + size > end) {
		throw new Error(`Invalid CR3 file: bad size for ${type} box`);
	}

	return {type, size, headerSize};
}

async function readBytes(handle, position, length) {
	const buffer = Buffer.alloc(length);
	const {bytesRead} = await handle.read(buffer, 0, length, position);
	return buffer.subarray(0, bytesRead);
}

// Yields the payload of every direct child box of `buffer` named `type`,
// descending into the standard container boxes on the way.
function * findBoxes(buffer, type) {
	let offset = 0;
	while (offset + 8 <= buffer.length) {
		let size = buffer.readUInt32BE(offset);
		let headerSize = 8;
		const boxType = buffer.toString('latin1', offset + 4, offset + 8);

		if (size === 1) {
			size = Number(buffer.readBigUInt64BE(offset + 8));
			headerSize = 16;
		} else if (size === 0) {
			size = buffer.length - offset;
		}

		if (size < headerSize || offset + size > buffer.length) {
			return;
		}

		const payload = buffer.subarray(offset + headerSize, offset + size);
		if (boxType === type) {
			yield payload;
		} else if (CONTAINER_BOXES.has(boxType)) {
			yield * findBoxes(payload, type);
		}

		offset += size;
	}
}

function firstBox(buffer, type) {
	return findBoxes(buffer, type).next().value;
}

// Returns the byte range of the first sample in a track, or undefined if
// the track does not describe one. Both boxes are "full boxes": 4 bytes of
// version/flags precede their payload.
function firstSample(track) {
	const sizeTable = firstBox(track, 'stsz');
	const offsetTable64 = firstBox(track, 'co64');
	const offsetTable = offsetTable64 ?? firstBox(track, 'stco');
	const offsetWidth = offsetTable64 ? 8 : 4;
	if (!sizeTable || !offsetTable || sizeTable.length < 12 || offsetTable.length < 8 + offsetWidth) {
		return undefined;
	}

	let size = sizeTable.readUInt32BE(4);
	if (size === 0) {
		// A size of zero means each sample has its own entry in the table.
		if (sizeTable.readUInt32BE(8) === 0 || sizeTable.length < 16) {
			return undefined;
		}

		size = sizeTable.readUInt32BE(12);
	}

	if (offsetTable.readUInt32BE(4) === 0 || size === 0) {
		return undefined;
	}

	const offset = offsetTable64
		? Number(offsetTable.readBigUInt64BE(8))
		: offsetTable.readUInt32BE(8);

	return {offset, size};
}
