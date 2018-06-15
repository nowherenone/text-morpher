const dotenv = require("dotenv").config();
const readline = require("readline");
const utils = require("./src/utils.js");
const args = require("args");

const fs = require("fs");
const Morpher = require("./src/morpher.js");

// Make preinstall and postinstall hooks
// Add stopwords   [таких,который,самого и т.д. ]


/**
 * Test stuff in cli
 */
const interactiveMode = (Morpher) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let question = () => {
    rl.question("Input: ", answer => {

      let cfg = JSON.parse(utils.getFile("./morpher.config.json"));
      let tpl = Morpher.createTemplate(answer);

      let result = Morpher.runTemplate(tpl, cfg);
      console.log(result.text);
      question();
    });
  };

  question();
};




const runMorpher = async () => {

  let M = await new Morpher({
    dictionary: "default"
  });

  interactiveMode(M);
};

/*

   console.log(M.dictionary.context.getSimilarWords({
      wordNormal: "месяц",
      part: "NOUN"
    }, topN = 500));
    
args
  .option('port', 'The port on which the app will be running', 3000)
  .option('reload', 'Enable/disable livereloading')
  .command('serve', 'Serve your static site', ['s'])

const flags = args.parse(process.argv)  
*/

/*

if (args[0] == "cli") {
  bot.cliMode();
} else {
  bot.initializeBot(token, botName, package.version);
}
*/



runMorpher();
//interactiveMode();
