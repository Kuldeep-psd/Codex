const state = {
  running: false,
  safetyOn: true,
  pingOn: true,
  mapVisible: true,
  position: null,
  home: null,
  currentCue: null,
};

const mockPlaces = [
  { name: "Pocket Park", kind: "green", safety: 0.92, vibe: "quiet", hiddenGem: true },
  { name: "Street Music Corner", kind: "music", safety: 0.86, vibe: "lively", hiddenGem: true },
  { name: "Night Market Lane", kind: "food", safety: 0.78, vibe: "busy", hiddenGem: false },
  { name: "Riverside Path", kind: "water", safety: 0.9, vibe: "open", hiddenGem: true },
  { name: "Transit Underpass", kind: "concrete", safety: 0.35, vibe: "isolated", hiddenGem: false },
  { name: "Old Book Alley", kind: "landmark", safety: 0.81, vibe: "curious", hiddenGem: true },
  { name: "Warehouse Strip", kind: "industrial", safety: 0.42, vibe: "empty", hiddenGem: false },
];

const directionBuckets = [
  { label: "lean north", bearing: 0 },
  { label: "drift northeast", bearing: 45 },
  { label: "slide east", bearing: 90 },
  { label: "drift southeast", bearing: 135 },
  { label: "lean south", bearing: 180 },
  { label: "drift southwest", bearing: 225 },
  { label: "slide west", bearing: 270 },
  { label: "drift northwest", bearing: 315 },
];

const promptTemplates = {
  green: [
    "Walk toward the tallest tree you can spot.",
    "Follow the cool patch of shade for two blocks.",
  ],
  music: [
    "Follow the nearest thread of music.",
    "Walk where the rhythm gets louder.",
  ],
  food: [
    "Move toward the warmest street smells.",
    "Follow the crowd forming near food carts.",
  ],
  water: [
    "Head toward the open sky and cooler air.",
    "Find where the city sounds soften near water.",
  ],
  landmark: [
    "Pick a weird sign and walk toward it.",
    "Follow the most textured building facade.",
  ],
  concrete: ["Take the quieter side street, then reassess."],
  industrial: ["Keep moving until storefront lights return."],
};

const mapLines = [
  "8,18 22,25 35,19 49,24 62,16 80,22 93,15",
  "7,39 20,33 33,40 47,34 65,41 78,35 92,42",
  "10,62 23,56 39,65 52,58 67,67 82,61 93,68",
  "9,83 23,76 37,84 53,77 69,85 83,79 95,86",
  "18,8 24,21 20,37 27,52 21,71 28,91",
  "46,7 52,20 46,38 54,54 49,72 55,92",
  "74,9 80,23 73,40 82,57 76,73 83,92",
];

const els = {
  directionText: document.getElementById("direction-text"),
  distanceText: document.getElementById("distance-text"),
  promptText: document.getElementById("prompt-text"),
  feed: document.getElementById("feed"),
  startBtn: document.getElementById("start-btn"),
  homeBtn: document.getElementById("home-btn"),
  newPromptBtn: document.getElementById("new-prompt-btn"),
  safetyToggle: document.getElementById("safety-toggle"),
  serendipityToggle: document.getElementById("serendipity-toggle"),
  mapSvg: document.getElementById("drift-map"),
  mapWrap: document.getElementById("map-wrap"),
  mapToggleBtn: document.getElementById("map-toggle-btn"),
};

function rand(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addFeed(message, type = "info") {
  const li = document.createElement("li");
  if (type === "ping") {
    li.innerHTML = `<strong>Ping:</strong> ${message}`;
  } else {
    li.textContent = message;
  }
  els.feed.prepend(li);

  while (els.feed.children.length > 6) {
    els.feed.removeChild(els.feed.lastChild);
  }
}

function filteredPlaces() {
  if (!state.safetyOn) return mockPlaces;
  return mockPlaces.filter((place) => place.safety >= 0.72);
}

function buildPrompt(place) {
  const templatePool = promptTemplates[place.kind] || ["Keep wandering toward what feels alive."];
  return `${rand(templatePool)} If it feels flat after 5 minutes, pivot.`;
}

function nextDirection() {
  return rand(directionBuckets);
}

function approxDistanceText() {
  if (!state.position || !state.home) {
    return "No rigid route. Just a pull.";
  }

  const latDiff = Math.abs(state.position.coords.latitude - state.home.latitude);
  const lngDiff = Math.abs(state.position.coords.longitude - state.home.longitude);
  const roughMeters = Math.round((latDiff + lngDiff) * 55000);

  if (roughMeters < 120) return "You are close to your start zone.";
  if (roughMeters < 400) return "You are gently drifting from home.";
  if (roughMeters < 900) return "You have reached a deeper drift radius.";
  return "You are far enough for surprise. Use Return Home anytime.";
}

function latLngToHomePoint() {
  if (!state.position || !state.home) return { x: 50, y: 52 };

  const lat = state.position.coords.latitude;
  const latMetersFromHome = (lat - state.home.latitude) * 111111;
  const lngMetersFromHome =
    (state.position.coords.longitude - state.home.longitude) * 111111 * Math.cos((lat * Math.PI) / 180);

  const x = clamp(50 - lngMetersFromHome / 20, 10, 90);
  const y = clamp(52 + latMetersFromHome / 20, 10, 90);
  return { x, y };
}

function cueTargetPoint() {
  if (!state.currentCue) return { x: 60, y: 42 };

  const radians = (state.currentCue.bearing * Math.PI) / 180;
  const units = clamp(state.currentCue.targetMeters / 16, 12, 28);
  return {
    x: clamp(50 + units * Math.sin(radians), 8, 92),
    y: clamp(52 - units * Math.cos(radians), 8, 92),
  };
}

function placeDots() {
  const list = filteredPlaces().slice(0, 4);
  return list
    .map((place, index) => {
      const angle = ((index + 1) * 72 * Math.PI) / 180;
      const radius = 16 + index * 3;
      const x = 50 + radius * Math.cos(angle);
      const y = 52 + radius * Math.sin(angle);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="#7f6a3d" opacity="0.85"><title>${place.name}</title></circle>`;
    })
    .join("");
}

function renderMap() {
  const user = { x: 50, y: 52 };
  const home = latLngToHomePoint();
  const target = cueTargetPoint();
  const targetName = state.currentCue ? state.currentCue.place.name : "cue target";

  const star = `${target.x},${target.y - 2.8} ${target.x + 1.2},${target.y - 0.8} ${target.x + 3.3},${target.y - 0.8} ${target.x + 1.6},${target.y + 0.6} ${target.x + 2.2},${target.y + 2.8} ${target.x},${target.y + 1.5} ${target.x - 2.2},${target.y + 2.8} ${target.x - 1.6},${target.y + 0.6} ${target.x - 3.3},${target.y - 0.8} ${target.x - 1.2},${target.y - 0.8}`;

  const paths = mapLines
    .map((line) => `<polyline points="${line}" fill="none" stroke="#7a6640" stroke-width="0.65" opacity="0.7"/>`)
    .join("");

  els.mapSvg.innerHTML = `
    <rect x="1" y="1" width="98" height="98" rx="2" fill="none" stroke="#8f7445" stroke-width="0.8"/>
    ${paths}
    <line x1="${user.x}" y1="${user.y}" x2="${target.x}" y2="${target.y}" stroke="#3f653f" stroke-dasharray="2 2" stroke-width="1.2" opacity="0.85"/>
    ${placeDots()}
    <rect x="${home.x - 1.6}" y="${home.y - 1.6}" width="3.2" height="3.2" fill="#7f3f2b">
      <title>Home anchor</title>
    </rect>
    <circle cx="${user.x}" cy="${user.y}" r="2.2" fill="#2d2618">
      <title>You are here</title>
    </circle>
    <polygon points="${star}" fill="#3f653f">
      <title>${targetName}</title>
    </polygon>
  `;
}

function updateCue() {
  const place = rand(filteredPlaces());
  const direction = nextDirection();
  const targetMeters = 180 + Math.floor(Math.random() * 380);

  state.currentCue = {
    place,
    direction: direction.label,
    bearing: direction.bearing,
    targetMeters,
  };

  els.directionText.textContent = direction.label;
  els.distanceText.textContent = approxDistanceText();
  els.promptText.textContent = buildPrompt(place);

  addFeed(`Cue generated toward ${place.name} (${place.vibe}).`);

  if (state.pingOn && place.hiddenGem && navigator.vibrate) {
    navigator.vibrate([70, 60, 120]);
    addFeed(`Hidden gem nearby: ${place.name}. Pause and look around.`, "ping");
  }

  renderMap();
}

function onPosition(position) {
  state.position = position;

  if (!state.home) {
    state.home = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    addFeed("Home anchor captured for safe return.");
  }

  if (state.running) {
    els.distanceText.textContent = approxDistanceText();
  }

  renderMap();
}

function initGeolocation() {
  if (!navigator.geolocation) {
    addFeed("Geolocation unavailable. Running in concept mode only.");
    return;
  }

  navigator.geolocation.watchPosition(onPosition, () => {
    addFeed("Location permission denied. Drift still works with mock cues.");
  });
}

function startWalk() {
  state.running = true;
  addFeed("Drift session started. Look up and walk by feel.");
  updateCue();
}

function returnHome() {
  if (!state.home) {
    addFeed("No home anchor yet. Start walk first.");
    return;
  }

  els.directionText.textContent = "head back by familiar streets";
  els.promptText.textContent =
    "Safety override active: retrace your last comfortable path toward your starting area.";
  els.distanceText.textContent = "Return Home mode: keep main roads and lit paths.";
  addFeed("Return Home override enabled.");

  state.currentCue = {
    place: { name: "Home", kind: "safe" },
    direction: "return",
    bearing: 315,
    targetMeters: 90,
  };
  renderMap();
}

function toggleMap() {
  state.mapVisible = !state.mapVisible;
  els.mapWrap.classList.toggle("is-hidden", !state.mapVisible);
  els.mapToggleBtn.textContent = state.mapVisible ? "Hide Map" : "Show Map";
}

els.startBtn.addEventListener("click", startWalk);
els.homeBtn.addEventListener("click", returnHome);
els.newPromptBtn.addEventListener("click", updateCue);
els.mapToggleBtn.addEventListener("click", toggleMap);
els.safetyToggle.addEventListener("change", (event) => {
  state.safetyOn = event.target.checked;
  addFeed(state.safetyOn ? "Safety leash ON." : "Safety leash OFF (raw drift mode).");
  renderMap();
});
els.serendipityToggle.addEventListener("change", (event) => {
  state.pingOn = event.target.checked;
  addFeed(state.pingOn ? "Serendipity pings ON." : "Serendipity pings OFF.");
});

initGeolocation();
renderMap();
addFeed("Ready. Tap Start Walk.");
