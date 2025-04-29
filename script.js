let currentDate = new Date();
let selectedDate = null;
let emotions = JSON.parse(localStorage.getItem("emotions") || "{}");

const emotionEmojis = {
  feliz: "😊",
  triste: "😢",
  estresado: "😣",
  emocionado: "🤩",
  ansioso: "😰"
};

const emotionColors = {
  feliz: "#bbf7d0",
  triste: "#fecaca",
  estresado: "#fcd34d",
  emocionado: "#a5f3fc",
  ansioso: "#ddd6fe"
};

function renderCalendar() {
  const calendar = document.getElementById("calendar");
  const monthLabel = document.getElementById("monthLabel");
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const div = document.createElement("div");
    div.className = "day";
    div.textContent = day;
    div.onclick = () => openModal(dateStr);

    if (emotions[dateStr]) {
      div.innerHTML = `<div>${day}</div><small>${emotionEmojis[emotions[dateStr].emotion]}</small>`;
      div.style.backgroundColor = emotionColors[emotions[dateStr].emotion];
      div.title = emotions[dateStr].text || "";
    }

    calendar.appendChild(div);
  }
}

function openModal(dateStr) {
  selectedDate = dateStr;
  document.getElementById("modal").classList.remove("hidden");

  if (emotions[dateStr]) {
    document.getElementById("emotion-select").value = emotions[dateStr].emotion;
    document.getElementById("emotion-text").value = emotions[dateStr].text || "";
  } else {
    document.getElementById("emotion-select").value = "";
    document.getElementById("emotion-text").value = "";
  }
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function saveEmotion() {
  const emotion = document.getElementById("emotion-select").value;
  const text = document.getElementById("emotion-text").value;

  if (!emotion) return;

  emotions[selectedDate] = { emotion, text };
  localStorage.setItem("emotions", JSON.stringify(emotions));
  closeModal();
  renderCalendar();
  updateChart();
  updateSummary();
  checkForSupport();
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderCalendar();
  updateChart();
  updateSummary();
  checkForSupport();
}

function updateChart() {
  const emotionCounts = {};
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  for (let date in emotions) {
    const [y, m] = date.split("-").map(Number);
    if (y === year && m === month) {
      const emotion = emotions[date].emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
  }

  const labels = Object.keys(emotionCounts);
  const data = Object.values(emotionCounts);
  const backgroundColors = labels.map(emotion => emotionColors[emotion]);

  const ctx = document.getElementById("emotionChart").getContext("2d");
  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Cantidad de días",
        data,
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

function updateSummary() {
  const summaryDiv = document.getElementById("monthlySummary");
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const emotionCounts = {};

  for (let date in emotions) {
    const [y, m] = date.split("-").map(Number);
    if (y === year && m === month) {
      const emotion = emotions[date].emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
  }

  const entries = Object.entries(emotionCounts);
  if (entries.length === 0) {
    summaryDiv.innerHTML = 'Aún no hay registros para este mes.';
    return;
  }

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [mostFrequent, count] = sorted[0];
  const emoji = emotionEmojis[mostFrequent] || '';
  const totalDays = entries.reduce((acc, [, v]) => acc + v, 0);

  summaryDiv.innerHTML = `
    <p><strong>Emoción más frecuente:</strong> ${mostFrequent} ${emoji}</p>
    <p><strong>Veces registrada:</strong> ${count} días</p>
    <p><strong>Total de días registrados:</strong> ${totalDays}</p>
    <p><em>${getReflectionMessage(mostFrequent)}</em></p>
  `;
}

function getReflectionMessage(emotion) {
  switch (emotion) {
    case "feliz":
      return "¡Estás teniendo un buen mes! 🎉 Sigue haciendo lo que te hace bien.";
    case "triste":
      return "Es válido sentirse así. No estás solo. Hablar con alguien puede ayudar. ❤️";
    case "estresado":
      return "Tal vez sea un buen momento para tomar un descanso o pedir ayuda.";
    case "emocionado":
      return "¡Qué emocionante! Guarda ese entusiasmo y compártelo.";
    case "ansioso":
      return "La ansiedad puede ser dura. Respirar profundo o escribir lo que sientes puede ayudarte.";
    default:
      return "";
  }
}

// Carga inicial
renderCalendar();
updateChart();
updateSummary();
checkForSupport();

function checkForSupport() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  let negativeCount = 0;

  for (let date in emotions) {
    const [y, m] = date.split("-").map(Number);
    if (y === year && m === month) {
      const emo = emotions[date].emotion;
      if (["triste", "ansioso", "estresado"].includes(emo)) {
        negativeCount++;
      }
    }
  }

  const helpSection = document.getElementById("helpSection");
  if (negativeCount >= 3) {
    helpSection.style.display = "block";
  } else {
    helpSection.style.display = "none";
  }
}
