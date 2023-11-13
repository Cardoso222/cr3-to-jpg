import exiftool from 'exiftool-vendored';

export async function cr3Conversor(filePath, outputPath) {
	try {
		await exiftool.exiftool.extractJpgFromRaw(filePath, outputPath);
		await exiftool.exiftool.end();
		return {success: true, outputPath};
	} catch (error) {
		exiftool.exiftool.end();
		console.error(error);
		return false;
	}
}

