const utils = require("./utils.js");

class Parser {
  constructor(options = {}) {
    this.Az = global.Az;
    this.options = options;
    this.accentLookup = this.options.accentLookup || {};
    this.stopWords = this.options.stopWords || [];
    this.options.withSpaces = true;
    this.initStopWords();
  }

  /**
   *
   *
   * @memberof Parser
   */
  initStopWords() {
    this.stopWordsLookup = {};
    this.stopWords.forEach(word => (this.stopWordsLookup[word] = true));
  }

  /**
   *
   *
   * @param {string} [word=""]
   * @memberof Parser
   */
  getVowelMap(word = "") {
    let w = word.toLowerCase();
    let parts = w.match(/[бвгджзйклмнпрстфхцчшщьъ]*?[аеёиоуыэюя]/gi) || [];

    return {
      vowels: parts.map(p => p.match(/[аеёиоуыэюя]{1,3}/gi)).join("-"),
      accmap: this.accentLookup[w] || new Array(parts.length).fill(0).join("")
    };
  }

  /**
   *
   * @param {*} token
   */
  getShortTag(token) {
    let skipParts = ["PRED", "PRCL", "PREP", "NPRO", "GRND", "ADVB"];
    let skipTags = ["inan", "anim"];

    if (
      !token.tag ||
      !token.word ||
      this.stopWordsLookup[token.normalize().word] ||
      token.tag.isCapitalized() ||
      ~skipParts.indexOf(token.tag.POST) ||
      token.word.length < 4
    ) {
      return false;
    } else {
      let POST = token.tag.POST;
      let tags = token.tag.stat.slice(1, 100).concat(token.tag.flex) || [];

      tags = tags.filter(t => !~skipTags.indexOf(t) && !/^[A-Z]/.test(t));

      return `{{${POST}/.*/${tags.join(",")}/${token.word}}}`;
    }
  }

  /**
   *
   * @param {*} word
   */
  parseWord(word) {
    return this.parseText(word).shift();
  }

  /**
   *
   *
   * @param {*} text
   * @returns
   * @memberof Parser
   */
  parseText(text) {
    let tokens = this.Az.Tokens(Array.isArray(text) ? text.join(" ") : text)
      .done()
      .map(token => {
        let origin = token.source.substr(token.st, token.length);
        let isCapitalized = origin[0] != (origin[0] || "").toLowerCase();

        let word = {
          word: origin
        };

        word = Object.assign(word, this.getVowelMap(origin));

        if (
          token.type == "WORD" &&
          token.subType == "CYRIL" &&
          !isCapitalized
        ) {
          let parse = this.Az.Morph(origin).shift();

          if (parse) {
            Object.assign(word, {
              wordNormal: parse.normalize().word,
              parse: parse,
              tag: parse.tag,
              part: parse.tag.POST,
              shortTag: this.getShortTag(parse) || origin || ""
            });
          }
        }

        return word;
      });

    return (
      (this.options.withSpaces
        ? tokens
        : tokens.filter(token => token.word.trim())) || []
    );
  }
}

module.exports = Parser;
