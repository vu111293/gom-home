'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let App = require('actions-on-google').DialogflowApp;
let express = require('express');
let bodyParse = require('body-parser');
let sprintf = require('sprintf-js').sprintf;
let iotModule = require('./iotserver/iotapi');
let localize = require('localize');
let url = require('url');

// net lib
let rxhttp = require('rx-http-request').RxHttpRequest;

// firebase lib
let firebase = require('firebase-admin');

let slib = new localize({
    'hello': {
        'en': 'Hello',
        'vi': 'Xin chào'
    },

    'turn_on_device $[1]': {
        'en': 'the $[1] is turned on',
        'vi': '$[1] đã được mở'
    },

    'turn_off_device $[1]': {
        'en': 'the $[1] is turned off',
        'vi': '$[1] đã được tắt'
    },

    'err_iot_server': {
        'en': 'error occurred while prcessing. Please try again',
        'vi': 'Xãy ra lỗi khi truy vấn. Xin thử lại'
    },

    'device_not_found $[1]': {
        'en': '$[1]',
        'vi': 'Không tìm thấy thiết bị $[1]'
    },

    'turn_on_scene $[1]': {
        'en': '$[1] effect is on',
        'vi': 'Hiệu ứng $[1] đã được bật'
    },

    'turn_off_scene $[1]': {
        'en': '$[1] effect is off',
        'vi': 'Hiệu ứng $[1] đã được tắt'
    },

    'scene_not_found $[1]': {
        'en': '$[1]',
        'vi': 'Không tìm thấy hiệu ứng $[1]'
    },

    'not_found_result': {
        'en': 'Result not found',
        'vi': 'Không tìm thấy kết quả'
    },

    'uber_from': {
        'en': 'Please tell start point',
        'vi': 'Bạn muốn xuất phát từ đâu?'
    },

    'uber_to': {
        'en': 'Please tell end point',
        'vi': 'Bạn muốn đến đâu?'
    },

    'uber_response $[1] $[2]': {
        'en': 'You have request uber from $[1] to $[2]',
        'vi': 'Đã yêu cầu uber từ $[1] đến $[2]'
    },

    'ask_info': {
        'en': 'What info do you want?',
        'vi': 'Bạn muốn biết thông tin gì?'
    },

    'ask_alarm': {
        'en': 'What time do you want to walkup?',
        'vi': 'Bạn muốn đặt báo thức lúc mấy giờ?'
    },

    'set_hour_only $[1]':
        {
            'en': 'Alarm was set at $[1] o\'clock',
            'vi': 'Đã đặt báo thức lúc $[1] giờ'
        },

    'set_hour_and_minute $[1] $[2]':
        {
            'en': 'Alarm was set at $[1] : $[2]',
            'vi': 'Đã đặt báo thức lúc $[1] giờ $[2] phút'
        },

});


slib.setLocale('en');
let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParse.json({ type: 'application/json' }));

const MAX = 100;

const HOST_IOT = 'http://mhome-showroom.ddns.net/api';

// Default action
const QUIT_ACTION = 'quit';
const WELLCOM_ACTION = 'input.welcome';
const DEFAULT_FALLBACK_ACTION = 'input.unknown';

// IOT action group
const TURNON_DEVICE_ACTION = 'device_on';
const TURNOFF_DEVICE_ACTION = 'device_off';

const START_SCENE_ACTION = 'scene_start';
const END_SCENE_ACTION = 'scene_end';

// Device controller
const TURNUP_VOLUMN_ACTION = 'volumn_up';
const TURNDOWN_VOLUMN_ACTION = 'volumn_down';

const SET_ALARM_ACTION = 'set_alarm';
const ASK_WIKI_ACTION = 'question_wiki';
const UBER_REQUEST_ACTION = 'uber_request';
const ASK_WEATHER_ACTION = 'question_weather';


let actionMap = new Map();
actionMap.set(QUIT_ACTION, quit);
actionMap.set(WELLCOM_ACTION, welcome)
actionMap.set(DEFAULT_FALLBACK_ACTION, defaultFallback);

actionMap.set(TURNON_DEVICE_ACTION, turnOnDevice);
actionMap.set(TURNOFF_DEVICE_ACTION, turnOffDevice);

actionMap.set(START_SCENE_ACTION, startScene);
actionMap.set(END_SCENE_ACTION, endScene);

actionMap.set(SET_ALARM_ACTION, setAlarm);
actionMap.set(ASK_WIKI_ACTION, askWiki);
actionMap.set(UBER_REQUEST_ACTION, uberRequest);
actionMap.set(ASK_WEATHER_ACTION, askWeather);


var iot = new iotModule();
app.post('/', function (request, response) {
    console.log('header: ' + JSON.stringify(request.headers));
    console.log('body: ' + JSON.stringify(response.body));


    let accessToken = request.body.originalRequest.data.user.accessToken;
    if (accessToken) {
        console.log('accessToken is ' + accessToken);
    }

    const app = new App({ request: request, response: response });
    // console.log('Token: ' + app.getUser().accessToken);
    // const userId = app.getUser().userId;
    // console.log(userId);

    app.handleRequest(actionMap);
    // response.sendStatus(200); // reponse OK
});

app.post('/token', function (request, response) {
    console.log('token called');

    let clientId = request.query['client_id'];
    let clientSecret = request.query['client_secret'];
    let code = request.query['code'];
    console.log('code: ' + code);
});

app.get('/auth', function (request, response) {
    console.log('auth called');
    let responseType = request.query['response_type'];
    let clientId = request.query['client_id'];
    let redirectUrl = request.query['redirect_uri'];
    let scope = request.query['scope'];
    let state = request.query['state'];

    console.log('redirect: ' + redirectUrl);
    console.log('state: ' + state);

    response.redirect(redirectUrl + '?code=Y2RlZmdoaWprbG1ub3asdasd' + '&state=' + state);

    // var options = {
    //     qs: {
    //         'code': 'Y2RlZmdoaWprbG1ub3Bxcg==',
    //         'state': state
    //     },
    //     headers: {
    //         // 'Authorization': AUTHENTICATION_IOT_SERVER
    //     },
    //     json: true
    // };
    // rxhttp.get(redirectUrl + '?code=Y2RlZmdoaWprbG1ub3asdasd' + '&state=' + state)
    //     .subscribe(
    //     (data) => {
    //         console.log('data: ' + JSON.stringify(data));
    //         console.log('redirect success!');
    //         // callback(null);
    //     },
    //     (err) => {
    //         console.log('error: ' + JSON.stringify(err));
    //         console.log('redirect fail!');
    //         // callback(null);
    //     }
    //     );
    // response.sendStatus(200);
});

var deviceList;
var sceneList;

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
            sceneList = postSnapshot.val().sceneList;
        }
        console.log('firebase DB changed');
    });
}


// Start the server
var server = app.listen(app.get('port'), function () {
    console.log('App host %s', server.address().address);
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
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

function signInHandler(app) {
    if (app.getSignInStatus() === app.SignInStatus.OK) {
        let accessToken = app.getUser().accessToken;
        console.log('Token: ' + accessToken);
        // access account data with the token
    } else {
        app.tell('You need to sign-in before using the app.');
    }
}

// call iot api
function welcome(app) {
    signInHandler(app);
    app.tell('Nice to meet u. I\'m ding dong');
}

function turnOnDevice(app) {
    signInHandler(app);

    let dname = app.getArgument('device_name');
    var id = findDeviceId(dname);
    if (id) {
        iot.turnOnDevice(id, function (code) {
            if (code == 202) {
                tellRaw(app, slib.translate('turn_on_device $[1]', dname));
            } else {
                ask(app, 'err_iot_server');
            }
        });
    } else {
        askRaw(app, slib.translate('device_not_found $[1]', dname));
        // ask(app, 'device_not_found');
    }
}

function turnOffDevice(app) {
    let dname = app.getArgument('device_name');
    var id = findDeviceId(dname);
    if (id) {
        iot.turnOffDevice(id, function (code) {
            if (code == 202) {
                tellRaw(app, slib.translate('turn_off_device $[1]', dname));
            } else {
                ask(app, 'err_iot_server');
            }
        });
    } else {
        askRaw(app, slib.translate('device_not_found $[1]', dname));
    }
}

function startScene(app) {
    var sceneName = app.getArgument('scene_name');
    var id = findSceneId(sceneName);
    if (id) {
        iot.startScene(id, function (code) {
            if (code == 202) {
                tellRaw(app, slib.translate('turn_on_scene $[1]', sceneName));
            } else {
                ask(app, 'err_iot_server');
            }
        });
    } else {
        askRaw(app, slib.translate('scene_not_found $[1]', scenename));
        // app.ask("Hiệu ứng không được tìm thấy hoặc chưa thiết lập");
    }
}

function endScene(app) {
    let sceneName = app.getArgument('scene_name');
    var id = findSceneId(sceneName);
    if (id) {
        iot.endScene(id, function (code) {
            if (code == 202) {
                tellRaw(app, slib.translate('turn_off_scene $[1]', sceneName));
            } else {
                ask(app, 'err_iot_server');
            }
        });
    } else {
        askRaw(app, slib.translate('scene_not_found $[1]', scenename));
    }
}

function setAlarm(app) {
    var hour = app.getArgument('hour');
    var minute = app.getArgument('minute');
    var time = app.getArgument('alarm_time');

    if (hour) {
        if (minute && time) {
            tellRaw(app, slib.translate('set_hour_and_minute $[1] $[2]', hour, minute));
            // app.tell("Đã đặt báo thức lúc " + hour + " giờ " + minute + " phút " + time);
        } else if (minute) {
            tellRaw(app, slib.translate('set_hour_and_minute $[1] $[2]', hour, minute));
        } else {
            tellRaw(app, slib.translate('set_hour_only $[1]', hour));
        }

    } else {
        ask(app, 'ask_alarm');
    }
}

function askWiki(app) {
    var question = app.getArgument('query');
    if (question) {
        iot.askWiki(question, function (response) {
            if (response) {
                tellRaw(app, response);
            } else {
                tell(app, 'not_found_result');
            }
        });
    } else {
        ask(app, 'ask_info');
    }
}

function uberRequest(app) {
    let from = app.getArgument('from');
    let to = app.getArgument('to');

    if (from == null) {
        ask(app, 'uber_start');
    } else if (to == null) {
        ask(app, 'uber_end');
    } else {
        tellRaw(app, slib.translate('uber_response $[1] $[2]', from, to));
    }
}

function askWeather(app) {
    iot.askWeather(function (response) {
        if (response) {
            tellRaw(app, response);
        } else {
            tell(app, 'not_found_result');
        }
    })
}

// function generateAnswer(app) {
//     console.log('generateAnswer');
//     var answer = getRandomNumber(0, 100);
//     app.data.answer = answer;
//     app.data.guessCount = 0;
//     app.data.fallbackCount = 0;
//     app.ask(sprintf(getRandomPrompt(app, GREETING_PROMPTS) + ' '
//         + getRandomPrompt(app, INVOCATION_PROMPT), MIN, MAX));
// }

// function checkGuess(app) {
//     console.log('checkGuess');
//     let answer = app.data.answer;
//     let guess = parseInt(app.getArgument('guess'));
//     if (app.data.hint) {
//         if (app.data.hint === 'higher' && guess <= app.data.previousGuess) {
//             app.ask('Nice try, but it’s still higher than ' + app.data.previousGuess);
//             return;
//         } else if (app.data.hint === 'lower' && guess >= app.data.previousGuess) {
//             app.ask('Nice try, but it’s still lower than ' + app.data.previousGuess);
//             return;
//         }
//     }
//     if (answer > guess) {
//         app.data.hint = 'higher';
//         app.data.previousGuess = guess;
//         app.ask('It\'s higher than ' + guess + '. What\'s your next guess?');
//     } else if (answer < guess) {
//         app.data.hint = 'lower';
//         app.data.previousGuess = guess;
//         app.ask('It\'s lower than ' + guess + '. Next guess?');
//     } else {
//         app.data.hint = 'none';
//         app.data.previousGuess = -1;
//         app.setContext('yes_no');
//         app.ask('Congratulations, that\'s it! I was thinking of ' + answer + '. Wanna play again?');
//     }
// }

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

// Support methods
function findDeviceId(raw) {
    if (raw == null) {
        return null;
    }

    var deviceId;
    for (var i = 0; i < deviceList.length; ++i) {
        var element = deviceList[i];
        if (element == null || element.nameList == null) continue;
        for (var j = 0; j < element.nameList.length; ++j) {
            var name = element.nameList[j];
            if (name.includes(raw)) {
                deviceId = element.id;
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

// Support methods
function findSceneId(raw) {
    if (raw == null) {
        return null;
    }

    var sceneId;
    for (var i = 0; i < sceneList.length; ++i) {
        var element = sceneList[i];
        if (element == null || element.nameList == null) continue;
        for (var j = 0; j < element.nameList.length; ++j) {
            var name = element.nameList[j];
            if (name.includes(raw)) {
                sceneId = element.id;
                break;
            }
        }

        if (sceneId) {
            break;
        }
    }
    if (sceneId) {
        console.log("find scene id #" + sceneId);
    }
    return sceneId;
}


// utils function
function ask(app, strName) {
    if (strName == null) {
        app.ask("");
        return;
    }
    app.ask(slib.translate(strName));
}

function askRaw(app, raw) {
    app.ask(raw);
}

function tell(app, strName) {
    app.tell("(end)" + slib.translate(strName));
}

function tellRaw(app, raw) {
    app.tell("(end)" + raw);
}