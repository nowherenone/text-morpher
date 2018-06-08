const utils = require("./utils.js");
const ProgressBar = require("progress");

class Parser {
  constructor(words) {
    this.Az = global.Az;
    this.tokens = [];
    this.text = "";

    this.text = Array.isArray(words) ? words.join(" ") : words;

    if (typeof this.text == "string") {
      this.tokens = this.getGrammaticMap(this.text);
    }

    return this.tokens || [];
  }

  getGrammaticMap(text) {
    let tokens = this.Az.Tokens(text).done();

    let bar = new ProgressBar("  parsing [:bar] :percent", {
      complete: "=",
      incomplete: " ",
      width: 20,
      total: tokens.length
    });

    return tokens
      .map(token => {
        bar.tick();

        let word = {
          word: token.source.substr(token.st, token.length)
        };

        if (token.type == "WORD" && token.subType == "CYRIL") {
          let parse = this.Az.Morph(word.word).shift();

          if (parse) {
            Object.assign(word, {
              wordNormal: parse.normalize().word,
              parse: parse,
              tag: parse.tag,
              part: parse.tag.POST
            });
          }
        }

        return word;
      })
      .filter(token => token.word.trim());
  }
}

module.exports = Parser;
