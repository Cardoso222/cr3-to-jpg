import fs from 'node:fs';
import test from 'ava';
import cr3ToJpg from './index.js';

const OUTPUT_PATH = 'fixtures/cr3/output.jpg';
const VALID_TEST_FILE = 'fixtures/cr3/valid.cr3';

const INVALID_TEST_FILE = 'fixtures/cr3/invalid.png';
const INVALID_OUTPUT_FORMAT = 'fixtures/cr3/invalid.mov';

test.after('cleanup', () => {
	fs.unlinkSync(OUTPUT_PATH);
});

test('cr3 to jpg', async t => {
	t.deepEqual(await cr3ToJpg(VALID_TEST_FILE, OUTPUT_PATH), {success: true, outputPath: OUTPUT_PATH});
});

test('invalid source file format', t => {
	t.throws(() => {
		cr3ToJpg(INVALID_TEST_FILE, OUTPUT_PATH);
	}, {instanceOf: Error, message: 'Invalid source file format'});

	t.pass();
});

test('invalid destination file format', t => {
	t.throws(() => {
		cr3ToJpg(VALID_TEST_FILE, INVALID_OUTPUT_FORMAT);
	}, {instanceOf: Error, message: 'Invalid destination file format'});

	t.pass();
});
