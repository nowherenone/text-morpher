const utils = require("./utils.js");
const fs = require("fs");
const Parser = require("./parser.js");
const Context = require("./context.js");

/**
 * http://pymorphy2.readthedocs.io/en/latest/user/grammemes.html
 *
 * Граммема	Значение	Примеры
 * NOUN	имя существительное	хомяк
 * ADJF	имя прилагательное (полное)	хороший
 * ADJS	имя прилагательное (краткое)	хорош
 * COMP	компаратив	лучше, получше, выше
 * VERB	глагол (личная форма)	говорю, говорит, говорил
 * INFN	глагол (инфинитив)	говорить, сказать
 * PRTF	причастие (полное)	прочитавший, прочитанная
 * PRTS	причастие (краткое)	прочитана
 * GRND	деепричастие	прочитав, рассказывая
 * NUMR	числительное	три, пятьдесят
 * ADVB	наречие	круто
 * NPRO	местоимение-существительное	он
 * PRED	предикатив	некогда
 * PREP	предлог	в
 * CONJ	союз	и
 * PRCL	частица	бы, же, лишь
 * INTJ	междометие	ой
 *
 * @class Dictionary
 */
class Dictionary {
  constructor(inputText) {
    this.speechParts = {};
    this.parser = new Parser();
    this.context = new Context();

    // Try to find file, if not - process as a text
    if (inputText && fs.existsSync(inputText)) {
      this.loadFile(inputText);
    } else {
      this.loadString(inputText);
    }

    this.generateRhythmLookup();
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

  generateRhythmLookup() {
    let l = this.parser.accentLookup;
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

  getStat() {
    Object.keys(this.speechParts).forEach(k => {
      console.log(`${k} - ${this.speechParts[k].length}`);
    });
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

  getContextWord(part, regexp = ".*", tags = [], matchOptions = {}) { }

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

    //console.log(tokens);
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

    tags = tags.map(v => {
      if (v == "gen2") return "datv";
      if (v == "loc2") return "datv";
      if (v == "acc2") return "nomn";
      return v;
    });

    //console.log(part, regexp, tags, matchOptions);

    if (matchOptions.contextSearch) {
      let origin = this.parser.parseWord(matchOptions.origin) || {
        wordNormal: matchOptions.origin,
        part: part
      };

      tokens = this.context.getSimilarWords(origin);
    } else {
      tokens = this.speechParts[part] || [];
    }

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
    // Get inflected list of words

    tokens = this.getInflectedTokens(tokens, tags);
    let part = (tokens[0] || {}).part;

    // Filter words by regexp
    tokens =
      (part == "NOUN" || part == "PRTF")
        ? this.filterNouns(tokens, regexp, tags)
        : tokens.filter(v => v.word.match(regexp));

    // Filter words by accent
    return this.filterByAccent(tokens, matchOptions);
  }

  /**
   *
   * @param {*} words
   */
  getInflectedTokens(tokens, tags) {
    return tokens.map(v => {
      // If this is noun - remove static tokens 
      if (v.part == "NOUN" || v.part == "PRTF") {
        tags = tags.filter(v => !~["masc", "femn", "neut"].indexOf(v));
      }

      let inf = tags && v.parse && v.parse.inflect(tags);
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
      tokens = tokens.filter(v => {
        let index = (matchOptions.accmap || []).findIndex(v => v);
        return v.vowels[index] == matchOptions.vowels[index];
      });
    } else {

      // Match syllables count 
      if (matchOptions.syllables) {
        tokens = tokens.filter(v => v.accmap.length == matchOptions.accmap.length);
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
