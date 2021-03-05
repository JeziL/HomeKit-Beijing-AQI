import { AQIData } from "./AQIData";
import fs from "fs";
import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    HAP,
    Logging,
    Service
} from "homebridge";


let hap: HAP;
export = (api: API) => {
    hap = api.hap;
    api.registerAccessory("AirQualitySensor", AirQualitySensor);
};

class AirQualitySensor implements AccessoryPlugin {
    private readonly log: Logging;
    private readonly name: string;

    private readonly aqsService: Service;
    private readonly infoService: Service;

    private aqiData: AQIData;

    readAQIData(userConfigPath: string) {
        const userConfig = JSON.parse(fs.readFileSync(userConfigPath, "utf8"));
        const aqiData = JSON.parse(fs.readFileSync(userConfig.aqi.outputPath, "utf8"));
        aqiData.aqiList.forEach(d => {
            if (d.id === userConfig.aqi.primeStation) {
                this.aqiData = new AQIData(d, aqiData.weather);
            }
        });
        return {
            aqiLevel: this.aqiData.aqiLevel,
            no2: this.aqiData.no2,
            o3: this.aqiData.o3,
            pm10: this.aqiData.pm10,
            pm25: this.aqiData.pm25,
            so2: this.aqiData.so2,
            coPPM: this.aqiData.coPPM,
        };
    }

    constructor(log: Logging, config: AccessoryConfig, api: API) {
        this.log = log;
        this.name = config.name;
        this.aqiData = new AQIData(null, null);

        this.aqsService = new hap.Service.AirQualitySensor(this.name);
        this.aqsService.getCharacteristic(hap.Characteristic.AirQuality)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.readAQIData(config.userConfigPath).aqiLevel);
            });
        this.aqsService.getCharacteristic(hap.Characteristic.NitrogenDioxideDensity)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.readAQIData(config.userConfigPath).no2);
            });
        this.aqsService.getCharacteristic(hap.Characteristic.OzoneDensity)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.readAQIData(config.userConfigPath).o3);
            });
        this.aqsService.getCharacteristic(hap.Characteristic.PM10Density)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.readAQIData(config.userConfigPath).pm10);
            });
        this.aqsService.getCharacteristic(hap.Characteristic.PM2_5Density)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.readAQIData(config.userConfigPath).pm25);
            });
        this.aqsService.getCharacteristic(hap.Characteristic.SulphurDioxideDensity)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.readAQIData(config.userConfigPath).so2);
            });
        this.aqsService.getCharacteristic(hap.Characteristic.CarbonMonoxideLevel)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.readAQIData(config.userConfigPath).coPPM);
            });
        
        this.infoService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "LiLi Industry")
            .setCharacteristic(hap.Characteristic.SerialNumber, "7C927C927231541B54E5")
            .setCharacteristic(hap.Characteristic.Model, "AQS001");
        
        log.info("AirQualitySensor finished initializing.");
    }

    identify(): void {
        this.log("Identify!");
    }

    getServices(): Service[] {
        return [
            this.infoService,
            this.aqsService
        ];
    }
}
