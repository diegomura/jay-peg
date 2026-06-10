import * as r from "restructure";
import { readUInt16BE, uint8ArrayToString } from "./utils.js";

const APP0_LENGTH_BYTES = 2;
const JFIF_IDENTIFIER = "JFIF\0";
const JFXX_IDENTIFIER = "JFXX\0";
const JFIF_HEADER_LENGTH = 14;
const JFXX_HEADER_LENGTH = 6;

// APP0's name and fields depend on the payload contents (JFIF, JFXX, or
// unknown), so they are written onto the marker directly to preserve the
// original flat output shape.
class APP0Payload {
  decode(stream, parent) {
    const payloadLength = parent.length - APP0_LENGTH_BYTES;

    if (payloadLength < 0) {
      throw new Error(`Invalid APP0 length ${parent.length}`);
    }

    const end = stream.pos + payloadLength;

    if (end > stream.length) {
      throw new Error(
        `Truncated APP0 segment: declared length ${parent.length} exceeds remaining buffer`,
      );
    }

    const payload = stream.buffer.slice(stream.pos, end);
    stream.pos = end;

    parent.name = "APP0";

    if (payload.length === 0) {
      return;
    }

    const identifierLength = Math.min(5, payload.length);
    const identifier = uint8ArrayToString(payload.slice(0, identifierLength));

    parent.identifier = identifier;

    if (
      identifier === JFIF_IDENTIFIER &&
      payload.length >= JFIF_HEADER_LENGTH
    ) {
      parent.name = "JFIF";
      parent.version = readUInt16BE(payload, 5);
      parent.units = payload[7];
      parent.xDensity = readUInt16BE(payload, 8);
      parent.yDensity = readUInt16BE(payload, 10);
      parent.thumbnailWidth = payload[12];
      parent.thumbnailHeight = payload[13];

      const thumbnailLength =
        parent.thumbnailWidth * parent.thumbnailHeight * 3;
      const thumbnailEnd = Math.min(
        JFIF_HEADER_LENGTH + thumbnailLength,
        payload.length,
      );

      if (thumbnailEnd > JFIF_HEADER_LENGTH) {
        parent.thumbnail = payload.slice(JFIF_HEADER_LENGTH, thumbnailEnd);
      }

      if (payload.length > thumbnailEnd) {
        parent.data = payload.slice(thumbnailEnd);
      }

      return;
    }

    if (identifier === JFXX_IDENTIFIER) {
      parent.name = "JFXX";

      if (payload.length >= JFXX_HEADER_LENGTH) {
        parent.extensionCode = payload[5];
      }

      if (payload.length > JFXX_HEADER_LENGTH) {
        parent.data = payload.slice(JFXX_HEADER_LENGTH);
      }

      return;
    }

    if (payload.length > identifierLength) {
      parent.data = payload.slice(identifierLength);
    }
  }
}

const JFIFMarker = {
  length: r.uint16be,
  payload: new APP0Payload(),
};

export default JFIFMarker;
