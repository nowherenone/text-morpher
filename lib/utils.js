"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runProcess = exports.getNPMName = exports.invert = exports.asyncForEach = exports.getRandomItem = exports.prob = exports.dumpFile = exports.writeFile = exports.getFileSize = exports.getFile = exports.exists = exports.unpackZip = exports.download = exports.log = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _readline = require("readline");

var _readline2 = _interopRequireDefault(_readline);

var _unzipStream = require("unzip-stream");

var _unzipStream2 = _interopRequireDefault(_unzipStream);

var _child_process = require("child_process");

var _http = require("http");

var _http2 = _interopRequireDefault(_http);

var _cliProgress = require("cli-progress");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
const fs = require("fs");
const chalk = require("chalk");
const readline = require("readline");
const Unzip = require("unzip-stream");
const spawn = require("child_process").spawn;
const http = require("http");
const Progress = require("cli-progress").Bar;
*/

var log = exports.log = function log(text) {
  //const log = console.log;
};

/**
 * Download a file
 *
 * @param {*} url
 * @param {*} dest
 * @param {*} cb
 */
var download = exports.download = function download(url, dest, cb) {
  var file = _fs2.default.createWriteStream(dest);

  var bar = new _cliProgress.Bar({
    barsize: 10,
    format: "Downloading: [{bar}] {percentage}% | | ETA: {eta}s | {value}/{total}"
  });

  var request = _http2.default.get(url, function (response) {
    var len = parseInt(response.headers["content-length"], 10);
    var cur = 0;

    bar.start(len, 0);

    // check if response is success
    if (response.statusCode !== 200) {
      return cb("Response status was " + response.statusCode);
    }

    response.pipe(file);

    response.on("data", function (chunk) {
      cur += chunk.length;
      bar.update(cur);
    });

    file.on("finish", function () {
      bar.stop();
      file.close(cb); // close() is async, call cb after close completes.
    });

    // check for request error too
    request.on("error", function (err) {
      bar.stop();
      _fs2.default.unlink(dest);
      return cb(err.message);
    });
  });

  file.on("error", function (err) {
    // Handle errors
    _fs2.default.unlink(dest); // Delete the file async. (But we don't check the result)
    return cb(err.message);
  });
};

/**
 *
 * @param {*} packedFile
 * @param {*} targetFolder
 */
var unpackZip = exports.unpackZip = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(packedFile, targetFolder) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              var unzipper = _unzipStream2.default.Extract({ path: targetFolder });
              unzipper.on("error", reject);
              unzipper.on("close", resolve);

              _fs2.default.createReadStream(packedFile).pipe(unzipper);
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function unpackZip(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var exists = exports.exists = function exists(path) {
  return _fs2.default.existsSync(path) ? path : false;
};
var getFile = exports.getFile = function getFile() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "./dump.json";

  return exists(name) ? _fs2.default.readFileSync(name, "utf8") : "";
};
var getFileSize = exports.getFileSize = function getFileSize(path) {
  var stats = _fs2.default.statSync(path);
  return Math.floor(stats["size"] / (1024 * 1024)) + "MB";
};

var writeFile = exports.writeFile = function writeFile() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "./dump.txt";
  var str = arguments[1];

  _fs2.default.writeFileSync(name, str);
};

var dumpFile = exports.dumpFile = function dumpFile() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "./dump.json";
  var object = arguments[1];

  _fs2.default.writeFileSync(name, JSON.stringify(object, null, 2));
};

var prob = exports.prob = function prob(_prob) {
  return Math.floor(Math.random() * 100) <= _prob;
};

var getRandomItem = exports.getRandomItem = function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
};

var asyncForEach = exports.asyncForEach = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(array, callback) {
    var index;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            index = 0;

          case 1:
            if (!(index < array.length)) {
              _context2.next = 7;
              break;
            }

            _context2.next = 4;
            return callback(array[index], index, array);

          case 4:
            index++;
            _context2.next = 1;
            break;

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function asyncForEach(_x6, _x7) {
    return _ref2.apply(this, arguments);
  };
}();

var invert = exports.invert = function invert(obj) {
  var new_obj = {};
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      new_obj[obj[prop]] = prop;
    }
  }

  return new_obj;
};

/**
 *  Get OS-independent npm name
 */
var getNPMName = exports.getNPMName = function getNPMName() {
  return (/^win/.test(process.platform) ? "npm.cmd" : "npm"
  );
};

/**
 * Start the child process and output everything into console
 */
var runProcess = exports.runProcess = function runProcess(command, params, callback) {
  var proc = (0, _child_process.spawn)(command, params);
  //proc.stdout.on("data", data => console.log("" + data));
  //proc.stderr.on("data", data => console.log("" + data));
  if (callback) proc.on("close", callback);
};