const CryptoJS = require("crypto-js");
const fetch = require("node-fetch");
const fs = require("fs");
const yargs = require("yargs");


const decryptByDES = (c, k) => {
    const ck = CryptoJS.enc.Utf8.parse(k);
    const d = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(c) }, ck, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return d.toString(CryptoJS.enc.Utf8);
};

const getAQIData = async (config) => {
    const resp = await fetch(config.aqi.url);
    const body = await resp.text();
    let tmp = body.split("eval(\"(\" + decryptByDES('")[1];
    tmp = tmp.split("', '");
    const aqiCiphertext = tmp[0];
    const aqiKey = tmp[1].split("'", 1)[0];
    const aqiList = JSON.parse(decryptByDES(aqiCiphertext, aqiKey));

    let aqiFavList = [];
    aqiList.forEach(a => {
        if (config.aqi.favStations.includes(a.id)) {
            aqiFavList.push(a);
        }
    });
    return aqiFavList;
};

const getWeatherData = async (config) => {
    const resp = await fetch(`${config.weather.url}?key=${config.weather.apiKey}&location=${config.weather.locationID}`);
    const data = await resp.json();
    if (data.code !== "200" || !data.now.temp || !data.now.pressure) {
        return { temp: 25, pressure: 1013 };
    }
    return { temp: parseFloat(data.now.temp), pressure: parseFloat(data.now.pressure) };
};

const updateAQIData = async (config) => {
    let data = {updateTime: Math.floor(Date.now() / 1000)};
    data.aqiList = await getAQIData(config);
    data.weather = await getWeatherData(config);
    fs.writeFileSync(config.aqi.writePath, JSON.stringify(data));
};

const argv = yargs
    .option("config", {
        alias: "c",
        description: "Path to the config.json file.",
        type: "string"
    })
    .help().alias("help", "h")
    .argv;

const config = JSON.parse(fs.readFileSync(argv.config, "utf8"));
updateAQIData(config);
