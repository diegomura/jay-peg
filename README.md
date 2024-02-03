# jay-peg

## Overview

Fast and small JavaScript library dedicated to the efficient decoding of JPEG images.

## Installation

Using npm:

```bash
npm install jay-peg
```

Using yarn:

```bash
yarn add jay-peg
```

## Usage

Use the `decoder` providing a JPEG data buffer as input.

```javascript
const JPEG = require('jay-peg');

const jpegBuffer = /* your JPEG buffer here */;
const imageMarkers = JPEG.decoder(jpegBuffer);

console.log(imageMarkers);
```

## Example Output

The output consists of a structured array of image markers:

```javascript
[
  {
    type: 65496,
    name: 'SOI',
  },
  {
    type: 65505,
    name: 'EXIF',
    length: 16382,
    identifier: "Exif\x00\x00",
    entries: [Object],
  },
  {
    type: 65499,
    name: 'DAC',
    length: 132,
    tables: [[Object], [Object]]
  },
  // ... and so forth
  {
    type: 65497,
    name: 'EOI',
  },
];
```

## API

### `decoder(buffer: Buffer): Array<ImageMarker>`

The `decoder` function accepts a JPEG buffer as its sole argument and returns an array of image markers.

#### Parameters

- `buffer`: A Buffer containing the JPEG image data.

#### Returns

An array of objects representing various markers found in the JPEG image.

### `ImageMarker`

Each `ImageMarker` object in the output array adheres to the following structure:

- `type` (Number): The marker type.
- `name` (String): The marker name.
- `length` (Number): The length of the marker data.
- Additional properties specific to certain marker types.

## License

`jay-peg` is released under the [MIT License](LICENSE)
