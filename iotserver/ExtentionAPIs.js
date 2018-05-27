let rxhttp = require('rx-http-request').RxHttpRequest;
let Promise = require('promise');
let sprintf = require('sprintf-js').sprintf;

const HOST_OPEN_WEATHER = 'http://api.openweathermap.org/data/2.5/weather';
const WEATHER_LOCATION_ID = '1580578';
const OPEN_WEATHER_APP_ID = '4087bd8be866da223189a20f0d3e2f55';
const AUTHENTICATION_ECOM_SERVER = 'Basic a3l0aHVhdEBraW1zb250aWVuLmNvbTpDaG90cm9ubmllbXZ1aTE=';


class ExtentionAPIs {


    
    constructor() {

    }

    callAPIAskWiki(ask) {
        return new Promise(function (resolve, reject) {
            rxhttp.get('https://vi.wikipedia.org/w/api.php?action=opensearch&search=' + ask + '&limit=1&format=json')
                .subscribe(
                    (data) => {
                        if (data.body) {
                            let ret = JSON.parse(data.body);
                            if (ret[2][0]) {
                                resolve(ret[2][0]);
                            } else {
                                reject('Not result');
                            }
                        } else {
                            reject('Data not found')
                        }
                    },
                    (err) => {
                        reject(err);
                    }
                );
        });
    }

    callAPIAskWeather() {
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
        return new Promise(function (resolve, reject) {
            rxhttp.get(HOST_OPEN_WEATHER, options)
                .subscribe((data) => {
                    if (data.body) {
                        resolve(_parseWeatherResponse(data.body));
                    } else {
                        reject('Not response');
                    }
                }, (err) => reject('Error'));
        });
    }

    changeDevice (id, action) {
        var options = {
            qs: {
                'deviceID': id, // -> uri + '?access_token=xxxxx%20xxxxx'
                'name': action
            },
            headers: {
                'Authorization': AUTHENTICATION_IOT_SERVER
            },
            json: true
        };

        return new Promise(function (resolve, reject) {
            rxhttp.get(HOST_IOT + "/callAction", options).subscribe(
                (data) => resolve(data.response.statusCode),
                (err) => reject("Error")
            );
        });
    }

    changeScene (id, action) {
        var options = {
            qs: {
                'id': id,
                'action': action
            },
            headers: {
                'Authorization': AUTHENTICATION_IOT_SERVER
            },
            json: true
        };

        return new Promise(function (resolve, reject) {
            rxhttp.get(HOST_IOT + "/sceneControl", options).subscribe(
                (data) => resolve(data.response.statusCode),
                (err) => reject("Error")
            );
        });
        
    }
    
}

function _parseWeatherResponse(response) {
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
            let temp = _convertToC(parseFloat(minTemp));
            build += sprintf('Nhiệt độ trung bình %.1f độ. ', temp);
        } else {
            let min = _convertToC(parseFloat(minTemp));
            let max = _convertToC(parseFloat(maxTemp));
            build += 'Nhiệt độ thấp nhất ' + min + ' độ. Nhiệt độ cao nhất ' + max + ' độ. ';
        }
    }
    if (humidity) {
        build += 'Độ ẩm trung bình ' + humidity + '%. ';
    }
    return build;
}

function _convertToC(temp) {
    return temp - 273.15;
}

module.exports = new ExtentionAPIs();