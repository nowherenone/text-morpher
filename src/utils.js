const fs = require("fs");

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

module.exports = {
  getFile,
  dumpFile,
  prob,
  getRandomItem
};
