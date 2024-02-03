import "colors";
import fs from "fs";
import url from "url";
import path from "path";
import Benchmark from "benchmark";

import JPEG from "../src/index.js";

const suite = new Benchmark.Suite();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const buffer = fs.readFileSync(`${__dirname}/daft-punk.jpeg`);

suite.add("decode".magenta + ": ".green, () => JPEG.decode(buffer));

console.log("=== TESTS OPS/SECOND ===".magenta);

suite
  .on("cycle", function (event) {
    console.log("Benchmarked:".yellow, String(event.target).green);
  })
  .run({ async: false });
