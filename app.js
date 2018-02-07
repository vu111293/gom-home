'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let App = require('actions-on-google').DialogflowApp;
let express = require('express');
let bodyParse = require('body-parser');
let sprintf = require('sprintf-js').sprintf;

// net lib
let rxhttp = require('rx-http-request').RxHttpRequest;

// firebase lib
let firebase = require('firebase-admin');

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParse.json({ type: 'application/json' }));

const MIN = 0;
const MAX = 100;

const HOST_IOT = 'http://mhome-showroom.ddns.net/api';

const GREETING_PROMPTS = ["Let's play Number Genie.", "Welcome to Number Genie!"];
const INVOCATION_PROMPT = ["I\'m thinking of a number from %s and %s. What's your first guess?"];

const GENERATE_ANSWER_ACTION = 'generate_answer';
const CHECK_GUESS_ACTION = 'check_guess';
const QUIT_ACTION = 'quit';
const PLAY_AGAIN_YES_ACTION = 'play_again_yes';
const PLAY_AGAIN_NO_ACTION = 'play_again_no';
const DEFAULT_FALLBACK_ACTION = 'input.unknown';

// IOT action group
const TURNON_DEVICE_ACTION = 'device_on';
const TURNOFF_DEVICE_ACTION = 'device_off';


let actionMap = new Map();
actionMap.set(GENERATE_ANSWER_ACTION, generateAnswer);
actionMap.set(CHECK_GUESS_ACTION, checkGuess);
actionMap.set(QUIT_ACTION, quit);
actionMap.set(PLAY_AGAIN_YES_ACTION, playAgainYes);
actionMap.set(PLAY_AGAIN_NO_ACTION, playAgainNo);
actionMap.set(DEFAULT_FALLBACK_ACTION, defaultFallback);

actionMap.set(TURNON_DEVICE_ACTION, turnDeviceOn);
actionMap.set(TURNOFF_DEVICE_ACTION, turnDeviceOff);


app.post('/', function (request, response) {
    console.log('header: ' + JSON.stringify(request.headers));
    console.log('body: ' + JSON.stringify(response.body));

    const app = new App({ request: request, response: response });
    app.handleRequest(actionMap);
    // response.sendStatus(200); // reponse OK

});

app.get('/find', function (request, response) {
    console.log(request.query);

    if (request.headers["query"] && deviceList) {

        var q = request.headers["query"];
        var deviceId;
        for (var i = 0; i < deviceList.length; ++i) {
            var element = deviceList[i];
            if (element == null || element.nameList == null) continue;
            for (var j = 0; j < element.nameList.length; ++j) {
                var name = element.nameList[j];
                if (name.includes(q)) {
                    deviceId = element.deviceId;
                    break;
                }
            }

            if (deviceId) {
                break;
            }
        }
        if (deviceId) {
            console.log("find device id #" + deviceId);
        }
    }
    console.log("call me");
    response.sendStatus(200);
});

app.get("/iot", function (request, response) {
    var q = request.query;
    if (q["deviceId"] && q["action"]) {
        var deviceId = q["deviceId"];
        var action = q["action"];
        changeDeviceAction(deviceId, action, function (success) {
            if (success) {
                response.sendStatus(200);
            } else {
                response.sendStatus(500);
            }

        })
    }
});


// app.get('/', function (request, response) {
//     console.log('header: ' + JSON.stringify(request.headers));
//     console.log('body: ' + JSON.stringify(response.body));

//     const app = new App({ request: request, response: response });
//     // response.sendStatus(200); // reponse OK
//     app.handleRequest(actionMap);
// });


var deviceList;

var serviceAccount = require('./service_account_key.json');
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://diy-smarthome-183215.firebaseio.com'
});
startListeners();

function startListeners() {
    firebase.database().ref('/smarthome/LGG3-604a04d5de04c5b8').on('value', function (postSnapshot) {
        if (postSnapshot.val()) {
            deviceList = postSnapshot.val().deviceList;
        }
        console.log('database changed');
    });
    console.log('New star notifier started...');
    console.log('Likes count updater started...');
}


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
function getRandomPrompt(app, array) {
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

function turnDeviceOn(app) {
    let deviceName = app.getArgument('device_name');
    if (deviceName) {
        let deviceId = findDeviceId(deviceName);
        if (deviceId) {
            changeDeviceAction(deviceId, "turnOn", function(success) {
                if (success) {
                    app.tell('Thiết bị đã được tắt');
                } else {
                    app.ask('Xãy ra lỗi trong khi thao tác');
                }
            });
        } else {
            app.ask('Không tìm thấy thiết bị!');
        }
    } else {
        app.ask('Bạn muốn thao tác với thiết bị nào?')
    }
}

function turnDeviceOff(app) {
    let deviceName = app.getArgument('device_name');
    if (deviceName) {
        let deviceId = findDeviceId(deviceName);
        if (deviceId) {
            changeDeviceAction(deviceId, "turnOff", function(success) {
                if (success) {
                    app.tell('Thiết bị đã được tắt');
                } else {
                    app.ask('Xãy ra lỗi trong khi thao tác');
                }
            });
        } else {
            app.ask('Không tìm thấy thiết bị!');
        }
    } else {
        app.ask('Bạn muốn thao tác với thiết bị nào?')
    }
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


// Call api IOT
function changeDeviceAction(deviceId, action, callback) {
    var options = {
        qs: {
            'deviceID': deviceId, // -> uri + '?access_token=xxxxx%20xxxxx'
            'name': action
        },
        headers: {
            'Authorization': 'Basic a3l0aHVhdEBraW1zb250aWVuLmNvbTpDaG90cm9ubmllbXZ1aTE='
            // 'User-Agent': 'Rx-Http-Request'
        },
        json: true // Automatically parses the JSON string in the response
    };

    rxhttp.get(HOST_IOT + "/callAction", options).subscribe(
        (data) => {
            callback(data.response.statusCode == 202);
        },
        (err) => {
            callback(false);
        }
    );
}

// Support methods
function findDeviceId(raw) {
    var deviceId;
    for (var i = 0; i < deviceList.length; ++i) {
        var element = deviceList[i];
        if (element == null || element.nameList == null) continue;
        for (var j = 0; j < element.nameList.length; ++j) {
            var name = element.nameList[j];
            if (name.includes(raw)) {
                deviceId = element.deviceId;
                break;
            }
        }

        if (deviceId) {
            break;
        }
    }
    if (deviceId) {
        console.log("find device id #" + deviceId);
    }
    return deviceId;
}