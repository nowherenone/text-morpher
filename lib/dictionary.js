"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _parser = require("./parser.js");

var _parser2 = _interopRequireDefault(_parser);

var _context3 = require("./context.js");

var _context4 = _interopRequireDefault(_context3);

var _utils = require("./utils.js");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
const Parser = require("./parser.js");
const Context = require("./context.js");
const utils = require("./utils.js");
const path = require("path");
*/

var baseDir = _path2.default.join(__dirname, "../");

/**
 *
 * @class Dictionary
 */

var Dictionary = function () {
  function Dictionary() {
    var _this = this;

    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Dictionary);

    this.speechParts = {};
    var name = config.dictionary;

    return new Promise(function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve, reject) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _this.initDictionary(name);

              case 2:
                _this.context = _this.initContext(config);
                //this.generateRhythmLookup();
                resolve(_this);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));

      return function (_x2, _x3) {
        return _ref.apply(this, arguments);
      };
    }());
  }

  (0, _createClass3.default)(Dictionary, [{
    key: "initDictionary",
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(name, isFallback) {
        var dPath, wordsFile, accentFile, stopFile, packedFile;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                dPath = baseDir + "/dictionary/";
                wordsFile = _utils2.default.exists("" + dPath + name + "/words.json");
                accentFile = _utils2.default.exists("" + dPath + name + "/accents.json");
                stopFile = _utils2.default.exists("" + dPath + name + "/stopwords.json");
                packedFile = _utils2.default.exists("" + dPath + name + "/dictionary.gz");

                // If there is no words file - load defaults

                if (!(!wordsFile && !packedFile)) {
                  _context2.next = 14;
                  break;
                }

                if (name) console.log(name + " dictionary files weren't found");

                if (isFallback) {
                  _context2.next = 12;
                  break;
                }

                _context2.next = 10;
                return this.initDictionary("default", true);

              case 10:
                _context2.next = 13;
                break;

              case 12:
                console.error("No dictionary found!");

              case 13:
                return _context2.abrupt("return");

              case 14:

                console.log("Loading " + name + " dictionary");

                // If dictionary is unpacked - unpack it

                if (!(!wordsFile && packedFile)) {
                  _context2.next = 22;
                  break;
                }

                console.log("Unpacking " + name + " dictionary");
                _context2.next = 19;
                return _utils2.default.unpackZip(packedFile, "" + dPath + name);

              case 19:
                _context2.next = 21;
                return this.initDictionary(name, true);

              case 21:
                return _context2.abrupt("return");

              case 22:

                // Stopwords file fallback
                if (!stopFile) stopFile = _utils2.default.exists(dPath + "/default/stopwords.json");
                // Load stopwords
                try {
                  this.stopWords = JSON.parse(_utils2.default.getFile(stopFile));
                } catch (e) {
                  this.stopWords = [];
                }

                // Accent file fallback
                if (!accentFile) accentFile = _utils2.default.exists(dPath + "/default/accents.json");
                // Load accent lookups
                try {
                  this.accentLookup = JSON.parse(_utils2.default.getFile(accentFile));
                } catch (e) {
                  this.accentLookup = {};
                }

                // Init Parser
                this.parser = new _parser2.default({
                  accentLookup: this.accentLookup,
                  stopWords: this.stopWords
                });

                // Load wordset
                if (wordsFile) this.loadFile(wordsFile);

              case 28:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function initDictionary(_x4, _x5) {
        return _ref2.apply(this, arguments);
      }

      return initDictionary;
    }()

    /**
     *
     * @param {*} name
     */

  }, {
    key: "initContext",
    value: function initContext(config) {
      var dPath = baseDir + "/dictionary/";
      var modelFile = _utils2.default.exists("" + dPath + config.name + "/context.bin");

      // Load context
      if (!modelFile) {
        modelFile = _utils2.default.exists(dPath + "/default/context.bin");
      }

      return new _context4.default({ modelFile: modelFile, contextSearch: config.contextSearch });
    }

    /**
     * Populate dictionary from file
     *
     * @param {*} dictFile
     * @returns
     * @memberof Dictionary
     */

  }, {
    key: "loadFile",
    value: function loadFile(dictFile) {
      var fileContent = "",
          words = [];

      // Try to open file
      try {
        fileContent = _utils2.default.getFile(dictFile);
      } catch (e) {
        console.error("Cannot load " + dictFile + " file to dictionary");
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

  }, {
    key: "generateRhythmLookup",
    value: function generateRhythmLookup() {
      var _this2 = this;

      var l = this.accentLookup;
      this.accentReverse = {};

      Object.keys(l).forEach(function (key) {
        var v = l[key];
        if (!_this2.accentReverse[v]) _this2.accentReverse[v] = [key];else _this2.accentReverse[v].push(key);
      });
    }

    /**
     *
     *
     * @param {*} str
     * @memberof Dictionary
     */

  }, {
    key: "loadString",
    value: function loadString(str) {
      var tokens = this.parser.parseText(str);
      this.sortTokens(tokens);
    }

    /**
     * Sort tokens by speech parts and add them into dictionary
     *
     * @param {*} tokens
     * @memberof Dictionary
     */

  }, {
    key: "sortTokens",
    value: function sortTokens(tokens) {
      var _this3 = this;

      var lookup = {};

      tokens.forEach(function (token) {
        var part = token.part;

        if (!_this3.speechParts[part]) _this3.speechParts[part] = [];

        if (token.word.length > 1 && !lookup[token.word]) {
          _this3.speechParts[part].push(token);
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

  }, {
    key: "getWord",
    value: function getWord() {
      var tokens = this.getWords.apply(this, arguments);
      var word = _utils2.default.getRandomItem(tokens) || {};

      return word.word || "";
    }

    /**
     *
     * @param {*} part
     * @param {*} regexp
     * @param {*} tags
     * @param {*} matchOptions
     */

  }, {
    key: "getWords",
    value: function getWords(part) {
      var regexp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ".*";
      var tags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var matchOptions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      var tokens = [];

      // Get a set of possibly matching words
      if (matchOptions.contextSearch) {
        var origin = this.parser.parseWord(matchOptions.origin) || {
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

  }, {
    key: "filterTokens",
    value: function filterTokens(tokens, regexp, tags, matchOptions) {
      var _this4 = this;

      var part = (tokens[0] || {}).part;

      // Filter words by normal form
      if (matchOptions.matchNormal) {
        tokens = tokens.filter(function (v) {
          if (!v) return false;
          return v.wordNormal == matchOptions.matchNormal;
        });
      }

      // Filter words by tagset
      tokens = tokens.filter(function (v) {
        if (!v || !v.tag || !tags.length) return true;
        var tokenTags = v.tag.stat.slice(1, 100).concat(v.tag.flex);
        return tags.every(function (tag) {
          return ~tokenTags.indexOf(tag);
        });
      });

      // Filter words by regexp
      tokens = part == "NOUN" || part == "PRTF" ? this.filterNouns(tokens, regexp, tags) : tokens.filter(function (v) {
        return v && v.word.match(regexp) && !~_this4.stopWords.indexOf(v.wordNormal);
      });

      // Filter words by accent
      return this.filterByAccent(tokens, matchOptions);
    }

    /**
     *
     * @param {*} words
     */

  }, {
    key: "getInflectedTokens",
    value: function getInflectedTokens(tokens, tags) {
      var _this5 = this;

      return tokens.map(function (v) {
        var infTags = tags;

        // If this is noun - remove static tokens
        if (v.part == "NOUN" || v.part == "PRTF") {
          infTags = tags.filter(function (v) {
            return !~["masc", "femn", "neut"].indexOf(v);
          });
        }

        // Inflect
        var inf = infTags && v.parse && v.parse.inflect(infTags);

        return inf ? _this5.parser.parseWord(inf.word) : v;
      });
    }

    /**
     *
     * @param {*} tokens
     * @param {*} matchOptions
     */

  }, {
    key: "filterByAccent",
    value: function filterByAccent(tokens, matchOptions) {
      // Match only accent letters
      if (matchOptions.accentLetter) {
        var index = (matchOptions.accmap || []).indexOf("1");
        if (index > -1) {
          tokens = tokens.filter(function (v) {
            return v.vowels[index] == matchOptions.vowels[index];
          });
        }
      }

      // Match syllables count
      if (matchOptions.syllables) {
        tokens = tokens.filter(function (v) {
          return v.accmap.length == matchOptions.accmap.length;
        });
      }

      // Accent map filter
      if (matchOptions.accent) {
        tokens = tokens.filter(function (v) {
          return v.accmap == matchOptions.accmap;
        });
      }

      // Vowels map filter
      if (matchOptions.vowels) {
        tokens = tokens.filter(function (v) {
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

  }, {
    key: "filterNouns",
    value: function filterNouns() {
      var tokens = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var regexp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ".*";
      var tags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      var statTags = this.extractStatTags(tags, ["masc", "femn", "neut"]);

      return tokens.filter(function (v) {
        if (v && v.parse && v.word.match(regexp)) {
          if (statTags) {
            return statTags.filter(function (s) {
              return ~v.tag.stat.slice().indexOf(s);
            }).length == statTags.length;
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

  }, {
    key: "extractStatTags",
    value: function extractStatTags() {
      var tags = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var statTags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      return tags.filter(function (v) {
        return ~statTags.indexOf(v);
      });
    }
  }]);
  return Dictionary;
}();

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


exports.default = Dictionary;