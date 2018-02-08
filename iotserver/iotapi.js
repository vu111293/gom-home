
// net lib
let rxhttp = require('rx-http-request').RxHttpRequest;
let sprintf = require('sprintf-js').sprintf;

const HOST_IOT = 'http://mhome-showroom.ddns.net/api';
const HOST_OPEN_WEATHER = 'http://api.openweathermap.org/data/2.5/weather';

const WEATHER_LOCATION_ID = '1580578';
const OPEN_WEATHER_APP_ID = '4087bd8be866da223189a20f0d3e2f55';
const AUTHENTICATION_IOT_SERVER = 'Basic a3l0aHVhdEBraW1zb250aWVuLmNvbTpDaG90cm9ubmllbXZ1aTE=';

const TURNON_ACTION = 'turnOn';
const TURNOFF_ACTION = 'turnOff';
const START_ACTION = 'start';
const STOP_ACTION = 'stop';
const PRESS_BUTTON_ACTION = 'pressButton';
const SET_SLIDER_ACTION = 'setSlider';
const SET_COLOR_ACTION = 'setColor';
const OPEN_ACTION = 'open';
const CLOSE_ACTION = 'close';

function iotModule() {

    // api public 

    this.detectFace = function () {
        sampleFunction();
    }

    // for devices
    this.turnOnDevice = function (id, callback) {
        changeDeviceAction(id, TURNON_ACTION, callback);
    }

    this.turnOffDevice = function (id, callback) {
        changeDeviceAction(id, TURNOFF_ACTION, callback);
    }

    // for scene
    this.startScene = function (id, callback) {
        changeSceneAction(id, START_ACTION, callback);
    }

    this.endScene = function (id, callback) {
        changeSceneAction(id, END_ACTION, callback);
    }

    this.askWiki = function (question, callback) {
        rxhttp.get('https://vi.wikipedia.org/w/api.php?action=opensearch&search=' + question + '&limit=1&format=json')
            .subscribe(
            (data) => {
                if (data.body) {
                    var ret = JSON.parse(data.body); //[2][0]
                    if (ret[2][0]) {
                        callback(ret[2][0]);
                    } else {
                        callback(null);
                    }
                } else {
                    callback(null);
                }
            },
            (err) => {
                callback(null);
            }
            );
    }

    this.askWeather = function (callback) {
        var options = {
            qs: {
                'id': WEATHER_LOCATION_ID,
                'appid': OPEN_WEATHER_APP_ID
            },
            headers: {
                // 'Authorization': AUTHENTICATION_IOT_SERVER
            },
            json: true
        };
        rxhttp.get(HOST_OPEN_WEATHER, options)
            .subscribe(
            (data) => {
                if (data.body) {
                    callback(parseWeatherResponse(data.body));
                } else {
                    callback(null);
                }
            },
            (err) => {
                callback(null);
            }
            );
    }

    // private functions

    var sampleFunction = function () {
        console.log("THIS IS EXAMPLE");
    }

    var getOutputByAction = function (action) {
        var output = '';
        switch (action) {
            case TURNON_ACTION:
                output = 'Thiết bị đã được mở';
                break;

            case TURNOFF_ACTION:
                output = 'Thiết bị đã được tắt';
                break;

            default:
                break;
        }
        return output;
    }

    var turnDeviceByAction = function (app, id, action) {
        let deviceName = app.getArgument('device_name');
        if (deviceName) {
            let deviceId = id; // findDeviceId(deviceName);
            if (deviceId) {
                changeDeviceAction(deviceId, action, function (success) {
                    if (success) {
                        app.tell(getOutputByAction(action));
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
    // // Call api IOT
    var changeDeviceAction = function (deviceId, action, callback) {
        var options = {
            qs: {
                'deviceID': deviceId, // -> uri + '?access_token=xxxxx%20xxxxx'
                'name': action
            },
            headers: {
                'Authorization': AUTHENTICATION_IOT_SERVER
                // 'User-Agent': 'Rx-Http-Request'
            },
            json: true // Automatically parses the JSON string in the response
        };

        rxhttp.get(HOST_IOT + "/callAction", options).subscribe(
            (data) => {
                callback(data.response.statusCode);
            },
            (err) => {
                callback(500);
            }
        );
    }

    var changeSceneAction = function (sceneId, action, callback) {
        var options = {
            qs: {
                'id': sceneId,
                'action': action
            },
            headers: {
                'Authorization': AUTHENTICATION_IOT_SERVER
            },
            json: true // Automatically parses the JSON string in the response
        };

        rxhttp.get(HOST_IOT + "/sceneControl", options).subscribe(
            (data) => {
                callback(data.response.statusCode);
            },
            (err) => {
                callback(500);
            }
        );
    }

    var parseWeatherResponse = function(response) {
        let wid = response.weather[0].description; // id;
        let minTemp = response.main.temp_min;
        let maxTemp = response.main.temp_max;
        let humidity = response.main.humidity;

        var build = '';
        if (wid) {
            build += 'Thời tiết ' + wid + '. ';
        }
        if (minTemp && maxTemp) {
            if (minTemp == maxTemp) {
                let temp = convertToC(parseFloat(minTemp));
                build += sprintf('Nhiệt độ trung bình %.1f độ. ', temp);
            } else {
                let min = convertToC(parseFloat(minTemp));
                let max = convertToC(parseFloat(maxTemp));
                build += 'Nhiệt độ thấp nhất ' +  min + ' độ. Nhiệt độ cao nhất ' + max + ' độ. ';
            }
        }
        if (humidity) {
            build += 'Độ ẩm trung bình ' +  humidity + '%. ';
        }
        return build;
    }

    var convertToC = function(temp) {
        return temp - 273.15;
    }

}

module.exports = iotModule;