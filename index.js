import {cr3Conversor} from './conversors/cr3.js';

export function cr3ToJpg(filePath, outputPath) {
	return validateFilePath(filePath) && validateOutputPath(outputPath) && cr3Conversor(filePath, outputPath);
}

function validateFilePath(filePath) {
	if (!filePath.includes('.cr3')) {
		throw new Error('Invalid source file format');
	}

	return true;
}

function validateOutputPath(filePath) {
	if (!filePath.includes('.jpg')) {
		throw new Error('Invalid destination file format');
	}

	return true;
}
