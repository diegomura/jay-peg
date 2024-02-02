import fs from 'fs'
import url from 'url'
import path from 'path'
import { describe, it } from 'vitest'
import * as r from 'restructure'
import tags from './tags.json'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const buffer = fs.readFileSync(`${__dirname}/images/orientation-1.jpeg`)

const UnkownMarker = {
  length: r.uint16be,
  buf: new r.Buffer((parent) => parent.length - 2),
}

const SOSComponentSpecification = new r.Struct({
  scanComponentSelector: r.uint8,
  entropyCodingTable: new r.Buffer(1),
})

const SOSMarker = {
  length: r.uint16be,
  numberOfImageComponents: r.uint8,
  componentSpecifications: new r.Array(SOSComponentSpecification, (parent) => parent.numberOfImageComponents),
  startOfSpectral: r.uint8,
  endOfSpectral: r.uint8,
  successiveApproximationBit: new r.Buffer(1),
  buf: new r.Buffer(Infinity),
}

const FrameColorComponent = new r.Struct({
  id: r.uint8,
  samplingFactors: r.uint8,
  quantizationTableId: r.uint8,
})

const StartOfFrameMarker = {
  length: r.uint16be,
  precision: r.uint8,
  height: r.uint16be,
  width: r.uint16be,
  numberOfComponents: r.uint8,
  components: new r.Array(FrameColorComponent, (parent) => parent.numberOfComponents),
}

class HuffmanTableElements {
   decode(stream, parent) {
    const elements = []

    for (const length of parent.lengths) {
      elements.push(stream.buffer.slice(stream.pos, stream.pos + length))
      stream.pos += length

    }

    return Buffer.concat(elements)
   }
}

const DefineHuffmanTableMarker = {
  length: r.uint16be,
  identifier: r.uint8,
  lengths: new r.Buffer(16),
  elements: new HuffmanTableElements(),
}

const JPGMarker = UnkownMarker

const DACTable = new r.Struct({
  identifier: new r.Buffer(1),
  value: new r.Buffer(1),
})

const DACMarker = {
  length: r.uint16be,
  tables: new r.Array(DACTable, (parent) => parent.length / 2),
}

const RestartMarker = {}

const DQTMarker = {
  length: r.uint16be,
  tables: new r.Array(new r.Struct({
    identifier: new r.Buffer(1),
    data: new r.Buffer(64)
  }), parent => (parent.length - 2) / 65)
}

const DRIMarker = {
  length: r.uint16be,
  restartInterval: r.uint16be,
}

const JFIFMarker = {
  length: r.uint16be,
  identifier: new r.String(5),
  version: r.uint16be,
  units: r.uint8,
  xDensity: r.uint16be,
  yDensity: r.uint16be,
  thumbnailWidth: r.uint8,
  thumbnailHeight: r.uint8,
}

class IDFEntries {
  constructor(bigEndian) {
    this.bigEndian = bigEndian
    this.bytes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8]
  }

  _getTagValue(dataValue, dataFormat) {
    const uint16 = (pos) => (this.bigEndian ? dataValue.readUInt16BE(pos) : dataValue.readUInt16LE(pos))
    const uint32 = (pos) => (this.bigEndian ? dataValue.readUInt32BE(pos) : dataValue.readUInt32LE(pos))

    let tagValue

    switch (dataFormat) {
      case 1:
        return dataValue.readUInt8(0)
      case 2:
        return dataValue.toString('ascii').replace(/\0+$/, '')
      case 3:
        return uint16(0)
      case 4:
        return uint32(0)
      case 5:
        const tagValue = []

        for (var i = 0; i < dataValue.length; i += 8) {
          tagValue.push(uint32(i) / uint32(i + 4))
        }

        return tagValue
      case 7:
        return null
      // switch (tagName) {
      //   case 'ExifVersion':
      //     tagValue = dataValue.toString()
      //     break
      //   case 'FlashPixVersion':
      //     tagValue = dataValue.toString()
      //     break
      //   case 'SceneType':
      //     tagValue = dataValue.readUInt8(0)
      //     break
      //   default:
      //     tagValue = '0x' + dataValue.toString('hex', 0, 15)
      //     break
      // }
      // break
      case 10: {
        return uint32(0) / uint32(4)
        break
      }
      default:
        return '0x' + dataValue.toString('hex')
    }
  }

  _decodeIDFEntries(buffer, tags, offset) {
    let pos = 2

    const entries = {}

    const uint16 = (pos) => (this.bigEndian ? buffer.readUInt16BE(pos) : buffer.readUInt16LE(pos))
    const uint32 = (pos) => (this.bigEndian ? buffer.readUInt32BE(pos) : buffer.readUInt32LE(pos))

    const numberOfEntries = uint16(0)

    for (let i = 0; i < numberOfEntries; i++) {
      const tagAddress = buffer.slice(pos, pos + 2)
      const dataFormat = uint16(pos + 2)
      const componentsNumber = uint32(pos + 4)
      const componentsBytes = this.bytes[dataFormat]
      const dataLength = componentsNumber * componentsBytes

      let dataValue = buffer.slice(pos + 8, pos + 12)

      if (dataLength > 4) {
        const valueOffset = this.bigEndian ? dataValue.readUInt32BE(0) : dataValue.readUInt32LE(0)
        const dataOffset = valueOffset - offset

        dataValue = buffer.slice(dataOffset, dataOffset + dataLength)
      }

      const tagValue = this._getTagValue(dataValue, dataFormat)
      const tagNumber = this.bigEndian ? tagAddress.toString('hex') : tagAddress.reverse().toString('hex')
      const tagName = tags[tagNumber]

      entries[tagName] = tagValue

      pos += 12
    }

    return entries
  }

  decode(stream, parent) {
    const buffer = stream.buffer.slice(stream.pos)
    const offsetToFirstIFD = parent.offsetToFirstIFD
    const entries = this._decodeIDFEntries(buffer, tags.ifd, offsetToFirstIFD)
    const { exifIFDPointer, gpsInfoIFDPointer } = entries

    if (exifIFDPointer) {
      const subuffer = buffer.slice(exifIFDPointer - offsetToFirstIFD)
      entries.subExif = this._decodeIDFEntries(subuffer, tags.ifd, exifIFDPointer)
    }

    if (gpsInfoIFDPointer) {
      const gps = gpsInfoIFDPointer
      const subuffer = buffer.slice(exifIFDPointer ? gps - exifIFDPointer : gps - offsetToFirstIFD)
      entries.gpsInfo = IFDHandler(subuffer, tags.gps, gps)
    }

    stream.pos += parent.parent.length - 16

    return entries
  }
}

const IFDData = (bigEndian) => {
  const uint16 = bigEndian ? r.uint16be : r.uint16le
  const uint32 = bigEndian ? r.uint32be : r.uint32le

  return {
    fortyTwo: uint16,
    offsetToFirstIFD: uint32,
    entries: new IDFEntries(bigEndian),
  }
}

const TIFFHeader = new r.VersionedStruct(new r.String(2), {
  MM: IFDData(true),
  II: IFDData(false),
})

const EXIFMarker = {
  length: r.uint16be,
  identifier: new r.String(6),
  tiffHeader: TIFFHeader,
}

const unknownMarkers = Array(63)
  .fill(0)
  .reduce((acc, v, i) => ({ ...acc, [i + 65472]: UnkownMarker }), {})

const restartMarkers = Array(8)
  .fill(0)
  .reduce((acc, v, i) => ({ ...acc, [i + 65488]: RestartMarker }), {})

const Marker = new r.VersionedStruct(r.uint16be, {
  ...unknownMarkers,
  ...restartMarkers,
  65472: StartOfFrameMarker,
  65473: StartOfFrameMarker,
  65474: StartOfFrameMarker,
  65475: StartOfFrameMarker,
  65476: DefineHuffmanTableMarker,
  65477: StartOfFrameMarker,
  65478: StartOfFrameMarker,
  65479: StartOfFrameMarker,
  65480: JPGMarker,
  65481: StartOfFrameMarker,
  65482: StartOfFrameMarker,
  65483: StartOfFrameMarker,
  65484: DACMarker,
  65485: StartOfFrameMarker,
  65486: StartOfFrameMarker,
  65487: StartOfFrameMarker,
  65498: SOSMarker,
  65499: DQTMarker,
  65501: DRIMarker,
  65504: JFIFMarker,
  65505: EXIFMarker,
})

const JPEG = new r.Array(Marker)

describe('exif', () => {
  it('test', () => {
    // const d = exif.fromBuffer(buffer)
    // console.log(d);

    const soi = buffer.slice(0, 2).readUInt16BE(0)
    const eoi = buffer.slice(buffer.length - 2).readUInt16BE(0)

    const markers = JPEG.fromBuffer(buffer.slice(2, buffer.length - 2))

    console.log(markers.filter((m) => m.version === 65476))
  })
})
