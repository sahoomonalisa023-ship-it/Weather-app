const API_KEY = "3adcf823b8a0cbbdfd0bed4bda391b1c";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// DOM Elements
const cityInput = document.getElementById("city-input");
const typeSelect = document.getElementById("type-select");
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
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// MAIN FUNCTION
async function handleSearch() {
  const city = cityInput.value.trim();
  const type = typeSelect.value;

  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  clearUI();
  showLoading(true);

  try {
    let url = "";

    if (type === "current") {
      url = `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`;
    } else {
      url = `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`;
    }

    console.log("Fetching:", url);

    const response = await fetch(url);
    const data = await response.json();

    showLoading(false);

    if (data.cod !== 200 && data.cod !== "200") {
      showError(data.message || "City not found");
      return;
    }

    if (type === "current") {
      renderCurrentWeather(data);
    } else {
      renderForecast(data);
    }
  } catch (error) {
    console.error(error);
    showLoading(false);
    showError("Network error. Please try again.");
  }
}

// CURRENT WEATHER
function renderCurrentWeather(data) {
  resultCity.textContent = data.name;
  resultDate.textContent = "Current Weather";

  resultTemp.textContent = `${data.main.temp}°C`;
  resultDesc.textContent = data.weather[0].description;

  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  detailHumidity.textContent = `${data.main.humidity}%`;
  detailWind.textContent = `${data.wind.speed} km/h`;
  detailPressure.textContent = `${data.main.pressure} mb`;

  weatherResult.classList.remove("hidden");
}

// FORECAST (5 DAY)
function renderForecast(data) {
  forecastResult.innerHTML = "<h3>5-Day Forecast</h3>";

  // every 8th item ≈ 1 day
  const dailyData = data.list.filter((item, index) => index % 8 === 0);

  dailyData.forEach((item) => {
    const date = new Date(item.dt_txt).toLocaleDateString();

    const div = document.createElement("div");
    div.className = "forecast-item";

    div.innerHTML = `
      <span>${date}</span>
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
        <span>${item.main.temp}°C</span>
      </div>
    `;

    forecastResult.appendChild(div);
  });

  forecastResult.classList.remove("hidden");
}

// LOADING
function showLoading(show) {
  loadingSpinner.classList.toggle("hidden", !show);
}

// ERROR
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove("hidden");

  setTimeout(() => {
    errorMessage.classList.add("hidden");
  }, 3000);
}

// CLEAR UI
function clearUI() {
  errorMessage.classList.add("hidden");
  weatherResult.classList.add("hidden");
  forecastResult.classList.add("hidden");
  forecastResult.innerHTML = "";
}
