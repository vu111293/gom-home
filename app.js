'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

// const { WebhookClient } = require('dialogflow-fulfillment');
const { WebhookClient } = require('./dialogflow/dialogflow-fulfillment');
const { Card, Suggestion, Image, Text, Payload } = require('dialogflow-fulfillment');

const TURNON_ACTION = 'turnOn';
const TURNOFF_ACTION = 'turnOff';
const START_ACTION = 'start';
const STOP_ACTION = 'stop';
const PRESS_BUTTON_ACTION = 'pressButton';
const SET_SLIDER_ACTION = 'setSlider';
const SET_COLOR_ACTION = 'setColor';
const OPEN_ACTION = 'open';
const CLOSE_ACTION = 'close';

let App = require('actions-on-google').DialogflowApp;
let express = require('express');
let bodyParse = require('body-parser');
let sprintf = require('sprintf-js').sprintf;
let localize = require('localize');
let url = require('url');
var Promise = require('promise');
let request = require('request')

// net lib
let rxhttp = require('rx-http-request').RxHttpRequest;
const externalApis = require('./iotserver/ExtentionAPIs');

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


slib.setLocale('vi');
let agent = express();
agent.set('port', (process.env.PORT || 8080));
agent.use(bodyParse.json({ type: 'application/json' }));

const MAX = 100;
const HOST_IOT = 'http://mhome-showroom.ddns.net/api';

// Default action
const QUIT_ACTION = 'quit';
const WELLCOM_ACTION = 'input.welcome';
const DEFAULT_FALLBACK_ACTION = 'input.unknown';

const PAYMENT_ACTION = 'payment';


let actionMap = new Map();
actionMap.set(QUIT_ACTION, quit);
actionMap.set(WELLCOM_ACTION, welcome)
actionMap.set(DEFAULT_FALLBACK_ACTION, defaultFallback);
actionMap.set(PAYMENT_ACTION, makeOrder);

agent.post('/', function (request, response) {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    // Run the proper handler based on the matched Dialogflow intent
    let intentMap = new Map();
    intentMap.set('Default Fallback Intent', defaultFallback);
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('quit_facts', quit);
    intentMap.set('device_on_action', turnOnDevice);
    intentMap.set('device_off_action', turnOffDevice);
    intentMap.set('scene_start_action', startScene);
    intentMap.set('scene_end_action', endScene);
    intentMap.set('question_wiki', askWiki);
    intentMap.set('question_weather', askWeather);
    intentMap.set('set_alarm', setAlarm);
    intentMap.set('request_uber', uberRequest);
    intentMap.set('mhome_volumn_up', volumUpHandler);
    intentMap.set('mhome_volumn_down', volumDownHandler);

    agent.handleRequest(intentMap);
});

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParse.urlencoded({ extended: false })
agent.post('/token', urlencodedParser, function (request, response) {
    let clientId = request.body.client_id;
    let clientSecret = request.body.client_secret;
    let grantType = request.body['grant_type'];

    console.log('client: ' + clientId);
    console.log('secret: ' + clientSecret);
    // verify clientid & clientsceret in db

    if (grantType == 'authorization_code') {
        // get code
        let code = request.body['code'];
        console.log('code: ' + code);

        // generate refresh token
        let refToken = 'YmNkZWZnaGlqa2xtbm9wcQ';
        response.send({
            token_type: "bearer",
            access_token: "YmNkZWZnaGlqa2xtbm9wcQ132",
            refresh_token: "YmNkZWZnaGlqa2xtbm9wcQ456",
            expires_in: 300
        });
    } else {
        // refresh token
        let ref2Token = request.body['refresh_token'];
        console.log('refresh token: ' + ref2Token);
        response.send({
            token_type: "bearer",
            access_token: "YmNkZWZnaGlqa2xtbm9wcQ789",
            expires_in: 300
        })
    }
});

agent.get('/auth', function (request, response) {
    console.log('auth called');
    let responseType = request.query['response_type'];
    let clientId = request.query['client_id'];
    let redirectUrl = request.query['redirect_uri'];
    let scope = request.query['scope'];
    let state = request.query['state'];

    console.log('redirect: ' + redirectUrl);
    console.log('state: ' + state);

    response.redirect(redirectUrl + '?code=Y2RlZmdoaWprbG1ub3asdasd' + '&state=' + state);
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


// Render html
agent.get('/device',function(req,res){
    res.render('list.html', {demo: "Device list", results: deviceList.map(item => item.nameList[0])})
 });

 agent.get('/scene',function(req,res){
    res.render('list.html', {demo: "Scane list", results: sceneList.map(item => item.nameList[0])})
 });

require('./router/main')(agent);
agent.set('views',__dirname + '/views');
agent.set('view engine', 'ejs');
agent.engine('html', require('ejs').renderFile);




// Start the server
var server = agent.listen(agent.get('port'), function () {
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

function welcome(agent) {
    agent.add('Hi. Tôi là em hôm. Bạn cần giúp gì?');
}

function turnOnDevice(agent) {
    // signInHandler(app);
    let dname = agent.parameters['device_name'];
    var id = findDeviceId(dname);
    if (id) {
        return externalApis.changeDevice(id, TURNON_ACTION)
            .then(data => agent.add(dname + ' đã được mở'))
            .catch(err => agent.add('Xãy ra lỗi khi mở thiết bị'));
    } else {
        agent.add('Không tìm thấy ' + dname);
    }
}

function turnOffDevice(agent) {
    let dname = agent.parameters['device_name'];
    var id = findDeviceId(dname);
    if (id) {
        return externalApis.changeDevice(id, TURNOFF_ACTION)
            .then(data => agent.add(dname + ' đã được tắt'))
            .catch(err => agent.add('Xãy ra lỗi khi tắt thiết bị'));
    } else {
        agent.add('Không tìm thấy ' + dname + '.');
    }
}

function startScene(agent) {
    var sceneName = agent.parameters['scene_name'];
    var id = findSceneId(sceneName);
    if (id) {
        return externalApis.changeScene(id, START_ACTION)
            .then(data => agent.add('Đã thực hiện ' + sceneName))
            .catch(err => agent.add('Không thể thực hiện hiệu ứng'));
    } else {
        agent.add('Không tìm thấy ' + sceneName);
    }
}

function endScene(agent) {
    let sceneName = agent.parameters['scene_name'];
    var id = findSceneId(sceneName);
    if (id) {
        return externalApis.changeScene(id, START_ACTION)
            .then(data => agent.add('Đã kết thúc ' + sceneName))
            .catch(err => agent.add('Không thể thực hiện hiệu ứng'));
    } else {
        agent.add('Không tìm thấy ' + sceneName);
    }
}

function setAlarm(agent) {
    var hour = agent.parameters['hour'];
    var minute = agent.parameters['minute'];
    var time = agent.parameters['alarm_time'];

    if (hour) {
        if (minute && time) {
            agent.add(slib.translate('set_hour_and_minute $[1] $[2]', hour, minute));
        } else if (minute) {
            agent.add(slib.translate('set_hour_and_minute $[1] $[2]', hour, minute));
        } else {
            agent.add(slib.translate('set_hour_only $[1]', hour));
        }
    } else {
        agent.add('Không thể đặt báo thức');
    }
}

function askWiki(agent) {
    var question = agent.parameters['query'];
    if (question) {
        return externalApis.callAPIAskWiki(question)
            .then(data => agent.add(data))
            .catch(err => agent.add(err));
    } else {
        agent.add('Vui lòng nhắc lại');
    }
}

function uberRequest(agent) {
    let from = agent.parameters['from'];
    let to = agent.parameters['to'];
    agent.add(slib.translate('uber_response $[1] $[2]', from, to));
}

function volumUpHandler(agent) {
    agent.add('Đã tăng âm lượng');
}

function volumDownHandler(agent) {
    agent.add('Đã giảm âm lượng');
}

function askWeather(agent) {
    return externalApis.callAPIAskWeather()
        .then(res => agent.add(res))
        .catch(err => agent.add(err));
}

function makeOrder(app) {
    let amount = app.getArgument('amount');
    if (amount == null) {
        app.ask('Thiếu số lượng');
        return;
    }

    iot.makeOrder(amount, function (response) {
        if (response) {
            // parse result
            let totalPrice = response.total_price;
            let address = response.address;
            let time = response.created_at;
            let id = response.id.substring(0, 5) + '...' + response.id.substring(response.id.length - 5);
            app.ask('Bill ' + id + ' đã tạo thành công. Tổng bill là ' + totalPrice + ', được giao đến ' + address);
        } else {
            app.ask('Xãy ra lỗi khi thanh toán');
        }
    });
}

function quit(agent) {
    agent.add('Hẹn gặp lại');
}

function defaultFallback(agent) {
    agent.add('Vui lòng thử lại');
}

// Support methods
function findDeviceId(raw) {
    if (raw == null) {
        return null;
    }
    raw = raw.toLowerCase();

    var deviceId;
    for (var i = 0; i < deviceList.length; ++i) {
        var element = deviceList[i];
        if (element == null || element.nameList == null) continue;
        for (var j = 0; j < element.nameList.length; ++j) {
            var name = element.nameList[j].toLowerCase();
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
    raw = raw.toLowerCase();

    var sceneId;
    for (var i = 0; i < sceneList.length; ++i) {
        var element = sceneList[i];
        if (element == null || element.nameList == null) continue;
        for (var j = 0; j < element.nameList.length; ++j) {
            var name = element.nameList[j].toLowerCase();
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