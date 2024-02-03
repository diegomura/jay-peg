import * as r from "restructure";

class ImageData {
  decode(stream) {
    const buffer = stream.buffer.slice(stream.pos);

    let length = 0;

    for (length; length < buffer.length; length++) {
      const currentByte = buffer[length];
      const nextByte = buffer[length + 1];
      const comesRestart = nextByte >= 0xd0 && nextByte <= 0xd7;

      if (currentByte === 0xff && nextByte !== 0x00 && !comesRestart) break;
    }

    stream.pos += length;

    return buffer.slice(0, length);
  }
}

const SOSComponentSpecification = new r.Struct({
  scanComponentSelector: r.uint8,
  entropyCodingTable: new r.Buffer(1),
});

const SOSMarker = {
  name: () => 'SOS',
  length: r.uint16be,
  numberOfImageComponents: r.uint8,
  componentSpecifications: new r.Array(
    SOSComponentSpecification,
    (parent) => parent.numberOfImageComponents,
  ),
  startOfSpectral: r.uint8,
  endOfSpectral: r.uint8,
  successiveApproximationBit: new r.Buffer(1),
  data: new ImageData(),
};

export default SOSMarker;
