const state = {
  running: false,
  safetyOn: true,
  pingOn: true,
  position: null,
  home: null,
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
  "lean north",
  "drift northeast",
  "slide east",
  "drift southeast",
  "lean south",
  "drift southwest",
  "slide west",
  "drift northwest",
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
  concrete: [
    "Take the quieter side street, then reassess.",
  ],
  industrial: [
    "Keep moving until storefront lights return.",
  ],
};

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
};

function rand(list) {
  return list[Math.floor(Math.random() * list.length)];
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
  return mockPlaces.filter((p) => p.safety >= 0.72);
}

function buildPrompt(place) {
  const templatePool = promptTemplates[place.kind] || ["Keep wandering toward what feels alive."];
  const cue = rand(templatePool);
  return `${cue} If it feels flat after 5 minutes, pivot.`;
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

function updateCue() {
  const places = filteredPlaces();
  const place = rand(places);
  const direction = nextDirection();

  els.directionText.textContent = direction;
  els.distanceText.textContent = approxDistanceText();
  els.promptText.textContent = buildPrompt(place);

  addFeed(`Cue generated toward ${place.name} (${place.vibe}).`);

  if (state.pingOn && place.hiddenGem && navigator.vibrate) {
    navigator.vibrate([70, 60, 120]);
    addFeed(`Hidden gem nearby: ${place.name}. Pause and look around.`, "ping");
  }
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
}

els.startBtn.addEventListener("click", startWalk);
els.homeBtn.addEventListener("click", returnHome);
els.newPromptBtn.addEventListener("click", updateCue);
els.safetyToggle.addEventListener("change", (e) => {
  state.safetyOn = e.target.checked;
  addFeed(state.safetyOn ? "Safety leash ON." : "Safety leash OFF (raw drift mode).");
});
els.serendipityToggle.addEventListener("change", (e) => {
  state.pingOn = e.target.checked;
  addFeed(state.pingOn ? "Serendipity pings ON." : "Serendipity pings OFF.");
});

initGeolocation();
addFeed("Ready. Tap Start Walk.");
