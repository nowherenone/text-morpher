"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _parser = require("./parser.js");

var _parser2 = _interopRequireDefault(_parser);

var _utils = require("./utils.js");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
const Parser = require("./parser.js");
const utils = require("./utils.js");

const baseDir = path.join(__dirname, "../");
*/

var Context = function () {
  function Context(config) {
    (0, _classCallCheck3.default)(this, Context);

    this.parser = new _parser2.default({ withSpaces: true });

    this.treshHold = 0.45;
    this.topN = 200;

    // Check if word2vector is installed
    if (config.contextSearch === false || !_utils2.default.exists(baseDir + "/node_modules/word2vector/index.js") || !_utils2.default.exists("" + config.modelFile)) {
      console.log("Context search with word2vec is disabled");
      this.disabled = true;
    } else {
      console.log("Context search is enabled, model size - " + _utils2.default.getFileSize("" + config.modelFile));
      this.w2v = require("word2vector");
      this.w2v.load("" + config.modelFile);
      console.log("Done");
    }
  }

  /**
   *
   * @param {*} token
   */


  (0, _createClass3.default)(Context, [{
    key: "getSimilarWords",
    value: function getSimilarWords(token) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (this.disabled) return [];

      // Edge case for adjectives
      var posMap = {
        ADJF: "ADJ",
        INFN: "VERB"
      };
      var backMap = _utils2.default.invert(posMap);

      var vTag = token.wordNormal + "_" + (posMap[token.part] || token.part);
      var results = [];

      try {
        results = this.w2v.getSimilarWords(vTag, { N: this.topN });
      } catch (e) {
        results = [];
      }

      return results.map(function (v) {
        var w = v.word.split("_");
        return {
          word: w[0],
          part: backMap[w[1]] || w[1],
          score: v.similarity
        };
      }).filter(function (v) {
        return !v.word.match("::") && v.word.match(/[^a-z]/g) && v.part == (options.extractPart || backMap[token.part] || token.part) && v.score > (options.treshHold || _this.treshHold);
      }).map(function (v) {
        return _this.parser.parseWord(v.word);
      });
    }
  }]);
  return Context;
}();

exports.default = Context;