import Parser from "./parser.js";
import { exists, getFileSize, invert } from "./utils.js";

/**
 *
 *
 * @export
 * @class Context
 */
export default class Context {
  constructor(config) {
    this.parser = new Parser({ withSpaces: true });

    this.treshHold = 0.45;
    this.topN = 200;

    // Check if word2vector is installed
    if (
      config.contextSearch === false ||
      !exists(`${baseDir}/node_modules/word2vector/index.js`) ||
      !exists(`${config.modelFile}`)
    ) {
      console.log(`Context search with word2vec is disabled`);
      this.disabled = true;
    } else {
      console.log(
        `Context search is enabled, model size - ${getFileSize(
          `${config.modelFile}`
        )}`
      );
      this.w2v = require("word2vector");
      this.w2v.load(`${config.modelFile}`);
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
    let backMap = invert(posMap);

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
}
