// Microsoft Build Tools 2013
// https://www.microsoft.com/en-us/download/details.aspx?id=40760
// npm install --global --production windows-build-tools
// Why no ES6 - because of conditional imports
/*
if (require('os').platform().indexOf('win32') < 0){
  throw 'node-windows is only supported on Windows.';
}
    // Works!
    winTools.elevate(".\\data\\123.cmd");
    return;
*/
const Parser = require("./parser.js");
const utils = require("./utils.js");


module.exports = class Context {
  constructor(config) {
    this.parser = new Parser({ withSpaces: true });

    this.treshHold = .5;
    this.topN = 500;

    // Check if word2vector is installed 
    if (!utils.exists(`./node_modules/word2vector/index.js`) || !utils.exists(config.modelFile)) {
      console.log(`Context search with word2vec is disabled`);
      this.disabled = true;
    } else {
      this.w2v = require("word2vector");
      this.w2v.load(config.modelFile);
    }
  }

  /**
   *
   * @param {*} token
   */
  getSimilarWords(token, extractPart) {
    if (this.disabled) return [];

    // Edge case for adjectives 
    let part = token.part == "ADJF" ? "ADJ" : token.part;

    let vTag = `${token.wordNormal}_${part}`;
    let results = [];

    try {
      results = this.w2v.getSimilarWords(vTag, { N: this.topN });
    } catch (e) { results = []; }

    return results
      .map(v => {
        let w = v.word.split("_");
        return {
          word: w[0],
          part: w[1] == "ADJ" ? "ADJF" : w[1],
          score: v.similarity
        };
      })
      .filter(v => {
        return (
          !v.word.match("::") &&
          v.word.match(/[^a-z]/g) &&
          v.part == extractPart || token.part &&
          v.score > this.treshHold
        );
      })
      .map(v => this.parser.parseWord(v.word));
  }
};
