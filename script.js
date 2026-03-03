const API_KEY = "972055286a4b35193c8c71416bdb9b5e";
const BASE_URL = "http://api.weatherstack.com";

// DOM Elements
const cityInput = document.getElementById("city-input");
const typeSelect = document.getElementById("type-select");
const dateInput = document.getElementById("date-input");
const searchBtn = document.getElementById("search-btn");
const loadingSpinner = document.getElementById("loading-spinner");
const errorMessage = document.getElementById("error-message");
const weatherResult = document.getElementById("weather-result");
const forecastResult = document.getElementById("forecast-result");

// Result Elements
const resultCity = document.getElementById("result-city");
const resultDate = document.getElementById("result-date");
const weatherIcon = document.getElementById("weather-icon");
const resultTemp = document.getElementById("result-temp");
const resultDesc = document.getElementById("result-desc");
const detailHumidity = document.getElementById("detail-humidity");
const detailWind = document.getElementById("detail-wind");
const detailPressure = document.getElementById("detail-pressure");

// Event Listeners
searchBtn.addEventListener("click", handleSearch);
typeSelect.addEventListener("change", toggleDateInput);
cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
});

function toggleDateInput() {
    if (typeSelect.value === "historical") {
        dateInput.classList.remove("hidden");
    } else {
        dateInput.classList.add("hidden");
    }
}

async function handleSearch() {
    const city = cityInput.value.trim();
    const type = typeSelect.value;
    const date = dateInput.value;

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    if (type === "historical" && !date) {
        showError("Please select a date for historical weather.");
        return;
    }

    // Clear previous UI
    clearUI();
    showLoading(true);

    try {
        let url = "";
        
        // Construct API URL based on type
        if (type === "current") {
            url = `${BASE_URL}/current?access_key=${API_KEY}&query=${encodeURIComponent(city)}`;
        } else if (type === "forecast") {
            // Weatherstack Free Plan might restrict forecast days, but we set it to 7 as requested
            url = `${BASE_URL}/forecast?access_key=${API_KEY}&query=${encodeURIComponent(city)}&forecast_days=7`;
        } else if (type === "historical") {
             url = `${BASE_URL}/historical?access_key=${API_KEY}&query=${encodeURIComponent(city)}&historical_date=${date}`;
        }

        console.log(`Fetching: ${url}`); // Debug

        const response = await fetch(url);
        const data = await response.json();

        showLoading(false);

        if (data.success === false) {
            // Weatherstack API errors (e.g., city not found, plan limits)
            const errorMsg = data.error.info || "City not found or API error.";
            showError(errorMsg);
        } else {
            // Success
            if (type === "current") {
                renderCurrentWeather(data);
            } else if (type === "forecast") {
                if (data.forecast) {
                    renderForecast(data);
                } else {
                    // Fallback if forecast data isn't returned (e.g. plan restriction)
                    renderCurrentWeather(data);
                    showError("Forecast data might not be available on this plan. Showing current weather instead.");
                }
            } else if (type === "historical") {
                renderHistorical(data);
            }
        }

    } catch (error) {
        console.error(error);
        showLoading(false);
        showError("Network error. Please try again.");
    }
}

function renderCurrentWeather(data) {
    const current = data.current;
    const location = data.location;

    resultCity.textContent = `${location.name}, ${location.country}`;
    resultDate.textContent = `Local Time: ${location.localtime}`;
    
    resultTemp.textContent = `${current.temperature}°`;
    resultDesc.textContent = current.weather_descriptions[0];
    weatherIcon.src = current.weather_icons[0];

    detailHumidity.textContent = `${current.humidity}%`;
    detailWind.textContent = `${current.wind_speed} km/h`;
    detailPressure.textContent = `${current.pressure} mb`;

    weatherResult.classList.remove("hidden");
}

function renderForecast(data) {
    // Note: Weatherstack structure for forecast
    // data.forecast is an object where keys are dates "2023-10-27": { ... }
    
    // First render current weather as the main card
    renderCurrentWeather(data);

    // Then process forecast data
    forecastResult.innerHTML = "<h3>7-Day Forecast</h3>";
    const forecastData = data.forecast;
    
    if (!forecastData) return;

    Object.keys(forecastData).forEach(date => {
        const day = forecastData[date];
        const div = document.createElement("div");
        div.className = "forecast-item";
        div.innerHTML = `
            <span class="forecast-date">${date}</span>
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${day.hourly[0]?.weather_icons[0] || ''}" style="width:30px; height:30px;">
                <span>${day.mintemp}° / <span class="forecast-temp">${day.maxtemp}°</span></span>
            </div>
        `;
        forecastResult.appendChild(div);
    });

    forecastResult.classList.remove("hidden");
}

function renderHistorical(data) {
    const historicalData = data.historical;
    const dateKey = Object.keys(historicalData)[0]; // The date we asked for
    const info = historicalData[dateKey];
    const location = data.location;

    // The 'historical' endpoint structure is slightly different, sometimes similar to forecast
    // Depending on plan, it might return hourly data.
    
    // We will try to map it to the main card
    resultCity.textContent = `${location.name}, ${location.country}`;
    resultDate.textContent = `Historical Data: ${dateKey}`;
    
    // Usually historical returns 'hourly', specific properties might vary.
    // We take the average or the first hour available if mid-day aggregation isn't there
    // For simplicity in this demo, let's take the first hourly entry or "avg" if available.
    
    // Weatherstack historical response usually has: historical: { "YYYY-MM-DD": { date: "...", date_epoch: ..., mintemp: ..., maxtemp: ..., avgtemp: ..., hourly: [...] } }
    
    resultTemp.textContent = `${info.avgtemp}°`; // Average temp for the day
    
    // Description/Icon usually comes from hourly analysis, let's pick noon (12:00) or index 0
    const midDay = info.hourly[Math.floor(info.hourly.length / 2)] || info.hourly[0];
    
    resultDesc.textContent = midDay.weather_descriptions[0];
    weatherIcon.src = midDay.weather_icons[0];

    detailHumidity.textContent = `${midDay.humidity}%`; // Approximate from mid-day
    detailWind.textContent = `${midDay.wind_speed} km/h`;
    detailPressure.textContent = `${midDay.pressure} mb`;

    weatherResult.classList.remove("hidden");
}


function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove("hidden");
    } else {
        loadingSpinner.classList.add("hidden");
    }
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove("hidden");
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorMessage.classList.add("hidden");
    }, 5000);
}

function clearUI() {
    errorMessage.classList.add("hidden");
    weatherResult.classList.add("hidden");
    forecastResult.classList.add("hidden");
    forecastResult.innerHTML = "";
}
