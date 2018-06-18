const dotenv = require("dotenv").config();
const readline = require("readline");
const utils = require("./src/utils.js");
const args = require("args");
const fs = require("fs");
const Morpher = require("./src/morpher.js");

// Describe cli commands and options
args
  .options([
    {
      name: "input",
      description: "A text file to process",
      defaultValue: ""
    },
    {
      name: "context",
      description: "Use word2vec model for context search",
      defaultValue: "1"
    },
    {
      name: "dictionary",
      description: "A dictionary to use",
      defaultValue: "default"
    },
    {
      name: "output",
      description: "A file to store results",
      defaultValue: "results.txt"
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
    }
  ])
  .command(
    "morph",
    "Morph text using word substitution",
    morphText
  )
  .command(
    "cli",
    "Interactive command-line mode",
    async (name, sub, options) => {
      let M = await new Morpher(options);
      interactiveMode(M);
    }
  );

const flags = args.parse(process.argv);

if (require.main === module) {
  if (flags.mode) args.showHelp();
} else {
  console.log("required as a module");
}

/**
 * Initializer
 */
const runMorpher = async options => {
  return await new Morpher({
    dictionary: "default"
  });
};


/**
 * Morph an input file
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

  let M = await new Morpher(options);
  let input = utils.getFile(options.input);

  let cfg = JSON.parse(utils.getFile("./morpher.config.json"));

  let tpl = M.createTemplate(input);
  let result = M.runTemplate(tpl, cfg);

  utils.writeFile(options.output, result.text);

  console.log(`Done. Results are stored in ${options.output} file.`);
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
      let cfg = JSON.parse(utils.getFile("./morpher.config.json"));

      if (answer.split(" ").length > 1) {
        let tpl = Morpher.createTemplate(answer);
        console.log(tpl);
        let result = Morpher.runTemplate(tpl, cfg);
        console.log(result.text);
      } else {
        console.log(Morpher.analyzeWord(answer));
      }

      question();
    });
  };

  question();
};

/*
   console.log(M.dictionary.context.getSimilarWords({
      wordNormal: "месяц",
      part: "NOUN"
    }, topN = 500));
*/

module.exports = Morpher;
