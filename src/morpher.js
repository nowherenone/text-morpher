const utils = require("./utils.js");
const Dictionary = require("./dictionary.js");
const Parser = require("./parser.js");

class Morpher {
  constructor(config) {
    this.dictionary = new Dictionary(config.dictFile);
    this.parser = new Parser({ withSpaces: true });

    if (config.inputFile) {
      this.dictionary.loadFile(config.inputFile);
    }
  }

  /**
   *
   *
   * options - matchVowels, matchAccent, matchFirst, matchLast
   * @param {*} inputStr
   * @memberof Morpher
   */
  createTemplate(inputStr, options) {
    return this.parser.parseText(inputStr).map(t => t.shortTag || t.word).join("");
  }

  /**
   *  Template syntax - {NOUN/^п./мр}
   *  {[PART]/[Regexp]/[tags]/[original]}
   *
   * @param {*} template
   * @memberof Morpher
   */
  runTemplate(template, matchOptions = {}) {
    let steps = template.split(" ");
    let output = [], stats = [];
    let tokenLookup = {};

    steps.forEach(v => {
      let tag = (v.match("{{.*}}") || []).shift();

      if (tag) {
        tokenLookup[tag] =
          tokenLookup[tag] || this.processTag(tag, matchOptions);
        output.push(v.replace(/{{.*}}/, tokenLookup[tag].result));
      } else {
        output.push(v);
      }

      stats.push(tokenLookup[tag] || { word: v })
    });

    return { text: output.join(" "), stats: stats };
  }

  /**
   *
   *
   * @param {*} tag
   * @param {*} [matchOptions={}]
   * @returns
   * @memberof Morpher
   */
  processTag(tag, matchOptions = {}) {
    let output = {};

    let chunks = tag
      .replace("{{", "")
      .replace("}}", "")
      .split("/");

    // Part of speech
    let pos = chunks[0];

    // Original word - third part of token
    let origin = chunks[3] || "";

    // Tags - third part of the token
    let tags = chunks[2] ? (chunks[2] = chunks[2].split(",")) : [];

    // Regexp - second part of token
    let regExp = matchOptions.length ? `.{${origin.length - 1}}` : chunks[1];
    let firstL = origin[0].toLowerCase();
    let lastL = origin[origin.length - 1].toLowerCase();

    if (matchOptions.first) regExp = `^${firstL}` + regExp;
    if (matchOptions.last) regExp = regExp + `${lastL}$`;

    let searchOptions = Object.assign({ origin: origin }, matchOptions);

    // Options to search a word
    if (
      origin &&
      (matchOptions.vowels || matchOptions.syllables || matchOptions.accent || matchOptions.accentLetter)
    ) {
      let o = this.parser.parseWord(origin);
      Object.assign(searchOptions, {
        vowelmap: o.vowels,
        accmap: o.accmap,
        origin: origin,
        accentLetter: matchOptions.accentLetter
      });
    }

    // Try to find a match 
    let tokens = this.dictionary.getWords(
      pos,
      regExp,
      tags,
      searchOptions
    );

    output.foundContext = false;

    // If we didn't find context matches try
    if (searchOptions.contextSearch && searchOptions.contextSearch != "strict") {
      if (tokens.length) {
        output.foundContext = true;
      } else {
        searchOptions.contextSearch = false;
        tokens = this.dictionary.getWords(pos, regExp, tags, searchOptions);
      }
    }

    let word = utils.getRandomItem(tokens);

    output.matches = (tokens.map(t => t.word) || []).slice(0, 20);
    output.result = word ? word.word : origin || "";
    output.tag = tag;
    output.origin = origin;

    return output;
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
    let nounToken = this.parser.parseWord(noun || []);
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


}

module.exports = Morpher;
