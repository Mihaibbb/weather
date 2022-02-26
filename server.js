if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const apiKey = process.env.API_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;
const airQualityApiKey = process.env.AIRQUALITY_API_KEY;

const express = require('express');
const axios = require('axios');
const http = require('http');
const fs = require('fs');
const path = require('path');

const weatherIconsJSON = fs.readFileSync(path.resolve(__dirname, 'json/icons.json'));
const weatherIcons = JSON.parse(weatherIconsJSON);

const app = express();
app.use(express.json());
app.use(express.static('public'));

const server = http.createServer(app);

server.on('error', err => {
    console.error('Server error: ', err);
});

app.listen(8000, () => console.log('Server started'));

app.post('/weather', (req, res) => {
    
    const requestSent = req.body;
    console.log(requestSent);
    const latitude = requestSent.latitude;
    const longitude = requestSent.longitude;
    console.log(requestSent);
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude}, ${longitude}&days=10&aqi=yes&units=auto`;

    axios({
        url: url,
        responseType: 'json'
    }).then(data => {
       
        res.json({
            data: data.data.current,
            location: data.data.location,
            daily: data.data.forecast.forecastday,
            astro: data.data.forecast.forecastday.astro
        });
    });
});

app.post('/location-weather', async (req, res) => {
    const locationString = req.body.value;
    const url = `http://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${locationString}`;
    
    try {
        const data = await axios({
            url: url,
            responseType: 'json'
        });

        
    
        if (await data.data[0] === undefined) {
            res.json({
                error: "This location doesn't exist."
            });
            
            res.end();
            
        } else {
            res.json({
                lat: data.data[0].lat,
                long: data.data[0].lon
            });
        }

    } catch(e) {   
        res.json({
            error: "This location doesn't exist."
        });
        res.end();
    }
});

app.post('/altitude', async (req, res) => {
    const coords = req.body;
    console.log(coords);
    const longitude = coords.longitude;
    const latitude = coords.latitude;

    const url = `https://api.airmap.com/elevation/v1/ele?points=${latitude},${longitude}`;
    console.log(url);

    try {
        const apiRequest = await axios({
            url: url,
            responseType: 'json'
        });

        const data = await apiRequest.data;
        const altitude = await Number(data.data);
        res.json({altitude});

        console.log({altitude});

    } catch(e) {
        res.json({
            error: "This location doesn't exist."
        });
        res.end();
    }
});

app.post('/location', async (req, res) => {
    const string = req.body.string;
    const config = {
        method: 'get',
        url: `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${string}&key=${googleApiKey}`,
        headers: {

        }
    };

    try {
        const googleReq = await axios(config);
        const googleRes = await JSON.stringify(googleReq.data);
        console.log(await googleRes);
    } catch(e) {
        res.json({error: e})
    }
    
    res.json(googleRes);
});

app.post('/air-quality', async (req, res) => {
    const data = req.body;
    const latitude = data.latitude;
    const longitude = data.longitude;

    const url = `https://api.weatherbit.io/v2.0/current/airquality?lat=${latitude}&lon=${longitude}&key=${airQualityApiKey}`;

    const airQualityReq = await axios({
        url: url,
        responseType: 'json'
    });

    const airQualityRes = await airQualityReq.data;
});

// JSON post links

app.post('/icons', (req, res) => {
    res.json({weatherIcons});
}); 