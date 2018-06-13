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

    let skipGrams = [
      /*
      "tran",
      "indc",
      "anim",
      "perf",
      "inan",
      "indc",
      "Apro",
      "impf"
      */
    ];

    let tokens = (
      this.parser.parseText(inputStr, { withSpaces: true }) || []
    ).map(t => {

      if (~["PRED", "PRCL", "PREP", "NPRO"].indexOf(t.part) || !t.tag || t.tag.isCapitalized() || t.word.length < 4) {
        return t.word;
      } else {
        let POST = t.tag.POST;

        let tags = t.tag.stat
          .slice(1, 100)
          .concat(t.tag.flex)
          .filter(t => !~skipGrams.indexOf(t));

        return `{{${POST}/.*/${tags.join(",")}/${t.word}}}`;
      }
    });

    return tokens.join("");
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
    let output = [];
    let tokenLookup = {};

    steps.forEach(v => {
      let tag = (v.match("{{.*}}") || []).shift();

      if (tag) {
        tokenLookup[tag] =
          tokenLookup[tag] || this.processTag(tag, matchOptions);
        output.push(v.replace(/{{.*}}/, tokenLookup[tag]));
      } else {
        output.push(v);
      }
    });

    return output.join(" ");
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
    let chunks = tag
      .replace("{{", "")
      .replace("}}", "")
      .split("/");

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
      let word = this.parser.parseWord(origin);
      Object.assign(searchOptions, {
        vowelmap: word.vowels,
        accmap: word.accmap,
        origin: origin,
        accentLetter: matchOptions.accentLetter
      });
    }

    // Part of speech
    let pos = chunks[0];
    let word = this.dictionary.getWord(
      pos,
      regExp,
      tags,
      searchOptions
    );

    // If we didn't find context matches
    if (!word && searchOptions.contextSearch) {
      searchOptions.contextSearch = false;
      word = this.dictionary.getWord(pos, regExp, tags, searchOptions);
    }

    return word ? word : origin || "";
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

  /*
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
  }*/
}

module.exports = Morpher;
