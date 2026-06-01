import express from 'express';
import os from 'os';

const app = express();
const PORT = process.env.PORT || 8080;
const AUTHOR = "Dawid Dziura";

//Logging startup info 
console.log("=".repeat(60));
console.log(`Aplikacja uruchomiona: ${new Date().toISOString()}`);
console.log(`Autor: ${AUTHOR}`);
console.log(`Nasłuchuje na porcie TCP: ${PORT}`);
console.log("=".repeat(60));

//Dane kraje i miasta
const LOCATIONS = {
    "Polska": {
        "Warszawa": [52.2297, 21.0122],
        "Kraków": [50.0647, 19.9450],
        "Gdańsk": [54.3520, 18.6466],
        "Wrocław": [51.1079, 17.0385],
        "Poznań": [52.4064, 16.9252],
    },
    "Niemcy": {
        "Berlin": [52.5200, 13.4050],
        "Monachium": [48.1351, 11.5820],
        "Hamburg": [53.5753, 10.0153],
    },
    "Francja": {
        "Paryż": [48.8566, 2.3522],
        "Lyon": [45.7640, 4.8357],
        "Marsylia": [43.2965, 5.3698],
    },
    "Wielka Brytania": {
        "Londyn": [51.5074, -0.1278],
        "Manchester": [53.4808, -2.2426],
        "Edynburg": [55.9533, -3.1883],
    },
    "USA": {
        "Nowy Jork": [40.7128, -74.0060],
        "Los Angeles": [34.0522, -118.2437],
        "Chicago": [41.8781, -87.6298],
    },
    "Japonia": {
        "Tokio": [35.6762, 139.6503],
        "Osaka": [34.6937, 135.5023],
        "Kioto": [35.0116, 135.7681],
    }
};

const WMO_CODES = {
    0: "Bezchmurnie", 1: "Przeważnie bezchmurnie", 2: "Częściowe zachmurzenie",
    3: "Zachmurzenie", 45: "Mgła", 48: "Osadzająca mgła",
    51: "Słaba mżawka", 53: "Umiarkowana mżawka", 55: "Gęsta mżawka",
    61: "Słaby deszcz", 63: "Umiarkowany deszcz", 65: "Silny deszcz",
    71: "Słaby śnieg", 73: "Umiarkowany śnieg", 75: "Silny śnieg",
    80: "Słabe przelotne opady", 81: "Umiarkowane przelotne opady",
    82: "Silne przelotne opady", 85: "Słabe opady śniegu",
    86: "Silne opady śniegu", 95: "Burza", 99: "Burza z gradem",
};

function wmo_icon(code) {
    if (code === 0) return "☀️";
    if (code <= 2) return "🌤️";
    if (code <= 3) return "☁️";
    if (code <= 48) return "🌫️";
    if (code <= 55) return "🌦️";
    if (code <= 65) return "🌧️";
    if (code <= 75) return "❄️";
    if (code <= 82) return "🌧️";
    if (code <= 86) return "🌨️";
    return "⛈️";
}


const HTML_PAGE = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pogoda</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f1b2d; color: #e8f0fe; font-family: 'DM Sans', sans-serif; padding: 2rem; }
  .card { background: rgba(255,255,255,0.06); padding: 2rem; border-radius: 20px; max-width: 480px; margin: auto; }
  select, button { width: 100%; padding: .85rem; margin-bottom: 1rem; }
  .result { display: none; margin-top: 2rem; }
  .result.show { display: block; }
</style>
</head>
<body>
<div class="card">
  <h1>☁ Pogoda</h1>
  <label>Kraj</label>
  <select id="country" onchange="updateCities()">{country_options}</select>
  <label>Miasto</label>
  <select id="city">{city_options_first}</select>
  <button onclick="fetchWeather()">Sprawdź pogodę</button>
  <div class="result" id="result">
    <h2 id="locName"></h2>
    <h1 id="wTemp"></h1>
    <p id="wDesc"></p>
  </div>
</div>
<footer>{author}</footer>

<script>
const LOCATIONS = {locations_json};

function updateCities() {
  const country = document.getElementById('country').value;
  const citySelect = document.getElementById('city');
  citySelect.innerHTML = '';
  Object.keys(LOCATIONS[country]).forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    citySelect.appendChild(opt);
  });
}

async function fetchWeather() {
  const country = document.getElementById('country').value;
  const city = document.getElementById('city').value;
  const resEl = document.getElementById('result');
  try {
    const resp = await fetch('/weather?country=' + encodeURIComponent(country) + '&city=' + encodeURIComponent(city));
    const d = await resp.json();
    document.getElementById('locName').textContent = d.icon + ' ' + city;
    document.getElementById('wTemp').textContent = d.temperature + ' °C';
    document.getElementById('wDesc').textContent = d.description;
    resEl.classList.add('show');
  } catch(e) {
    alert("Błąd pobierania");
  }
}
</script>
</body>
</html>`;

function build_html() {
    const countries = Object.keys(LOCATIONS);
    const country_opts = countries.map(c => `<option value="${c}">${c}</option>`).join("\n");
    const first_country = countries[0];
    const city_opts = Object.keys(LOCATIONS[first_country]).map(city => `<option value="${city}">${city}</option>`).join("\n");

    return HTML_PAGE
        .replace("{country_options}", country_opts)
        .replace("{city_options_first}", city_opts)
        .replace("{locations_json}", JSON.stringify(LOCATIONS))
        .replace("{author}", AUTHOR);
}

//Endpointy
app.get('/', (req, res) => {
    res.send(build_html());
});

app.get('/weather', async (req, res) => {
    const { country, city } = req.query;
    const cities = LOCATIONS[country];
    if (!cities || !cities[city]) {
        return res.status(404).json({ detail: "Nieznana lokalizacja" });
    }

    const [lat, lon] = cities[city];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code&wind_speed_unit=kmh&timezone=auto`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        
        const current = data.current;
        const code = current.weather_code;

        console.log(`[${new Date().toISOString()}] INFO: Pobrano pogodę dla: ${city}, ${country} – ${current.temperature_2m}°C`);

        res.json({
            temperature: Math.round(current.temperature_2m * 10) / 10,
            feels_like: Math.round(current.apparent_temperature * 10) / 10,
            humidity: current.relative_humidity_2m,
            wind_speed: Math.round(current.wind_speed_10m * 10) / 10,
            pressure: Math.round(current.surface_pressure),
            description: WMO_CODES[code] || "Nieznane",
            icon: wmo_icon(code)
        });
    } catch (error) {
        res.status(500).json({ detail: "Błąd podczas pobierania pogody" });
    }
});

app.get('/healthz', (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nasłuchiwanie na porcie ${PORT}`);
});