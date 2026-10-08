import path from 'node:path';
import {cr3Conversor} from './conversors/cr3.js';

const SOURCE_EXTENSIONS = new Set(['.cr3']);
const DESTINATION_EXTENSIONS = new Set(['.jpg', '.jpeg']);

export default async function cr3ToJpg(filePath, outputPath) {
	validatePath(filePath, SOURCE_EXTENSIONS, 'Invalid source file format');
	validatePath(outputPath, DESTINATION_EXTENSIONS, 'Invalid destination file format');
	return cr3Conversor(filePath, outputPath);
}

function validatePath(filePath, allowedExtensions, message) {
	if (typeof filePath !== 'string' || filePath.length === 0) {
		throw new TypeError('Expected a file path string');
	}

	if (!allowedExtensions.has(path.extname(filePath).toLowerCase())) {
		throw new Error(message);
	}
}
