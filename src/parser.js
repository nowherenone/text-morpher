const utils = require("./utils.js");
let accentLookup;

class Parser {
  constructor(options = {}) {
    this.Az = global.Az;
    this.tokens = [];
    this.options = options;
    this.text = "";

    this.loadAccents();
    this.accentLookup = accentLookup;
  }

  loadAccents() {
    if (accentLookup) return;
    accentLookup = JSON.parse(utils.getFile("./data/accentLookup.json"));
  }




  /**
   *
   *
   * @param {string} [word=""]
   * @memberof Parser
   */
  getVowelMap(word = "") {
    let parts = word.match(/[бвгджзйклмнпрстфхцчшщьъ]*?[аеёиоуыэюя]/gi) || [];

    return {
      vowels: parts.map(p => p.match(/[аеёиоуыэюя]{1,3}/gi)).join("-"),
      accmap:
        this.accentLookup[word] || new Array(parts.length).fill(0).join("")
    };
  }


  getShortTag(token) {
    let skipParts = ["PRED", "PRCL", "PREP", "NPRO", "GRND", "ADVB"];
    let skipTags = ["inan", "anim"];

    if (!token.tag
      || !token.word
      || token.tag.isCapitalized()
      || ~skipParts.indexOf(token.tag.POST)
      || token.word.length < 4) {
      return false;
    } else {
      let POST = token.tag.POST;
      let tags = token.tag.stat.slice(1, 100).concat(token.tag.flex) || [];

      tags = tags.filter(t => !~skipTags.indexOf(t) && !/^[A-Z]/.test(t));

      return `{{${POST}/.*/${tags.join(",")}/${token.word}}}`;
    }
  }


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
        let word = {
          word: token.source.substr(token.st, token.length)
        };

        word = Object.assign(word, this.getVowelMap(word.word));

        if (token.type == "WORD" && token.subType == "CYRIL") {
          let parse = this.Az.Morph(word.word).shift();

          if (parse) {
            Object.assign(
              word,
              {
                wordNormal: parse.normalize().word,
                parse: parse,
                tag: parse.tag,
                part: parse.tag.POST,
                shortTag: this.getShortTag(parse) || word.word || ""
              },
              this.getVowelMap(word.word)
            );
          }
        }

        return word;
      });

    return (this.options.withSpaces
      ? tokens
      : tokens.filter(token => token.word.trim())) || [];
  }
}

module.exports = Parser;
