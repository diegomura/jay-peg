import "colors";
import fs from "fs";
import url from "url";
import path from "path";
import Benchmark from "benchmark";

import JPEG from "../src/index.js";

const suite = new Benchmark.Suite();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const small = fs.readFileSync(`${__dirname}/small.jpg`);
const medium = fs.readFileSync(`${__dirname}/medium.jpg`);
const large = fs.readFileSync(`${__dirname}/large.jpg`);
const huge = fs.readFileSync(`${__dirname}/huge.jpg`);

suite.add("small".magenta + ": ".green, () => JPEG.decode(small));
suite.add("medium".magenta + ": ".green, () => JPEG.decode(medium));
suite.add("large".magenta + ": ".green, () => JPEG.decode(large));
suite.add("huge".magenta + ": ".green, () => JPEG.decode(huge));

console.log("=== TESTS OPS/SECOND ===".magenta);

suite
  .on("cycle", function (event) {
    console.log("Benchmarked:".yellow, String(event.target).green);
  })
  .run({ async: false });
