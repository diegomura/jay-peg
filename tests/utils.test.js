import { describe, it, expect } from "vitest";
import {
  readUInt8,
  readUInt16BE,
  readUInt16LE,
  readUInt32BE,
  readUInt32LE,
  uint8ArrayToHexString, uint8ArrayToString, concatenateUint8Arrays, readInt32BE, readInt32LE
} from "../src/markers/utils.js";

describe("readUInt8", () => {
  it("reads minimum 8-bit unsigned integer (0) correctly", () => {
    const data = new Uint8Array([0]);
    expect(readUInt8(data, 0)).toBe(0);
  });

  it("reads maximum 8-bit unsigned integer (0xff) correctly", () => {
    const data = new Uint8Array([0xff]);
    expect(readUInt8(data, 0)).toBe(255);
  });

  it("reads a non-zero value correctly", () => {
    const data = new Uint8Array([0, 255]);
    expect(readUInt8(data, 1)).toBe(255);
  });
});

describe("readUInt16BE", () => {
  it("reads minimum 16-bit unsigned integer (0) correctly", () => {
    const data = new Uint8Array([0x00, 0x00]);
    expect(readUInt16BE(data, 0)).toBe(0);
  });

  it("reads maximum 16-bit unsigned integer (0xffff) correctly", () => {
    const data = new Uint8Array([0xff, 0xff]);
    expect(readUInt16BE(data, 0)).toBe(65535);
  });

  it("reads 16-bit big-endian integer correctly", () => {
    const data = new Uint8Array([0x12, 0x34]);
    expect(readUInt16BE(data, 0)).toBe(0x1234);
  });

  it("reads with offset correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x12, 0x34]);
    expect(readUInt16BE(data, 2)).toBe(0x1234);
  });
});

describe("readUInt16LE", () => {
  it("reads minimum 16-bit unsigned integer (0) correctly", () => {
    const data = new Uint8Array([0x00, 0x00]);
    expect(readUInt16LE(data, 0)).toBe(0);
  });

  it("reads maximum 16-bit unsigned integer (0xffff) correctly", () => {
    const data = new Uint8Array([0xff, 0xff]);
    expect(readUInt16LE(data, 0)).toBe(65535);
  });

  it("reads 16-bit little-endian integer correctly", () => {
    const data = new Uint8Array([0x34, 0x12]);
    expect(readUInt16LE(data, 0)).toBe(0x1234);
  });

  it("reads with offset correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x34, 0x12]);
    expect(readUInt16LE(data, 2)).toBe(0x1234);
  });
});

describe("readUInt32BE", () => {
  it("reads minimum 32-bit unsigned integer (0) correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(readUInt32BE(data, 0)).toBe(0);
  });

  it("reads maximum 32-bit unsigned integer (0xffffffff) correctly", () => {
    const data = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
    expect(readUInt32BE(data, 0)).toBe(4294967295);
  });

  it("reads 32-bit big-endian integer correctly", () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
    expect(readUInt32BE(data, 0)).toBe(0x12345678);
  });

  it("reads with offset correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x12, 0x34, 0x56, 0x78]);
    expect(readUInt32BE(data, 2)).toBe(0x12345678);
  });
});

describe("readUInt32LE", () => {
  it("reads minimum 32-bit unsigned integer (0) correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(readUInt32LE(data, 0)).toBe(0);
  });

  it("reads maximum 32-bit unsigned integer (0xffffffff) correctly", () => {
    const data = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
    expect(readUInt32LE(data, 0)).toBe(4294967295);
  });

  it("reads 32-bit little-endian integer correctly", () => {
    const data = new Uint8Array([0x78, 0x56, 0x34, 0x12]);
    expect(readUInt32LE(data, 0)).toBe(0x12345678);
  });

  it("reads with offset correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x78, 0x56, 0x34, 0x12]);
    expect(readUInt32LE(data, 2)).toBe(0x12345678);
  });
});

describe("uint8ArrayToHexString", () => {
  it("converts uint8Array to hex string correctly", () => {
    const data = new Uint8Array([0x12, 0x34, 0x56]);
    expect(uint8ArrayToHexString(data)).toBe("123456");
  });
});

describe("uint8ArrayToString", () => {
  it("converts uint8Array to string correctly", () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]);
    expect(uint8ArrayToString(data)).toBe("Hello");
  });
});

describe("concatenateUint8Arrays", () => {
  it("concatenates multiple Uint8Arrays correctly", () => {
    const array1 = new Uint8Array([1, 2]);
    const array2 = new Uint8Array([3, 4]);
    const array3 = new Uint8Array([5, 6]);
    expect(concatenateUint8Arrays([array1, array2, array3])).toEqual(
      new Uint8Array([1, 2, 3, 4, 5, 6])
    );
  });
});

describe("readInt32BE", () => {
  it("reads minimum 32-bit signed integer (-2147483648) correctly", () => {
    const data = new Uint8Array([0x80, 0x00, 0x00, 0x00]);
    expect(readInt32BE(data, 0)).toBe(-2147483648);
  });

  it("reads maximum 32-bit signed integer (2147483647) correctly", () => {
    const data = new Uint8Array([0x7f, 0xff, 0xff, 0xff]);
    expect(readInt32BE(data, 0)).toBe(2147483647);
  });

  it("reads 32-bit signed big-endian integer correctly", () => {
    const data = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
    expect(readInt32BE(data, 0)).toBe(-1);
  });

  it("reads positive 32-bit signed big-endian integer correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
    expect(readInt32BE(data, 0)).toBe(1);
  });
});

describe("readInt32LE", () => {
  it("reads minimum 32-bit signed integer (-2147483648) correctly", () => {
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x80]);
    expect(readInt32LE(data, 0)).toBe(-2147483648);
  });

  it("reads maximum 32-bit signed integer (2147483647) correctly", () => {
    const data = new Uint8Array([0xff, 0xff, 0xff, 0x7f]);
    expect(readInt32LE(data, 0)).toBe(2147483647);
  });

  it("reads 32-bit signed little-endian integer correctly", () => {
    const data = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
    expect(readInt32LE(data, 0)).toBe(-1);
  });

  it("reads positive 32-bit signed little-endian integer correctly", () => {
    const data = new Uint8Array([0x01, 0x00, 0x00, 0x00]);
    expect(readInt32LE(data, 0)).toBe(1);
  });
});
