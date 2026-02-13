"use strict";
console.clear();

// Coordinate per Milano
const city = "Milan";
const countryCode = "IT";

// URL Open-Meteo per previsioni orarie (temperature e condizioni)

const geocoding = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&countryCode=${countryCode}&language=it`;

// helper per icone Open-Meteo
function weatherCodeToIcon(code) {
  switch (code) {
    case 0:
      return "☀️"; // sereno
    case 1:
    case 2:
      return "🌤️"; // poco nuvoloso
    case 3:
      return "☁️"; // nuvoloso
    case 61:
    case 63:
    case 65:
      return "🌧️"; // pioggia
    case 71:
    case 73:
    case 75:
      return "❄️"; // neve
    case 95:
    case 96:
    case 99:
      return "⛈️"; // temporale
    default:
      return "☀️";
  }
}

// helper HTML
function hour(temp, icon, time) {
  return `
  <div class="hour">
    <strong>${temp}</strong>
    <div>${icon}</div>
    <small>${time}</small>
  </div>`;
}

function day(temp, icon, name) {
  return `
  <div class="day">
    <strong>${temp}</strong>
    <div>${icon}</div>
    <small>${name}</small>
  </div>`;
}

// struttura widget
const app = document.getElementById("app");
app.innerHTML = `
<div class="widget">
  <div class="slides-container">
    <div class="slide"></div>  <!-- Slide attuale -->
    <div class="slide"></div>  <!-- Slide prossime 5 ore -->
    <div class="slide"></div>  <!-- Slide prossimi 5 giorni -->
  </div>
  <div class="dots">
    <span class="dot active" data-slide="0"></span>
    <span class="dot" data-slide="1"></span>
    <span class="dot" data-slide="2"></span>
  </div>
</div>
`;

const slidesContainer = document.querySelector(".slides-container");
const slides = document.querySelectorAll(".slide");
const slidesCount = slides.length;
const dots = document.querySelectorAll(".dot");
let activeIndex = 0;

// funzione per mostrare slide
function showSlide(index) {
  activeIndex = index;
  slidesContainer.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((d) => d.classList.remove("active"));
  dots[index].classList.add("active");
}

// click puntini
dots.forEach((d) => {
  d.addEventListener("click", () => showSlide(parseInt(d.dataset.slide)));
});

// swipe touch
let startX = 0,
  endX = 0;
slidesContainer.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  endX = startX;
});
slidesContainer.addEventListener(
  "touchmove",
  (e) => (endX = e.touches[0].clientX),
);
slidesContainer.addEventListener("touchend", (e) => {
  const diff = endX - startX;
  if (Math.abs(diff) < 50) return;
  if (diff < 0) showSlide((activeIndex + 1) % slidesCount);
  else showSlide((activeIndex - 1 + slidesCount) % slidesCount);
  startX = 0;
  endX = 0;
});

// inizializzazione widget
const initWidget = async () => {
  try {
    const resGeocoding = await axios.get(geocoding);
    const dataGeocoding = resGeocoding.data;
    console.log("Dati Geocoding:", dataGeocoding);
    const lat = dataGeocoding.results[0].latitude;
    const lon = dataGeocoding.results[0].longitude;
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=Europe/Rome`;
    const res = await axios.get(openMeteoUrl);
    const data = res.data;
    console.log("Dati Open-Meteo:", data);

    // --- Slide 0: meteo attuale (ora corrente reale)
    const now = new Date();
    const nowTimestamp = now.getTime();
    const indexNow = data.hourly.time.findIndex(
      (t) => new Date(t).getTime() >= nowTimestamp,
    );
    const nowTemp = Math.round(data.hourly.temperature_2m[indexNow]) + "°";
    const nowIcon = weatherCodeToIcon(data.hourly.weathercode[indexNow]);

    slides[0].innerHTML = `
      <div class="top-card">
        <div>
          <h1>${nowTemp}</h1>
          <p>${dataGeocoding.results[0].name}, ${dataGeocoding.results[0].country}</p>
        </div>
        <div style="font-size:60px">${nowIcon}</div>
      </div>
    `;

    // --- Slide 1: prossime 5 ore
    const next5Hours = [];
    for (let i = 0; i < 5; i++) {
      const idx = indexNow + i;
      next5Hours.push({
        temp: Math.round(data.hourly.temperature_2m[idx]) + "°",
        icon: weatherCodeToIcon(data.hourly.weathercode[idx]),
        time: new Date(data.hourly.time[idx]).getHours() + "h",
      });
    }
    slides[1].innerHTML = `<div class="card">${next5Hours.map((h) => hour(h.temp, h.icon, h.time)).join("")}</div>`;

    // --- Slide 2: prossimi 5 giorni (media giorno)
    const dailyMap = {};
    data.hourly.time.forEach((t, i) => {
      const dayName = new Date(t).toLocaleDateString("it-IT", {
        weekday: "short",
      });
      if (!dailyMap[dayName]) dailyMap[dayName] = [];
      dailyMap[dayName].push(data.hourly.temperature_2m[i]);
    });

    const next5Days = Object.entries(dailyMap)
      .slice(0, 5)
      .map(([dayName, temps]) => {
        const avgTemp =
          Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) + "°";
        return day(avgTemp, "☀️", dayName);
      });

    slides[2].innerHTML = `<div class="card">${next5Days.join("")}</div>`;
  } catch (err) {
    console.error("Errore nel caricamento dati Open-Meteo:", err);
    slides.forEach(
      (slide) => (slide.innerHTML = "<p>Dati non disponibili</p>"),
    );
  }
};

initWidget();
