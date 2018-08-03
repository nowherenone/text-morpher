const MorpherJS = require("../src/morpher.js");
const should = require("should");

let Morpher;

/*
      Падежи:
        nomn - именительный	(Кто? Что?)	хомяк ест
        gent - родительный	(Кого? Чего?)	у нас нет хомяка
        datv - дательный	(Кому? Чему?)	сказать хомяку спасибо
        accs - винительный	(Кого? Что?)	книга читает хомяка
        ablt - творительный	(Кем? Чем?)	зерно съедено хомяком 
        loct - предложный	(О ком? О чём?)	память о хомякe
      Число: 
        sing - единственное число	хомяк
        plur - множественное число	хомяки
      Род:
        masc - мужской род	хомяк, говорил
        femn - женский род	хомячиха, говорила
        neut - средний род	зерно, говорило
    */

describe("", function() {
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
  });

  describe("Basic Morpher functions", () => {
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

    it("Creating a template ", async function() {
      let words = "мама мыла раму";
      let data = Morpher.createTemplate(words);

      // {{VERB/.*/impf,tran,femn,sing,past,indc/мыла}}

      data.should.be.equal(
        "{{NOUN/.*/femn,sing,nomn/мама}} {{NOUN/.*/neut,sing,gent/мыла}} {{NOUN/.*/femn,sing,accs/раму}}"
      );
    });

    it("Split tags", async function() {
      let words = "мама мыла раму";
      let tag = Morpher.splitTag("{{NOUN/.*/femn,sing,nomn/мама}}");

      /* 
      { 
        pos: 'NOUN',
        regExp: '.*',
        tags: [ 'femn', 'sing', 'nomn' ],
        origin: 'мама',
        text: '{{NOUN/.* /femn,sing,nomn/мама}}' 
      }
      */

      tag.should.have.property("pos").which.is.a.String();
      tag.should.have.property("origin").which.is.a.String();
      tag.should.have.property("tags").which.is.an.Array();
      tag.should.have.property("regExp").which.is.a.String();
      tag.should.have.property("text").which.is.a.String();

      tag.origin.should.be.equal("мама");
      tag.regExp.should.be.equal(".*");
      tag.pos.should.be.equal("NOUN");
      tag.text.should.be.equal("{{NOUN/.*/femn,sing,nomn/мама}}");
    });

    it("Inflect", async function() {
      let word = "параллелепипед";

      let testSet = {
        nomn: "параллелепипед",
        gent: "параллелепипеда",
        datv: "параллелепипеду",
        accs: "параллелепипед",
        ablt: "параллелепипедом",
        loct: "параллелепипеде",
        plur: "параллелепипеды",
        "plur,gent": "параллелепипедов",
        "plur,loct": "параллелепипедах",
        "plur,datv": "параллелепипедам",
        "plur,accs": "параллелепипеды"
      };

      Object.keys(testSet).forEach(tag => {
        let inflected = Morpher.inflect(word, tag);
        inflected.should.be.equal(testSet[tag]);
      });
    });

    it("Pluralize", async function() {
      let word = "параллелепипед";
      let testSet = {
        1: "параллелепипед",
        2: "параллелепипеда",
        3: "параллелепипеда",
        10: "параллелепипедов",
        11: "параллелепипедов",
        21: "параллелепипед",
        102: "параллелепипеда"
      };

      Object.keys(testSet).forEach(tag => {
        let plur = Morpher.pluralize(word, tag);
        plur.should.be.equal(testSet[tag]);
      });
    });

    it("GetNextWord", async function() {
      let testSet = {
        параллелепипед: "ADJF", // NOUN -> ADJF
        синий: "NOUN", // ADJF -> NOUN,
        бежала: "NOUN", // VERB -> NOUN,
        бежать: "NOUN" // INFN -> NOUN,
      };

      Object.keys(testSet).forEach(word => {
        let newWord = Morpher.analyzeWord(Morpher.getNextWord(word, []));
        newWord.part.should.be.equal(testSet[word]);
      });
    });
  });
});
