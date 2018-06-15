const fs = require("fs");
const chalk = require('chalk');
const readline = require('readline');
const Unzip = require("unzip-stream");

const log = (text) => {
  //const log = console.log;
}

const type = (text) => {
  readline.write(text);

}


/**
 * 
 * @param {*} packedFile 
 * @param {*} targetFolder 
 */
const unpackZip = async (packedFile, targetFolder) => {

  return new Promise((resolve, reject) => {
    const unzipper = Unzip.Extract({ path: targetFolder });
    unzipper.on('error', reject);
    unzipper.on('close', resolve);

    fs.createReadStream(packedFile).pipe(unzipper);
  })
}


const exists = (path) => {
  return fs.existsSync(path) ? path : false;
}

const getFile = (name = "./dump.json") => {
  return fs.readFileSync(name, "utf8");
};

const dumpFile = (object, name = "./dump.json") => {
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
    await callback(array[index], index, array)
  }
}


module.exports = {
  getFile,
  unpackZip,
  dumpFile,
  exists,
  prob,
  asyncForEach,
  getRandomItem
};
