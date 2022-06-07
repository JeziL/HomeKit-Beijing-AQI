# HomeKit-Beijing-AQI

This project fetches the air quality data of Beijing from the official website [1], and display it through a pseudo air quality sensor in HomeKit.

<img src="https://i.loli.net/2021/03/06/yqm1GfnWXk4Ep9T.png" height=500 />

## Introduction

This project consists of two parts:

- `aqi_updater`: A Node.js tool to fetch air quality and weather data (which is needed for converting units when calculating AQI index [2]) from public web services.

- `homebridge-bjaqi`: A [Homebridge](https://homebridge.io/) plugin to simulate an air quality sensor with HomeKit support.
    - Note: The AQI (Air Quality Index) is calculated based on the EPA (United States Environmental Protection Agency) standard [3]. Other standards [4] might be supported in the future, too.

## Usage

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Homebridge](https://homebridge.io/)
- A device (eg. a [Raspberry Pi](https://www.raspberrypi.org/)) as your Homebridge server.
- Register at [dev.qweather.com](https://dev.qweather.com/en/) to get an API key for the weather data we need.

### Installation

1. Clone the repo.

    ```
    git clone https://github.com/JeziL/HomeKit-Beijing-AQI.git
    ```

2. Install dependencies.

    ```
    cd aqi_updater && npm i
    cd ../homebridge-bjaqi && npm i
    ```
3. Create a config.json file in the repo root directory. A sample config.json file:

    ```json
    {
        "aqi": {
            "url": "http://zx.bjmemc.com.cn/getAqiList.shtml",
            "writePath": "/path/to/aqi.json",
            "readPath": "/path/to/aqi.json",
            "favStations": [
                11,
                85,
                54
            ],
            "primeStation": 11
        },
        "weather": {
            "url": "https://devapi.qweather.com/v7/weather/now",
            "apiKey": "your-api-key-here",
            "locationID": "101010900"
        }
    }

    ```

    - `aqi.writePath`: The program will fetch and write air quality & weather data to that file with a fixed time interval (which is configured in the next step).
    - `aqi.readPath`: The program will read air quality & weather data from that file. It could differ from the `aqi.writePath` when running Homebridge in a docker container.
    - `aqi.favStations`: The program will only save the data from these specified monitor stations. The IDs of all stations are as follows (this could change in the future).

        | ID | Station | ID | Station | ID | Station | ID | Station | ID | Station |
        |---|---|---|---|---|---|---|---|---|---|
        6 | 顺义新城|15 | 西城万寿西宫|26 | 朝阳奥体中心|68 | 海淀四季青|60 | 顺义北小营
        7 | 延庆夏都|17 | 昌平镇|27 | 朝阳农展馆|85 | 丰台小屯|56 | 昌平南邵
        8 | 平谷镇|18 | 门头沟双峪|28 | 密云镇|54 | 石景山老山|51 | 门头沟三家店
        9 | 房山良乡|20 | 大兴黄村|29 | 石景山古城|69 | 房山燕山|67 | 平谷新城
        10 | 亦庄开发区|21 | 定陵(对照点)|32 | 西城官园|83 | 通州永顺|62 | 怀柔新城
        11 | 丰台云岗|24 | 东城东四|38 | 海淀万柳|64 | 通州东关|63 | 密云新城
        13 | 怀柔镇|25 | 东城天坛|40 | 京东南区域点|55 | 大兴旧宫|57 | 延庆石河营
    
    - `aqi.primeStation`: This is the staion whose data will be shown in the Home app.
    - `weather.locationID`: This is the city we will get temperature and air pressure of. Typically it should be close to the location of `aqi.primeStation`. Look up the location ID referring to [this webpage](https://dev.qweather.com/en/docs/api/geo/city-lookup/).

4. Run `aqi_updater` with a fixed time interval (eg. every 30 minutes) to update data. We use `crontab` here.

    ```
    crontab -e

    0,30 * * * * cd /path/to/aqi_updater && npm start
    ```

5. Link the Homebridge plugin.

    ```
    cd homebridge-bjaqi && npm link
    ```

6. You should see `Homebridge BJ AQI` in your Homebridge UI Plugins page. Hit `SETTINGS` and add a `userConfigPath` key that points to the config.json file.

    ```JSON
    {
        "accessory": "AirQualitySensor",
        "name": "Air Quality Sensor",
        "userConfigPath": "/path/to/config.json"
    }
    ```

7. Manually trigger the first data update, then reboot Homebridge server through the web UI. It should be all set.

    ```
    cd /path/to/aqi_updater && npm start
    ```

## References

[1] [北京市生态环境监测中心](http://www.bjmemc.com.cn/)

[2] [Air Pollution Information System - Unit Conversion](http://www.apis.ac.uk/unit-conversion)

[3] [Technical Assistance Document for the Reporting of Daily Air Quality](https://www.airnow.gov/sites/default/files/2020-05/aqi-technical-assistance-document-sept2018.pdf)

[4] [中华人民共和国生态环境部 - 环境空气质量指数（AQI）技术规定（试行）](https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/jcffbz/201203/t20120302_224166.shtml)