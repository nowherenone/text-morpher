// Microsoft Build Tools 2013
// https://www.microsoft.com/en-us/download/details.aspx?id=40760

const readline = require("readline");
const chalk = require("chalk");
const tmp = require("tmp");
const fs = require("fs");
const winTools = require("node-windows");
const utils = require("../src/utils.js");
const Spinner = require("cli-spinner").Spinner;
const gunzip = require("gunzip-file");
let installStage = false;

const dictURL =
  "http://rusvectores.org/static/models/ruwikiruscorpora_upos_cbow_300_20_2017.bin.gz";

const text =
  "\nOne of the key features of this library is an ability to find \n" +
  "words similar by context. But this feature requires a lot of RAM\n" +
  "(usually ~0.5-1Gb), and windows-build-tools library\n" +
  "\n" +
  "You may install it manually by running: \n" +
  chalk.white("npm install --global --production windows-build-tools\n") +
  "or we can install it now (it requires admin privileges): \n";

const installWindowsLibs = () => {
  let cmdFile = tmp.fileSync({ prefix: "winInstall-", postfix: ".cmd" });
  let logFile = cmdFile.name + ".txt";
  let cmd = "npm install --global --production windows-build-tools";
  let spinner = new Spinner("Please wait.. %s");

  // Create a .cmd file
  fs.writeFileSync(cmdFile.name, `${cmd} >> "${logFile}" `);

  // Watch the installation progress
  const w = fs.watchFile(logFile, { interval: 1000 }, (cur, prev) => {
    let a = utils.getFile(logFile);
    console.log(a);

    if (~a.indexOf("All done!")) {
      spinner.stop();
      w.stop();
      installw2v();
    }
  });

  winTools.elevate(cmdFile.name);
  console.log(
    chalk.white(
      "Step 1/4: Installing windows-build-tools - it may take a few minutes"
    )
  );
  spinner.start();
};

// install word2vector library
const installw2v = () => {
  if (installStage != "installw2v") installStage = "installw2v";
  else return;

  console.log(chalk.white("Step 2/4: Installing word2vector npm."));
  utils.runProcess(utils.getNPMName(), ["install", "word2vector"], c => {
    downloadDictionary();
  });
};

// Download dictionary
const downloadDictionary = () => {
  let tmpFile = tmp.fileSync();

  console.log(chalk.white("Step 3/4: Downloading word2vec model (420Mb)..."));

  utils.download(dictURL, tmpFile.name, v => {
    unpackAndRename(tmpFile.name);
  });
};

const unpackAndRename = async name => {
  let localDir = __dirname + "/../dictionary/default/";

  console.log(chalk.white("\n Step 4/4: File is recieved, unpacking..."));

  gunzip(name, localDir + "context.bin", function() {
    console.log("Model is extracted. Installation is completed now.");
    process.exit();
  });
};

const startPostInstall = () => {
  console.log(text);

  // Check if we are on Windows
  if (
    ~require("os")
      .platform()
      .indexOf("win32")
  ) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(
      "Do you want to install windows-build-tools now? (Y/n): ",
      answer => {
        if (answer.toLowerCase() != "n") installWindowsLibs();
      }
    );
  } else {
    installw2v();
  }
};

//downloadDictionary();
//unpackAndRename();
startPostInstall();
