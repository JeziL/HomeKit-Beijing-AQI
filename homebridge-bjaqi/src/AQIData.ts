const interp1 = (bp_lo: number, bp_hi: number, i_lo: number, i_hi: number, value: number) => {
    return (i_hi - i_lo) / (bp_hi - bp_lo) * (value - bp_lo) + i_lo;
};

const interpIAQI = (bp: number[], iaqiBP: number[], step: number, value: number) => {
    let iaqi = -1;
    for (var i = 0; i < iaqiBP.length + 1; i++) {
        if (value > bp[i] + step && value <= bp[i+1]) {
            iaqi = interp1(bp[i] + step, bp[i+1], iaqiBP[i] + 1, iaqiBP[i+1], value);
        }
    }
    return iaqi;
};

export class AQIData {
    public  readonly pm10: number
    public  readonly pm25: number
    private readonly pm10Avg24Hrs: number
    private readonly pm25Avg24Hrs: number
    public  readonly so2: number
    private readonly so2Avg24Hrs: number
    public  readonly o3: number
    private readonly o324Hrs: string
    public  readonly no2: number
    private readonly co: number
    private readonly co24Hrs: string
    public  readonly coPPM: number

    private          aqi: number
    public           aqiLevel: number

    private readonly weather: any

    constructor(data: any, weather: any) {
        this.pm10 = data ? data.pm10_01 : 0;
        this.pm25 = data ? data.pm2_01 : 0;
        this.pm10Avg24Hrs = data ? parseFloat(data.pm10avg) : 0;
        this.pm25Avg24Hrs = data ? parseFloat(data.pm25avg) : 0;
        this.so2 = data ? data.so2_01 : 0;
        this.so2Avg24Hrs = data ? parseFloat(data.so2avg) : 0;
        this.o3 = data ? data.o3_01 : 0;
        this.o324Hrs = data ? data.o324h : "0,0,0,0,0,0,0,0";
        this.no2 = data ? data.no2_01 : 0;
        this.co = data ? data.co_01 : 0;
        this.co24Hrs = data ? data.co24h : "0,0,0,0,0,0,0,0";
        this.weather = weather ? weather : { temp: 25, pressure: 1013 };
        this.coPPM = this.co * 83.155 * (273.15 + this.weather.temp) / (this.weather.pressure * 28);
        this.aqi = data ? data.aqi : 0;
        this.aqiLevel = 0;

        this.calcEPAAQI();
    }

    calcEPAAQI() {
        let iaqi: number[] = [];

        const pm25Round = Math.round((this.pm25Avg24Hrs + Number.EPSILON) * 10) / 10;
        const iaqiPm25 = interpIAQI(
            [-0.1, 12, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4],
            [-1, 50, 100, 150, 200, 300, 400, 500],
            0.1, pm25Round);
        iaqi.push(Math.round(iaqiPm25 + Number.EPSILON));

        const pm10Round = Math.round(this.pm10Avg24Hrs + Number.EPSILON);
        const iaqiPm10 = interpIAQI(
            [-1, 54, 154, 254, 354, 424, 504, 604],
            [-1, 50, 100, 150, 200, 300, 400, 500],
            1, pm10Round);
        iaqi.push(Math.round(iaqiPm10 + Number.EPSILON));

        const cohrs = this.co24Hrs.split(",").map(s => parseFloat(s));
        const co8hrs = cohrs.slice(Math.max(cohrs.length - 8, 0));
        let sum = 0; let n = 0;
        co8hrs.forEach(h => {
            if (h >= 0) {
                sum += h;
                n += 1;
            }
        });
        const co8hrsavg = sum / n;
        const co8hrsPPM = co8hrsavg * 83.155 * (273.15 + this.weather.temp) / (this.weather.pressure * 28);
        const coPPMRound = Math.round((co8hrsPPM + Number.EPSILON) * 10) / 10;
        const iaqiCo = interpIAQI(
            [-0.1, 4.4, 9.4, 12.4, 15.4, 30.4, 40.4, 50.4],
            [-1, 50, 100, 150, 200, 300, 400, 500],
            0.1, coPPMRound);
        iaqi.push(Math.round(iaqiCo + Number.EPSILON));

        const no2PPB = this.no2 * 83.155 * (273.15 + this.weather.temp) / (this.weather.pressure * 46);
        const no2PPBRound = Math.round(no2PPB + Number.EPSILON);
        const iaqino2 = interpIAQI(
            [-1, 53, 100, 360, 649, 1249, 1649, 2049],
            [-1, 50, 100, 150, 200, 300, 400, 500],
            1, no2PPBRound);
        iaqi.push(Math.round(iaqino2 + Number.EPSILON));

        const so2PPB = this.no2 * 83.155 * (273.15 + this.weather.temp) / (this.weather.pressure * 64);
        const so2PPBRound = Math.round(so2PPB + Number.EPSILON);
        const iaqiso21hr = interpIAQI(
            [-1, 35, 75, 185, 304, 604, 804, 1004],
            [-1, 50, 100, 150, 200, 300, 400, 500],
            1, so2PPBRound);
        const so2PPBavg = this.so2Avg24Hrs * 83.155 * (273.15 + this.weather.temp) / (this.weather.pressure * 64);
        const so2PPBRoundavg = Math.round(so2PPBavg + Number.EPSILON);
        const iaqiso2avg = interpIAQI(
            [-1, 35, 75, 185, 304, 604, 804, 1004],
            [-1, 50, 100, 150, 200, 300, 400, 500],
            1, so2PPBRoundavg);
        const iaqiso2 = (iaqiso21hr >= 200) ? iaqiso2avg : iaqiso21hr;
        iaqi.push(Math.round(iaqiso2 + Number.EPSILON));

        const o3hrs = this.o324Hrs.split(",").map(s => parseFloat(s));
        const o38hrs = o3hrs.slice(Math.max(o3hrs.length - 8, 0));
        sum = 0; n = 0;
        o38hrs.forEach(h => {
            if (h >= 0) {
                sum += h;
                n += 1;
            }
        });
        const o38hrsavg = sum / n;

        const o3PPM = this.o3 * 83.155 * (273.15 + this.weather.temp) / (this.weather.pressure * 48) / 1000;
        const o3PPMRound = Math.round((o3PPM + Number.EPSILON) * 1000) / 1000;
        const iaqio31hr = interpIAQI(
            [0.124, 0.164, 0.204, 0.404, 0.504, 0.604],
            [100, 150, 200, 300, 400, 500],
            0.001, o3PPMRound);
        const o3PPMavg = o38hrsavg * 83.155 * (273.15 + this.weather.temp) / (this.weather.pressure * 48) / 1000;
        const o3PPMRoundavg = Math.round((o3PPMavg + Number.EPSILON) * 1000) / 1000;
        const iaqio38hr = interpIAQI(
            [-0.001, 0.054, 0.070, 0.085, 0.105, 0.200],
            [-1, 50, 100, 150, 200, 300],
            0.001, o3PPMRoundavg);
        const iaqio3 = Math.max(iaqio31hr, iaqio38hr);
        iaqi.push(Math.round(iaqio3 + Number.EPSILON));

        this.aqi = Math.max.apply(null, iaqi);
        if (this.aqi >= 0 && this.aqi <= 50) {
            this.aqiLevel = 1;
        } else if (this.aqi >= 51 && this.aqi <= 100) {
            this.aqiLevel = 2;
        } else if (this.aqi >= 101 && this.aqi <= 150) {
            this.aqiLevel = 3;
        } else if (this.aqi >= 151 && this.aqi <= 300) {
            this.aqiLevel = 4;
        } else if (this.aqi >= 301 && this.aqi <= 500) {
            this.aqiLevel = 5;
        } else {
            this.aqiLevel = 0;
        }
    }
}
