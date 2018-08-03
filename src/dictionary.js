const fs = require("fs");
const Parser = require("./parser.js");
const Context = require("./context.js");
const utils = require("./utils.js");
const path = require("path");
const baseDir = path.join(__dirname, "../");

/**
 *
 * @class Dictionary
 */
class Dictionary {
  constructor(config = {}) {
    this.speechParts = {};
    let name = config.dictionary;

    return new Promise(async (resolve, reject) => {
      await this.initDictionary(name);
      this.context = this.initContext(config);
      //this.generateRhythmLookup();
      resolve(this);
    });
  }

  async initDictionary(name, isFallback) {
    let dPath = `${baseDir}/dictionary/`;

    let wordsFile = utils.exists(`${dPath}${name}/words.json`);
    let accentFile = utils.exists(`${dPath}${name}/accents.json`);
    let stopFile = utils.exists(`${dPath}${name}/stopwords.json`);
    let packedFile = utils.exists(`${dPath}${name}/dictionary.gz`);

    // If there is no words file - load defaults
    if (!wordsFile && !packedFile) {
      if (name) console.log(`${name} dictionary files weren't found`);
      if (!isFallback) await this.initDictionary("default", true);
      else console.error("No dictionary found!");
      return;
    }

    console.log(`Loading ${name} dictionary`);

    // If dictionary is unpacked - unpack it
    if (!wordsFile && packedFile) {
      console.log(`Unpacking ${name} dictionary`);
      await utils.unpackZip(packedFile, `${dPath}${name}`);
      await this.initDictionary(name, true);
      return;
    }

    // Stopwords file fallback
    if (!stopFile) stopFile = utils.exists(`${dPath}/default/stopwords.json`);
    // Load stopwords
    try {
      this.stopWords = JSON.parse(utils.getFile(stopFile));
    } catch (e) {
      this.stopWords = [];
    }

    // Accent file fallback
    if (!accentFile) accentFile = utils.exists(`${dPath}/default/accents.json`);
    // Load accent lookups
    try {
      this.accentLookup = JSON.parse(utils.getFile(accentFile));
    } catch (e) {
      this.accentLookup = {};
    }

    // Init Parser
    this.parser = new Parser({
      accentLookup: this.accentLookup,
      stopWords: this.stopWords
    });

    // Load wordset
    if (wordsFile) this.loadFile(wordsFile);
  }

  /**
   *
   * @param {*} name
   */
  initContext(config) {
    let dPath = `${baseDir}/dictionary/`;
    let modelFile = utils.exists(`${dPath}${config.name}/context.bin`);

    // Load context
    if (!modelFile) {
      modelFile = utils.exists(`${dPath}/default/context.bin`);
    }

    return new Context({ modelFile, contextSearch: config.contextSearch });
  }

  /**
   * Populate dictionary from file
   *
   * @param {*} dictFile
   * @returns
   * @memberof Dictionary
   */
  loadFile(dictFile) {
    let fileContent = "",
      words = [];

    // Try to open file
    try {
      fileContent = utils.getFile(dictFile);
    } catch (e) {
      console.error(`Cannot load ${dictFile} file to dictionary`);
    }

    try {
      words = JSON.parse(fileContent);
    } catch (e) {
      words = fileContent;
    }

    this.loadString(words || "");
  }

  /**
   *
   */
  generateRhythmLookup() {
    let l = this.accentLookup;
    this.accentReverse = {};

    Object.keys(l).forEach(key => {
      let v = l[key];
      if (!this.accentReverse[v]) this.accentReverse[v] = [key];
      else this.accentReverse[v].push(key);
    });
  }

  /**
   *
   *
   * @param {*} str
   * @memberof Dictionary
   */
  loadString(str) {
    let tokens = this.parser.parseText(str);
    this.sortTokens(tokens);
  }

  /**
   * Sort tokens by speech parts and add them into dictionary
   *
   * @param {*} tokens
   * @memberof Dictionary
   */
  sortTokens(tokens) {
    let lookup = {};

    tokens.forEach(token => {
      let part = token.part;

      if (!this.speechParts[part]) this.speechParts[part] = [];

      if (token.word.length > 1 && !lookup[token.word]) {
        this.speechParts[part].push(token);
        lookup[token.word] = 1;
      }
    });
  }

  /**
   *
   * @param {*} part
   * @param {*} regexp
   * @param {*} tags
   * @param {*} matchOptions
   */
  getWord(...params) {
    let tokens = this.getWords(...params);
    let word = utils.getRandomItem(tokens) || {};

    return word.word || "";
  }

  /**
   *
   * @param {*} part
   * @param {*} regexp
   * @param {*} tags
   * @param {*} matchOptions
   */
  getWords(part, regexp = ".*", tags = [], matchOptions = {}) {
    let tokens = [];

    // Get a set of possibly matching words
    if (matchOptions.contextSearch) {
      let origin = this.parser.parseWord(matchOptions.origin) || {
        wordNormal: matchOptions.origin,
        part: part
      };

      tokens = this.context.getSimilarWords(origin, {
        extractPart: part,
        treshHold: matchOptions.treshHold
      });
    } else {
      tokens = this.speechParts[part] || [];
    }

    // Try to inflect them
    tokens = this.getInflectedTokens(tokens, tags);

    // Get inflected list of words
    return this.filterTokens(tokens, regexp, tags, matchOptions) || [];
  }

  /**
   *
   * @param {*} tokens
   * @param {*} regexp
   * @param {*} tags
   * @param {*} matchOptions
   */
  filterTokens(tokens, regexp, tags, matchOptions) {
    let part = (tokens[0] || {}).part;

    // Filter words by normal form
    if (matchOptions.matchNormal) {
      tokens = tokens.filter(v => {
        if (!v) return false;
        return v.wordNormal == matchOptions.matchNormal;
      });
    }

    // Filter words by tagset
    tokens = tokens.filter(v => {
      if (!v || !v.tag || !tags.length) return true;
      let tokenTags = v.tag.stat.slice(1, 100).concat(v.tag.flex);
      return tags.every(tag => ~tokenTags.indexOf(tag));
    });

    // Filter words by regexp
    tokens =
      part == "NOUN" || part == "PRTF"
        ? this.filterNouns(tokens, regexp, tags)
        : tokens.filter(
            v =>
              v &&
              v.word.match(regexp) &&
              !~this.stopWords.indexOf(v.wordNormal)
          );

    // Filter words by accent
    return this.filterByAccent(tokens, matchOptions);
  }

  /**
   *
   * @param {*} words
   */
  getInflectedTokens(tokens, tags) {
    return tokens.map(v => {
      let infTags = tags;

      // If this is noun - remove static tokens
      if (v.part == "NOUN" || v.part == "PRTF") {
        infTags = tags.filter(v => !~["masc", "femn", "neut"].indexOf(v));
      }

      // Inflect
      let inf = infTags && v.parse && v.parse.inflect(infTags);

      return inf ? this.parser.parseWord(inf.word) : v;
    });
  }

  /**
   *
   * @param {*} tokens
   * @param {*} matchOptions
   */
  filterByAccent(tokens, matchOptions) {
    // Match only accent letters
    if (matchOptions.accentLetter) {
      let index = (matchOptions.accmap || []).indexOf("1");
      if (index > -1) {
        tokens = tokens.filter(v => {
          return v.vowels[index] == matchOptions.vowels[index];
        });
      }
    }

    // Match syllables count
    if (matchOptions.syllables) {
      tokens = tokens.filter(
        v => v.accmap.length == matchOptions.accmap.length
      );
    }

    // Accent map filter
    if (matchOptions.accent) {
      tokens = tokens.filter(v => v.accmap == matchOptions.accmap);
    }

    // Vowels map filter
    if (matchOptions.vowels) {
      tokens = tokens.filter(v => {
        return v.vowels == matchOptions.vowelmap;
      });
    }

    return tokens;
  }

  /**
   *
   * @param {*} regexp
   * @param {*} tags
   */
  filterNouns(tokens = [], regexp = ".*", tags = []) {
    let statTags = this.extractStatTags(tags, ["masc", "femn", "neut"]);

    return tokens.filter(v => {
      if (v && v.parse && v.word.match(regexp)) {
        if (statTags) {
          return (
            statTags.filter(s => ~v.tag.stat.slice().indexOf(s)).length ==
            statTags.length
          );
        }

        return true;
      }
    });
  }

  /**
   * Extract static tags from array
   * @param {*} tags
   * @param {*} statTags
   */
  extractStatTags(tags = [], statTags = []) {
    return tags.filter(v => ~statTags.indexOf(v));
  }
}

/*
  // наречие  (как?)
  getAdverb(regexp = ".*", tags) {
    return this.getWord("ADVB", regexp, tags);
  }

  // глагол (инфинитив)
  getVerb(regexp = ".*", tags) {
    return this.getWord("VERB", regexp, tags);
  }

  // Прилигательное
  getAdjective(regexp = ".*", tags) {
    return this.getWord("ADJF", regexp, tags);
  }
  */

module.exports = Dictionary;
