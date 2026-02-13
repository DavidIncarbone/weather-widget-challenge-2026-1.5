"use strict";

//  Configurazione
const city = "New York";
const countryCode = "US";
const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

// Stato globale per il meteo (usato per ripristinare il gradiente al ritorno sulla slide 0)
let isDayGlobal = true;

//. Helper Icone
function weatherCodeToIcon(code, isDay) {
  if (code === 0) return isDay ? "fa-sun" : "fa-moon";
  if (code === 1 || code === 2) return isDay ? "fa-cloud-sun" : "fa-cloud-moon";
  if (code === 3) return "fa-cloud";
  if ([61, 63, 65].includes(code)) return "fa-cloud-showers-heavy";
  if ([71, 73, 75].includes(code)) return "fa-snowflake";
  if ([95, 96, 99].includes(code)) return "fa-bolt-lightning";
  return isDay ? "fa-sun" : "fa-moon";
}

//  Helper Formattazione Oraria
function formatHour(dateString) {
  const d = new Date(dateString);
  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return { hour: hours, ampm: ampm };
}

//  Templates (Gradi e AM/PM con dimensioni diverse)
const templates = {
  hour: (temp, icon, time, ampm) => `
        <div class="hour-item">
            <div class="temp-container">
                <span class="temp-val">${temp}</span><span class="temp-deg">°</span>
            </div>
            <i class="fa-solid ${icon} icon-outline"></i>
            <span class="time-val">${time}</span>
            <span class="ampm-label">${ampm}</span>
        </div>`,

  day: (temp, icon, name) => `
        <div class="day-item">
            <div class="temp-container">
                <span class="temp-val">${temp}</span><span class="temp-deg">°</span>
            </div>
            <i class="fa-solid ${icon} icon-outline"></i>
            <span class="day-name">${name}</span>
        </div>`,
};

//  Inizializzazione Widget
const initWidget = async () => {
  const app = document.getElementById("app");

  app.innerHTML = `
        <div class="widget">
            <div class="slides-container">
                <div class="slide" id="slide-0"></div>
                <div class="slide" id="slide-1"></div>
                <div class="slide" id="slide-2"></div>
            </div>
            <div id="dots-container" class="dots">
                <span class="dot active" data-index="0"></span>
                <span class="dot" data-index="1"></span>
                <span class="dot" data-index="2"></span>
            </div>
        </div>
    `;

  const widget = app.querySelector(".widget");
  const container = app.querySelector(".slides-container");
  const dots = app.querySelectorAll(".dot");
  const slides = app.querySelectorAll(".slide");

  // Funzione scorrimento con protezione del colore
  const showSlide = (index) => {
    container.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach((d) => d.classList.remove("active"));
    dots[index].classList.add("active");

    if (index === 0) {
      widget.classList.add(isDayGlobal ? "day" : "night");
    } else {
      setTimeout(() => {
        const currentIndex = Array.from(dots).findIndex((d) =>
          d.classList.contains("active"),
        );
        if (currentIndex !== 0) {
          widget.classList.remove("day", "night");
        }
      }, 400);
    }
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => showSlide(parseInt(dot.dataset.index)));
  });

  try {
    const geoRes = await axios.get(geocodingUrl);
    if (!geoRes.data.results) throw new Error("Città non trovata");
    const {
      latitude: lat,
      longitude: lon,
      name,
      country,
    } = geoRes.data.results[0];

    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,is_day&daily=temperature_2m_max,temperature_2m_mean,weathercode&timezone=auto`,
    );
    const data = weatherRes.data;

    const now = new Date();
    const hourIndex = data.hourly.time.findIndex((t) => new Date(t) >= now);
    const currentTemp = Math.round(data.hourly.temperature_2m[hourIndex]);

    isDayGlobal = data.hourly.is_day[hourIndex] === 1;
    const currentIcon = weatherCodeToIcon(
      data.hourly.weathercode[hourIndex],
      isDayGlobal,
    );

    widget.classList.add(isDayGlobal ? "day" : "night");

    // --- SLIDE 1 (Attuale) ---

    slides[0].innerHTML = `
            <div class="main-card ${isDayGlobal ? "day" : "night"}">
                <div class="text-group">
                    <span class="big-temp">${currentTemp}°</span>
                    <span class="location">${name}, ${country}</span>
                </div>
                <div class="icon-group">
                    <i class="fa-solid ${currentIcon} main-sun"></i>
                </div>
            </div>
        `;

    // --- SLIDE 2 (Ore) ---
    let hoursHTML = "";
    for (let i = 0; i < 5; i++) {
      const idx = hourIndex + i;
      const timeData = formatHour(data.hourly.time[idx]);
      const icon = weatherCodeToIcon(
        data.hourly.weathercode[idx],
        data.hourly.is_day[idx],
      );
      hoursHTML += templates.hour(
        Math.round(data.hourly.temperature_2m[idx]),
        icon,
        `${timeData.hour}:00`,
        timeData.ampm,
      );
    }
    slides[1].innerHTML = `<div class="sub-card">${hoursHTML}</div>`;

    // --- SLIDE 3 (Giorni) ---
    let daysHTML = "";
    for (let i = 1; i <= 5; i++) {
      const date = data.daily.time[i];
      const dayName = new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
      });
      const icon = weatherCodeToIcon(data.daily.weathercode[i], true);
      daysHTML += templates.day(
        Math.round(data.daily.temperature_2m_mean[i]),
        icon,
        dayName,
      );
    }
    slides[2].innerHTML = `<div class="sub-card">${daysHTML}</div>`;
  } catch (err) {
    console.error(err);
    slides[0].innerHTML = `<p style="padding: 20px;">Dati non disponibili</p>`;
  }
};

initWidget();
