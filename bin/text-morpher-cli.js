#!/usr/bin/env node
"use strict";

process.title = "text-morpher";

const readline = require("readline");
const path = require("path");
const baseDir = path.join(__dirname, "../");
const args = require("args");
const utils = require("../lib/utils.js");
const Morpher = require("../lib/morpher.js");

let originalBaseDir = process.cwd();
let MorpherInstance;

/**
 *
 *
 * @returns
 */
const readConfig = () => {
  let cfg = {};
  try {
    cfg = JSON.parse(utils.getFile(baseDir + "/morpher.config.json"));
  } catch (e) {}
  return cfg;
};

/**
 * Morph an input file
 *
 * @param {*} name
 * @param {*} sub
 * @param {*} options
 * @returns
 */
const morphText = async (name, sub, options) => {
  if (!options.input || !utils.exists(options.input)) {
    console.log("Input file not found.");
    console.log(
      "Please provide a path to the input file using '--input' option."
    );
    return;
  }

  console.log(`Morphing ${options.input} file:`);

  let M = new Morpher();
  await M.init(options);
  let input = utils.getFile(`${originalBaseDir}/${options.input}`);

  let tpl = M.createTemplate(input);
  let result = M.runTemplate(tpl, readConfig());

  utils.writeFile(`${originalBaseDir}/${options.output}`, result.text);

  console.log(`Done. Results are stored in ${options.output} file.`);
};

/**
 *
 * @param {*} answer
 * @param {*} callback
 */
const processCLIInput = (answer = "", callback) => {
  let Morpher = MorpherInstance;

  if (answer.split(" ").length > 1) {
    let tpl = Morpher.createTemplate(answer);
    let result = Morpher.runTemplate(tpl, readConfig());
    console.log(result.text);
  } else {
    if (~answer.indexOf("~")) {
      console.log(
        Morpher.queryContext(answer.replace("~", ""))
          .map(v => v.word)
          .join(", ")
      );
    } else {
      console.log(Morpher.getNextWord(answer));
    }
  }

  callback && callback();
};

/**
 * Test stuff in cli
 */
const interactiveMode = Morpher => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let question = () => {
    rl.question("Input: ", answer => {
      processCLIInput(answer);
      question();
    });
  };

  question();
};

// Describe cli commands and options
args
  .options([
    {
      name: "input",
      description: "A text file to process",
      defaultValue: ""
    },
    {
      name: "output",
      description: "A file to store results",
      defaultValue: "results.txt"
    }
    /*
    {
      name: "dictionary",
      description: "A dictionary to use",
      defaultValue: "default"
    },
    {
      name: "context",
      description: "Use word2vec model for context search",
      defaultValue: "1"
    },
    {
      name: "config",
      description: "A config file with matching options",
      defaultValue: ""
    },
    {
      name: "mode",
      description: "Matching mode [text | poetry]",
      defaultValue: "text"
    }*/
  ])
  .command("morph", "Morph text using word substitution", morphText)
  .command("install", "Download and install word2vec model support", () => {
    require("./postInstall.js");
  })
  .command(
    "cli",
    "Interactive command-line mode",
    async (name, sub, options) => {
      let M = new Morpher();
      await M.init(options);
      MorpherInstance = M;
      interactiveMode();
    }
  );

const flags = args.parse(process.argv);
//args.showHelp();
