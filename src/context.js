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

module.exports = class Context {
  constructor() {
    this.parser = new Parser({ withSpaces: true });

    this.treshHold = .6;
    this.w2v = require("word2vector");
    this.modelFile = "./data/web.bin";
    this.w2v.load(this.modelFile);
  }

  /**
   *
   * @param {*} token
   */
  getSimilarWords(token, topN = 500) {
    let vTag = `${token.wordNormal}_${token.part}`;
    let results = [];

    try {
      results = this.w2v.getSimilarWords(vTag, { N: topN });
    } catch (e) {
      console.log(e);
    }

    return results
      .map(v => {
        let w = v.word.split("_");
        return { word: w[0], part: w[1], score: v.similarity };
      })
      .filter(v => {
        return (
          !v.word.match("::") &&
          v.word.match(/[^a-z]/g) &&
          v.part == token.part &&
          v.score > this.treshHold
        );
      })
      .map(v => this.parser.parseWord(v.word));
  }
};
