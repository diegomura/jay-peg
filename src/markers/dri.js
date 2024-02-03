import * as r from 'restructure'

const DRIMarker = {
  length: r.uint16be,
  restartInterval: r.uint16be,
}

export default DRIMarker
