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
  getTags(token) {
    let skipTags = ["inan", "anim"];
    let tags = token.tag.stat.slice(1, 100).concat(token.tag.flex) || [];
    return tags.filter(t => !~skipTags.indexOf(t) && !/^[A-Z]/.test(t));
  }

  /**
   *
   * @param {*} token
   */
  getShortTag(token) {
    let skipParts = ["PRED", "PRCL", "PREP", "NPRO", "GRND", "ADVB"];

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
      return `{{${POST}/.*/${this.getTags(token).join(",")}/${token.word}}}`;
    }
  }

  /**
   *
   * @param {*} word
   */
  parseWord(word, simpleForm) {
    let token = this.parseText(word).shift();

    if (simpleForm) {
      token.tags = this.getTags(token).join(",");
      delete token.parse;
      delete token.tag;
      delete token.shortTag;
    }

    return token;
  }

  /**
   *
   *
   * @param {*} text
   * @returns
   * @memberof Parser
   */
  parseText(inputText) {
    let text = Array.isArray(inputText) ? inputText.join(" ") : inputText;
    let tokens = this.Az.Tokens(text)
      .done()
      .map(token => {
        return this.parseToken(token, true).shift() || {};
      });

    return (
      (this.options.withSpaces
        ? tokens
        : tokens.filter(token => token.word.trim())) || []
    );
  }

  /**
   *
   */
  parseToken(token, quick) {
    let origin = token.source.substr(token.st, token.length);
    let isCapitalized = origin[0] != (origin[0] || "").toLowerCase();
    let output = [];

    // Get basic word properties
    let wordData = Object.assign(
      {
        word: origin
      },
      this.getVowelMap(origin)
    );

    // Process only cyrillic words for now
    if (token.type == "WORD" && token.subType == "CYRIL" && !isCapitalized) {
      let parseVars = this.Az.Morph(origin);

      if (parseVars && parseVars.length) {
        if (quick) parseVars = [parseVars[0]];

        output = parseVars.map(parse => {
          return Object.assign({}, wordData, {
            wordNormal: parse.normalize().word,
            parse: parse,
            tag: parse.tag,
            part: parse.tag.POST,
            shortTag: this.getShortTag(parse) || origin || ""
          });
        });
      }
    }

    return output.length ? output : [wordData];
  }
}

module.exports = Parser;
