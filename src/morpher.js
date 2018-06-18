const utils = require("./utils.js");
const Dictionary = require("./dictionary.js");
const Parser = require("./parser.js");
const Progress = require("cli-progress").Bar;
const procStats = require("process-stats");
const Az = require("az");

class Morpher {
  constructor(config) {
    return this.init(config);
  }

  /**
   *
   * @param {*} config
   */
  init(config) {
    return new Promise(async resolve => {
      Az.Morph.init(() => {
        global.Az = Az;

        new Dictionary(config).then(d => {
          this.dictionary = d;
          this.parser = this.dictionary.parser;
          this.showStat();
          resolve(this);
        });
      });
    });
  }

  /**
   *
   *
   * @memberof Morpher
   */
  showStat() {
    let wordCount = 0;
    let d = this.dictionary.speechParts;
    let pstat = procStats({ pretty: true });
    Object.keys(d).forEach(k => (wordCount += d[k].length));

    console.log(`Words in dictionary - ${wordCount}`);
    console.log(`Memory used - ${pstat.memUsed.pretty}`);
    console.log(``);
  }

  analyzeWord(word) {
    let token = this.parser.parseWord(word);
    token.parse = false;
    token.tag = false;
    return token;
  }

  /**
   *
   *
   *
   * @param {*} inputStr
   * @memberof Morpher
   */
  createTemplate(inputStr) {
    return this.parser
      .parseText(inputStr)
      .map(t => t.shortTag || t.word)
      .join("");
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
    let output = [],
      stats = [];
    let tokenLookup = {};
    let normalLookup = {};
    let minProgress = 20;
    let startTime = new Date();
    let replaces = 0;

    let bar = new Progress({
      barsize: 10,
      format:
        "Processing: [{bar}] {percentage}% | {speed} words/s | {replaces} replaces | {value}/{total}"
    });

    if (steps.length > minProgress) bar.start(steps.length, 0);

    steps.forEach((v, i) => {
      let tagText = (v.match("{{.*}}") || []).shift();

      if (tagText) {
        let tag = this.splitTag(tagText);

        // If we have a normal match
        matchOptions.matchNormal = false;
        if (tag.origin && normalLookup[tag.origin]) {
          matchOptions.matchNormal = normalLookup[tag.origin];
        }

        let tagData =
          tokenLookup[tagText] || this.processTag(tag, matchOptions);

        // Cache processed tags
        if (!tokenLookup[tagText]) tokenLookup[tagText] = tagData;

        // Cache processed normal matches
        if (tag.origin && !normalLookup[tag.origin]) {
          normalLookup[tag.origin] = tagData.wordNormal;
        }

        if (tag.origin != tagData.result) replaces++;

        output.push(v.replace(/{{.*}}/, tagData.result));
      } else {
        output.push(v);
      }

      // Update progressbar
      if (steps.length > minProgress)
        bar.update(i, {
          speed: Math.floor(i / ((new Date() - startTime) / 1000)),
          replaces
        });

      stats.push(tokenLookup[tagText] || { word: v });
    });

    if (steps.length > minProgress) bar.stop();

    return { text: output.join(" "), stats: stats };
  }

  /**
   *
   * @param {*} text
   * @param {*} tpl
   */
  formatStats(text, tpl) {
    let stat = { avgMatch: 0, matchContext: 0, replaced: 0 };
    text.stats.forEach(s => {
      if (s.tag) stat.replaced++;
      if (s.foundContext) stat.matchContext++;
      if (s.matches) stat.avgMatch += s.matches.length;
    });

    stat.replaced = (stat.replaced / text.stats.length) * 100 + "%";
    stat.avgMatch = (stat.avgMatch / stat.replaced) * 100 + "%";
    stat.matchContext = (stat.matchContext / stat.replaced) * 100 + "%";
    stat.totalWords = text.stats.length;

    return stat;
  }

  /**
   *
   * @param {*} tag
   */
  splitTag(tag = "") {
    let chunks = tag
      .replace("{{", "")
      .replace("}}", "")
      .split("/");

    return {
      pos: chunks[0], // Part of speech
      regExp: chunks[1], // Regexp to match
      tags: chunks[2] ? (chunks[2] = chunks[2].split(",")) : [], // Tags - third part of the token
      origin: chunks[3] || "", // Initial word to replace
      text: tag // initial text
    };
  }

  /**
   *
   *
   * @param {*} tag
   * @param {*} [matchOptions={}]
   * @returns {Object}
   * @memberof Morpher
   */
  processTag(tag, matchOptions = {}) {
    let partsFilter = matchOptions.parts;

    // Prepare out
    let result = {
      matches: [],
      tag,
      tagText: tag.text,
      origin: tag.origin
    };

    // If matchOptions have filter by parts - apply it
    if (partsFilter && !~partsFilter.indexOf(tag.pos)) {
      result.result = tag.origin;
      return result;
    }

    // Get search options
    let searchOptions = this.getSearchOptions(tag, matchOptions);

    // Try to find a match
    let tokens = this.dictionary.getWords(
      tag.pos,
      searchOptions.regExp,
      tag.tags,
      searchOptions
    );

    result.foundContext = false;

    // If we didn't find context matches try
    if (searchOptions.contextSearch) {
      if (tokens.length) {
        result.foundContext = true;
      } else if (searchOptions.contextSearch != "strict") {
        searchOptions.contextSearch = false;
        tokens = this.dictionary.getWords(
          tag.pos,
          searchOptions.regExp,
          tag.tags,
          searchOptions
        );
      }
    }

    let word = utils.getRandomItem(tokens);
    result.matches = (tokens.map(t => t.word) || []).slice(0, 20);
    result.wordNormal = word ? word.wordNormal : tag.origin || "";
    result.result = word ? word.word : tag.origin || "";

    return result;
  }

  /**
   *
   * @param {*} origin
   * @param {*} matchOptions
   */
  getSearchOptions(tag, matchOptions) {
    // Regexp - second part of token
    let regExp = matchOptions.length ? `.{${origin.length - 1}}` : tag.regExp;
    let firstL = tag.origin.toLowerCase();
    let lastL = tag.origin[tag.origin.length - 1].toLowerCase();

    if (matchOptions.first) regExp = `^${firstL}` + regExp;
    if (matchOptions.last) regExp = regExp + `${lastL}$`;

    // If we have a user-defined regexp - use it
    if (matchOptions.regexp) regExp = matchOptions.regexp;

    let searchOptions = Object.assign(
      { origin: tag.origin, regExp: regExp },
      matchOptions
    );

    // Options to search a word
    if (
      tag.origin &&
      (matchOptions.vowels ||
        matchOptions.syllables ||
        matchOptions.accent ||
        matchOptions.accentLetter)
    ) {
      let o = this.parser.parseWord(tag.origin) || {};

      Object.assign(searchOptions, {
        vowelmap: o.vowels || "",
        accmap: o.accmap || "",
        origin: tag.origin,
        originNormal: o.wordNormal || tag.origin || "",
        accentLetter: matchOptions.accentLetter
      });
    }

    return searchOptions;
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
