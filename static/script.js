// Store autocomplete suggestions
const cityCache = {};

document.getElementById("plan-trip-btn").addEventListener("click", async () => {
  const rawInput = document.getElementById("city").value;
  // Check cache or geocode to get destination details
  let dest = cityCache[rawInput];
  if (!dest) {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(rawInput)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    dest = geoData.results?.[0];
    if (!dest) throw new Error("Unable to locate destination city.");
  }

  const countryCode = dest.country_code;
  const displayCity = dest.name + (dest.admin1 ? `, ${dest.admin1}` : `, ${dest.country}`);
  const baseCurrency = document.getElementById("base-currency").value;

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");

  try {
    // Determine destination currency
    const countryRes = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    const countryInfo = await countryRes.json();
    const currencyCodes = countryInfo[0].currencies ? Object.keys(countryInfo[0].currencies) : [];
    const destCurrency = currencyCodes[0] || baseCurrency;

    // Fetch weather using city name and country code for precise mapping
    const weatherCityParam = `${dest.name},${countryCode}`;
    const weatherRes = await fetch('/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: weatherCityParam })
    });
    const weatherData = await weatherRes.json();
    if (weatherData.error) throw new Error(weatherData.error);

    // Display weather
    document.getElementById("weather-city").innerText = displayCity;
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";
    weatherData.forecast.forEach(day => {
      const div = document.createElement("div");
      div.className = "forecast-day";
      div.innerHTML = `
        <div class="forecast-date">${day.date}</div>
        <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="icon" />
        <div>${day.temp}°C</div>
        <div>${day.description}</div>
      `;
      forecastContainer.appendChild(div);
    });

    // Fetch exchange rate
    const exchangeRes = await fetch('/currency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: baseCurrency, to: destCurrency })
    });
    const exchangeData = await exchangeRes.json();
    document.getElementById("from-currency").innerText = baseCurrency;
    document.getElementById("to-currency").innerText = destCurrency;
    document.getElementById("base-currency-code").innerText = baseCurrency;
    document.getElementById("exchange-rate").innerText = exchangeData.rate;
    document.getElementById("local-currency-code").innerText = destCurrency;
    document.getElementById("currency-updated").innerText = `Updated: ${exchangeData.time}`;

    // Conversion button
    document.getElementById("convert-btn").onclick = () => {
      const amount = parseFloat(document.getElementById("amount").value) || 0;
      const result = (amount * exchangeData.rate).toFixed(2);
      document.getElementById("conversion-result").innerText = `${amount} ${baseCurrency} = ${result} ${destCurrency}`;
    };

    document.getElementById("results").classList.remove("hidden");
  } catch (err) {
    alert(err.message);
    console.error(err);
  } finally {
    document.getElementById("loading").classList.add("hidden");
  }
});

// Autocomplete city input
const datalistId = 'city-suggestions';
document.getElementById("city").addEventListener("input", async e => {
  const value = e.target.value;
  if (value.length < 3) return;
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=5&language=en&format=json`
    );
    const data = await res.json();
    let list = document.getElementById(datalistId);
    if (!list) {
      list = document.createElement("datalist");
      list.id = datalistId;
      document.body.appendChild(list);
      document.getElementById("city").setAttribute("list", datalistId);
    }
    list.innerHTML = "";
    (data.results || []).forEach(item => {
      const label = `${item.name}, ${item.admin1 || item.country}`;
      const option = document.createElement("option");
      option.value = label;
      cityCache[label] = item;
      list.appendChild(option);
    });
  } catch (err) {
    console.error("Autocomplete failed:", err);
  }
});
