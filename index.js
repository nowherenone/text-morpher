const dotenv = require("dotenv").config();
const readline = require("readline");
const package = require("./package.json");
const args = require("args");
const Az = require("az");
const Morpher = require("./src/morpher.js");
const Parser = require("./src/parser.js");

const initAZ = () => {
  return new Promise(resolve => {
    Az.Morph.init(() => {
      global.Az = Az;
      resolve(this);
    });
  });
};

const runMorpher = () => {
  initAZ().then(() => {
    let m = new Morpher({
      dictFile: "data/words.json"
      //  inputFile: "data/input.txt"
    });

    let steps =
      "{ADJF/^о.*/masc} {NOUN/^о.*/masc} {VERB/^о.*/masc,sing} {ADJF/^о.*/femn,accs} {NOUN/^о.*/femn,accs}";
    //let steps = "{NOUN/^п.*/femn} {NOUN/^п.*/femn}";

    for (let index = 0; index < 10; index++) {
      console.log(m.parseTemplate(steps));
    }

    //console.log(m.dictionary.getWords("ADJF", "^п.*", ["жр"]));
  });
};

/*
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

/**
 * Test stuff in cli
 */
const interactiveMode = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let question = async () => {
    rl.question("Input: ", async answer => {
      //let a = await botCmd.test(answer);
      //console.log(a);
      question();
    });
  };

  question();
};

runMorpher();
