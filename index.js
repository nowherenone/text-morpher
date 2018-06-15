const dotenv = require("dotenv").config();
const readline = require("readline");
const utils = require("./src/utils.js");
const args = require("args");
const Az = require("az");
const fs = require("fs");
const Morpher = require("./src/morpher.js");

// Make preinstall and postinstall hooks
// Make tests

// Todo make a procedure for inflecting Verbs 


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

      let text = Morpher.runTemplate(tpl, cfg || {
        first: false,
        last: false,
        length: false,
        vowels: false,
        accent: false,
        syllables: false,
        accentLetter: false,
        contextSearch: true,
        tags: false
      });


      let stat = { avgMatch: 0, matchContext: 0, replaced: 0 };
      text.stats.forEach(s => {
        if (s.tag) stat.replaced++;
        if (s.foundContext) stat.matchContext++;
        if (s.matches) stat.avgMatch += s.matches.length;
      });

      stat.replaced = (stat.replaced / text.stats.length);
      stat.avgMatch = (stat.avgMatch / text.stats.length);
      stat.matchContext = (stat.matchContext / text.stats.length);
      stat.total = text.stats.length;

      console.log(tpl);
      console.log(stat);
      console.log("");
      console.log(text.text);


      question();
    });
  };

  question();
};



const test = m => {
  let input = utils.getFile("./input").split("\n");

  input.forEach(line => {
    let tpl = m.createTemplate(line, {});
    //let tpl = "{{VERB/.*/sing,3per,pres/снижает}}";
    //console.log(tpl);

    // console.log(
    m.runTemplate(tpl, {
      first: false,
      last: false,
      length: false,
      vowels: false,
      accent: false,
      syllables: false,
      accentLetter: false,
      contextSearch: "strict",
      tags: false
    })
    //  );
  });
};

const runMorpher = () => {
  Az.Morph.init(() => {
    global.Az = Az;

    let M = new Morpher({
      dictFile: "data/words.json",
    });



    interactiveMode(M);
  });
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
