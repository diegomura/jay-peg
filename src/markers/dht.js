import * as r from "restructure";
import { readUInt8 } from "./utils.js";

class HuffmanTableElements {
  decode(stream, parent) {
    const tables = [];

    let buffer = stream.buffer.slice(
      stream.pos,
      stream.pos + parent.length - 2,
    );

    while (buffer.length > 0) {
      let offset = 1;

      const htInfo = readUInt8(buffer, 0);
      const tableClass = htInfo >> 4 === 0 ? "DC" : "AC";
      const identifier = htInfo & 0xf;
      const bits = buffer.slice(offset, offset + 16);

      offset += 16;

      let code = 0;

      const elements = new Map();
      for (let length = 0; length <= bits.length; length++) {
        const numCodes = bits[length];

        for (let i = 0; i < numCodes; i++) {
          const value = readUInt8(buffer, offset);
          const key = code.toString(2).padStart(length + 1, "0");

          elements.set(key, value);
          code++;
          offset++;
        }

        code <<= 1;
      }

      buffer = buffer.slice(offset);

      tables.push({
        tableClass,
        identifier,
        elements,
      });
    }

    stream.pos += parent.length - 2;

    return tables;
  }
}

const DefineHuffmanTableMarker = {
  name: () => "DHT",
  length: r.uint16be,
  tables: new HuffmanTableElements(),
};

export default DefineHuffmanTableMarker;
