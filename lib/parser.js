"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Parser = function () {
  function Parser() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Parser);

    this.Az = global.Az;
    this.options = options;
    this.accentLookup = this.options.accentLookup || {};
    this.stopWords = this.options.stopWords || [];
    this.options.withSpaces = true;
    this.initStopWords();
  }

  /**
   *
   *
   * @memberof Parser
   */


  (0, _createClass3.default)(Parser, [{
    key: "initStopWords",
    value: function initStopWords() {
      var _this = this;

      this.stopWordsLookup = {};
      this.stopWords.forEach(function (word) {
        return _this.stopWordsLookup[word] = true;
      });
    }

    /**
     *
     *
     * @param {string} [word=""]
     * @memberof Parser
     */

  }, {
    key: "getVowelMap",
    value: function getVowelMap() {
      var word = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

      var w = word.toLowerCase();
      var parts = w.match(/[бвгджзйклмнпрстфхцчшщьъ]*?[аеёиоуыэюя]/gi) || [];

      return {
        vowels: parts.map(function (p) {
          return p.match(/[аеёиоуыэюя]{1,3}/gi);
        }).join("-"),
        accmap: this.accentLookup[w] || new Array(parts.length).fill(0).join("")
      };
    }

    /**
     *
     * @param {*} token
     */

  }, {
    key: "getTags",
    value: function getTags(token) {
      var skipTags = ["inan", "anim"];
      var tags = token.tag.stat.slice(1, 100).concat(token.tag.flex) || [];
      return tags.filter(function (t) {
        return !~skipTags.indexOf(t) && !/^[A-Z]/.test(t);
      });
    }

    /**
     *
     * @param {*} token
     */

  }, {
    key: "getShortTag",
    value: function getShortTag(token) {
      var skipParts = ["PRED", "PRCL", "PREP", "NPRO", "GRND", "ADVB"];

      if (!token.tag || !token.word || this.stopWordsLookup[token.normalize().word] || token.tag.isCapitalized() || ~skipParts.indexOf(token.tag.POST) || token.word.length < 4) {
        return false;
      } else {
        var POST = token.tag.POST;
        return "{{" + POST + "/.*/" + this.getTags(token).join(",") + "/" + token.word + "}}";
      }
    }

    /**
     *
     * @param {*} word
     */

  }, {
    key: "parseWord",
    value: function parseWord(word, simpleForm) {
      var token = this.parseText(word).shift();

      if (simpleForm) {
        token.tags = this.getTags(token).join(",");
        delete token.parse;
        delete token.tag;
        delete token.shortTag;
      }

      return token;
    }

    /**
     *
     *
     * @param {*} text
     * @returns
     * @memberof Parser
     */

  }, {
    key: "parseText",
    value: function parseText(inputText) {
      var _this2 = this;

      var text = Array.isArray(inputText) ? inputText.join(" ") : inputText;
      var tokens = this.Az.Tokens(text).done().map(function (token) {
        return _this2.parseToken(token, true).shift() || {};
      });

      return (this.options.withSpaces ? tokens : tokens.filter(function (token) {
        return token.word.trim();
      })) || [];
    }

    /**
     *
     */

  }, {
    key: "parseToken",
    value: function parseToken(token, quick) {
      var _this3 = this;

      var origin = token.source.substr(token.st, token.length);
      var isCapitalized = origin[0] != (origin[0] || "").toLowerCase();
      var output = [];

      // Get basic word properties
      var wordData = Object.assign({
        word: origin
      }, this.getVowelMap(origin));

      // Process only cyrillic words for now
      if (token.type == "WORD" && token.subType == "CYRIL" && !isCapitalized) {
        var parseVars = this.Az.Morph(origin);

        if (parseVars && parseVars.length) {
          if (quick) parseVars = [parseVars[0]];

          output = parseVars.map(function (parse) {
            return Object.assign({}, wordData, {
              wordNormal: parse.normalize().word,
              parse: parse,
              tag: parse.tag,
              part: parse.tag.POST,
              shortTag: _this3.getShortTag(parse) || origin || ""
            });
          });
        }
      }

      return output.length ? output : [wordData];
    }
  }]);
  return Parser;
}();

exports.default = Parser;