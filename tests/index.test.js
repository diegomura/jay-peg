import fs from "fs";
import url from "url";
import path from "path";
import { describe, it, expect } from "vitest";

import JPEG from "../src";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const images = fs.readdirSync(`${__dirname}/images`);
const bufferTypes = [
  ["Buffer", (bytes) => Buffer.from(bytes)],
  ["Uint8Array", (bytes) => Uint8Array.from(bytes)],
];

expect.addSnapshotSerializer({
  serialize: (val) => Buffer.from(val).toString("hex"),
  test: (val) => Buffer.isBuffer(val) || val?.constructor.name === "Uint8Array",
});

describe("decode w/buffers", () => {
  it.each(images)("%s", (image) => {
    const buffer = fs.readFileSync(`${__dirname}/images/${image}`);
    const markers = JPEG.decode(buffer);

    expect(markers).toMatchSnapshot();
  });
});

describe("decode w/int arrays", () => {
  it.each(images)("%s", (image) => {
    const buffer = fs.readFileSync(`${__dirname}/images/${image}`);
    const markers = JPEG.decode(new Uint8Array(buffer));

    expect(markers).toMatchSnapshot();
  });
});

describe("APP0 markers", () => {
  it.each(bufferTypes)(
    "consumes extra JFIF bytes before the next marker w/%s",
    (_, toBuffer) => {
      const buffer = toBuffer([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x14, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x01, 0x2c, 0x01, 0x2c, 0x00, 0x00, 0x41, 0x4d, 0x50, 0x46,
        0xff, 0xe1, 0x00, 0x12, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d,
        0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0xff, 0xd9,
      ]);

      const markers = JPEG.decode(buffer);

      expect(markers[1].name).toBe("JFIF");
      expect(markers[1].length).toBe(20);
      expect(Array.from(markers[1].data)).toEqual([0x41, 0x4d, 0x50, 0x46]);
      expect(markers[2].type).toBe(0xffe1);
      expect(markers[2].name).toBe("EXIF");
      expect(markers[2].entries).toEqual({});
      expect(markers[3].type).toBe(0xffd9);
    },
  );

  it.each(bufferTypes)("consumes JFIF thumbnail bytes w/%s", (_, toBuffer) => {
    const buffer = toBuffer([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x13, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x02, 0x01, 0x00, 0x48, 0x00, 0x48, 0x01, 0x01, 0xff, 0x80, 0x00, 0xff,
      0xd9,
    ]);

    const markers = JPEG.decode(buffer);

    expect(markers[1].name).toBe("JFIF");
    expect(markers[1].thumbnailWidth).toBe(1);
    expect(markers[1].thumbnailHeight).toBe(1);
    expect(Array.from(markers[1].thumbnail)).toEqual([0xff, 0x80, 0x00]);
    expect(markers[2].type).toBe(0xffd9);
  });

  it.each(bufferTypes)("consumes JFXX payloads w/%s", (_, toBuffer) => {
    const buffer = toBuffer([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x09, 0x4a, 0x46, 0x58, 0x58, 0x00, 0x10,
      0xaa, 0xff, 0xd9,
    ]);

    const markers = JPEG.decode(buffer);

    expect(markers[1].type).toBe(0xffe0);
    expect(markers[1].name).toBe("JFXX");
    expect(markers[1].extensionCode).toBe(0x10);
    expect(Array.from(markers[1].data)).toEqual([0xaa]);
    expect(markers[2].type).toBe(0xffd9);
  });

  it.each(bufferTypes)("consumes empty APP0 segments w/%s", (_, toBuffer) => {
    const buffer = toBuffer([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x02, 0xff, 0xd9]);

    const markers = JPEG.decode(buffer);

    expect(markers[1].type).toBe(0xffe0);
    expect(markers[1].name).toBe("APP0");
    expect(markers[1].length).toBe(2);
    expect(markers[1].identifier).toBeUndefined();
    expect(markers[2].type).toBe(0xffd9);
  });

  it.each(bufferTypes)(
    "throws on APP0 lengths smaller than the length field w/%s",
    (_, toBuffer) => {
      const buffer = toBuffer([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01, 0xff, 0xd9]);

      expect(() => JPEG.decode(buffer)).toThrow("Invalid APP0 length 1");
    },
  );

  it.each(bufferTypes)(
    "throws on truncated APP0 payloads w/%s",
    (_, toBuffer) => {
      const buffer = toBuffer([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x14, 0x4a, 0x46, 0x49, 0x46, 0x00,
      ]);

      expect(() => JPEG.decode(buffer)).toThrow(
        "Truncated APP0 segment: declared length 20 exceeds remaining buffer",
      );
    },
  );

  it.each(bufferTypes)(
    "decodes the existing ExifTool APP0 fixture w/%s",
    (_, toBuffer) => {
      const buffer = fs.readFileSync(`${__dirname}/images/ExifTool.jpg`);
      const markers = JPEG.decode(toBuffer(buffer));

      expect(markers.some((marker) => marker.name === "JFXX")).toBe(true);
      expect(markers.some((marker) => marker.name === "APP0")).toBe(true);
      expect(markers.at(-1).type).toBe(0xffd9);
    },
  );
});
