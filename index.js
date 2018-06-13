const dotenv = require("dotenv").config();
const readline = require("readline");
const utils = require("./src/utils.js");
const args = require("args");
const Az = require("az");
const Morpher = require("./src/morpher.js");
const winTools = require("node-windows");

const Parser = require("./src/parser.js");
const Context = require("./src/context.js");

// Make preinstall and postinstall hooks
// Make tests

// Todo make a procedure for inflecting Verbs 

//  {{VERB/.*/intr,plur,3per,pres/работают}}
//  {{VERB/.*/sing,3per,pres/снижает}} 

const test = m => {
  let input = utils.getFile("./input").split("\n");

  input.forEach(line => {
    let tpl = m.createTemplate(line, {});

    // console.log(tpl);

    console.log(
      m.runTemplate(tpl, {
        first: true,
        last: true,
        length: false,
        vowels: false,
        accent: false,
        syllables: false,
        accentLetter: false,
        contextSearch: true,
        tags: false
      })
    );
  });
};

const runMorpher = () => {
  Az.Morph.init(() => {
    global.Az = Az;

    // console.log(new Parser().parseWord("dlkfjslkjsdgrlsjdl"));
    /*
    let c = new Context();

    c.getSimilarWords({ wordNormal: "стол", part: "NOUN" }).forEach(v =>
      console.log(v.word)
    );

    return;
*/

    let m = new Morpher({
      dictFile: "data/words.json"
    });

    test(m);
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
//interactiveMode();
