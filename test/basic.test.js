const MorpherJS = require("../src/morpher.js");
const should = require("should");

let Morpher;

describe("hooks", function() {
  before(async function() {
    this.timeout(60000);
    Morpher = new MorpherJS();
    await Morpher.init({ contextSearch: false });
  });

  describe("Init", () => {
    it("Initializing Morpher", async function() {
      should(Morpher.dictionary).be.ok();
      should(Morpher.parser).be.ok();
    });

    it("Analyzing a word ", async function() {
      let word = "привилегированными";
      let data = Morpher.analyzeWord(word);

      /* 
        { 
            word: 'привилегированными',
            vowels: 'и-и-е-и-о-а-ы-и',
            accmap: '00001000',
            wordNormal: 'привилегированный',
            part: 'ADJF',
            tags: 'plur,ablt'
        }
      */

      data.should.have.property("word").which.is.a.String();
      data.should.have.property("vowels").which.is.a.String();
      data.should.have.property("accmap").which.is.a.String();
      data.should.have.property("part").which.is.a.String();
      data.should.have.property("tags").which.is.a.String();

      data.word.should.be.equal(word);
      data.vowels.should.be.equal("и-и-е-и-о-а-ы-и");
      data.accmap.should.be.equal("00001000");
      data.wordNormal.should.be.equal("привилегированный");
    });
  });
});
