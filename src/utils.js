const fs = require("fs");
const chalk = require("chalk");
const readline = require("readline");
const Unzip = require("unzip-stream");
const spawn = require("child_process").spawn;
const http = require("http");
const Progress = require("cli-progress").Bar;

const log = text => {
  //const log = console.log;
};

const download = (url, dest, cb) => {
  let file = fs.createWriteStream(dest);

  let bar = new Progress({
    barsize: 10,
    format:
      "Downloading: [{bar}] {percentage}% | | ETA: {eta}s | {value}/{total}"
  });

  let request = http.get(url, function(response) {
    let len = parseInt(response.headers["content-length"], 10);
    var cur = 0;

    bar.start(len, 0);

    // check if response is success
    if (response.statusCode !== 200) {
      return cb("Response status was " + response.statusCode);
    }

    response.pipe(file);

    response.on("data", function(chunk) {
      cur += chunk.length;
      bar.update(cur);
    });

    file.on("finish", function() {
      bar.stop();
      file.close(cb); // close() is async, call cb after close completes.
    });

    // check for request error too
    request.on("error", function(err) {
      bar.stop();
      fs.unlink(dest);
      return cb(err.message);
    });
  });

  file.on("error", function(err) {
    // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    return cb(err.message);
  });
};

/**
 *
 * @param {*} packedFile
 * @param {*} targetFolder
 */
const unpackZip = async (packedFile, targetFolder) => {
  return new Promise((resolve, reject) => {
    const unzipper = Unzip.Extract({ path: targetFolder });
    unzipper.on("error", reject);
    unzipper.on("close", resolve);

    fs.createReadStream(packedFile).pipe(unzipper);
  });
};

const exists = path => {
  return fs.existsSync(path) ? path : false;
};

const getFile = (name = "./dump.json") => {
  return exists(name) ? fs.readFileSync(name, "utf8") : "";
};

const getFileSize = path => {
  const stats = fs.statSync(path);
  return Math.floor(stats["size"] / (1024 * 1024)) + "MB";
};

const writeFile = (name = "./dump.txt", str) => {
  fs.writeFileSync(name, str);
};

const dumpFile = (name = "./dump.json", object) => {
  fs.writeFileSync(name, JSON.stringify(object, null, 2));
};

const prob = prob => {
  return Math.floor(Math.random() * 100) <= prob;
};

const getRandomItem = items => {
  return items[Math.floor(Math.random() * items.length)];
};

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

/**
 *  Get OS-independent npm name
 */
const getNPMName = () => {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
};

/**
 * Start the child process and output everything into console
 */
const runProcess = (command, params, callback) => {
  let proc = spawn(command, params);
  proc.stdout.on("data", data => console.log("" + data));
  proc.stderr.on("data", data => console.log("" + data));
  if (callback) proc.on("close", callback);
};

module.exports = {
  getFile,
  getFileSize,
  unpackZip,
  download,
  dumpFile,
  writeFile,
  exists,
  prob,
  runProcess,
  getNPMName,
  asyncForEach,
  getRandomItem
};
