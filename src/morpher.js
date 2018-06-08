const utils = require("./utils.js");
const Dictionary = require("./dictionary.js");
const Parser = require("./parser.js");

/// femn , masc

class Morpher {
  constructor(config) {
    this.dictionary = new Dictionary(config.dictFile);

    if (config.inputFile) {
      this.dictionary.loadFile(config.inputFile);
    }
  }

  /**
   *  Template syntax - {NOUN/^п./мр}
   *  {[PART]/[Regexp]/[tags]}
   *
   * @param {*} template
   * @memberof Morpher
   */
  parseTemplate(template) {
    let steps = template.split(" ");
    let output = [];

    steps.forEach(v => {
      let tag = (v.match("^{.*}$") || []).shift();
      if (tag) {
        tag = tag.replace("{", "").replace("}", "");
        let chunks = tag.split("/");

        if (chunks[2]) chunks[2] = chunks[2].split(",");

        //if ()
        let word = this.dictionary.getWord(chunks[0], chunks[1], chunks[2]);

        output.push(word);
      } else {
        output.push(v);
      }
    });

    return output.join(" ");
  }

  /**
   *
   *
   * @param {*} nouns
   * @param {*} adj
   * @returns
   * @memberof Morpher
   */
  conformAdjective(noun, adjFilter) {
    let nounToken = (new Parser(noun) || []).shift();
    let tag = nounToken.tag;
    let myAdj = this.dictionary.getAdjective(adjFilter);
    let newWord = "";

    if (myAdj && tag && tag.GNdr) {
      let gender = tag.GNdr;
      let flex = tag.flex.slice();
      flex.push(tag.GNdr);
      newWord = myAdj.parse.inflect(flex) || {};
    }

    return newWord.word !== undefined ? newWord.word : "";
  }

  addAdjectives(nouns, adjFilter) {
    let gender = "";
    let isFound = false;
    let tokens = new Parser(nouns);
    let hasAdj = !!tokens.find(v => v.part == "ADJF");
    let hasNoun = !!tokens.find(v => v.part == "NOUN");

    let result = [];

    tokens.forEach(v => {
      v.wordFinal = this.conformAdjective(v.word, adjFilter);

      let augmented = utils.prob(50)
        ? v.word + " " + v.wordFinal
        : v.wordFinal + " " + v.word;

      if (!isFound || (isFound && utils.prob(30))) {
        result.push(v.wordFinal ? augmented : v.word);
      } else {
        result.push(v.word);
      }

      if (v.wordFinal) isFound = true;
    });

    return result.join("");
  }
}

module.exports = Morpher;
