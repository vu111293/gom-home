'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let App = require('actions-on-google').DialogflowApp;
let express = require('express');
let bodyParse = require('body-parser');
let sprintf = require('sprintf-js').sprintf;

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParse.json({ type: 'application/json' }));

const MIN = 0;
const MAX = 100;

const GREETING_PROMPTS = ["Let's play Number Genie.", "Welcome to Number Genie!"];
const INVOCATION_PROMPT = ["I\'m thinking of a number from %s and %s. What's your first guess?"];

const GENERATE_ANSWER_ACTION = 'generate_answer';
const CHECK_GUESS_ACTION = 'check_guess';
const QUIT_ACTION = 'quit';
const PLAY_AGAIN_YES_ACTION = 'play_again_yes';
const PLAY_AGAIN_NO_ACTION = 'play_again_no';
const DEFAULT_FALLBACK_ACTION = 'input.unknown';


let actionMap = new Map();
actionMap.set(GENERATE_ANSWER_ACTION, generateAnswer);
actionMap.set(CHECK_GUESS_ACTION, checkGuess);
actionMap.set(QUIT_ACTION, quit);
actionMap.set(PLAY_AGAIN_YES_ACTION, playAgainYes);
actionMap.set(PLAY_AGAIN_NO_ACTION, playAgainNo);
actionMap.set(DEFAULT_FALLBACK_ACTION, defaultFallback);


app.post('/', function (request, response) {
    console.log('header: ' + JSON.stringify(request.headers));
    console.log('body: ' + JSON.stringify(response.body));

    const app = new App({ request: request, response: response });
    app.handleRequest(actionMap);
    // response.sendStatus(200); // reponse OK

});

// app.get('/', function (request, response) {
//     console.log('header: ' + JSON.stringify(request.headers));
//     console.log('body: ' + JSON.stringify(response.body));

//     const app = new App({ request: request, response: response });
//     // response.sendStatus(200); // reponse OK
//     app.handleRequest(actionMap);
// });

// Start the server
var server = app.listen(app.get('port'), function () {
    console.log('App host %s', server.address().address);
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');

    console.log(sprintf("hello %s", "123113"));
});


function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility function to pick prompts
function getRandomPrompt (app, array) {
    let lastPrompt = app.data.lastPrompt;
    let prompt;
    if (lastPrompt) {
      for (let index in array) {
        prompt = array[index];
        if (prompt != lastPrompt) {
          break;
        }
      }
    } else {
      prompt = array[Math.floor(Math.random() * (array.length))];
    }
    return prompt;
  }
  

function generateAnswer(app) {
    console.log('generateAnswer');
    var answer = getRandomNumber(0, 100);
    app.data.answer = answer;
    app.data.guessCount = 0;
    app.data.fallbackCount = 0;
    app.ask(sprintf(getRandomPrompt(app, GREETING_PROMPTS) + ' ' 
    + getRandomPrompt(app, INVOCATION_PROMPT), MIN, MAX));
}

function checkGuess(app) {
    console.log('checkGuess');
    let answer = app.data.answer;
    let guess = parseInt(app.getArgument('guess'));
    if (app.data.hint) {
        if (app.data.hint === 'higher' && guess <= app.data.previousGuess) {
            app.ask('Nice try, but it’s still higher than ' + app.data.previousGuess);
            return;
        } else if (app.data.hint === 'lower' && guess >= app.data.previousGuess) {
            app.ask('Nice try, but it’s still lower than ' + app.data.previousGuess);
            return;
        }
    }
    if (answer > guess) {
        app.data.hint = 'higher';
        app.data.previousGuess = guess;
        app.ask('It\'s higher than ' + guess + '. What\'s your next guess?');
    } else if (answer < guess) {
        app.data.hint = 'lower';
        app.data.previousGuess = guess;
        app.ask('It\'s lower than ' + guess + '. Next guess?');
    } else {
        app.data.hint = 'none';
        app.data.previousGuess = -1;
        app.setContext('yes_no');
        app.ask('Congratulations, that\'s it! I was thinking of ' + answer + '. Wanna play again?');
    }
}

function playAgainYes(app) {
    console.log('playAgainYes');
    var answer = getRandomNumber(0, 100);
    app.data.answer = answer;
    app.ask('Great! I\'m thinking of a number from 0 and 100! What\'s your guess?');
}

function playAgainNo(app) {
    console.log('playAgainNo');
    app.tell('Alright, talk to you later then.');
}

function quit(app) {
    console.log('quit');
    let answer = app.data.answer;
    app.tell('Ok, I was thinking of ' + answer + '. See your later');
}

function defaultFallback(app) {
    console.log('defaultFallback');
    app.data.fallbackCount++;
    if (app.data.fallbackCount == 1) {
        app.setContext('done_yes_no');
        app.ask('Are you done playing Number Genie?');
    } else {
        app.tell('We can stop here. Let’s play again soon.');
    }
}