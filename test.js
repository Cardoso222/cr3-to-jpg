import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'ava';
import cr3ToJpg from './index.js';

const VALID_TEST_FILE = 'fixtures/cr3/valid.cr3';
const INVALID_TEST_FILE = 'fixtures/cr3/invalid.png';
const INVALID_OUTPUT_FORMAT = 'fixtures/cr3/invalid.mov';

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'cr3-to-jpg-'));
const temporaryPath = name => path.join(temporaryDirectory, name);

test.after.always('cleanup', () => {
	fs.rmSync(temporaryDirectory, {recursive: true, force: true});
});

test('cr3 to jpg', async t => {
	const outputPath = temporaryPath('output.jpg');
	t.deepEqual(await cr3ToJpg(VALID_TEST_FILE, outputPath), {success: true, outputPath});

	const output = fs.readFileSync(outputPath);
	t.is(output.length, 2_520_350);
	t.deepEqual(output.subarray(0, 3), Buffer.from([0xFF, 0xD8, 0xFF]), 'starts with a JPEG SOI marker');
	t.deepEqual(output.subarray(-2), Buffer.from([0xFF, 0xD9]), 'ends with a JPEG EOI marker');
});

test('accepts .jpeg and upper-case extensions', async t => {
	const outputPath = temporaryPath('OUTPUT.JPEG');
	t.deepEqual(await cr3ToJpg(VALID_TEST_FILE, outputPath), {success: true, outputPath});
});

test('invalid source file format', async t => {
	await t.throwsAsync(cr3ToJpg(INVALID_TEST_FILE, temporaryPath('output.jpg')), {instanceOf: Error, message: 'Invalid source file format'});
	await t.throwsAsync(cr3ToJpg('photo.cr3.png', temporaryPath('output.jpg')), {message: 'Invalid source file format'});
});

test('invalid destination file format', async t => {
	await t.throwsAsync(cr3ToJpg(VALID_TEST_FILE, INVALID_OUTPUT_FORMAT), {instanceOf: Error, message: 'Invalid destination file format'});
	await t.throwsAsync(cr3ToJpg(VALID_TEST_FILE, 'output.jpg.mov'), {message: 'Invalid destination file format'});
});

test('rejects non-string paths', async t => {
	await t.throwsAsync(cr3ToJpg(undefined, 'output.jpg'), {instanceOf: TypeError});
	await t.throwsAsync(cr3ToJpg(VALID_TEST_FILE, ''), {instanceOf: TypeError});
});

test('rejects a file that is not a cr3', async t => {
	const fakeFile = temporaryPath('fake.cr3');
	fs.writeFileSync(fakeFile, Buffer.from('not a raw file at all'));
	await t.throwsAsync(cr3ToJpg(fakeFile, temporaryPath('fake.jpg')), {message: 'Not a CR3 file'});
});

test('rejects a cr3 without an embedded jpeg', async t => {
	const header = fs.readFileSync(VALID_TEST_FILE).subarray(0, 24);
	const truncatedFile = temporaryPath('truncated.cr3');
	fs.writeFileSync(truncatedFile, header);
	await t.throwsAsync(cr3ToJpg(truncatedFile, temporaryPath('truncated.jpg')), {message: 'Invalid CR3 file: missing moov box'});
});

test('rejects a missing file', async t => {
	await t.throwsAsync(cr3ToJpg(temporaryPath('missing.cr3'), temporaryPath('missing.jpg')), {code: 'ENOENT'});
});
