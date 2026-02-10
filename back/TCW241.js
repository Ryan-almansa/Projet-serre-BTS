class TCW241 {
    constructor() {
        this.temperature = null;
        this.h1 = null;
        this.h2 = null;
        this.h3 = null;
        this.humiditeMoyenne = null;
        this.timestamp = new Date();
    }

    setTemperature(value) {
        this.temperature = value;
        this.timestamp = new Date();
    }

    setHumidites(h1, h2, h3) {
        this.h1 = h1;
        this.h2 = h2;
        this.h3 = h3;
        this.humiditeMoyenne = (h1 + h2 + h3) / 3;
        this.timestamp = new Date();
    }

    toJSON() {
        return {
            temperature: this.temperature,
            humidite1: this.h1,
            humidite2: this.h2,
            humidite3: this.h3,
            humiditeSol: this.humiditeMoyenne,
            timestamp: this.timestamp
        };
    }
}

module.exports = TCW241;
