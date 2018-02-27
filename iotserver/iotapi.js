
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


const HOST_ECOM = 'https://innoway-server.mcommerce.com.vn/api/v1';
const AUTHENTICATION_ECOM_SERVER = 'Basic a3l0aHVhdEBraW1zb250aWVuLmNvbTpDaG90cm9ubmllbXZ1aTE=';




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
        changeSceneAction(id, STOP_ACTION, callback);
    }

    this.makeOrder = function (amount, callback) {
        order(amount, callback);
    }

    // private functions

    // Call ecom api
    var order = function (amount, callback) {
        // mockup request
        var mocOrderRequest = {
            "address": "17A Nguyễn Thị Minh Khai, Bến Nghé, Quận 1, Hồ Chí Minh, Vietnam",
            "longitude": 106.700632,
            "latitude": 10.785387,
            "sub_fee": 0,
            "channel": "at_store",
            "is_vat": false,
            "pay_amount": 0,
            "receive_amount": 0,
            "branch_id": "e1d8bb70-f45e-11e7-b8a6-d51f40ca4e2d",
            "employee_id": "e24ba180-f45e-11e7-b8a6-d51f40ca4e2d",
            "customer_id": "82d82590-f4de-11e7-b8a6-d51f40ca4e2d",
            "products": [
                {
                    "product_id": "5c56f0b0-f4e1-11e7-b8a6-d51f40ca4e2d",
                    "amount": amount,
                    "topping_value_ids": [
                    ]
                }
            ]
        }

        var options = {
            headers: {
                'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXlsb2FkIjp7ImJyYW5kX2lkIjoiZTFiZjY3MTAtZjQ1ZS0xMWU3LWI4YTYtZDUxZjQwY2E0ZTJkIiwiZW1wbG95ZWVfaWQiOiJlMjRiYTE4MC1mNDVlLTExZTctYjhhNi1kNTFmNDBjYTRlMmQiLCJmaXJlYmFzZV90b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpqYkdGcGJYTWlPbnNpWW5KaGJtUmZhV1FpT2lKbE1XSm1OamN4TUMxbU5EVmxMVEV4WlRjdFlqaGhOaTFrTlRGbU5EQmpZVFJsTW1RaUxDSndaWEp0YVhOemFXOXVJam9pWVdSdGFXNGlmU3dpZFdsa0lqb2laVEkwWW1FeE9EQXRaalExWlMweE1XVTNMV0k0WVRZdFpEVXhaalF3WTJFMFpUSmtJaXdpYVdGMElqb3hOVEU1TnpFM01qZzRMQ0psZUhBaU9qRTFNVGszTWpBNE9EZ3NJbUYxWkNJNkltaDBkSEJ6T2k4dmFXUmxiblJwZEhsMGIyOXNhMmwwTG1kdmIyZHNaV0Z3YVhNdVkyOXRMMmR2YjJkc1pTNXBaR1Z1ZEdsMGVTNXBaR1Z1ZEdsMGVYUnZiMnhyYVhRdWRqRXVTV1JsYm5ScGRIbFViMjlzYTJsMElpd2lhWE56SWpvaVptbHlaV0poYzJVdFlXUnRhVzV6WkdzdGFURXhOR3hBWkdGemFHSnZZWEprTFhabGNuTnBiMjR0TWkwd0xtbGhiUzVuYzJWeWRtbGpaV0ZqWTI5MWJuUXVZMjl0SWl3aWMzVmlJam9pWm1seVpXSmhjMlV0WVdSdGFXNXpaR3N0YVRFeE5HeEFaR0Z6YUdKdllYSmtMWFpsY25OcGIyNHRNaTB3TG1saGJTNW5jMlZ5ZG1salpXRmpZMjkxYm5RdVkyOXRJbjAuUEk5d2Q1LTlEb192Tml4YlJXYnI3Y3l6N2hwd0U2RUtsZGdUTUhpRWhvMzN4ZExlNHJDNENrdTFVQVNuYmpNb0NHZGl1UThHV29jNHd4TlVFNWp0SFp2QThsaXVlN21lc04xR29zeVBpczc4QmN4T3lfbU0yNU1pWFFmMk9pSlFCd3FfNDNfSDg1Skk5QVdzVWFrdVJYVzVKRGdzUFY3bGRvbkQzODJwUGRVdmN5Zi1kcWZoN2ZCZ2VoZ0FNU0QtbnFGcWhmMVdaNUN4eGhxeGZJeHotTFV4dWFPLWQwVkpjazBMSS1NQktjdnd4OHhtNHdSa1p4SUQ4cDZ6Q1BrVWNOMHc3YUpYTFVnSkEzS0R1ZzVvVXpLRlBtYVpyeHRjMWxadjZxOG5MeU5yZHdRUUEtdGpTNHFiZmxtUmZWYU5MeGZiei1VZU9QZzJvRmpLM0QyckZnIn0sInJvbGVzIjpbImFkbWluIl0sImV4cCI6IjIwMTgtMDItMjhUMDc6NDE6MjguODI1WiJ9.hOxHoIimqMmT6Nh5b5im_Tm48IFCOeiWVbvqZ2zkk-I',
                'Content-Type': 'application/json'
            },

            body: mocOrderRequest,
            json: true
        }

        rxhttp.post(HOST_ECOM + '/bill/order_at_store', options)
            .subscribe(
            (data) => {
                let code = data.response.statusCode;
                if (code == 200) {
                    callback(data.response.toJSON().body.results.object.bill);
                } else {
                    callback(null);
                }
            },
            (err) => {
                callback(null);
            }
            );

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

    var parseWeatherResponse = function (response) {
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
                build += 'Nhiệt độ thấp nhất ' + min + ' độ. Nhiệt độ cao nhất ' + max + ' độ. ';
            }
        }
        if (humidity) {
            build += 'Độ ẩm trung bình ' + humidity + '%. ';
        }
        return build;
    }

    var convertToC = function (temp) {
        return temp - 273.15;
    }

}

module.exports = iotModule;