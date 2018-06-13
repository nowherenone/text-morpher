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

/*

    let acc = JSON.parse(utils.getFile("./data/accent.json"));
    let accentLookup = {};
    Object.keys(acc).forEach(key => {
      let w = acc[key];
      w.forEach(word => {
        let parts =
          word.match(/[бвгджзйклмнпрстфхцчшщьъ']*?[аеёиоуыэюя]/gi) || [];

        let accPos = parts.findIndex(p => ~p.indexOf("'"));
        let map = new Array(parts.length).fill(0);
        //console.log(word, accPos, parts, parts.length);
        map[accPos == -1 ? parts.length - 1 : accPos - 1] = 1;

        accentLookup[word.replace("'", "")] = map.join("");

        //  .join("");
      });
    });

    utils.dumpFile(accentLookup, "./accentLookup.json");
    */
