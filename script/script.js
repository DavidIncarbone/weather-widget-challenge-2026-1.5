// Comandi per ridurre gli errori e migliorare la leggibilità del codice JavaScript.
"use strict";
console.clear();

const lat = 45.4642; // Latitudine di Milano
const lon = 9.19; // Longitudine di Milano
const apiKey = "db84958f63f2d8e6ff20e71cbbd8040e"; // Mia API Key per OpenWeatherMap
const lang = "it"; // Lingua italiana per le descrizioni del tempo
const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=it`;

getCurrentWeatherData(); // Chiamata alla funzione per recuperare i dati meteo e aggiornare la pagina

const name = document.getElementById("name"); // Selezione dell'elemento HTML per il nome della città
const temp = document.getElementById("temp"); // Selezione dell'elemento HTML per la temperatura

// *** FUNZIONI ***

// Funzione per recuperare i dati meteo e aggiornare la pagina
function getCurrentWeatherData() {
  axios
    .get(apiUrl)
    .then((res) => {
      const data = res.data;
      console.log(data); // Log dei dati ricevuti per debug e verifica
    })
    .catch((err) => {
      console.error("Errore nel recupero dei dati meteo:", err); // Log degli errori per debug
    });
}

const dots = document.querySelectorAll(".dot");
const slides = document.querySelectorAll(".slide");

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = dot.dataset.slide;

    // rimuovi active da tutti
    slides.forEach((s) => s.classList.remove("active"));
    dots.forEach((d) => d.classList.remove("active"));

    // attiva selezionato
    slides[index].classList.add("active");
    dot.classList.add("active");
  });
});
