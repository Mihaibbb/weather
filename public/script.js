

(function getCoords() {

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async position => {
    
        const latitude  =  position.coords.latitude;
        const longitude =  position.coords.longitude;
        
        await getApiurl({ latitude, longitude });
    });

})();

const weatherAppElement = document.querySelector('.weather-app');
const locationTextElement = weatherAppElement.querySelector('[location]');
const weatherStatusElement = weatherAppElement.querySelector('.status');
const currentTimeElement = weatherAppElement.querySelector('.current_time');
const temperatureElement = weatherAppElement.querySelector('[temperature] .text');

// Details
const humidityElement = weatherAppElement.querySelector('[humidity]');
const windElement = weatherAppElement.querySelector('[wind]');
const visibilityElement = weatherAppElement.querySelector('[visibility]');
const altitudeElement = weatherAppElement.querySelector('[altitude]');
const airQualityElement = weatherAppElement.querySelector('[air-quality]');

const searchIcon = weatherAppElement.querySelector('.search i.fa-search');
const locationInput = document.querySelector('.search input');

// Google Places API
const googleSearchBox = new google.maps.places.SearchBox(locationInput);
console.log(googleSearchBox)
googleSearchBox.addListener('places_changed', async () => {
    
    const place = googleSearchBox.getPlaces()[0];
    
    if (place == null) return;
    const placeLatitude = place.geometry.location.lat();
    const placeLongitude = place.geometry.location.lng();
    const coordsObject = {
        latitude: placeLatitude,
        longitude: placeLongitude
    }
    await getApiurl(coordsObject, true);
});

const getLocationCoords = async (data) => {
    console.log(JSON.stringify(data));
    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    };

    const response = await fetch('/location-weather', options);
    const serverCoords = await response.json();

    const prevErrorElement = document.querySelector('.error-search');
    if (prevErrorElement !== null) prevErrorElement.remove();

    if (serverCoords.error) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error-search');
        errorElement.innerText = serverCoords.error;
        locationInput.parentElement.appendChild(errorElement);
        return;
    } 

    const latitude = await serverCoords.lat;
    const longitude = await serverCoords.long;
    
    await getApiurl({latitude, longitude});
}

const getAltitude = async (data) => {

    console.log(data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    }

    const response = await fetch('/altitude', options);
    const json = await response.json();
    const altitude = await json.altitude;
    console.log(await altitude);

    return await altitude;
}


const getApiurl = async (data, changed=false) => {

    // Getting weather data
    
    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    };

    const response = await fetch('/weather', options);
    
    const serverInfo = await response.json();
    console.log(serverInfo);

    // Get json weather icons keywords

    const iconsResponse = await fetch('/icons', {
        method: "POST"
    });

    const iconsData = await iconsResponse.json();
    const icons = await iconsData.weatherIcons;
    console.log(icons)
    // Server info response
    const location = await serverInfo.location;
    const weatherData = await serverInfo.data;
    const dailyData = await serverInfo.daily;
    const astroData = await serverInfo.astro;
    

    // Minmax temp
    const currDayData = dailyData[0];
    const currDayMinTemp = currDayData.day.mintemp_c;
    const currDayMaxTemp = currDayData.day.maxtemp_c;

    // Last update
    const lastUpdate =  await weatherData.last_updated;
    const lastUpdateTime = lastUpdate.split(" ")[lastUpdate.split(" ").length - 1];

    // Details data

    const windData = await weatherData.wind_kph;
    const windDirection = await weatherData.wind_dir;
    const humidityData = await weatherData.humidity;
    const visibilityData = await weatherData.vis_km;
    const airQualityData = await weatherData.air_quality;
    const airQualityNumber = await airQualityData["us-epa-index"];
    
    // Getting icon status

    const iconStatusSrc = await weatherData.condition.icon;

    // Check if it's day

    const dayStatus = weatherData.is_day;

    if (!dayStatus) {
        document.body.classList.add('night');
        document.body.classList.remove('day');
    } else {
        document.body.classList.add('day');
        document.body.classList.remove('night');
    }

    // Current weather status
    const weatherStatus = weatherData.condition.text;
    weatherStatusElement.innerHTML = weatherStatus;

    let statusKeyword = weatherStatus.toLowerCase().replaceAll(" ", "_");
    console.log(statusKeyword);
    if (!dayStatus) statusKeyword += "_night";
    const currStatus = icons[statusKeyword];

    console.log(currStatus)
    

    temperatureElement.innerHTML = `
    <img src=${currStatus} alt="weather status"> 
    <span class="curr-temp">${parseInt(weatherData.temp_c)}°</span>
    <span class="units"> 
        <span class="metric active">C</span> / <span class="imperial">F</span>
    </span>`;

    // minMaxElement.innerHTML = `${parseInt(currDayMinTemp)}° / ${parseInt(currDayMaxTemp)}°`;
    
    const currDate = new Date();

    if (!changed) {
        locationTextElement.innerText = `${location.region}, ${location.country}`;
        currentTimeElement.innerText = `${currDate.getHours() < 10 ? `0${currDate.getHours()}` : currDate.getHours()}:${currDate.getMinutes() < 10 ? `0${currDate.getMinutes()}` : currDate.getMinutes()}`;
    } else {
        locationTextElement.innerText = locationInput.value;
        currentTimeElement.innerText = lastUpdateTime;
    } 

    
    
    const unitElements = temperatureElement.querySelectorAll('.units span');
    const currentTemp = temperatureElement.querySelector('.curr-temp');
    const weatherStatusImg = temperatureElement.querySelector('.text img');
    

    unitElements.forEach(unitElement => {

        unitElement.addEventListener('click', (e) => {
            console.log(e.target)
            const activeUnit = unitElement.parentElement.querySelector('.active');

            let newTemp;

            if (unitElement.innerText === activeUnit.innerText) return;
            
            if (unitElement.innerText === "C") newTemp = parseInt(fahrenheitToCelsius(parseFloat(currentTemp.innerText)));
            else newTemp = parseInt(celsiusToFahrenheit(parseFloat(currentTemp.innerText)));

            currentTemp.innerText = `${newTemp}°`;
            
            console.log(temperatureElement)
            
            if (unitElement.innerText === "C") {
               
               
                activeUnit.innerText = "C";
                activeUnit.classList.add('metric');
                activeUnit.classList.remove('imperial');
                
            
                unitElement.innerText = "F";
                unitElement.classList.add('imperial');
                unitElement.classList.remove('metric');

            } else {
                console.log(activeUnit, unitElement)
                
                activeUnit.innerText = "F";
                activeUnit.classList.add('imperial');
                activeUnit.classList.remove('metric');
            
                unitElement.innerText = "C";
                unitElement.classList.add('metric');
                unitElement.classList.remove('imperial');
            }

            unitElement.classList.remove('active');
            activeUnit.classList.add('active');

            
        });
    });

    // Getting options data
    

    windElement.innerHTML = '';

    const windIconElement = document.createElement('img');
    windIconElement.classList.add('wind-img');
    windIconElement.src = 'img/wind.svg';

    const windIconContainer = document.createElement('div');
    windIconContainer.classList.add('icon');
    windIconContainer.appendChild(windIconElement);

    const windSpeedElement = document.createElement('div');
    windSpeedElement.classList.add('wind-speed');
    windSpeedElement.innerText = `${windData} km/h`;

    const windNameElement = document.createElement('div');
    windNameElement.classList.add('detail');
    windNameElement.innerText = 'Wind';

    windElement.appendChild(windIconContainer);
    windElement.appendChild(windNameElement);
    windElement.appendChild(windSpeedElement);
    

    humidityElement.innerHTML = '';

    const humidityIconElement = document.createElement('img');
    humidityIconElement.classList.add('humidity-img');
    humidityIconElement.src = 'img/water.svg';

    const humidityIconContainer = document.createElement('div');
    humidityIconContainer.classList.add('icon');
    humidityIconContainer.appendChild(humidityIconElement);

    const humidityPercentElement = document.createElement('div');
    humidityPercentElement.classList.add('humidity-percent');
    humidityPercentElement.innerText = `${humidityData}%`;

    const humidityNameElement = document.createElement('div');
    humidityNameElement.classList.add('detail');
    humidityNameElement.innerText = 'Humidity';

    humidityElement.appendChild(humidityIconContainer);
    humidityElement.appendChild(humidityNameElement);
    humidityElement.appendChild(humidityPercentElement);


    visibilityElement.innerHTML = '';
    const visibilityIconElement = document.createElement('img');
    visibilityIconElement.classList.add('visibility-img');
    visibilityIconElement.src = 'img/eye.png';

    const visibilityIconContainer = document.createElement('div');
    visibilityIconContainer.classList.add('icon');
    visibilityIconContainer.appendChild(visibilityIconElement);

    const visibilityKmElement = document.createElement('div');
    visibilityKmElement.classList.add('visibility-data');
    visibilityKmElement.innerText = `${visibilityData}km`;

    const visibilityNameElement = document.createElement('div');
    visibilityNameElement.classList.add('detail');
    visibilityNameElement.innerText = 'Visibility';

    visibilityElement.appendChild(visibilityIconContainer);
    visibilityElement.appendChild(visibilityNameElement);
    visibilityElement.appendChild(visibilityKmElement);
    
    // Get the altitude by API
    const altitude = await getAltitude(data);
    
    altitudeElement.innerHTML = '';
    
    const altitudeIconElement = document.createElement('img');
    altitudeIconElement.classList.add('altitude-img');
    altitudeIconElement.src = 'img/altitude.svg';

    const altitudeIconContainer = document.createElement('div');
    altitudeIconContainer.classList.add('icon');
    altitudeIconContainer.appendChild(altitudeIconElement);

    const altitudeMElement = document.createElement('div');
    altitudeMElement.classList.add('altitude-data');
    altitudeMElement.innerText = `${await altitude}m`;

    const altitudeNameElement = document.createElement('div');
    altitudeNameElement.classList.add('detail');
    altitudeNameElement.innerText = 'Altitude';

    altitudeElement.appendChild(altitudeIconContainer);
    altitudeElement.appendChild(altitudeNameElement);
    altitudeElement.appendChild(altitudeMElement);

    // Air quality element

    // // Creating the apex chart options for air quality
    // const airQualityOptions = {
    //     series: [airQualityNumber],
    //     chart: {
    //       height: 180,
    //       type: "radialBar",
    //       offsetY: -15,
    //       offsetX: -15,
    //       width: "100%"
    //     },

    //     colors: ["rgb(21,187,247)"],
    //     plotOptions: {
    //       radialBar: {
    //         startAngle: 0,
    //         endAngle: 360,
    //         hollow: {
    //           margin: 0,
    //           size: "70%",
    //           background: "rgba(0, 0, 0, .7)",
    //           image: undefined,
    //           position: "front",
    //           dropShadow: {
    //             enabled: true,
    //             top: 3,
    //             left: 0,
    //             blur: 4,
    //             opacity: 0.24
    //           }
    //         },
    //         track: {
    //           background: "rgba(0, 0, 0, .55)",
    //           strokeWidth: "100%",
    //           margin: 0, // margin is in pixels
    //           dropShadow: {
    //             enabled: true,
    //             top: -3,
    //             left: 0,
    //             blur: 4,
    //             opacity: 0.35
    //           }
    //         },
  
    //         dataLabels: {
    //           show: true,
    //           name: {
    //             offsetY: -10,
    //             show: true,
    //             color: "#888",
    //             fontSize: "17px",
    //             fontFamily: "Quicksand, sans-serif",
    //           },
    //           value: {
    //             formatter: function(val) {
    //               return parseInt(val.toString(), 10).toString();
    //             },
    //             color: "rgb(22,184,244)",
    //             fontSize: "36px",
    //             fontFamily: "Quicksand, sans-serif",
                
    //           }
    //         }
    //       }
    //     },
    //     fill: {
    //       type: "gradient",
    //       gradient: {
    //         shade: "dark",
    //         type: "horizontal",
    //         shadeIntensity: 0.5,
    //         gradientToColors: ["rgb(18,102,244)"],
    //         inverseColors: false,
    //         opacityFrom: 1,
    //         opacityTo: 1,
    //         stops: [0, 100]
    //       }
    //     },
    //     stroke: {
    //       lineCap: "round"
    //     },
    //     labels: ["Good"],

    //   };
    
    // Creating the dom elements

    airQualityElement.innerHTML = '';
        
    const qualityIconElement = document.createElement('img');
    qualityIconElement.classList.add('quality-img');
    qualityIconElement.src = 'img/air_quality.svg';

    const qualityIconContainer = document.createElement('div');
    qualityIconContainer.classList.add('icon');
    qualityIconContainer.appendChild(qualityIconElement);

    const  qualityUnitElement = document.createElement('div');
    qualityUnitElement.classList.add('air-data');
    if (airQualityNumber === 1) {
        qualityUnitElement.innerText = 'Very Good';
    } else if (airQualityNumber > 1 && airQualityNumber <= 50) {
        qualityUnitElement.innerText = 'Good';
    } else if (airQualityNumber > 50 && airQualityNumber <= 100) {
        qualityUnitElement.innerText = 'Moderate';
    } else if (airQualityNumber > 100 && airQualityNumber <= 200) {
        qualityUnitElement.innerText = 'Unhealthy';
    }


    const qualityNameElement = document.createElement('div');
    qualityNameElement.classList.add('detail');
    qualityNameElement.innerText = 'Air Quality';

    airQualityElement.appendChild(qualityIconContainer);
    airQualityElement.appendChild(qualityNameElement);
    airQualityElement.appendChild(qualityUnitElement);

    // Get the next days 

    const nextDaysContainer = document.querySelector('.next-days');

    nextDaysContainer.innerHTML = "";

    const currLocalTime = location.localtime.split(" ")[0];

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Getting the current Hour
    
    const currentHour = currDate.getHours();
    console.log(currentHour)
    const minHour = currentHour - 2;
    const currentHourString = currDate.getHours() < 12 ? `${currDate.getHours()}AM` : `${parseInt(currDate.getHours()) - 12}PM`;
    let todayHoursDate = [],
        todayHours = [],
        todayHoursTemp = [],
        evenHourStamp,
        todayHoursWind = [];

    dailyData.forEach(day => {
        const currDay = document.createElement('div');
        currDay.classList.add('day-view');

        const title = document.createElement('h2');
        title.classList.add('title');

        const d = new Date(day.date);
        
        const dayData = day.date.split("-");
        const dayNumber = dayData[dayData.length - 1];
       
        const dayName = DAYS[d.getDay()];

        if (day.date === currLocalTime) {
            title.innerText = 'Today';
            currDay.classList.add('highlight');
        }
        else title.innerText = `${dayName} ${Number(dayNumber)}`;

        const dailyMinTemp = day.day.mintemp_c;
        const dailyMaxTemp = day.day.maxtemp_c;
        const dailyCondition = day.day.condition;
        const dailyIcon = dailyCondition.icon;
        const dailyText = dailyCondition.text;
        const dailyPrecip = day.day.totalprecip_mm;
        const hourlyStatusWeather = day.hour;
        const hourlyWindSpeed = day.wind_kph;
        

        let dailyTextKeyword = dailyText.toLowerCase().replaceAll(" ", "_");
        console.log(dailyTextKeyword);
        const dailyStatus = icons[dailyTextKeyword];

        if (day.date === currLocalTime) {
            hourlyStatusWeather.forEach(hourData => {
                const hourDate = new Date(hourData.time);
                const hourTime = hourDate.getHours();
                const hourString = hourTime === 0 ? "12 AM" : hourTime < 12 ? `${hourTime} AM` : `${parseInt(hourTime) - 12} PM`;
                
                if (hourTime === minHour) {
                    todayHours.push(hourString);
                    const thisTemp = Math.round(hourData.temp_c);
                    const thisWind = Math.round(hourData.wind_kph);
                    todayHoursTemp.push(thisTemp);
                    evenHourStamp = currentHour % 2;
                    todayHoursDate.push(hourData.time);
                    todayHoursWind.push(thisWind);
                    
                } else if (hourTime > minHour && evenHourStamp === hourTime % 2) {
                    todayHours.push(hourString);
                    const thisTemp = Math.round(hourData.temp_c);
                    const thisWind = Math.round(hourData.wind_kph);
                    todayHoursTemp.push(thisTemp);
                    todayHoursDate.push(hourData.time);
                    todayHoursWind.push(thisWind);
                }                
            }); 

           
        } else {
            
            hourlyStatusWeather.forEach(hourData => {
               
                if (todayHours.length >= 14) return;
                const hourDate = new Date(hourData.time);
                const hourTime = hourDate.getHours();  
                const hourString = hourTime === 0 ? "12 AM" : hourTime === 12 ? "12 PM" : hourTime < 12 ? `${hourTime} AM` : `${parseInt(hourTime) - 12} PM`;
                
                if (hourTime % 2 === evenHourStamp) {
                    todayHours.push(hourString);
                    const thisTemp = Math.round(hourData.temp_c);
                    const thisWind = Math.round(hourData.wind_kph);
                    todayHoursTemp.push(thisTemp);
                    todayHoursDate.push(hourData.time);
                    todayHoursWind.push(thisWind);
                }
            });
        }

        // const currentlyStatusWeather
        const divIcon = document.createElement('div');
        divIcon.classList.add('icon-container');

        const icon = document.createElement('img');
        icon.classList.add('icon');
        icon.src = dailyStatus;

        divIcon.appendChild(icon);

        const tempsContainer = document.createElement('div');
        tempsContainer.classList.add('temps-container');
        
        const maxTemp = document.createElement('div');
        maxTemp.classList.add('max_temp');
        maxTemp.innerText = `${parseInt(dailyMaxTemp)}°`;

        const slashElement = document.createElement('span');
        slashElement.innerText = '/';

        const minTemp = document.createElement('div');
        minTemp.classList.add('min_temp');
        minTemp.innerText = `${parseInt(dailyMinTemp)}°`;

        tempsContainer.appendChild(maxTemp);
        tempsContainer.appendChild(slashElement);
        tempsContainer.appendChild(minTemp);

        const condition = document.createElement('div');
        condition.classList.add('condition');
        condition.innerText = dailyText;

        const totalPrecip = document.createElement('div');
        totalPrecip.classList.add('total-precipitation');
        const totalPrecipDiv = document.createElement('div');
        totalPrecipDiv.innerText = `${dailyPrecip}mm`;
        totalPrecip.appendChild(totalPrecipDiv);

        currDay.appendChild(title);
        currDay.appendChild(condition);
        currDay.appendChild(tempsContainer);
        currDay.appendChild(divIcon); 
        currDay.appendChild(totalPrecip);
        nextDaysContainer.appendChild(currDay);
    });


    console.log(todayHoursDate, todayHoursTemp);
    console.log(todayHoursWind);
    const allDays = document.querySelectorAll('.day-view');

    // Temp graphics

    const chartOptions = {
        chart: {
            height: 280,
            type: "area",
            
            toolbar: {
                show: false
            },

            offsetY: 20,
        },

        colors: ["rgb(18,102,244)"],
        
        grid: {
            yaxis: {
                lines: {
                    show: false
                }
            },

            xaxis: {
                lines: {
                    show: false
                }
            },

            padding: {
                left: -50,
                right: -50
            },

        },

        dataLabels: {
            style: {
                
                fontSize: '18px',
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: 'bold',
                colors: ["#fff"]
            },
            
            formatter: (val, opt) => {
                return `${val}°`;
            },
            background: {
                enabled: false
            },
            offsetY: -5,
            offsetX: 5
        },
        
        series: [
            {
                name: "Series 1",
                data: todayHoursTemp
            }
        ],

        fill: {
            type: "gradient",
            gradient: {
                shade: "dark",
                gradientToColors: ["rgb(39,58,128)"],
                shadeIntensity: 0,
                type: "horizontal",
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            },

        },

        xaxis: {

            labels: {
                style: {
                    fontSize: '16px',
                    fontFamily: '"Quicksand", sans-serif',
                    colors: "#fff"
                },
                format: "h TT",
            },

            categories: todayHours,

            axisBorder: {
                show: true,
                color: "rgba(0, 0, 0, .8)",
            },

            axisTicks: {
                show: false
            },

           
        },

        yaxis: {
            labels: {
                show: false,
                style: {
                    fontSize: '16px',
                    fontFamily: '"Open Sans", sans-serif',
                    colors: "#fff"
                },
                align: "left"
            }, 
            
            min: (min) => {
                if (min > 0) return 0;
                
                return min - (min % 5);
            },

            max: (max) => {
                console.log(max);
                return max + (5 - (max % 5));
            },
            
        },

        tooltip: {
            shared: false
        }

    };

    const chartElement = document.querySelector('#chart');

    const chart = new ApexCharts(chartElement, chartOptions);
    chartElement.style.maxWidth = `${allDays[0].offsetWidth * 3 + 60}px`;
    
    chart.render();

    // Change color of chart by night

    if (!dayStatus) {
        console.log('')
        chart.updateOptions({
            colors: ["rgb(78,164,240)"],

            fill: {
                colors: ["rgb(28,50,104)", "#070B34"],
                gradient: {
                    gradientToColors: ["#070B34"],
                }
                
            }
        });
    } else {
        console.log('in else')
        chart.updateOptions({
            colors: ["rgb(21,187,247)"]
        });
    }

    // Highlight day event listener

    let dayClick = false;

    allDays.forEach((day, dayIdx) => {
        const title = day.querySelector('.title');
        
        day.addEventListener('click', () => {

            const oldHighlight = document.querySelector('.highlight');
            if (oldHighlight !== null) oldHighlight.classList.remove('highlight');
            day.classList.toggle('highlight');
            
            // Getting and stocating hourly data
            const newDayData = dailyData[dayIdx];
            const allHoursData = newDayData.hour;
            let newTimes = [], newTemps = [];
            allHoursData.forEach(hourData => {
                if (newTimes.length >= 12) return;
                const actualTime = new Date(hourData.time);
                const actualHour = actualTime.getHours();
                if (actualHour % 2 === 0) {
                    const actualHourString = `${actualHour} ${actualHour <= 12 ? " AM" : " PM" }`;
                    const actualTemp = Math.round(hourData.temp_c);
                    newTemps.push(actualTemp);
                    newTimes.push(actualHourString);
                }
            });

            if (title === "Today") {
                // Updating options 
                chart.updateOptions({
                    series: [{
                        data: newTemps
                    }],

                    xaxis: {
                        categories: todayHoursTemp
                    }
                });
            } else {
                 // Updating options 
                chart.updateOptions({
                    series: [{
                        data: newTemps
                    }],

                    xaxis: {
                        categories: newTimes
                    }
                });
            }

            // Trigger event for air quality 

            dayClick = {
                hoursData: newDayData.hour
            };
        });
    });


    // Details chart

    const detailsChartElement = document.querySelector('#details-chart');

    const detailsOptions = {
        chart: {
            height: 280,
            type: "area",
            
            toolbar: {
                show: false
            },

            offsetY: 20,
        },

        colors: ["rgb(18,102,244)"],
        
        grid: {
            yaxis: {
                lines: {
                    show: false
                }
            },

            xaxis: {
                lines: {
                    show: false
                }
            },

            padding: {
                left: -50,
                right: -50
            },

        },

        dataLabels: {
            style: {
                
                fontSize: '18px',
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: 'bold',
                colors: ["#fff"]
            },
            
            formatter: (val, opt) => {
                const idx = opt.dataPointIndex;
                if (idx === todayHoursWind.length - 1 || idx === 0) return; 
                return `${Math.round(val)} km/h`;
            },
            background: {
                enabled: false
            },
            offsetY: -6.5,
            offsetX: 1.5,

            textAnchor: 'middle',
        },
        
        series: [
            {
                name: "Wind Speed",
                data: todayHoursWind
            }
        ],

        fill: {
            type: "gradient",
            gradient: {
                shade: "dark",
                gradientToColors: ["royalblue"],
                shadeIntensity: 0,
                type: "horizontal",
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            },

        },

        xaxis: {

            labels: {
                style: {
                    fontSize: '16px',
                    fontFamily: '"Quicksand", sans-serif',
                    colors: "#fff"
                },
                format: "h TT",
            },

            categories: todayHours,

            axisBorder: {
                show: true,
                color: "rgba(0, 0, 0, .8)",
            },

            axisTicks: {
                show: false
            },

           
        },

        yaxis: {
            labels: {
                show: false,
                style: {
                    fontSize: '16px',
                    fontFamily: '"Open Sans", sans-serif',
                    colors: "#fff"
                },
                align: "left"
            }, 
            
            min: (min) => {
                if (min > 0) return 0;
                
                return min - (min % 5);
            },

            max: (max) => {
                console.log(max);
                return max + (5 - (max % 5));
            },
            
        },

        tooltip: {
            shared: false
        }
    };
    
    const detailsChart = new ApexCharts(detailsChartElement, detailsOptions);
    detailsChart.render();
    
};

const celsiusToFahrenheit = (temp) => {
    return temp * 9/5 + 32;
};

const fahrenheitToCelsius = (temp) => {
    return (temp - 32) * (5 / 9);
};




