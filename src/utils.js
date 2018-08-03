import fs from "fs";
import chalk from "chalk";
import readline from "readline";
import Unzip from "unzip-stream";
import { spawn } from "child_process";
import http from "http";
import { Bar as Progress } from "cli-progress";
/*
const fs = require("fs");
const chalk = require("chalk");
const readline = require("readline");
const Unzip = require("unzip-stream");
const spawn = require("child_process").spawn;
const http = require("http");
const Progress = require("cli-progress").Bar;
*/

export const log = text => {
  //const log = console.log;
};

/**
 * Download a file
 *
 * @param {*} url
 * @param {*} dest
 * @param {*} cb
 */
export const download = (url, dest, cb) => {
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
export const unpackZip = async (packedFile, targetFolder) => {
  return new Promise((resolve, reject) => {
    const unzipper = Unzip.Extract({ path: targetFolder });
    unzipper.on("error", reject);
    unzipper.on("close", resolve);

    fs.createReadStream(packedFile).pipe(unzipper);
  });
};

export const exists = path => {
  return fs.existsSync(path) ? path : false;
};
export const getFile = (name = "./dump.json") => {
  return exists(name) ? fs.readFileSync(name, "utf8") : "";
};
export const getFileSize = path => {
  const stats = fs.statSync(path);
  return Math.floor(stats["size"] / (1024 * 1024)) + "MB";
};

export const writeFile = (name = "./dump.txt", str) => {
  fs.writeFileSync(name, str);
};

export const dumpFile = (name = "./dump.json", object) => {
  fs.writeFileSync(name, JSON.stringify(object, null, 2));
};

export const prob = prob => {
  return Math.floor(Math.random() * 100) <= prob;
};

export const getRandomItem = items => {
  return items[Math.floor(Math.random() * items.length)];
};

export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export const invert = obj => {
  let new_obj = {};
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      new_obj[obj[prop]] = prop;
    }
  }

  return new_obj;
};

/**
 *  Get OS-independent npm name
 */
export const getNPMName = () => {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
};

/**
 * Start the child process and output everything into console
 */
export const runProcess = (command, params, callback) => {
  let proc = spawn(command, params);
  //proc.stdout.on("data", data => console.log("" + data));
  //proc.stderr.on("data", data => console.log("" + data));
  if (callback) proc.on("close", callback);
};
