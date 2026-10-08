export type ConversionResult = {
	success: true;
	outputPath: string;
};

/**
Extract the full-size JPEG embedded in a Canon `.cr3` raw file.

@param filePath - Path to the source `.cr3` file.
@param outputPath - Path where the `.jpg` (or `.jpeg`) file will be written.
@returns Resolves once the JPEG has been written.
@throws {TypeError} If either path is not a non-empty string.
@throws {Error} If either path has the wrong extension, the source is not a CR3 file, or it holds no embedded JPEG.

@example
```
import cr3ToJpg from 'cr3-to-jpg';

await cr3ToJpg('file.cr3', 'destination.jpg');
//=> {success: true, outputPath: 'destination.jpg'}
```
*/
export default function cr3ToJpg(filePath: string, outputPath: string): Promise<ConversionResult>;
