import * as r from "restructure";

class HuffmanTableElements {
  decode(stream, parent) {
    const tables = {};

    let buffer = stream.buffer.slice(
      stream.pos,
      stream.pos + parent.length - 2,
    );

    while (buffer.length > 0) {
      let offset = 1;

      const elements = [];
      const identifier = buffer.readUInt8();
      const lengths = buffer.slice(offset, offset + 16);

      offset += 16;

      for (const length of lengths) {
        elements.push(buffer.slice(offset, offset + length));
        offset += length;
      }

      buffer = buffer.slice(offset);

      tables[identifier] = Buffer.concat(elements);
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
