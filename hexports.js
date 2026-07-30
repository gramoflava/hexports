/* hexports application */
const HEALTH_EXPORTER_NAMES = {
  activeCalories: { label: "Active Calories", unitLabel: "kcal", kind: "activity", aggregationMethod: "sum" },
  basalCalories: { label: "Basal Calories", unitLabel: "kcal", kind: "activity", aggregationMethod: "sum" },
  bmi: { label: "BMI", unitLabel: "count", kind: "body", aggregationMethod: "latest" },
  bodyFat: { label: "Body Fat", unitLabel: "%", kind: "body", aggregationMethod: "latest" },
  dietaryCarbohydrates: { label: "Dietary Carbohydrates", unitLabel: "g", kind: "nutrition", aggregationMethod: "sum" },
  dietaryEnergy: { label: "Dietary Energy", unitLabel: "kcal", kind: "nutrition", aggregationMethod: "sum" },
  dietaryFatTotal: { label: "Dietary Fat", unitLabel: "g", kind: "nutrition", aggregationMethod: "sum" },
  dietaryProtein: { label: "Dietary Protein", unitLabel: "g", kind: "nutrition", aggregationMethod: "sum" },
  exerciseMinutes: { label: "Exercise Minutes", unitLabel: "min", kind: "activity", aggregationMethod: "sum" },
  flightsClimbed: { label: "Flights Climbed", unitLabel: "count", kind: "activity", aggregationMethod: "sum" },
  heartRateVariability: { label: "Heart Rate Variability", unitLabel: "ms", kind: "vitals", aggregationMethod: "average" },
  leanBodyMass: { label: "Lean Body Mass", unitLabel: "kg", kind: "body", aggregationMethod: "latest" },
  oxygenSaturation: { label: "Oxygen Saturation", unitLabel: "%", kind: "vitals", aggregationMethod: "average" },
  respiratoryRate: { label: "Respiratory Rate", unitLabel: "breaths/min", kind: "vitals", aggregationMethod: "average" },
  restingHeartRate: { label: "Resting Heart Rate", unitLabel: "bpm", kind: "vitals", aggregationMethod: "average" },
  sleepTime: { label: "Sleep Time", unitLabel: "min", kind: "recovery", aggregationMethod: "average" },
  stepCount: { label: "Step Count", unitLabel: "count", kind: "activity", aggregationMethod: "sum" },
  vo2Max: { label: "VO2 Max", unitLabel: "mL/kg/min", kind: "fitness", aggregationMethod: "average" },
  walkingDistance: { label: "Walking Distance", unitLabel: "m", kind: "activity", aggregationMethod: "sum" },
  walkingHeartRate: { label: "Walking Heart Rate", unitLabel: "bpm", kind: "vitals", aggregationMethod: "average" },
  weight: { label: "Weight", unitLabel: "kg", kind: "body", aggregationMethod: "latest" },
  wristTemperature: { label: "Wrist Temperature", unitLabel: "°C", kind: "vitals", aggregationMethod: "average" }
};

const WORKOUT_STAT_NAMES = {
  HKQuantityTypeIdentifierActiveEnergyBurned: "Workout Active Energy",
  HKQuantityTypeIdentifierBasalEnergyBurned: "Workout Basal Energy",
  HKQuantityTypeIdentifierDistanceCycling: "Workout Cycling Distance",
  HKQuantityTypeIdentifierDistanceSwimming: "Workout Swimming Distance",
  HKQuantityTypeIdentifierDistanceWalkingRunning: "Workout Walking & Running Distance",
  HKQuantityTypeIdentifierHeartRate: "Workout Heart Rate",
  HKQuantityTypeIdentifierSwimmingStrokeCount: "Workout Swimming Strokes"
};

const WORKOUT_VALUE_LABELS = {
  average: "Average",
  max: "Maximum",
  min: "Minimum",
  sum: "Total"
};

const PALETTE_TOKENS = [
  "--palette-blue", "--palette-cyan", "--palette-teal", "--palette-green",
  "--palette-lime", "--palette-yellow", "--palette-orange", "--palette-red",
  "--palette-pink", "--palette-fuchsia", "--palette-purple", "--palette-violet",
  "--palette-indigo", "--palette-sky", "--palette-slate", "--palette-brown"
];

const SMOOTH_LEVELS = [0, 1, 7, 30, 90, 182, 365];
const SMOOTH_LABELS = ["None", "1d", "1w", "1mo", "3mo", "6mo", "1y"];
const DAY_MS = 24 * 60 * 60 * 1000;
const PREFERENCES_STORAGE_KEY = "hexports:preferences:v1";
const ANNOTATIONS_STORAGE_PREFIX = "hexports:annotations:v1:";

// chartSlots: [{id, datasetId, selectedSeries: Set}]
// slot index 0 = left axis, slot index 1 = right axis
const state = {
  sourceName: "",
  sourceKey: "",
  datasets: [],
  chartSlots: [],
  smoothingWindow: 0,
  smoothingMode: "ema",
  pointMode: "auto",
  interactionMode: "marker",
  markers: [],
  ranges: [],
  markerDraftColor: "",
  markerDraftColorIndex: 0,
  rangeDraftColor: "",
  rangeDraftColorIndex: 1,
  aggregationPeriod: "month",
  chart: {
    viewMinX: null,
    viewMaxX: null,
    hover: null,
    pointerDownAt: null,
    isDragging: false,
    fullMinX: null,
    fullMaxX: null,
    gestureScale: null,
    hoveredMarkerId: null,
    rangeDraft: null
  }
};

const elements = {
  openDataButton: document.getElementById("openDataButton"),
  sourceName: document.getElementById("sourceName"),
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  fileStatus: document.getElementById("fileStatus"),
  slotsList: document.getElementById("slotsList"),
  addSlotButton: document.getElementById("addSlotButton"),
  smoothingRange: document.getElementById("smoothingRange"),
  smoothingLabel: document.getElementById("smoothingLabel"),
  smoothingMode: document.getElementById("smoothingMode"),
  pointMode: document.getElementById("pointMode"),
  markerList: document.getElementById("markerList"),
  rangeList: document.getElementById("rangeList"),
  annotationHelp: document.getElementById("annotationHelp"),
  addRangeButton: document.getElementById("addRangeButton"),
  markerModeButton: document.getElementById("markerModeButton"),
  rangeModeButton: document.getElementById("rangeModeButton"),
  markerPopup: document.getElementById("markerPopup"),
  markerPopupClose: document.getElementById("markerPopupClose"),
  popupMarkerDate: document.getElementById("popupMarkerDate"),
  popupMarkerLabel: document.getElementById("popupMarkerLabel"),
  popupMarkerPalette: document.getElementById("popupMarkerPalette"),
  popupMarkerSave: document.getElementById("popupMarkerSave"),
  popupMarkerCancel: document.getElementById("popupMarkerCancel"),
  rangePopup: document.getElementById("rangePopup"),
  rangePopupClose: document.getElementById("rangePopupClose"),
  rangeStartDate: document.getElementById("rangeStartDate"),
  rangeEndDate: document.getElementById("rangeEndDate"),
  rangeLabel: document.getElementById("rangeLabel"),
  rangePalette: document.getElementById("rangePalette"),
  rangePopupSave: document.getElementById("rangePopupSave"),
  rangePopupCancel: document.getElementById("rangePopupCancel"),
  resetViewButton: document.getElementById("resetViewButton"),
  fitSelectionButton: document.getElementById("fitSelectionButton"),
  copyPngButton: document.getElementById("copyPngButton"),
  exportPngButton: document.getElementById("exportPngButton"),
  summaryChip: document.getElementById("summaryChip"),
  canvasWrap: document.getElementById("canvasWrap"),
  chartCard: document.querySelector(".chart-card"),
  emptyState: document.getElementById("emptyState"),
  chartCanvas: document.getElementById("chartCanvas"),
  chartDescription: document.getElementById("chartDescription"),
  tooltip: document.getElementById("tooltip"),
  mobileReadout: document.getElementById("mobileReadout"),
  aggSection: document.getElementById("aggSection"),
  aggTable: document.getElementById("aggTable"),
  aggMonthBtn: document.getElementById("aggMonthBtn"),
  aggYearBtn: document.getElementById("aggYearBtn")
};

const ctx = elements.chartCanvas.getContext("2d");

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function readStoredJson(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function writeStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage may be unavailable in private browsing; the current session still works.
  }
}

function restorePreferences() {
  const preferences = readStoredJson(PREFERENCES_STORAGE_KEY);
  if (!preferences || typeof preferences !== "object") return;
  if (SMOOTH_LEVELS.includes(preferences.smoothingWindow)) {
    state.smoothingWindow = preferences.smoothingWindow;
  }
  if (["movingAverage", "ema"].includes(preferences.smoothingMode)) {
    state.smoothingMode = preferences.smoothingMode;
  }
  if (["auto", "always", "never"].includes(preferences.pointMode)) {
    state.pointMode = preferences.pointMode;
  }
  if (["marker", "range"].includes(preferences.interactionMode)) {
    state.interactionMode = preferences.interactionMode;
  }
}

function persistPreferences() {
  writeStoredJson(PREFERENCES_STORAGE_KEY, {
    smoothingWindow: state.smoothingWindow,
    smoothingMode: state.smoothingMode,
    pointMode: state.pointMode,
    interactionMode: state.interactionMode
  });
}

function syncPreferenceControls() {
  const smoothingIndex = Math.max(0, SMOOTH_LEVELS.indexOf(state.smoothingWindow));
  elements.smoothingRange.value = String(smoothingIndex);
  elements.smoothingLabel.textContent = SMOOTH_LABELS[smoothingIndex];
  elements.smoothingMode.value = state.smoothingMode;
  elements.pointMode.value = state.pointMode;
}

async function makeSourceKey(text) {
  try {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest).slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += Math.max(1, Math.floor(text.length / 4096))) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${text.length.toString(36)}-${(hash >>> 0).toString(36)}`;
  }
}

function restoreAnnotations() {
  state.markers = [];
  state.ranges = [];
  if (!state.sourceKey) return;
  const stored = readStoredJson(`${ANNOTATIONS_STORAGE_PREFIX}${state.sourceKey}`);
  const pool = getColorPool();

  if (Array.isArray(stored?.markers)) {
    state.markers = stored.markers
      .filter((marker) => Number.isFinite(marker?.x))
      .map((marker) => {
        const colorIndex = Number.isInteger(marker.colorIndex) && marker.colorIndex >= 0
          ? marker.colorIndex % pool.length
          : 0;
        return {
          id: typeof marker.id === "string" ? marker.id : uid(),
          x: marker.x,
          label: typeof marker.label === "string" ? marker.label : "",
          colorIndex,
          color: pool[colorIndex]
        };
      });
  }
  if (Array.isArray(stored?.ranges)) {
    state.ranges = stored.ranges
      .filter((range) => Number.isFinite(range?.startX) && Number.isFinite(range?.endX))
      .map((range) => {
        const colorIndex = Number.isInteger(range.colorIndex) && range.colorIndex >= 0
          ? range.colorIndex % pool.length
          : 1;
        return {
          id: typeof range.id === "string" ? range.id : uid(),
          startX: Math.min(range.startX, range.endX),
          endX: Math.max(range.startX, range.endX),
          label: typeof range.label === "string" ? range.label : "",
          colorIndex,
          color: pool[colorIndex]
        };
      });
  }
}

function persistAnnotations() {
  if (!state.sourceKey) return;
  writeStoredJson(`${ANNOTATIONS_STORAGE_PREFIX}${state.sourceKey}`, {
    markers: state.markers.map(({ id, x, label, colorIndex }) => ({ id, x, label, colorIndex })),
    ranges: state.ranges.map(({ id, startX, endX, label, colorIndex }) => ({
      id,
      startX,
      endX,
      label,
      colorIndex
    }))
  });
}

function init() {
  restorePreferences();
  const pool = getColorPool();
  state.markerDraftColor = pool[state.markerDraftColorIndex];
  state.rangeDraftColor = pool[state.rangeDraftColorIndex];
  const d = new Date();
  elements.popupMarkerDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  syncPreferenceControls();
  updateInteractionMode();
  bindEvents();
  resizeCanvas();
  renderAll();
  window.addEventListener("resize", () => {
    resizeCanvas();
    drawChart();
  });
  watchThemeChanges();
}

function bindEvents() {
  elements.openDataButton.addEventListener("click", () => elements.fileInput.click());

  elements.fileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    state.sourceName = file.name;
    elements.fileStatus.textContent = `Loaded: ${file.name}`;
    const text = await file.text();
    await loadSource(file.name, text);
  });

  const dz = elements.dropzone;
  dz.addEventListener("dragenter", (e) => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", (e) => { if (!dz.contains(e.relatedTarget)) dz.classList.remove("over"); });
  dz.addEventListener("drop", async (e) => {
    e.preventDefault();
    dz.classList.remove("over");
    const [file] = e.dataTransfer.files;
    if (!file) return;
    state.sourceName = file.name;
    elements.fileStatus.textContent = `Loaded: ${file.name}`;
    const text = await file.text();
    await loadSource(file.name, text);
  });

  elements.smoothingRange.addEventListener("input", () => {
    const idx = Number(elements.smoothingRange.value);
    state.smoothingWindow = SMOOTH_LEVELS[idx];
    elements.smoothingLabel.textContent = SMOOTH_LABELS[idx];
    persistPreferences();
    drawChart();
  });

  elements.smoothingMode.addEventListener("change", () => {
    state.smoothingMode = elements.smoothingMode.value;
    persistPreferences();
    renderAll();
  });

  elements.pointMode.addEventListener("change", () => {
    state.pointMode = elements.pointMode.value;
    persistPreferences();
    drawChart();
  });

  elements.addSlotButton.addEventListener("click", handleAddSlot);
  elements.markerModeButton.addEventListener("click", () => setInteractionMode("marker"));
  elements.rangeModeButton.addEventListener("click", () => setInteractionMode("range"));
  elements.addRangeButton.onclick = showRangePopupForView;

  elements.aggMonthBtn.addEventListener("click", () => {
    state.aggregationPeriod = "month";
    elements.aggMonthBtn.classList.add("is-active");
    elements.aggYearBtn.classList.remove("is-active");
    renderAggregationTable();
  });
  elements.aggYearBtn.addEventListener("click", () => {
    state.aggregationPeriod = "year";
    elements.aggYearBtn.classList.add("is-active");
    elements.aggMonthBtn.classList.remove("is-active");
    renderAggregationTable();
  });

  elements.resetViewButton.addEventListener("click", () => {
    resetChartView();
    updateChartDescription();
    drawChart();
  });
  elements.fitSelectionButton.addEventListener("click", () => {
    fitToVisibleSeries();
    updateChartDescription();
    drawChart();
  });
  elements.copyPngButton.addEventListener("click", copyChartPng);
  elements.exportPngButton.addEventListener("click", downloadChartPng);
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    elements.copyPngButton.hidden = true;
  }

  elements.chartCanvas.addEventListener("wheel", handleWheel, { passive: false });
  elements.chartCanvas.addEventListener("pointerdown", handlePointerDown);
  elements.chartCanvas.addEventListener("pointermove", handlePointerMove);
  elements.chartCanvas.addEventListener("pointerup", handlePointerUp);
  elements.chartCanvas.addEventListener("pointercancel", handlePointerUpGlobal);
  elements.chartCanvas.addEventListener("pointerleave", handlePointerLeave);
  elements.chartCanvas.addEventListener("keydown", handleChartKeydown);
  window.addEventListener("pointerup", handlePointerUpGlobal);

  elements.chartCanvas.addEventListener("dblclick", () => {
    resetChartView();
    drawChart();
  });
  elements.chartCanvas.addEventListener("gesturestart", handleGestureStart);
  elements.chartCanvas.addEventListener("gesturechange", handleGestureChange);
  elements.chartCanvas.addEventListener("gestureend", handleGestureEnd);

  // Marker popup
  elements.markerPopupClose.addEventListener("click", hideMarkerPopup);
  elements.popupMarkerCancel.addEventListener("click", hideMarkerPopup);
  elements.popupMarkerSave.addEventListener("click", addMarkerFromPopup);
  elements.rangePopupClose.addEventListener("click", hideRangePopup);
  elements.rangePopupCancel.addEventListener("click", hideRangePopup);
  elements.rangePopupSave.addEventListener("click", addRangeFromPopup);

  // Close popup on Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideMarkerPopup();
      hideRangePopup();
    }
  });
}

function watchThemeChanges() {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const refreshTheme = () => {
    const pool = getColorPool();
    state.datasets.forEach((dataset) => {
      dataset.series.forEach((series) => {
        if (!series.customColor && series.colorIndex != null) {
          series.color = pool[series.colorIndex % pool.length];
        }
      });
    });
    state.markers.forEach((marker) => {
      marker.color = pool[marker.colorIndex % pool.length];
    });
    state.ranges.forEach((range) => {
      range.color = pool[range.colorIndex % pool.length];
    });
    state.markerDraftColor = pool[state.markerDraftColorIndex % pool.length];
    state.rangeDraftColor = pool[state.rangeDraftColorIndex % pool.length];
    renderPopupPalette();
    renderRangePalette();
    renderAll();
  };
  document.addEventListener("themechange", refreshTheme);
  media.addEventListener("change", () => {
    if (!localStorage.getItem("theme")) refreshTheme();
  });
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = elements.canvasWrap.getBoundingClientRect();
  const width = Math.max(320, Math.floor(bounds.width));
  const height = Math.max(320, Math.floor(elements.chartCanvas.clientHeight || 520));
  elements.chartCanvas.width = Math.floor(width * ratio);
  elements.chartCanvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

// ─── Color helpers ────────────────────────────────────────────────────────

function getColorPool() {
  return PALETTE_TOKENS.map(getCssVariable);
}

function getUsedColorIndices(excludeSlotId) {
  const indices = [];
  state.chartSlots.forEach((slot) => {
    if (slot.id === excludeSlotId) return;
    const dataset = state.datasets.find((d) => d.id === slot.datasetId);
    if (dataset) {
      dataset.series.forEach((s) => {
        if (s.colorIndex != null) indices.push(s.colorIndex);
      });
    }
  });
  return indices;
}

function pickNextColor(usedIndices) {
  const pool = getColorPool();
  const allIndices = pool.map((_, i) => i);
  const unused = allIndices.filter((i) => !usedIndices.includes(i));
  const source = unused.length > 0 ? unused : allIndices;
  const idx = source[Math.floor(Math.random() * source.length)];
  return { color: pool[idx], colorIndex: idx };
}

function assignColorsForSlot(slotId) {
  const slot = state.chartSlots.find((s) => s.id === slotId);
  if (!slot) return;
  const dataset = state.datasets.find((d) => d.id === slot.datasetId);
  if (!dataset) return;
  const usedIndices = getUsedColorIndices(slotId);
  dataset.series.forEach((series) => {
    if (!series.customColor) {
      const { color, colorIndex } = pickNextColor(usedIndices);
      series.color = color;
      series.colorIndex = colorIndex;
      usedIndices.push(colorIndex);
    }
  });
}

// ─── Source loading ───────────────────────────────────────────────────────

async function loadSource(fileName, text) {
  try {
    let datasets = [];
    if (fileName.toLowerCase().endsWith(".json")) {
      datasets = parseJsonDatasets(text);
    } else if (fileName.toLowerCase().endsWith(".csv")) {
      datasets = parseCsvDatasets(text, fileName);
    }

    state.datasets = datasets;
    state.chartSlots = [];
    state.sourceKey = await makeSourceKey(text);
    restoreAnnotations();
    elements.sourceName.textContent = fileName;

    if (datasets.length) {
      addSlotForDataset(datasets[0]);
    }

    resetChartView();
    renderAll();

    if (!datasets.length) {
      elements.fileStatus.textContent = `Loaded: ${fileName}. No suitable time series were found.`;
    }
  } catch (error) {
    state.datasets = [];
    state.chartSlots = [];
    state.sourceKey = "";
    state.markers = [];
    state.ranges = [];
    elements.sourceName.textContent = "Could not open file";
    resetChartView();
    renderAll();
    elements.fileStatus.textContent = `Could not parse ${fileName}: ${error.message}`;
  }
}

function addSlotForDataset(dataset) {
  if (!dataset || state.chartSlots.length >= 2) return null;
  const slot = {
    id: uid(),
    datasetId: dataset.id,
    selectedSeries: new Set(dataset.series.slice(0, 1).map((s) => s.key))
  };
  state.chartSlots.push(slot);
  assignColorsForSlot(slot.id);
  return slot;
}

function handleAddSlot() {
  if (state.chartSlots.length >= 2 || !state.datasets.length) return;
  const usedIds = state.chartSlots.map((s) => s.datasetId);
  const candidate = state.datasets.find((d) => !usedIds.includes(d.id)) || state.datasets[0];
  addSlotForDataset(candidate);
  resetChartView();
  renderAll();
}

function removeSlot(slotId) {
  state.chartSlots = state.chartSlots.filter((s) => s.id !== slotId);
  resetChartView();
  renderAll();
}

function handleSlotDatasetChange(slotId, newDatasetId) {
  const slot = state.chartSlots.find((s) => s.id === slotId);
  if (!slot) return;
  slot.datasetId = newDatasetId;
  const dataset = state.datasets.find((d) => d.id === newDatasetId);
  if (dataset) {
    slot.selectedSeries = new Set(dataset.series.slice(0, 1).map((s) => s.key));
    assignColorsForSlot(slotId);
  }
  resetChartView();
  renderAll();
}

// ─── Parsing ──────────────────────────────────────────────────────────────

function parseJsonDatasets(text) {
  const json = JSON.parse(text);
  const datasets = [];
  let recognizedExporterPayload = false;

  if (isAppleHealthExporterPayload(json)) {
    datasets.push(...parseAppleHealthExporterDatasets(json));
    recognizedExporterPayload = true;
  }
  if (isWorkoutExporterPayload(json)) {
    datasets.push(...parseWorkoutExporterDatasets(json));
    recognizedExporterPayload = true;
  }
  if (recognizedExporterPayload) return datasets;

  function visit(node, path) {
    if (Array.isArray(node)) {
      const dataset = makeDatasetFromArray(node, path.join(".") || "root");
      if (dataset) datasets.push(dataset);
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        visit(value, path.concat(key));
      }
    }
  }
  visit(json, []);
  return datasets;
}

function isAppleHealthExporterPayload(json) {
  return Boolean(json && typeof json === "object" && json.exportInfo && Array.isArray(json.exportInfo.dataTypes));
}

function isWorkoutExporterPayload(json) {
  if (!json || typeof json !== "object" || !Array.isArray(json.workouts)) return false;
  if (!json.workouts.length) {
    return Boolean(json.exportInfo && Array.isArray(json.exportInfo.activityTypes));
  }
  return json.workouts.some((workout) =>
    workout &&
    typeof workout === "object" &&
    typeof workout.activityType === "string" &&
    Number.isFinite(toTimestamp(workout.startDate)) &&
    Number.isFinite(toNumber(workout.duration))
  );
}

function parseAppleHealthExporterDatasets(json) {
  const dataTypes = json.exportInfo.dataTypes || [];
  const sortedTypes = dataTypes
    .filter((key) => Array.isArray(json[key]))
    .sort((l, r) => {
      const li = HEALTH_EXPORTER_NAMES[l]?.label || l;
      const ri = HEALTH_EXPORTER_NAMES[r]?.label || r;
      return li.localeCompare(ri);
    });

  return sortedTypes
    .map((key) => {
      const items = json[key];
      if (!Array.isArray(items)) return null;
      const points = items
        .map((item) => {
          const x = toTimestamp(item.date);
          const value = toNumber(item.value);
          if (!Number.isFinite(x) || !Number.isFinite(value)) return null;
          return { x, rawDate: item.date, values: { value }, raw: item };
        })
        .filter(Boolean)
        .sort((a, b) => a.x - b.x);

      const metadata = HEALTH_EXPORTER_NAMES[key] || { label: humanizeKey(key), unitLabel: items[0]?.unit || "", kind: "other" };
      const unit = items.find((item) => item && typeof item.unit === "string")?.unit || metadata.unitLabel || "";

      return {
        id: key,
        key,
        label: metadata.label,
        sourceLabel: key,
        dateField: "date",
        unit,
        kind: metadata.kind,
        isAppleHealth: true,
        aggregationMethod: metadata.aggregationMethod || "average",
        series: [{ key: "value", label: metadata.label, shortLabel: "value", color: "", colorIndex: null, lineWidth: 1, customColor: false }],
        points
      };
    })
    .filter((d) => d && d.points.length);
}

function parseWorkoutExporterDatasets(json) {
  const workouts = json.workouts
    .filter((workout) => workout && typeof workout === "object")
    .slice()
    .sort((a, b) => toTimestamp(a.startDate) - toTimestamp(b.startDate));
  const datasets = [];

  const durationDataset = makeWorkoutDataset({
    id: "workouts:duration",
    label: "Workout Duration",
    unit: "min",
    workouts,
    aggregationMethod: "sum",
    readValue: (workout) => {
      const seconds = toNumber(workout.duration);
      return Number.isFinite(seconds) ? seconds / 60 : NaN;
    }
  });
  if (durationDataset) datasets.push(durationDataset);

  const statisticKeys = new Set();
  workouts.forEach((workout) => {
    if (!workout.statistics || typeof workout.statistics !== "object") return;
    Object.keys(workout.statistics).forEach((key) => statisticKeys.add(key));
  });

  [...statisticKeys]
    .sort((left, right) => getWorkoutStatisticLabel(left).localeCompare(getWorkoutStatisticLabel(right)))
    .forEach((statisticKey) => {
      const samples = workouts
        .map((workout) => workout.statistics?.[statisticKey])
        .filter((statistic) => statistic && typeof statistic === "object");
      const valueFields = new Set();
      samples.forEach((statistic) => {
        Object.entries(statistic).forEach(([field, value]) => {
          if (field !== "unit" && Number.isFinite(toNumber(value))) valueFields.add(field);
        });
      });

      const unit = normalizeWorkoutUnit(
        samples.find((statistic) => typeof statistic.unit === "string")?.unit || ""
      );
      const baseLabel = getWorkoutStatisticLabel(statisticKey);
      const orderedFields = [...valueFields].sort((left, right) => {
        const order = ["sum", "average", "min", "max"];
        const leftIndex = order.indexOf(left);
        const rightIndex = order.indexOf(right);
        if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
        if (leftIndex === -1) return 1;
        if (rightIndex === -1) return -1;
        return leftIndex - rightIndex;
      });

      orderedFields.forEach((valueField) => {
        const fieldLabel = WORKOUT_VALUE_LABELS[valueField] || humanizeKey(valueField);
        const label = orderedFields.length > 1 ? `${baseLabel} — ${fieldLabel}` : baseLabel;
        const dataset = makeWorkoutDataset({
          id: `workouts:${statisticKey}:${valueField}`,
          label,
          unit,
          workouts,
          aggregationMethod: valueField === "sum" ? "sum" : "average",
          readValue: (workout) => toNumber(workout.statistics?.[statisticKey]?.[valueField])
        });
        if (dataset) datasets.push(dataset);
      });
    });

  return datasets;
}

function makeWorkoutDataset({ id, label, unit, workouts, aggregationMethod, readValue }) {
  const activityCounts = new Map();
  const usableWorkouts = [];

  workouts.forEach((workout) => {
    const x = toTimestamp(workout.startDate);
    const value = readValue(workout);
    if (!Number.isFinite(x) || !Number.isFinite(value)) return;
    const activityType = workout.activityType || "other";
    activityCounts.set(activityType, (activityCounts.get(activityType) || 0) + 1);
    usableWorkouts.push({ workout, x, value, activityType });
  });
  if (!usableWorkouts.length) return null;

  const activityTypes = [...activityCounts.keys()].sort((left, right) => {
    const countDifference = activityCounts.get(right) - activityCounts.get(left);
    if (countDifference) return countDifference;
    return getWorkoutActivityLabel(left).localeCompare(getWorkoutActivityLabel(right));
  });
  const series = activityTypes.map((activityType) => ({
    key: activityType,
    label: getWorkoutActivityLabel(activityType),
    shortLabel: getWorkoutActivityLabel(activityType),
    color: "",
    colorIndex: null,
    lineWidth: 1,
    customColor: false
  }));
  const points = usableWorkouts.map(({ workout, x, value, activityType }) => ({
    x,
    rawDate: workout.startDate,
    values: { [activityType]: value },
    raw: workout
  }));

  return {
    id,
    key: id,
    label,
    sourceLabel: "workouts",
    dateField: "startDate",
    unit,
    kind: "workout",
    isAppleHealth: false,
    isWorkout: true,
    displayMode: aggregationMethod === "sum" ? "event-bars" : "event-points",
    aggregationMethod,
    series,
    points
  };
}

function getWorkoutStatisticLabel(identifier) {
  if (WORKOUT_STAT_NAMES[identifier]) return WORKOUT_STAT_NAMES[identifier];
  return `Workout ${humanizeKey(String(identifier).replace(/^HKQuantityTypeIdentifier/, ""))}`;
}

function getWorkoutActivityLabel(activityType) {
  if (activityType === "highIntensityIntervalTraining") {
    return "High-Intensity Interval Training";
  }
  return humanizeKey(activityType);
}

function normalizeWorkoutUnit(unit) {
  if (unit === "count/min") return "bpm";
  return unit;
}

function makeDatasetFromArray(items, label) {
  if (!items.length || !items.every((item) => item && typeof item === "object" && !Array.isArray(item))) return null;
  const fields = new Set();
  items.forEach((item) => Object.keys(item).forEach((k) => fields.add(k)));
  const keys = [...fields];
  const dateField = findDateField(keys, (key) => items.map((item) => item[key]));
  if (!dateField) return null;
  const numericFields = keys.filter((k) => k !== dateField && items.some((item) => Number.isFinite(toNumber(item[k]))));
  if (!numericFields.length) return null;

  const series = numericFields.map((field) => ({
    key: field, label: field, color: "", colorIndex: null, lineWidth: 1, customColor: false
  }));

  const points = items
    .map((item) => {
      const x = toTimestamp(item[dateField]);
      if (!Number.isFinite(x)) return null;
      const values = {};
      for (const s of series) {
        const v = toNumber(item[s.key]);
        values[s.key] = Number.isFinite(v) ? v : null;
      }
      return { x, rawDate: item[dateField], values, raw: item };
    })
    .filter(Boolean)
    .sort((a, b) => a.x - b.x);

  if (!points.length) return null;
  return {
    id: label,
    key: label,
    label,
    sourceLabel: label,
    dateField,
    unit: "",
    kind: "generic",
    isAppleHealth: false,
    aggregationMethod: "average",
    series,
    points
  };
}

function parseCsvDatasets(text, label) {
  const rows = csvToRows(text);
  if (!rows.length) return [];
  const headers = rows[0];
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell !== ""));
  const dateField = findDateField(headers, (_header, index) => dataRows.map((row) => row[index]));
  if (!dateField) return [];
  const dateIndex = headers.indexOf(dateField);
  const numericFields = headers.filter((h, i) => i !== dateIndex && dataRows.some((row) => Number.isFinite(toNumber(row[i]))));
  if (!numericFields.length) return [];

  const series = numericFields.map((field) => ({
    key: field, label: field, color: "", colorIndex: null, lineWidth: 1, customColor: false
  }));

  const points = dataRows
    .map((row) => {
      const x = toTimestamp(row[dateIndex]);
      if (!Number.isFinite(x)) return null;
      const values = {};
      headers.forEach((h, i) => { values[h] = Number.isFinite(toNumber(row[i])) ? toNumber(row[i]) : null; });
      return { x, rawDate: row[dateIndex], values, raw: Object.fromEntries(headers.map((h, i) => [h, row[i]])) };
    })
    .filter(Boolean)
    .sort((a, b) => a.x - b.x);

  return [{
    id: label,
    key: label,
    label,
    sourceLabel: label,
    dateField,
    unit: "",
    kind: "csv",
    isAppleHealth: false,
    aggregationMethod: "average",
    series,
    points
  }];
}

function csvToRows(text) {
  const rows = [];
  let row = [], cell = "", quote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1];
    if (ch === '"') {
      if (quote && nx === '"') { cell += '"'; i++; } else { quote = !quote; }
    } else if (ch === "," && !quote) {
      row.push(cell); cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quote) {
      if (ch === "\r" && nx === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  if (rows[0]?.[0]) rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  return rows;
}

// ─── Rendering ────────────────────────────────────────────────────────────

function renderAll() {
  renderSlots();
  renderMarkers();
  renderRanges();
  renderAggregationTable();
  updateSummaryChip();
  updateToolbar();
  updateChartDescription();
  drawChart();
}

function renderSlots() {
  elements.slotsList.innerHTML = "";
  state.chartSlots.forEach((slot, index) => {
    elements.slotsList.append(buildSlotItem(slot, index));
  });
  const canAdd = state.chartSlots.length < 2 && state.datasets.length > 0;
  elements.addSlotButton.hidden = !canAdd;
}

function buildSlotItem(slot, slotIndex) {
  const dataset = state.datasets.find((d) => d.id === slot.datasetId);
  const axisLabel = slotIndex === 0 ? "Left axis" : "Right axis";

  const wrap = document.createElement("div");
  wrap.className = "slot-item";

  // Header
  const header = document.createElement("div");
  header.className = "slot-header";

  const axisSpan = document.createElement("span");
  axisSpan.className = "slot-axis-label";
  axisSpan.textContent = axisLabel;
  header.append(axisSpan);

  const select = document.createElement("select");
  select.className = "slot-dataset-select";
  select.setAttribute("aria-label", `${axisLabel} dataset`);
  state.datasets.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.label}${d.unit ? ` (${d.unit})` : ""}`;
    opt.selected = d.id === slot.datasetId;
    select.append(opt);
  });
  select.addEventListener("change", () => handleSlotDatasetChange(slot.id, select.value));
  header.append(select);

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn--quiet btn--danger btn--icon slot-remove-btn";
  removeBtn.setAttribute("aria-label", `Remove ${axisLabel.toLowerCase()} dataset`);
  removeBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6l-12 12M6 6l12 12"></path></svg>';
  removeBtn.addEventListener("click", () => removeSlot(slot.id));
  header.append(removeBtn);

  wrap.append(header);

  if (!dataset) return wrap;

  // Compact meta
  const first = dataset.points[0]?.x;
  const last = dataset.points[dataset.points.length - 1]?.x;
  if (first && last) {
    const meta = document.createElement("div");
    meta.className = "meta-kv";
    meta.innerHTML = `
      <span class="hint">Samples</span><span>${dataset.points.length.toLocaleString()}</span>
      <span class="hint">Range</span><span>${escapeHtml(formatDateShort(first))} – ${escapeHtml(formatDateShort(last))}</span>
    `;
    wrap.append(meta);
  }

  // Series list
  const seriesList = document.createElement("div");
  seriesList.className = "series-list";
  dataset.series.forEach((series) => {
    seriesList.append(buildSeriesItem(slot, dataset, series));
  });
  wrap.append(seriesList);

  return wrap;
}

function buildSeriesItem(slot, dataset, series) {
  const item = document.createElement("div");
  item.className = "series-item";

  const checked = slot.selectedSeries.has(series.key);
  const latestValue = getLatestValue(dataset, series.key);

  item.innerHTML = `
    <div class="series-top">
      <span class="chip"><span class="color-dot" style="background:${series.color}"></span>${escapeHtml(series.shortLabel || series.label)}</span>
      <input type="checkbox" ${checked ? "checked" : ""} data-series-key="${escapeHtml(series.key)}">
    </div>
    <div class="series-controls">
      <div class="hint">Latest: ${latestValue ?? "no data"}${dataset.unit ? ` ${escapeHtml(dataset.unit)}` : ""}</div>
      <div class="series-grid">
        <div class="palette-block">
          <div class="series-control-row">
            <span class="hint">Color</span>
            ${dataset.unit ? `<span class="unit-badge">${escapeHtml(dataset.unit)}</span>` : ""}
          </div>
          <div class="palette" data-palette-series="${escapeHtml(series.key)}"></div>
        </div>
        <label class="series-width">
          <div class="series-width-row">
            <span class="hint">Line width</span>
            <span class="hint">${escapeHtml(round(series.lineWidth || 1))} px</span>
          </div>
          <input type="range" min="0.1" max="2" step="0.1" value="${escapeHtml(series.lineWidth || 1)}" data-width-series="${escapeHtml(series.key)}">
        </label>
      </div>
    </div>
  `;

  const checkbox = item.querySelector("input[type=checkbox]");
  checkbox.setAttribute("aria-label", `Show ${series.shortLabel || series.label}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) slot.selectedSeries.add(series.key);
    else slot.selectedSeries.delete(series.key);
    fitToVisibleSeries();
    renderAll();
  });

  renderPaletteInto(item.querySelector(`[data-palette-series="${CSS.escape(series.key)}"]`), series.color, (color, colorIndex) => {
    series.color = color;
    series.colorIndex = colorIndex;
    series.customColor = true;
    renderAll();
  });

  const widthSlider = item.querySelector(`[data-width-series="${CSS.escape(series.key)}"]`);
  const widthLabel = item.querySelector(".series-width-row").lastElementChild;
  widthSlider.addEventListener("input", (e) => {
    series.lineWidth = Number(e.target.value);
    widthLabel.textContent = `${round(series.lineWidth)} px`;
    drawChart();
  });
  widthSlider.addEventListener("change", () => renderAll());

  return item;
}

function getLatestValue(dataset, key) {
  for (let i = dataset.points.length - 1; i >= 0; i--) {
    const v = dataset.points[i].values[key];
    if (Number.isFinite(v)) return round(v);
  }
  return null;
}

function renderMarkers() {
  elements.markerList.innerHTML = "";
  if (!state.markers.length) {
    const note = document.createElement("div");
    note.className = "hint";
    note.textContent = "No markers yet.";
    elements.markerList.append(note);
    return;
  }
  state.markers
    .slice()
    .sort((a, b) => a.x - b.x)
    .forEach((marker) => {
      const item = document.createElement("div");
      item.className = "marker-item";
      item.innerHTML = `
        <div class="marker-top">
          <span class="chip"><span class="color-dot" style="background:${marker.color}"></span>${escapeHtml(marker.label || "Untitled")}</span>
          <button type="button" class="btn btn--quiet btn--danger">Delete</button>
        </div>
        <div class="hint">${formatDateUtc(marker.x)}</div>
      `;
      item.querySelector("button").addEventListener("click", () => {
        state.markers = state.markers.filter((m) => m.id !== marker.id);
        persistAnnotations();
        renderMarkers();
        drawChart();
      });
      elements.markerList.append(item);
    });
}

function renderRanges() {
  elements.rangeList.innerHTML = "";
  if (!state.ranges.length) {
    const note = document.createElement("div");
    note.className = "hint";
    note.textContent = "No analyzed periods yet.";
    elements.rangeList.append(note);
    return;
  }

  state.ranges
    .slice()
    .sort((left, right) => left.startX - right.startX)
    .forEach((range) => {
      const item = document.createElement("div");
      item.className = "range-item";
      const stats = computeRangeStats(range);
      const statsHtml = stats.length
        ? stats.map((stat) => `
            <div class="range-stat">
              <span>${escapeHtml(stat.label)}</span>
              <strong title="Mean, population standard deviation, and observation count">${escapeHtml(formatRangeStatText(stat))}</strong>
            </div>
          `).join("")
        : '<div class="hint">No selected-series observations in this period.</div>';

      item.innerHTML = `
        <div class="marker-top">
          <span class="chip"><span class="color-dot" style="background:${range.color}"></span>${escapeHtml(range.label || "Analyzed period")}</span>
          <button type="button" class="btn btn--quiet btn--danger">Delete</button>
        </div>
        <div class="hint">${escapeHtml(formatDateUtc(range.startX))} – ${escapeHtml(formatDateUtc(range.endX))}</div>
        <div class="range-stats">${statsHtml}</div>
      `;
      item.querySelector("button").addEventListener("click", () => {
        state.ranges = state.ranges.filter((candidate) => candidate.id !== range.id);
        persistAnnotations();
        renderRanges();
        drawChart();
      });
      elements.rangeList.append(item);
    });
}

function computeRangeStats(range) {
  return getSelectedRawSeries()
    .map((selected) => {
      const values = selected.points
        .filter((point) => point.x >= range.startX && point.x <= range.endX)
        .map((point) => point.y);
      if (!values.length) return null;
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
      return {
        label: selected.datasetLabel === selected.label
          ? selected.label
          : `${selected.datasetLabel} — ${selected.label}`,
        unit: selected.datasetUnit,
        count: values.length,
        mean,
        deviation: Math.sqrt(variance)
      };
    })
    .filter(Boolean);
}

function formatRangeStatText(stat) {
  const unit = stat.unit ? ` ${stat.unit}` : "";
  return `Mean ${round(stat.mean)}${unit} · SD ${round(stat.deviation)}${unit} · n=${stat.count}`;
}

function getRangeSummary(range) {
  const dates = `${formatDateShortUtc(range.startX)} – ${formatDateShortUtc(range.endX)}`;
  return {
    title: range.label ? `${range.label} · ${dates}` : dates,
    stats: computeRangeStats(range)
  };
}

function updateSummaryChip() {
  const processed = getProcessedSeries();
  if (!processed.length) {
    elements.summaryChip.textContent = "No data";
    elements.summaryChip.title = "No data";
    return;
  }
  const labels = state.chartSlots
    .map((slot) => state.datasets.find((d) => d.id === slot.datasetId)?.label)
    .filter(Boolean);
  const totalPts = getSelectedRawSeries().reduce((sum, series) => sum + series.points.length, 0);
  const summary = `${labels.join(" + ")} • ${processed.length} series • ${totalPts.toLocaleString()} pts`;
  elements.summaryChip.textContent = summary;
  elements.summaryChip.title = summary;
}

function updateToolbar() {
  const hasData = getProcessedSeries().length > 0;
  elements.fitSelectionButton.disabled = !hasData;
  elements.copyPngButton.disabled = !hasData;
  elements.exportPngButton.disabled = !hasData;
  elements.addRangeButton.disabled = !hasData;
}

function updateChartDescription() {
  const rawSeries = getSelectedRawSeries();
  if (!rawSeries.length) {
    elements.chartDescription.textContent = "Load a file and select a data series to explore the chart.";
    return;
  }
  const labels = rawSeries.map((series) => `${series.datasetLabel}: ${series.label}`).join("; ");
  const from = Number.isFinite(state.chart.viewMinX) ? formatDate(state.chart.viewMinX) : "unknown";
  const to = Number.isFinite(state.chart.viewMaxX) ? formatDate(state.chart.viewMaxX) : "unknown";
  elements.chartDescription.textContent =
    `Interactive chart from ${from} to ${to}. Selected series: ${labels}. ` +
    "Use Left and Right Arrow to pan, Plus and Minus to zoom, and Home to reset the view.";
}

function chartPngBlob() {
  const ratio = elements.chartCanvas.width / Math.max(1, elements.chartCanvas.clientWidth);
  const margin = 18 * ratio;
  const legendGap = 18 * ratio;
  const lineHeight = 20 * ratio;
  const visibleRangeSummaries = state.ranges
    .filter((range) =>
      range.endX >= state.chart.viewMinX &&
      range.startX <= state.chart.viewMaxX
    )
    .map((range) => ({ range, ...getRangeSummary(range) }));
  const legend = getProcessedSeries().map((series) => ({
    color: series.color,
    label: `${series.datasetLabel === series.label ? series.label : `${series.datasetLabel} — ${series.label}`}${series.datasetUnit ? ` (${series.datasetUnit})` : ""}`
  }));
  const scratch = document.createElement("canvas").getContext("2d");
  scratch.font = `${12 * ratio}px ${getCssVariable("--font-sans")}`;
  let legendRows = 1;
  let currentWidth = 0;
  legend.forEach((entry) => {
    const entryWidth = 14 * ratio + scratch.measureText(entry.label).width + legendGap;
    if (currentWidth && currentWidth + entryWidth > elements.chartCanvas.width - margin * 2) {
      legendRows++;
      currentWidth = entryWidth;
    } else {
      currentWidth += entryWidth;
    }
  });
  const headerHeight = (58 * ratio) + legendRows * lineHeight;
  const footerHeight = visibleRangeSummaries.length
    ? (
        62 +
        visibleRangeSummaries.reduce(
          (height, summary) => height + 26 + Math.max(1, summary.stats.length) * 18,
          0
        )
      ) * ratio
    : 0;
  const output = document.createElement("canvas");
  output.width = elements.chartCanvas.width;
  output.height = elements.chartCanvas.height + headerHeight + footerHeight;
  const outputCtx = output.getContext("2d");
  outputCtx.fillStyle = getCssVariable("--surface");
  outputCtx.fillRect(0, 0, output.width, output.height);

  const datasetLabels = state.chartSlots
    .map((slot) => state.datasets.find((dataset) => dataset.id === slot.datasetId)?.label)
    .filter(Boolean);
  outputCtx.fillStyle = getCssVariable("--text");
  outputCtx.font = `600 ${18 * ratio}px ${getCssVariable("--font-sans")}`;
  outputCtx.fillText(datasetLabels.join(" + ") || "hexports chart", margin, 26 * ratio);
  outputCtx.fillStyle = getCssVariable("--text-muted");
  outputCtx.font = `${11 * ratio}px ${getCssVariable("--font-sans")}`;
  const rangeLabel = Number.isFinite(state.chart.viewMinX) && Number.isFinite(state.chart.viewMaxX)
    ? `${formatDate(state.chart.viewMinX)} – ${formatDate(state.chart.viewMaxX)}`
    : "";
  outputCtx.fillText([state.sourceName, rangeLabel].filter(Boolean).join(" · "), margin, 45 * ratio);

  let legendX = margin;
  let legendY = 68 * ratio;
  outputCtx.font = `${12 * ratio}px ${getCssVariable("--font-sans")}`;
  legend.forEach((entry) => {
    const textWidth = outputCtx.measureText(entry.label).width;
    const entryWidth = 14 * ratio + textWidth + legendGap;
    if (legendX > margin && legendX + entryWidth > output.width - margin) {
      legendX = margin;
      legendY += lineHeight;
    }
    outputCtx.fillStyle = entry.color;
    outputCtx.beginPath();
    outputCtx.arc(legendX + 4 * ratio, legendY - 4 * ratio, 4 * ratio, 0, Math.PI * 2);
    outputCtx.fill();
    outputCtx.fillStyle = getCssVariable("--text");
    outputCtx.fillText(entry.label, legendX + 12 * ratio, legendY);
    legendX += entryWidth;
  });

  outputCtx.drawImage(elements.chartCanvas, 0, headerHeight);
  if (visibleRangeSummaries.length) {
    let footerY = headerHeight + elements.chartCanvas.height;
    outputCtx.strokeStyle = getCssVariable("--line-strong");
    outputCtx.lineWidth = ratio;
    outputCtx.beginPath();
    outputCtx.moveTo(margin, footerY + 1 * ratio);
    outputCtx.lineTo(output.width - margin, footerY + 1 * ratio);
    outputCtx.stroke();

    footerY += 24 * ratio;
    outputCtx.fillStyle = getCssVariable("--text");
    outputCtx.font = `600 ${14 * ratio}px ${getCssVariable("--font-sans")}`;
    outputCtx.fillText("Analyzed periods", margin, footerY);
    footerY += 22 * ratio;

    visibleRangeSummaries.forEach(({ range, title, stats }) => {
      outputCtx.fillStyle = range.color;
      outputCtx.fillRect(margin, footerY - 10 * ratio, 3 * ratio, 14 * ratio);
      outputCtx.fillStyle = getCssVariable("--text");
      outputCtx.font = `600 ${12 * ratio}px ${getCssVariable("--font-sans")}`;
      outputCtx.fillText(
        fitTextForContext(outputCtx, title, output.width - margin * 2 - 12 * ratio),
        margin + 10 * ratio,
        footerY
      );
      footerY += 18 * ratio;

      outputCtx.fillStyle = getCssVariable("--text-muted");
      outputCtx.font = `${11 * ratio}px ${getCssVariable("--font-sans")}`;
      const statLines = stats.length
        ? stats.map((stat) => `${stat.label}: ${formatRangeStatText(stat)}`)
        : ["No selected-series observations in this period."];
      statLines.forEach((line) => {
        outputCtx.fillText(
          fitTextForContext(outputCtx, line, output.width - margin * 2 - 10 * ratio),
          margin + 10 * ratio,
          footerY
        );
        footerY += 18 * ratio;
      });
      footerY += 8 * ratio;
    });

    outputCtx.fillStyle = getCssVariable("--text-muted");
    outputCtx.font = `${10 * ratio}px ${getCssVariable("--font-sans")}`;
    outputCtx.fillText(
      "Mean and population SD use raw observations in each period; chart smoothing is not applied.",
      margin,
      footerY + 4 * ratio
    );
  }
  return new Promise((resolve, reject) => {
    output.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG generation failed")), "image/png");
  });
}

async function copyChartPng() {
  try {
    const blobPromise = chartPngBlob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
    toast("Chart PNG copied.");
  } catch (error) {
    toast("Could not copy the chart PNG.", true);
  }
}

async function downloadChartPng() {
  try {
    const blob = await chartPngBlob();
    const link = document.createElement("a");
    const stem = (state.sourceName || "hexports-chart").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
    link.download = `${stem || "hexports-chart"}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast("Chart PNG downloaded.");
  } catch (error) {
    toast("Could not download the chart PNG.", true);
  }
}

let toastTimer = null;
function toast(message, isError = false) {
  const toastElement = document.getElementById("toast");
  toastElement.textContent = message;
  toastElement.classList.toggle("is-error", isError);
  toastElement.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove("is-shown"), isError ? 6000 : 3600);
}

// ─── Marker popup ─────────────────────────────────────────────────────────

function setInteractionMode(mode) {
  if (!["marker", "range"].includes(mode)) return;
  state.interactionMode = mode;
  hideMarkerPopup();
  hideRangePopup();
  updateInteractionMode();
  persistPreferences();
}

function updateInteractionMode() {
  const isRange = state.interactionMode === "range";
  elements.markerModeButton.classList.toggle("is-active", !isRange);
  elements.rangeModeButton.classList.toggle("is-active", isRange);
  elements.markerModeButton.setAttribute("aria-pressed", String(!isRange));
  elements.rangeModeButton.setAttribute("aria-pressed", String(isRange));
  elements.canvasWrap.classList.toggle("range-mode", isRange);
  elements.annotationHelp.textContent = isRange
    ? "Period mode: drag across the chart to analyze a date range."
    : "Marker mode: click the chart to add a dated marker.";
}

function positionPopup(popup, clientX, clientY) {
  const viewportPadding = 8;
  const pointerGap = 14;

  popup.style.left = "0px";
  popup.style.top = "0px";
  popup.classList.add("visible");

  const popupBounds = popup.getBoundingClientRect();
  const availableWidth = Math.max(0, window.innerWidth - viewportPadding * 2);
  const availableHeight = Math.max(0, window.innerHeight - viewportPadding * 2);
  const popupWidth = Math.min(popupBounds.width, availableWidth);
  const popupHeight = Math.min(popupBounds.height, availableHeight);

  let viewportLeft = clientX + pointerGap;
  let viewportTop = clientY - 20;
  if (viewportLeft + popupWidth > window.innerWidth - viewportPadding) {
    viewportLeft = clientX - popupWidth - pointerGap;
  }

  viewportLeft = clamp(
    viewportLeft,
    viewportPadding,
    Math.max(viewportPadding, window.innerWidth - popupWidth - viewportPadding)
  );
  viewportTop = clamp(
    viewportTop,
    viewportPadding,
    Math.max(viewportPadding, window.innerHeight - popupHeight - viewportPadding)
  );

  popup.style.left = `${viewportLeft}px`;
  popup.style.top = `${viewportTop}px`;
}

function showMarkerPopup(clientX, clientY, dateStr) {
  hideRangePopup();
  elements.popupMarkerDate.value = dateStr;
  elements.popupMarkerLabel.value = "";
  renderPopupPalette();

  positionPopup(elements.markerPopup, clientX, clientY);
  elements.popupMarkerLabel.focus({ preventScroll: true });
}

function hideMarkerPopup() {
  elements.markerPopup.classList.remove("visible");
}

function renderPopupPalette() {
  renderPaletteInto(elements.popupMarkerPalette, state.markerDraftColor, (color, colorIndex) => {
    state.markerDraftColor = color;
    state.markerDraftColorIndex = colorIndex;
    renderPopupPalette();
  });
}

function addMarkerFromPopup() {
  const date = elements.popupMarkerDate.value;
  if (!date) return;
  state.markers.push({
    id: uid(),
    x: toTimestamp(date),
    label: elements.popupMarkerLabel.value.trim(),
    color: state.markerDraftColor,
    colorIndex: state.markerDraftColorIndex
  });
  persistAnnotations();
  hideMarkerPopup();
  renderMarkers();
  drawChart();
}

function showRangePopup(clientX, clientY, startX, endX) {
  hideMarkerPopup();
  const start = Math.min(startX, endX);
  const end = Math.max(startX, endX);
  elements.rangeStartDate.value = formatDateInput(start);
  elements.rangeEndDate.value = formatDateInput(end);
  elements.rangeLabel.value = "";
  renderRangePalette();

  positionPopup(elements.rangePopup, clientX, clientY);
  elements.rangeLabel.focus({ preventScroll: true });
}

function showRangePopupForView() {
  if (!Number.isFinite(state.chart.viewMinX) || !Number.isFinite(state.chart.viewMaxX)) return;
  const bounds = elements.chartCanvas.getBoundingClientRect();
  showRangePopup(
    bounds.left + bounds.width / 2,
    bounds.top + Math.min(80, bounds.height / 2),
    state.chart.viewMinX,
    state.chart.viewMaxX
  );
}

function hideRangePopup() {
  elements.rangePopup.classList.remove("visible");
}

function renderRangePalette() {
  renderPaletteInto(elements.rangePalette, state.rangeDraftColor, (color, colorIndex) => {
    state.rangeDraftColor = color;
    state.rangeDraftColorIndex = colorIndex;
    renderRangePalette();
  });
}

function addRangeFromPopup() {
  const start = toTimestamp(elements.rangeStartDate.value);
  const endDate = toTimestamp(elements.rangeEndDate.value);
  if (!Number.isFinite(start) || !Number.isFinite(endDate)) {
    toast("Choose a valid start and end date.", true);
    return;
  }
  const end = endDate + DAY_MS - 1;
  if (end < start) {
    toast("The period end must be on or after its start.", true);
    return;
  }

  state.ranges.push({
    id: uid(),
    startX: start,
    endX: end,
    label: elements.rangeLabel.value.trim(),
    color: state.rangeDraftColor,
    colorIndex: state.rangeDraftColorIndex
  });
  persistAnnotations();
  hideRangePopup();
  renderRanges();
  drawChart();
}

// ─── Series processing ────────────────────────────────────────────────────

function getSelectedRawSeries() {
  const results = [];
  state.chartSlots.forEach((slot, slotIndex) => {
    const dataset = state.datasets.find((candidate) => candidate.id === slot.datasetId);
    if (!dataset) return;
    const axis = slotIndex === 0 ? "left" : "right";
    dataset.series
      .filter((series) => slot.selectedSeries.has(series.key))
      .forEach((series) => {
        const points = dataset.points
          .map((point) => ({ x: point.x, y: point.values[series.key], raw: point }))
          .filter((point) => Number.isFinite(point.y));
        if (!points.length) return;
        results.push({
          ...series,
          points,
          axis,
          datasetLabel: dataset.label,
          datasetUnit: dataset.unit || "",
          displayMode: dataset.displayMode || "line",
          slotIndex
        });
      });
  });
  return results;
}

function getProcessedSeries() {
  return getSelectedRawSeries().map((series) => ({
    ...series,
    points: smoothPoints(series.points, state.smoothingWindow, state.smoothingMode)
  }));
}

function smoothPoints(points, windowDays, mode) {
  if (!windowDays) return points;
  if (mode === "ema") return ema(points, windowDays);
  return movingAverage(points, windowDays);
}

function movingAverage(points, windowDays) {
  const windowMs = windowDays * DAY_MS;
  const result = [];
  let start = 0;
  let sum = 0;

  points.forEach((point, index) => {
    sum += point.y;
    while (start < index && point.x - points[start].x > windowMs) {
      sum -= points[start].y;
      start++;
    }
    result.push({ ...point, y: sum / (index - start + 1) });
  });
  return result;
}

function ema(points, windowDays) {
  const dailyAlpha = 2 / (windowDays + 1);
  let prev = points[0]?.y ?? 0;
  return points.map((pt, i) => {
    if (i === 0) { prev = pt.y; return pt; }
    const elapsedDays = Math.max(0, (pt.x - points[i - 1].x) / DAY_MS);
    const alpha = elapsedDays > 0
      ? 1 - Math.pow(1 - dailyAlpha, elapsedDays)
      : dailyAlpha;
    prev = alpha * pt.y + (1 - alpha) * prev;
    return { ...pt, y: prev };
  });
}

// ─── View / zoom ──────────────────────────────────────────────────────────

function resetChartView() {
  const processed = getProcessedSeries();
  const extent = getSeriesXExtent(processed);
  if (!extent) {
    state.chart.viewMinX = null; state.chart.viewMaxX = null;
    state.chart.fullMinX = null; state.chart.fullMaxX = null;
    return;
  }
  const { minX, maxX } = extent;
  state.chart.fullMinX = minX; state.chart.fullMaxX = maxX;
  state.chart.viewMinX = minX; state.chart.viewMaxX = maxX;
}

function fitToVisibleSeries() {
  const processed = getProcessedSeries();
  const extent = getSeriesXExtent(processed);
  if (!extent) return;
  state.chart.viewMinX = extent.minX;
  state.chart.viewMaxX = extent.maxX;
}

function getSeriesXExtent(seriesList) {
  let minX = Infinity;
  let maxX = -Infinity;
  seriesList.forEach((series) => {
    series.points.forEach((point) => {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
    });
  });
  return Number.isFinite(minX) && Number.isFinite(maxX) ? { minX, maxX } : null;
}

function getChartPadding() {
  const hasRight = state.chartSlots.length >= 2 &&
    !!state.chartSlots[1] &&
    state.chartSlots[1].selectedSeries.size > 0 &&
    state.datasets.some((d) => d.id === state.chartSlots[1]?.datasetId);
  return { top: 24, right: hasRight ? 60 : 30, bottom: 40, left: 60 };
}

// ─── Chart drawing ────────────────────────────────────────────────────────

function drawChart() {
  const processed = getProcessedSeries();
  const width = elements.chartCanvas.clientWidth;
  const height = elements.chartCanvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  if (!processed.length) {
    elements.emptyState.style.display = "grid";
    hideTooltip();
    return;
  }
  elements.emptyState.style.display = "none";

  const padding = getChartPadding();
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  if (!Number.isFinite(state.chart.viewMinX) || !Number.isFinite(state.chart.viewMaxX)) {
    resetChartView();
  }

  const minX = state.chart.viewMinX;
  const maxX = state.chart.viewMaxX;

  const visibleSeries = processed.map((s) => ({
    ...s,
    visiblePoints: s.points.filter((p) => p.x >= minX && p.x <= maxX)
  }));

  // Compute Y ranges per axis
  const leftVisible = visibleSeries.filter((s) => s.axis === "left").flatMap((s) => s.visiblePoints.map((p) => p.y));
  const rightVisible = visibleSeries.filter((s) => s.axis === "right").flatMap((s) => s.visiblePoints.map((p) => p.y));
  if (visibleSeries.some((series) => series.axis === "left" && series.displayMode === "event-bars" && series.visiblePoints.length)) {
    leftVisible.push(0);
  }
  if (visibleSeries.some((series) => series.axis === "right" && series.displayMode === "event-bars" && series.visiblePoints.length)) {
    rightVisible.push(0);
  }

  const effectiveLeft = leftVisible.length ? leftVisible : rightVisible;
  const effectiveRight = rightVisible.length ? rightVisible : leftVisible;

  const yRangeLeft = computeYRange(effectiveLeft);
  const yRangeRight = computeYRange(effectiveRight);

  const scaleX = (x) => padding.left + ((x - minX) / (maxX - minX || 1)) * plotWidth;
  const scaleYLeft = (y) => padding.top + plotHeight - ((y - yRangeLeft.minY) / (yRangeLeft.maxY - yRangeLeft.minY || 1)) * plotHeight;
  const scaleYRight = (y) => padding.top + plotHeight - ((y - yRangeRight.minY) / (yRangeRight.maxY - yRangeRight.minY || 1)) * plotHeight;

  const hasRight = rightVisible.length > 0;

  drawRanges({ padding, plotWidth, plotHeight, minX, maxX, scaleX });
  drawGrid({ padding, plotWidth, plotHeight, minX, maxX, scaleX, yRangeLeft, yRangeRight, hasRight });
  drawMarkers({ padding, plotHeight, minX, maxX, scaleX });

  visibleSeries.forEach((series) => {
    if (!series.visiblePoints.length) return;
    const scaleY = series.axis === "right" ? scaleYRight : scaleYLeft;
    drawDataSeries(series, scaleX, scaleY);
  });

  drawRangeSummaries({ padding, plotWidth, plotHeight, minX, maxX, scaleX });

  if (state.chart.hover) {
    drawHover({ visibleSeries, scaleX, scaleYLeft, scaleYRight, padding, plotWidth, plotHeight, minX, maxX });
  }
}

function drawDataSeries(series, scaleX, scaleY) {
  if (series.displayMode === "event-bars") {
    const baselineY = scaleY(0);
    ctx.save();
    ctx.strokeStyle = series.color;
    ctx.fillStyle = series.color;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = Math.max(1, series.lineWidth || 1);
    series.visiblePoints.forEach((point) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      ctx.beginPath();
      ctx.moveTo(x, baselineY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.75, (series.lineWidth || 1) + 0.5), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    return;
  }

  if (series.displayMode === "event-points") {
    drawSeriesPoints(series, scaleX, scaleY, true);
    return;
  }

  ctx.strokeStyle = series.color;
  ctx.lineWidth = series.lineWidth || 1;
  ctx.beginPath();
  series.visiblePoints.forEach((point, index) => {
    const x = scaleX(point.x);
    const y = scaleY(point.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  if (shouldDrawPoints(series.visiblePoints.length)) {
    drawSeriesPoints(series, scaleX, scaleY);
  }
}

function drawSeriesPoints(series, scaleX, scaleY, emphasize = false) {
  ctx.save();
  ctx.fillStyle = series.color;
  ctx.globalAlpha = emphasize ? 0.82 : 1;
  const radius = Math.max(emphasize ? 2.25 : 2, (series.lineWidth || 1) + 0.75);
  series.visiblePoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(scaleX(point.x), scaleY(point.y), radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawRanges({ padding, plotWidth, plotHeight, minX, maxX, scaleX }) {
  const ranges = state.ranges.slice();
  if (state.chart.rangeDraft) {
    ranges.push({
      startX: Math.min(state.chart.rangeDraft.startX, state.chart.rangeDraft.endX),
      endX: Math.max(state.chart.rangeDraft.startX, state.chart.rangeDraft.endX),
      label: "New period",
      color: state.rangeDraftColor,
      isDraft: true
    });
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(padding.left, padding.top, plotWidth, plotHeight);
  ctx.clip();

  ranges.forEach((range) => {
    if (range.endX < minX || range.startX > maxX) return;
    const startX = scaleX(Math.max(range.startX, minX));
    const endX = scaleX(Math.min(range.endX, maxX));
    const width = Math.max(1, endX - startX);

    ctx.save();
    ctx.fillStyle = range.color;
    ctx.globalAlpha = range.isDraft ? 0.18 : 0.1;
    ctx.fillRect(startX, padding.top, width, plotHeight);
    ctx.globalAlpha = range.isDraft ? 0.9 : 0.65;
    ctx.strokeStyle = range.color;
    ctx.lineWidth = range.isDraft ? 2 : 1;
    ctx.setLineDash(range.isDraft ? [4, 4] : []);
    ctx.strokeRect(startX, padding.top, width, plotHeight);
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    if (range.isDraft) {
      ctx.fillStyle = range.color;
      ctx.font = `10px ${getCssVariable("--font-sans")}`;
      ctx.textAlign = "left";
      ctx.fillText("New period", startX + 5, padding.top + 13);
    }
    ctx.restore();
  });

  ctx.restore();
}

function drawRangeSummaries({ padding, plotWidth, plotHeight, minX, maxX, scaleX }) {
  const visibleRanges = state.ranges
    .filter((range) => range.endX >= minX && range.startX <= maxX)
    .slice()
    .sort((left, right) => left.startX - right.startX);
  if (!visibleRanges.length) return;

  const plotRight = padding.left + plotWidth;
  const lineHeight = 16;
  const cardPadding = 7;
  const gap = 5;
  const maxCardWidth = Math.max(120, Math.min(420, plotWidth - 8));
  const occupied = [];

  ctx.save();
  ctx.beginPath();
  ctx.rect(padding.left, padding.top, plotWidth, plotHeight);
  ctx.clip();

  visibleRanges.forEach((range) => {
    const summary = getRangeSummary(range);
    const availableDetailLines = Math.max(
      1,
      Math.floor((plotHeight - cardPadding * 2 - lineHeight) / lineHeight)
    );
    let detailLines = summary.stats.map(
      (stat) => `${stat.label}: ${formatRangeStatText(stat)}`
    );
    if (!detailLines.length) {
      detailLines = ["No selected-series observations in this period."];
    } else if (detailLines.length > availableDetailLines) {
      const visibleCount = Math.max(0, availableDetailLines - 1);
      detailLines = [
        ...detailLines.slice(0, visibleCount),
        `+${detailLines.length - visibleCount} more selected series`
      ];
    }
    const lines = [summary.title, ...detailLines];

    ctx.font = `600 12px ${getCssVariable("--font-sans")}`;
    let desiredWidth = ctx.measureText(lines[0]).width;
    ctx.font = `11px ${getCssVariable("--font-sans")}`;
    lines.slice(1).forEach((line) => {
      desiredWidth = Math.max(desiredWidth, ctx.measureText(line).width);
    });

    const cardWidth = Math.min(maxCardWidth, Math.max(120, desiredWidth + cardPadding * 2));
    const cardHeight = cardPadding * 2 + lines.length * lineHeight;
    const rangeStart = scaleX(Math.max(range.startX, minX));
    let cardX = clamp(rangeStart + gap, padding.left + 4, plotRight - cardWidth - 4);
    let cardY = padding.top + gap;

    while (
      occupied.some((box) =>
        cardX < box.right + gap &&
        cardX + cardWidth > box.left - gap &&
        cardY < box.bottom + gap &&
        cardY + cardHeight > box.top - gap
      ) &&
      cardY + cardHeight + gap < padding.top + plotHeight
    ) {
      cardY += cardHeight + gap;
    }
    occupied.push({
      left: cardX,
      right: cardX + cardWidth,
      top: cardY,
      bottom: cardY + cardHeight
    });

    ctx.fillStyle = getCssVariable("--surface");
    ctx.globalAlpha = 0.5;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = range.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX + 0.5, cardY + 0.5, cardWidth - 1, cardHeight - 1);
    ctx.fillStyle = range.color;
    ctx.fillRect(cardX, cardY, 3, cardHeight);

    let textY = cardY + cardPadding + 11;
    ctx.textAlign = "left";
    ctx.fillStyle = getCssVariable("--text");
    ctx.font = `600 12px ${getCssVariable("--font-sans")}`;
    ctx.fillText(fitCanvasText(lines[0], cardWidth - cardPadding * 2), cardX + cardPadding, textY);
    ctx.font = `11px ${getCssVariable("--font-sans")}`;
    lines.slice(1).forEach((line) => {
      textY += lineHeight;
      ctx.fillText(fitCanvasText(line, cardWidth - cardPadding * 2), cardX + cardPadding, textY);
    });
  });

  ctx.restore();
}

function fitCanvasText(text, maxWidth) {
  return fitTextForContext(ctx, text, maxWidth);
}

function fitTextForContext(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  let fitted = text;
  while (fitted.length && context.measureText(`${fitted}${ellipsis}`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  return `${fitted}${ellipsis}`;
}

function computeYRange(values) {
  if (!values.length) return { minY: 0, maxY: 1 };
  let minY = Infinity;
  let maxY = -Infinity;
  values.forEach((value) => {
    if (value < minY) minY = value;
    if (value > maxY) maxY = value;
  });
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const pad = (maxY - minY) * 0.08;
  return { minY: minY - pad, maxY: maxY + pad };
}

function drawGrid({ padding, plotWidth, plotHeight, minX, maxX, scaleX, yRangeLeft, yRangeRight, hasRight }) {
  ctx.save();
  ctx.strokeStyle = getCssVariable("--chart-grid");
  ctx.lineWidth = 1;
  ctx.fillStyle = getCssVariable("--chart-axis-label");
  ctx.font = `10px ${getCssVariable("--font-sans")}`;

  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const ratio = i / yTicks;
    const y = padding.top + ratio * plotHeight;
    const leftVal = yRangeLeft.maxY - ratio * (yRangeLeft.maxY - yRangeLeft.minY);

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.stroke();

    // Left axis labels
    ctx.textAlign = "right";
    ctx.fillText(round(leftVal), padding.left - 6, y + 3);

    // Right axis labels
    if (hasRight) {
      const rightVal = yRangeRight.maxY - ratio * (yRangeRight.maxY - yRangeRight.minY);
      ctx.textAlign = "left";
      ctx.fillText(round(rightVal), padding.left + plotWidth + 6, y + 3);
    }
  }

  const xTicks = Math.min(8, Math.max(3, Math.floor(plotWidth / 100)));
  for (let i = 0; i <= xTicks; i++) {
    const ratio = i / xTicks;
    const x = padding.left + ratio * plotWidth;
    const val = minX + ratio * (maxX - minX);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(formatDateShort(val), x, padding.top + plotHeight + 16);
  }

  ctx.strokeStyle = getCssVariable("--chart-axis");
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.stroke();

  if (hasRight) {
    ctx.beginPath();
    ctx.moveTo(padding.left + plotWidth, padding.top);
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMarkers({ padding, plotHeight, minX, maxX, scaleX }) {
  state.markers.forEach((marker) => {
    if (marker.x < minX || marker.x > maxX) return;
    const x = scaleX(marker.x);
    const isHovered = state.chart.hoveredMarkerId === marker.id;

    ctx.save();
    ctx.strokeStyle = marker.color;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = marker.color;
    ctx.font = `11px ${getCssVariable("--font-sans")}`;
    ctx.textAlign = "left";
    ctx.fillText(marker.label || formatDateShort(marker.x), x + 6, padding.top + 14);

    // Delete indicator when hovered
    if (isHovered) {
      const cx = x, cy = padding.top + 12, r = 9;
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = getCssVariable("--text-on-accent");
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx + 4, cy + 4);
      ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx - 4, cy + 4);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawHover({ visibleSeries, scaleX, scaleYLeft, scaleYRight, padding, plotWidth, plotHeight, minX, maxX }) {
  const hoverXValue = minX + ((state.chart.hover.x - padding.left) / plotWidth) * (maxX - minX);

  // Find the nearest X timestamp across all series
  let nearestX = null;
  visibleSeries.forEach((s) => {
    s.visiblePoints.forEach((pt) => {
      const dx = Math.abs(pt.x - hoverXValue);
      if (nearestX === null || dx < nearestX.dx) nearestX = { x: pt.x, dx };
    });
  });
  if (!nearestX) { hideTooltip(); return; }

  const x = scaleX(nearestX.x);

  // Vertical crosshair
  ctx.save();
  ctx.strokeStyle = getCssVariable("--chart-axis");
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, padding.top);
  ctx.lineTo(x, padding.top + plotHeight);
  ctx.stroke();
  ctx.restore();

  // Dots and tooltip entries
  const entries = [];
  visibleSeries.forEach((series) => {
    const scaleY = series.axis === "right" ? scaleYRight : scaleYLeft;
    let nearest = null, minDx = Infinity;
    series.visiblePoints.forEach((pt) => {
      const dx = Math.abs(pt.x - nearestX.x);
      if (dx < minDx) { minDx = dx; nearest = pt; }
    });
    if (!nearest) return;
    const y = scaleY(nearest.y);
    ctx.save();
    ctx.fillStyle = series.color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    entries.push({ series, point: nearest });
  });

  showTooltip(entries, nearestX.x, x);
}

function shouldDrawPoints(count) {
  if (state.pointMode === "always") return true;
  if (state.pointMode === "never") return false;
  return count <= 180;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────

function showTooltip(entries, timestamp, canvasX) {
  elements.tooltip.classList.add("visible");
  const tw = 200;
  const txPx = Math.min(canvasX + 14, elements.chartCanvas.clientWidth - tw);
  elements.tooltip.style.transform = `translate(${txPx}px, 16px)`;

  const rows = entries.map(({ series, point }) => {
    const unit = series.datasetUnit ? ` ${escapeHtml(series.datasetUnit)}` : "";
    return `<div><span class="series-color-dot" style="--series-color:${series.color}"></span>${escapeHtml(series.label)}: <strong>${round(point.y)}${unit}</strong></div>`;
  });

  const content = `<div class="tooltip-date">${escapeHtml(formatDate(timestamp))}</div>${rows.join("")}`;
  elements.tooltip.innerHTML = content;
  elements.mobileReadout.innerHTML = content;
}

function hideTooltip() {
  elements.tooltip.classList.remove("visible");
  elements.tooltip.style.transform = "translateY(8px)";
}

// ─── Event handlers ───────────────────────────────────────────────────────

function handleWheel(event) {
  const processed = getProcessedSeries();
  if (!processed.length) return;
  event.preventDefault();

  const bounds = elements.chartCanvas.getBoundingClientRect();
  const padding = getChartPadding();
  const plotWidth = bounds.width - padding.left - padding.right;
  if (event.offsetX < padding.left || event.offsetX > bounds.width - padding.right) return;

  const currentMin = state.chart.viewMinX, currentMax = state.chart.viewMaxX;
  const span = currentMax - currentMin;
  const ratio = (event.offsetX - padding.left) / plotWidth;
  const anchor = currentMin + ratio * span;
  const zoomFactor = Math.exp(clamp(event.deltaY, -40, 40) * 0.0025);
  const nextSpan = clamp(span * zoomFactor, 24 * 60 * 60 * 1000, state.chart.fullMaxX - state.chart.fullMinX || span);

  let nextMin = anchor - ratio * nextSpan;
  let nextMax = nextMin + nextSpan;
  if (nextMin < state.chart.fullMinX) { nextMin = state.chart.fullMinX; nextMax = nextMin + nextSpan; }
  if (nextMax > state.chart.fullMaxX) { nextMax = state.chart.fullMaxX; nextMin = nextMax - nextSpan; }

  state.chart.viewMinX = nextMin;
  state.chart.viewMaxX = nextMax;
  updateChartDescription();
  drawChart();
}

function handleGestureStart(event) {
  event.preventDefault();
  state.chart.gestureScale = event.scale || 1;
}

function handleGestureChange(event) {
  event.preventDefault();
  if (!getProcessedSeries().length) return;
  const prev = state.chart.gestureScale || 1;
  const deltaScale = prev / (event.scale || 1);
  state.chart.gestureScale = event.scale || 1;
  const bounds = elements.chartCanvas.getBoundingClientRect();
  zoomAtPosition(bounds.width / 2, deltaScale);
}

function handleGestureEnd(event) {
  event.preventDefault();
  state.chart.gestureScale = null;
}

function handlePointerDown(event) {
  // If popup is open, close it and don't start a drag
  if (elements.markerPopup.classList.contains("visible") || elements.rangePopup.classList.contains("visible")) {
    hideMarkerPopup();
    hideRangePopup();
    return;
  }
  if (!getProcessedSeries().length) return;

  if (state.interactionMode === "range") {
    const bounds = elements.chartCanvas.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const timestamp = timestampAtCanvasOffset(offsetX);
    if (!Number.isFinite(timestamp)) return;
    state.chart.rangeDraft = {
      startClientX: event.clientX,
      startX: timestamp,
      endX: timestamp
    };
    state.chart.isDragging = false;
    drawChart();
    return;
  }

  state.chart.pointerDownAt = {
    clientX: event.clientX,
    clientY: event.clientY,
    minX: state.chart.viewMinX,
    maxX: state.chart.viewMaxX
  };
  state.chart.isDragging = false;
  elements.chartCanvas.classList.add("dragging");
}

function handlePointerMove(event) {
  const bounds = elements.chartCanvas.getBoundingClientRect();
  state.chart.hover = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };

  if (state.chart.rangeDraft) {
    const timestamp = timestampAtCanvasOffset(state.chart.hover.x, true);
    if (Number.isFinite(timestamp)) state.chart.rangeDraft.endX = timestamp;
    if (Math.abs(event.clientX - state.chart.rangeDraft.startClientX) > 4) {
      state.chart.isDragging = true;
    }
    drawChart();
    return;
  }

  if (state.chart.pointerDownAt) {
    const dx = event.clientX - state.chart.pointerDownAt.clientX;
    const dy = event.clientY - state.chart.pointerDownAt.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.chart.isDragging = true;
  }

  if (state.chart.isDragging && state.chart.pointerDownAt) {
    const padding = getChartPadding();
    const plotWidth = bounds.width - padding.left - padding.right;
    const dx = event.clientX - state.chart.pointerDownAt.clientX;
    const span = state.chart.pointerDownAt.maxX - state.chart.pointerDownAt.minX;
    const delta = (dx / plotWidth) * span;
    let nextMin = state.chart.pointerDownAt.minX - delta;
    let nextMax = state.chart.pointerDownAt.maxX - delta;
    const fullSpan = state.chart.fullMaxX - state.chart.fullMinX;
    const curSpan = nextMax - nextMin;
    if (curSpan >= fullSpan) {
      nextMin = state.chart.fullMinX; nextMax = state.chart.fullMaxX;
    } else {
      if (nextMin < state.chart.fullMinX) { nextMin = state.chart.fullMinX; nextMax = nextMin + curSpan; }
      if (nextMax > state.chart.fullMaxX) { nextMax = state.chart.fullMaxX; nextMin = nextMax - curSpan; }
    }
    state.chart.viewMinX = nextMin;
    state.chart.viewMaxX = nextMax;
  }

  updateMarkerHover();
  drawChart();
}

function handlePointerUp(event) {
  if (state.chart.rangeDraft) {
    const draft = state.chart.rangeDraft;
    const wasDrag = state.chart.isDragging;
    state.chart.rangeDraft = null;
    state.chart.isDragging = false;
    if (wasDrag) {
      showRangePopup(event.clientX, event.clientY, draft.startX, draft.endX);
    } else {
      showRangePopup(event.clientX, event.clientY, draft.startX, draft.startX);
    }
    drawChart();
    return;
  }

  const wasClick = !state.chart.isDragging && state.chart.pointerDownAt;
  state.chart.pointerDownAt = null;
  state.chart.isDragging = false;
  elements.chartCanvas.classList.remove("dragging");
  updateChartDescription();
  if (wasClick) handleChartClick(event);
}

function handlePointerUpGlobal() {
  state.chart.pointerDownAt = null;
  state.chart.rangeDraft = null;
  state.chart.isDragging = false;
  elements.chartCanvas.classList.remove("dragging");
}

function handlePointerLeave() {
  state.chart.hover = null;
  state.chart.hoveredMarkerId = null;
  elements.chartCanvas.style.cursor = "";
  if (!state.chart.isDragging) hideTooltip();
  drawChart();
}

function handleChartClick(event) {
  if (state.interactionMode !== "marker") return;
  // Delete hovered marker
  if (state.chart.hoveredMarkerId) {
    state.markers = state.markers.filter((m) => m.id !== state.chart.hoveredMarkerId);
    persistAnnotations();
    state.chart.hoveredMarkerId = null;
    elements.chartCanvas.style.cursor = "";
    renderMarkers();
    drawChart();
    return;
  }

  // Show add-marker popup
  const processed = getProcessedSeries();
  if (!processed.length) return;

  const bounds = elements.chartCanvas.getBoundingClientRect();
  const padding = getChartPadding();
  const offsetX = event.clientX - bounds.left;
  const plotWidth = bounds.width - padding.left - padding.right;

  if (offsetX < padding.left || offsetX > bounds.width - padding.right) return;

  const minX = state.chart.viewMinX, maxX = state.chart.viewMaxX;
  const xValue = minX + ((offsetX - padding.left) / plotWidth) * (maxX - minX);
  const d = new Date(xValue);
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

  showMarkerPopup(event.clientX, event.clientY, dateStr);
}

function updateMarkerHover() {
  if (state.interactionMode !== "marker") {
    state.chart.hoveredMarkerId = null;
    return;
  }
  if (!state.chart.hover || !Number.isFinite(state.chart.viewMinX)) {
    if (state.chart.hoveredMarkerId) {
      state.chart.hoveredMarkerId = null;
      elements.chartCanvas.style.cursor = "";
    }
    return;
  }
  const padding = getChartPadding();
  const bounds = elements.chartCanvas.getBoundingClientRect();
  const plotWidth = bounds.width - padding.left - padding.right;
  const minX = state.chart.viewMinX, maxX = state.chart.viewMaxX;
  const scaleX = (x) => padding.left + ((x - minX) / (maxX - minX || 1)) * plotWidth;

  let found = null;
  state.markers.forEach((marker) => {
    if (marker.x < minX || marker.x > maxX) return;
    const mx = scaleX(marker.x);
    if (Math.abs(state.chart.hover.x - mx) <= 8) found = marker.id;
  });

  if (found !== state.chart.hoveredMarkerId) {
    state.chart.hoveredMarkerId = found;
    if (!state.chart.isDragging) {
      elements.chartCanvas.style.cursor = found ? "pointer" : "";
    }
  }
}

function zoomAtPosition(offsetX, zoomFactor) {
  const bounds = elements.chartCanvas.getBoundingClientRect();
  const padding = getChartPadding();
  const plotWidth = bounds.width - padding.left - padding.right;
  const ratio = clamp((offsetX - padding.left) / plotWidth, 0, 1);
  const currentMin = state.chart.viewMinX, currentMax = state.chart.viewMaxX;
  const span = currentMax - currentMin;
  const anchor = currentMin + ratio * span;
  const nextSpan = clamp(span * zoomFactor, 24 * 60 * 60 * 1000, state.chart.fullMaxX - state.chart.fullMinX || span);
  let nextMin = anchor - ratio * nextSpan;
  let nextMax = nextMin + nextSpan;
  if (nextMin < state.chart.fullMinX) { nextMin = state.chart.fullMinX; nextMax = nextMin + nextSpan; }
  if (nextMax > state.chart.fullMaxX) { nextMax = state.chart.fullMaxX; nextMin = nextMax - nextSpan; }
  state.chart.viewMinX = nextMin;
  state.chart.viewMaxX = nextMax;
  updateChartDescription();
  drawChart();
}

function timestampAtCanvasOffset(offsetX, clampToPlot = false) {
  const bounds = elements.chartCanvas.getBoundingClientRect();
  const padding = getChartPadding();
  const plotWidth = bounds.width - padding.left - padding.right;
  const effectiveX = clampToPlot
    ? clamp(offsetX, padding.left, bounds.width - padding.right)
    : offsetX;
  if (effectiveX < padding.left || effectiveX > bounds.width - padding.right) return NaN;
  const ratio = (effectiveX - padding.left) / plotWidth;
  return state.chart.viewMinX + ratio * (state.chart.viewMaxX - state.chart.viewMinX);
}

function handleChartKeydown(event) {
  if (!getProcessedSeries().length) return;
  const span = state.chart.viewMaxX - state.chart.viewMinX;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const delta = span * 0.1 * direction;
    let nextMin = state.chart.viewMinX + delta;
    let nextMax = state.chart.viewMaxX + delta;
    if (nextMin < state.chart.fullMinX) {
      nextMin = state.chart.fullMinX;
      nextMax = nextMin + span;
    }
    if (nextMax > state.chart.fullMaxX) {
      nextMax = state.chart.fullMaxX;
      nextMin = nextMax - span;
    }
    state.chart.viewMinX = nextMin;
    state.chart.viewMaxX = nextMax;
    updateChartDescription();
    drawChart();
  } else if (event.key === "+" || event.key === "=" || event.key === "-") {
    event.preventDefault();
    zoomAtPosition(elements.chartCanvas.clientWidth / 2, event.key === "-" ? 1.25 : 0.8);
  } else if (event.key === "Home") {
    event.preventDefault();
    resetChartView();
    updateChartDescription();
    drawChart();
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (state.interactionMode === "range") {
      showRangePopupForView();
    } else {
      const bounds = elements.chartCanvas.getBoundingClientRect();
      const middle = state.chart.viewMinX + span / 2;
      showMarkerPopup(
        bounds.left + bounds.width / 2,
        bounds.top + Math.min(80, bounds.height / 2),
        formatDateInput(middle)
      );
    }
  }
}

// ─── Aggregation ──────────────────────────────────────────────────────────

function computeAggregated(period) {
  const allSeries = [];
  state.chartSlots.forEach((slot, slotIndex) => {
    const dataset = state.datasets.find((d) => d.id === slot.datasetId);
    if (!dataset) return;
    dataset.series
      .filter((s) => slot.selectedSeries.has(s.key))
      .forEach((series) => {
        allSeries.push({ series, dataset, valueKey: `${slotIndex}_${series.key}` });
      });
  });
  if (!allSeries.length) return null;

  const allPeriodKeys = new Set();
  const seriesData = allSeries.map(({ series, dataset, valueKey }) => {
    const points = dataset.points
      .map((p) => ({ x: p.x, y: p.values[series.key] }))
      .filter((p) => Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x);
    const aggregationMethod = dataset.aggregationMethod || "average";
    const periodBuckets = new Map();

    points.forEach((point) => {
      const key = getPeriodKey(point.x, period);
      if (!periodBuckets.has(key)) periodBuckets.set(key, []);
      periodBuckets.get(key).push(point);
      allPeriodKeys.add(key);
    });

    const periodValues = new Map();
    periodBuckets.forEach((periodPoints, key) => {
      const values = periodPoints.map((point) => point.y);
      const total = values.reduce((sum, value) => sum + value, 0);
      if (aggregationMethod === "sum") periodValues.set(key, total);
      else if (aggregationMethod === "latest") periodValues.set(key, periodPoints[periodPoints.length - 1].y);
      else periodValues.set(key, total / values.length);
    });
    return { series, dataset, periodValues, valueKey };
  });

  const sortedPeriods = [...allPeriodKeys].sort().reverse();
  const rows = sortedPeriods.map((key) => {
    const values = {};
    seriesData.forEach(({ periodValues, valueKey }) => {
      values[valueKey] = periodValues.has(key) ? periodValues.get(key) : null;
    });
    return { key, values };
  });

  return { rows, seriesData };
}

function renderAggregationTable() {
  const result = computeAggregated(state.aggregationPeriod);
  elements.aggTable.innerHTML = "";
  if (!result || !result.rows.length) {
    elements.aggSection.classList.remove("visible");
    return;
  }
  elements.aggSection.classList.add("visible");

  const table = document.createElement("table");
  const caption = table.createCaption();
  caption.className = "sr-only";
  caption.textContent = `${state.aggregationPeriod === "year" ? "Yearly" : "Monthly"} values. Each column identifies whether it shows a total, average, or latest observation.`;
  const thead = table.createTHead();
  const hrow = thead.insertRow();
  const thPeriod = document.createElement("th");
  thPeriod.textContent = state.aggregationPeriod === "year" ? "Year" : "Month";
  hrow.append(thPeriod);

  result.seriesData.forEach(({ series, dataset }) => {
    const th = document.createElement("th");
    const unit = dataset.unit || "";
    const aggregationLabel = getAggregationLabel(dataset.aggregationMethod);
    th.innerHTML = `<span class="series-color-dot table-color-dot" style="--series-color:${series.color}"></span>${escapeHtml(series.label)} · ${escapeHtml(aggregationLabel)}${unit ? ` (${escapeHtml(formatUnitLabel(unit))})` : ""}`;
    hrow.append(th);
  });

  const tbody = table.createTBody();
  result.rows.forEach(({ key, values }) => {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = formatPeriodKey(key, state.aggregationPeriod);
    result.seriesData.forEach(({ dataset, valueKey }) => {
      tr.insertCell().textContent = formatTableValue(values[valueKey], dataset.unit || "");
    });
  });

  elements.aggTable.append(table);
}

function getAggregationLabel(method) {
  if (method === "sum") return "total";
  if (method === "latest") return "latest";
  return "average";
}

function getPeriodKey(t, period) {
  const d = new Date(t);
  if (period === "year") return String(d.getUTCFullYear());
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatPeriodKey(key, period) {
  if (period === "year") return key;
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ─── Palette rendering ────────────────────────────────────────────────────

function renderPaletteInto(container, selectedColor, onSelect) {
  if (!container) return;
  container.innerHTML = "";
  const frag = document.createDocumentFragment();
  getColorPool().forEach((color, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `swatch${selectedColor === color ? " selected" : ""}`;
    btn.innerHTML = `<span style="--swatch-color:${color}"></span>`;
    btn.title = `Choose color ${idx + 1}`;
    btn.setAttribute("aria-label", `Choose color ${idx + 1}`);
    btn.setAttribute("aria-pressed", String(selectedColor === color));
    btn.addEventListener("click", () => onSelect(color, idx));
    frag.append(btn);
  });
  container.append(frag);
}

// ─── Formatting / utilities ───────────────────────────────────────────────

function findDateField(keys, valuesForKey) {
  const candidates = keys
    .map((key, index) => {
      const values = valuesForKey(key, index).filter((value) => value !== null && value !== undefined && value !== "");
      if (!values.length) return null;
      const validCount = values.filter(isValidDate).length;
      const ratio = validCount / values.length;
      const normalizedKey = String(key).toLowerCase();
      const nameScore = /(^|[_\s-])(date|time|timestamp)([_\s-]|$)/.test(normalizedKey) ||
        /(date|time|timestamp)$/.test(normalizedKey) ? 2 : 0;
      return { key, ratio, validCount, nameScore, index };
    })
    .filter((candidate) => candidate && candidate.validCount > 0 && candidate.ratio >= 0.6)
    .sort((left, right) =>
      right.nameScore - left.nameScore ||
      right.ratio - left.ratio ||
      right.validCount - left.validCount ||
      left.index - right.index
    );
  return candidates[0]?.key || null;
}

function isValidDate(value) {
  if (typeof value !== "string" && typeof value !== "number") return false;
  return Number.isFinite(toTimestamp(value));
}

function toTimestamp(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return NaN;
    if (value >= 946684800 && value <= 4102444800) return value * 1000;
    if (value >= 946684800000 && value <= 4102444800000) return value;
    return NaN;
  }
  if (typeof value !== "string") return NaN;
  const normalized = value.trim();
  if (!normalized) return NaN;
  if (/^\d{10}$/.test(normalized)) return toTimestamp(Number(normalized));
  if (/^\d{13}$/.test(normalized)) return toTimestamp(Number(normalized));
  if (/^\d{4}-\d{2}-\d{2}(?:$|[T\s])/.test(normalized)) {
    const timestamp = Date.parse(normalized);
    return Number.isFinite(timestamp) ? timestamp : NaN;
  }

  const yearFirst = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (yearFirst) return makeUtcDate(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));
  const dayFirst = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dayFirst) return makeUtcDate(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1]));
  return NaN;
}

function makeUtcDate(year, month, day) {
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? timestamp
    : NaN;
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value !== "string") return NaN;
  let normalized = value.trim().replace(/[\s\u00a0\u202f]/g, "");
  if (!normalized) return NaN;

  const commaCount = (normalized.match(/,/g) || []).length;
  const dotCount = (normalized.match(/\./g) || []).length;
  if (commaCount && dotCount) {
    const decimalSeparator = normalized.lastIndexOf(",") > normalized.lastIndexOf(".") ? "," : ".";
    const groupingSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized.split(groupingSeparator).join("");
    if (decimalSeparator === ",") normalized = normalized.replace(",", ".");
  } else if (commaCount === 1) {
    normalized = normalized.replace(",", ".");
  } else if (commaCount > 1 && /^[+-]?\d{1,3}(?:,\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/,/g, "");
  }

  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return NaN;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(value);
}

function formatDateUtc(value) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(value);
}

function formatDateInput(value) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatDateShort(value) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(value);
}

function formatDateShortUtc(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "UTC"
  }).format(value);
}

function round(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function formatTableValue(v, unit) {
  if (v == null) return "—";
  if (unit === "min") {
    const tot = Math.round(v);
    const h = Math.floor(tot / 60), m = tot % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
  }
  return round(v);
}

function formatUnitLabel(unit) {
  if (unit === "min") return "h:m";
  return unit;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function humanizeKey(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

init();
