# cr3-to-jpg
The lightweight, lightning-fast .CR3 to .JPG format wizard. Effortlessly harness the magic of your .CR3 photo archives, swiftly transmuting them into vibrant, shareable .JPG masterpieces.

## Install

`npm install cr3-to-jpg`

## Usage

```javascript
import cr3ToJpg from 'cr3-to-jpg'

const result = await cr3ToJpg('file.cr3', 'destination.jpg')
//=> {success: true, outputPath: 'destination.jpg'}
```

The source path must end in `.cr3` and the destination in `.jpg` or `.jpeg` (case-insensitive). The returned promise rejects with an `Error` if either path has the wrong extension, if the source is not a CR3 file, or if it holds no embedded JPEG.

## How it works

A `.cr3` file is an ISO base media container, like MP4 or MOV. Alongside the raw sensor data the camera stores a full-size JPEG rendering as the first track of the file. This package reads the container's index to find that JPEG and copies it out byte for byte. No decoding takes place, so it has no dependencies and no native binaries.

## Unpacked Size
Less than 10 kB
