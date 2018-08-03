# text-morpher

## Features and goals

Basically this module was designed to serve a single purpose: generating morphologically correct sentences **in russian** to use them in a chatbot. So the main feature of this module sounds like:

	Generate me a sentence of a given structure for a given topic

It looks very simple on the first sight, but when it comes to the russian morphology things get complicated, since you have to put your words in proper genders, forms, case etc. So, over the time it started to get more and more features and here is what it can do at the moment:

* Detect part of speech and other grammar tags of any word
* Convert words in text into inline templates with grammar metadata
* Put a word to any chosen form (and get it's initial form from any other)
* Use Word2Vec models to search words close by **meaning**
* Find matches to any word by:
    * Syllable length
    * Vowels structure: папа -> мама 
    * Accent syllable: долото -> паразит
    * Grammar properties
    * Regexp (match first/last letter of the orginal word etc.)
    * And meaning (!): яблоко -> зеленое, круглое

These features may be use to (just examples out of my head):
* Make all words in the text start with the sale letter
* Replace all adjectives with close (or contrary) ones by meaning 
* Update poetry by replacing words matching by syllables and accent
* Lookup which adjectives is related to a chosen noun
* This could be an endless list :)

## How it works

Here is a simple example to give you an idea of how Morhper is processing a text, lets suppose this is our input:

    "мама мыла раму"

First, it converts text in a set of tags using Morpher.createTemplate function, and returns a string where each of them contains all morphological properties of the word:

    {{NOUN/.*/femn,sing,nomn/мама}} 
    {{VERB/.*/impf,tran,femn,sing,past,indc/мыла}} 
    {{NOUN/.*/femn,sing,accs/раму}}

The structure of each tag is quite simple:
1. Part of speech
2. Regexp to filter matches
3. Set of grammar tags (gender, tense, plural, case etc.)
4. Original word

Then using function Morpher.runTemplate we can process this string with tags and find matches for each word. Searching for matches could be configured with parameters provided as a second argument to this function. By default set of parameters is taken from ./morpher.config.json file in the root folder. 

So if we try to run this template without using Word2Vec model - we get morphologically correct, but quite meaningless replacements, like:

    "француженка клеила миску"
    "страница брала бороду"
    "харчевня пенила клятву"

Then, if we turn context search option on - the output word will be way more relevant to original: 

    "девочка слала шахту"
    "соседка пугала веранду"
    "сестрёнка меняла рекламу"

Althou, the whole output sentence may not have the same meaning as the original one.  :)  This is one of the major TO-DO's at the moment.

## Installation 

1. Install [NodeJS](https://nodejs.org),   
2. Run `npm i -g text-morpher` to install package globally

This module has a built-in dictionary for about ~22K words, so it kinda  works right after the installation. But the most interesting part of it require to use word2vec model file to enable context search features.
In order to use it - we need to install a word2vector module and download the word2vec model for russian language.  Since it is quite an expensive feature (the model is about 600Mb in size and when it is loaded it takes the same amount of RAM) I left it disabled by default.  But you need just to run one extra command to make it all automatically. An important note: **on Windows it will ask for admin privileges** to compile a c++ binary, but don't worry - you may check /scripts/postInstall.js and make sure it doesn't do any harm. :)

3. Run `text-morpher install` to add word2vec support

That's it - now you may use Morpher class in your app or run in from CLI

## Configuration

There is a morpher.config.json file in the root folder. Morpher use it to look for matches when it processing tags.  Here is all the options available at the moment:

```js
{
  // Parts of speech to process
  // (see the whole list here http://opencorpora.org/dict.php?act=gram)
  // Anythig else will be skipped and left in the original form
  "parts": ["NOUN","ADJF","VERB","INFN"],

  // Match the first letter of the original word
  "first": false,
  
  // Match the last letter of the original word
  "last": false,

  // Match the length of the original word
  "length": false,

  // Match all the vowels  (молоко -> долото)
  "vowels": false,

  // Match syllable count (горбившиеся -> гусеницами)
  "syllables": false,

  // Match the accent syllable  (пого`да -> профе`ссия)
  "accent": false,

  // Match the accent vowel (пого`да -> забо`та)
  "accentLetter": false,

  // Match all the original grammar tags  (gender, tense, plural, case etc.) 
  // (see the whole list here http://opencorpora.org/dict.php?act=gram)
  "tags": false,

  // false or a string with regexp
  "regexp": false,

  // Enable search by word2vec model
  "contextSearch": true,

  // Treshold for search by word2vec model - float
  "treshHold": 0.6
}
```

The same structure could be passed as an object to Morpher.runTemplate to override any of these options.


## CLI Usage 

At the moment two commands are supported from command line: 

1. **text-morpher cli** - this command starts morpher in interactive mode. 
    * If you type any text - it will substitute it with any matches with default matching options from  ./morpher.config.json
    * If you enter just a single word with tilda, like this: `~свобода`, it will show you all the closest matches from word2vec model.

2. **text-morpher morph** - this command has two options: `input` and `output`, where you can define input textfile to process and the name of an output file. Morpher will process all text from input file and save it in the output


## API Usage 

This part is a subject to be updated soon.
Like, very soon. :) But if you're interested - there are API call examples 
in /test folder

## Useful links 

[OpenCorpora grammar tag list](http://opencorpora.org/dict.php?act=gram)  
[Word2Vec models](http://rusvectores.org/ru/models/)  
[Word2Vec technology reference](https://deeplearning4j.org/word2vec.html)  
[Google NGrams](http://storage.googleapis.com/books/ngrams/books/datasetsv2.html)


## Thanks to 

Denis Olshin <me@denull.ru> for [Az.js](https://github.com/deNULL/Az.js)   
Mikhail Korobov <kmike84@gmail.com> for [Pymorphy](https://github.com/kmike/pymorphy2)   
Lee Xun <speachlesslee@gmail.com> for [word2vector](https://github.com/LeeXun/word2vector)


