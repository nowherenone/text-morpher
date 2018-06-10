const utils = require("./utils.js");
const Parser = require("./parser.js");
const fs = require("fs");

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
    this.lookup = {};
    this.parser = new Parser();

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

    utils.dumpFile(this.accentReverse, "./rum.json");
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
    tokens.forEach(token => {
      let part = token.part;

      if (!this.speechParts[part]) this.speechParts[part] = [];

      if (token.word.length > 1 && !this.lookup[token.word]) {
        this.speechParts[part].push(token);
        this.lookup[token.word] = 1;
      }
    });
  }

  getWordVerbose(part, regexp = ".*", tags, matchOptions = {}) {
    let regExp = "";

    let words = (this.speechParts[part] || []).map(v => {
      if (part == "NOUN") {
        tags = (tags || []).filter(v => !~["masc", "femn", "neut"].indexOf(v));
      }

      let inf = tags && v.parse && v.parse.inflect(tags);

      return inf ? this.parser.parseWord(inf.word) : v;
    });

    /// Match regexp
    words = words.filter(v => v.word.match(regexp));

    // Match only accent letters
    if (matchOptions.accentLetter) {
      words = words.filter(v => {
        let index = (matchOptions.accmap || []).findIndex(v => v);
        return v.vowels[index] == matchOptions.vowels[index];
      });
    } else {
      // Vowels filter
      if (matchOptions.vowels) {
        words = words.filter(v => {
          return v.vowels == matchOptions.vowels;
        });
      }

      // Accent filter
      if (matchOptions.accmap) {
        words = words.filter(v => v.accmap == matchOptions.accmap);
      }
    }

    let word = utils.getRandomItem(words) || {};
    return word.word || "";
  }

  // Получить любую часть речи
  getWord(part, regexp = ".*", tags) {
    let words = [];
    if (part == "NOUN") {
      words = this.getNouns(regexp, tags);
    } else {
      words = (this.speechParts[part] || []).filter(v => {
        if (v.word.match(regexp)) {
          return true;
        }
      });
    }

    //console.log(words);

    let word = utils.getRandomItem(words) || {};
    if (word.parse && tags) word = word.parse.inflect(tags) || word;

    return word.word || "";
  }

  // Получить любую часть речи
  getWords(part, regexp = ".*", tags) {
    let words = (this.speechParts[part] || []).filter(v => {
      if (v.wordNormal.match(regexp)) {
        return true;
      }
    });

    if (tags) {
      words = words.map(w => {
        return w.parse.inflect(tags) || w;
      });
    }

    return words || [];
  }

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

  // Существительное
  getNouns(regexp = ".*", tags = []) {
    let statTags = this.extractStatTags(tags, ["masc", "femn", "neut"]);

    let words = (this.speechParts["NOUN"] || []).filter(v => {
      if (v.wordNormal.match(regexp)) {
        if (statTags) {
          return (
            statTags.filter(s => ~v.tag.stat.slice().indexOf(s)).length ==
            statTags.length
          );
        }

        return true;
      }
    });

    return words;
  }

  extractStatTags(tags = [], statTags = []) {
    return (tags || []).filter(v => ~statTags.indexOf(v));
  }
}

module.exports = Dictionary;
