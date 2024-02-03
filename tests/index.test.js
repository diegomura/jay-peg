import fs from "fs";
import url from "url";
import path from "path";
import { describe, it, expect } from "vitest";

import JPEG from "../src";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const images = fs.readdirSync(`${__dirname}/images`);

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
