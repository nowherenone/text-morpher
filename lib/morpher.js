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

var _cliProgress = require("cli-progress");

var _processStats = require("process-stats");

var _processStats2 = _interopRequireDefault(_processStats);

var _az = require("az");

var _az2 = _interopRequireDefault(_az);

var _dictionary = require("./dictionary.js");

var _dictionary2 = _interopRequireDefault(_dictionary);

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 *
 * @class Morpher
 */
var Morpher = function () {
  function Morpher(config) {
    (0, _classCallCheck3.default)(this, Morpher);

    if (config) {
      return this.init(config);
    }
  }

  /**
   *
   * @param {*} config
   */


  (0, _createClass3.default)(Morpher, [{
    key: "init",
    value: function init(config) {
      var _this = this;

      return new Promise(function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve) {
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _az2.default.Morph.init(function () {
                    global.Az = _az2.default;

                    new _dictionary2.default(config).then(function (d) {
                      _this.dictionary = d;
                      _this.parser = _this.dictionary.parser;
                      _this.showStat();
                      resolve(_this);
                    });
                  });

                case 1:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, _this);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    }

    /**
     *
     *
     * @memberof Morpher
     */

  }, {
    key: "showStat",
    value: function showStat() {
      var wordCount = 0;
      var d = this.dictionary.speechParts;
      var pstat = (0, _processStats2.default)({ pretty: true });
      Object.keys(d).forEach(function (k) {
        return wordCount += d[k].length;
      });

      console.log("Words in dictionary - " + wordCount);
      console.log("Memory used - " + pstat.memUsed.pretty);
      console.log("");
    }

    /**
     *
     * @param {*} word
     */

  }, {
    key: "analyzeWord",
    value: function analyzeWord(word) {
      return this.parser.parseWord(word, true);
    }

    /**
     *
     *
     *
     * @param {*} inputStr
     * @memberof Morpher
     */

  }, {
    key: "createTemplate",
    value: function createTemplate(inputStr) {
      return this.parser.parseText(inputStr).map(function (t) {
        return t.shortTag || t.word;
      }).join("");
    }

    /**
     *  Template syntax - {NOUN/^п./мр}
     *  {[PART]/[Regexp]/[tags]/[original]}
     *
     * @param {*} template
     * @memberof Morpher
     */

  }, {
    key: "runTemplate",
    value: function runTemplate(template) {
      var _this2 = this;

      var matchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var steps = template.split(" ");
      var output = [],
          stats = [];
      var tokenLookup = {};
      var normalLookup = {};
      var minProgress = 20;
      var startTime = new Date();
      var replaces = 0;

      var bar = new _cliProgress.Bar({
        barsize: 10,
        format: "Processing: [{bar}] {percentage}% | {speed} words/s | {replaces} replaces | {value}/{total}"
      });

      if (steps.length > minProgress) bar.start(steps.length, 0);

      steps.forEach(function (v, i) {
        var tagText = (v.match("{{.*}}") || []).shift();

        if (tagText) {
          var tag = _this2.splitTag(tagText);

          // If we have a normal match
          matchOptions.matchNormal = false;
          if (tag.origin && normalLookup[tag.origin]) {
            matchOptions.matchNormal = normalLookup[tag.origin];
          }

          var tagData = tokenLookup[tagText] || _this2.processTag(tag, matchOptions);

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
        if (steps.length > minProgress) bar.update(i, {
          speed: Math.floor(i / ((new Date() - startTime) / 1000)),
          replaces: replaces
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

  }, {
    key: "formatStats",
    value: function formatStats(text, tpl) {
      var stat = { avgMatch: 0, matchContext: 0, replaced: 0 };
      text.stats.forEach(function (s) {
        if (s.tag) stat.replaced++;
        if (s.foundContext) stat.matchContext++;
        if (s.matches) stat.avgMatch += s.matches.length;
      });

      stat.replaced = stat.replaced / text.stats.length * 100 + "%";
      stat.avgMatch = stat.avgMatch / stat.replaced * 100 + "%";
      stat.matchContext = stat.matchContext / stat.replaced * 100 + "%";
      stat.totalWords = text.stats.length;

      return stat;
    }

    /**
     *
     * @param {*} tag
     */

  }, {
    key: "splitTag",
    value: function splitTag() {
      var tag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

      var chunks = tag.replace("{{", "").replace("}}", "").split("/");

      return {
        pos: chunks[0], // Part of speech
        regExp: chunks[1], // Regexp to match
        tags: chunks[2] ? chunks[2] = chunks[2].split(",") : [], // Tags - third part of the token
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

  }, {
    key: "processTag",
    value: function processTag(tag) {
      var matchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var partsFilter = matchOptions.parts;

      // Prepare out
      var result = {
        matches: [],
        tag: tag,
        tagText: tag.text,
        origin: tag.origin
      };

      // If matchOptions have filter by parts - apply it
      if (partsFilter && !~partsFilter.indexOf(tag.pos)) {
        result.result = tag.origin;
        return result;
      }

      // Get search options
      var searchOptions = this.getSearchOptions(tag, matchOptions);

      // Try to find a match
      var tokens = this.dictionary.getWords(tag.pos, searchOptions.regExp, tag.tags, searchOptions);

      result.foundContext = false;

      // If we didn't find context matches try
      if (searchOptions.contextSearch) {
        if (tokens.length) {
          result.foundContext = true;
        } else if (searchOptions.contextSearch != "strict") {
          searchOptions.contextSearch = false;
          tokens = this.dictionary.getWords(tag.pos, searchOptions.regExp, tag.tags, searchOptions);
        }
      }

      var word = (0, _utils.getRandomItem)(tokens);
      result.matches = (tokens.map(function (t) {
        return t.word;
      }) || []).slice(0, 20);
      result.wordNormal = word ? word.wordNormal : tag.origin || "";
      result.result = word ? word.word : tag.origin || "";

      return result;
    }

    /**
     *
     * @param {*} origin
     * @param {*} matchOptions
     */

  }, {
    key: "getSearchOptions",
    value: function getSearchOptions(tag, matchOptions) {
      // Regexp - second part of token
      var regExp = matchOptions.length ? ".{" + (origin.length - 1) + "}" : tag.regExp;
      var firstL = tag.origin.toLowerCase();
      var lastL = tag.origin[tag.origin.length - 1].toLowerCase();

      if (matchOptions.first) regExp = "^" + firstL + regExp;
      if (matchOptions.last) regExp = regExp + (lastL + "$");

      // If we have a user-defined regexp - use it
      if (matchOptions.regexp) regExp = matchOptions.regexp;

      var searchOptions = Object.assign({ origin: tag.origin, regExp: regExp }, matchOptions);

      // Options to search a word
      if (tag.origin && (matchOptions.vowels || matchOptions.syllables || matchOptions.accent || matchOptions.accentLetter)) {
        var o = this.parser.parseWord(tag.origin) || {};

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
     * @param {*} origin
     */

  }, {
    key: "queryContext",
    value: function queryContext(origin) {
      var input = this.parser.parseWord(origin);
      return this.dictionary.context.getSimilarWords(input);
    }

    /**
     *
     * @param {*} origin
     */

  }, {
    key: "inflect",
    value: function inflect(origin) {
      var tags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var tagArray = typeof tags === "string" ? tags.split(",") : tags;

      var input = this.parser.parseWord(origin);
      if (input && input.parse) {
        // Inflect
        var inf = input.parse.inflect(tagArray);
        return inf ? inf.word : origin;
      } else {
        return origin;
      }
    }

    /**
     *
     * @param {*} origin
     */

  }, {
    key: "pluralize",
    value: function pluralize(origin) {
      var number = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      var input = this.parser.parseWord(origin);
      number = parseInt(number, 10);

      if (input && input.parse && number) {
        // Inflect
        var inf = input.parse.pluralize(number);
        return inf ? inf.word : origin;
      } else {
        return origin;
      }
    }

    /**
     *
     *
     * @param {*} nouns
     * @param {*} adj
     * @returns
     * @memberof Morpher
     */

  }, {
    key: "getNextWord",
    value: function getNextWord(origin) {
      var regExp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ".*";

      var conformMap = {
        NOUN: "ADJF",
        ADJF: "NOUN",
        VERB: "NOUN",
        INFN: "NOUN"
      };

      var inputToken = this.parser.parseWord(origin || "");
      if (!inputToken) return "";

      var tag = this.splitTag(inputToken.shortTag);

      // Edge case for verbs
      if (tag.pos.match("VERB|INFN")) tag.tags = ["accs"];

      var results = this.dictionary.getWords(conformMap[tag.pos] || "NOUN", regExp, tag.tags, {
        origin: origin,
        contextSearch: true
      });

      // If we didn't get enough matches from w2v - choose random one
      if (results.length < 3) {
        results = this.dictionary.getWords(conformMap[tag.pos] || "NOUN", regExp, tag.tags, {
          origin: origin,
          contextSearch: false
        });
      }

      var word = (0, _utils.getRandomItem)(results) || {};
      return word.word || "";
    }
  }]);
  return Morpher;
}();

exports.default = Morpher;