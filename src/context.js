const Parser = require("./parser.js");
const utils = require("./utils.js");

module.exports = class Context {
  constructor(config) {
    this.parser = new Parser({ withSpaces: true });

    this.treshHold = 0.5;
    this.topN = 200;

    // Check if word2vector is installed
    if (
      config.contextSearch === false ||
      !utils.exists(`./node_modules/word2vector/index.js`) ||
      !utils.exists(config.modelFile)
    ) {
      console.log(`Context search with word2vec is disabled`);
      this.disabled = true;
    } else {
      console.log(
        `Context search is enabled, model size - ${utils.getFileSize(
          config.modelFile
        )}`
      );
      this.w2v = require("word2vector");
      this.w2v.load(config.modelFile);
      console.log("Done");
    }
  }

  /**
   *
   * @param {*} token
   */
  getSimilarWords(token, options = {}) {
    if (this.disabled) return [];

    // Edge case for adjectives
    let posMap = {
      ADJF: "ADJ",
      INFN: "VERB"
    };
    let backMap = utils.invert(posMap);

    let vTag = `${token.wordNormal}_${posMap[token.part] || token.part}`;
    let results = [];

    try {
      results = this.w2v.getSimilarWords(vTag, { N: this.topN });
    } catch (e) {
      results = [];
    }

    return results
      .map(v => {
        let w = v.word.split("_");
        return {
          word: w[0],
          part: backMap[w[1]] || w[1],
          score: v.similarity
        };
      })
      .filter(v => {
        return (
          !v.word.match("::") &&
          v.word.match(/[^a-z]/g) &&
          v.part ==
            (options.extractPart || backMap[token.part] || token.part) &&
          v.score > (options.treshHold || this.treshHold)
        );
      })
      .map(v => this.parser.parseWord(v.word));
  }
};
