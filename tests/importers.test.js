const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const mainScript = fs.readFileSync(path.join(root, "hexports.js"), "utf8");

const dummyElement = {
  getContext() {
    return {};
  }
};
const context = vm.createContext({
  console,
  crypto: {
    randomUUID() {
      return "test-id";
    }
  },
  document: {
    getElementById() {
      return dummyElement;
    },
    querySelector() {
      return dummyElement;
    }
  }
});

const testableScript = mainScript.replace(/\n\s*init\(\);\s*$/, "") + `
  globalThis.importers = {
    isAppleHealthExporterPayload,
    isWorkoutExporterPayload,
    parseJsonDatasets,
    toNumber,
    toTimestamp,
    smoothPoints,
    computeAggregated,
    computeRangeStats,
    formatRangeStatText,
    state
  };
`;
vm.runInContext(testableScript, context, { filename: "index.html" });

const workoutPayload = fs.readFileSync(path.join(__dirname, "fixtures", "workouts.json"), "utf8");
const healthPayload = fs.readFileSync(path.join(__dirname, "fixtures", "health.json"), "utf8");

assert.equal(context.importers.isWorkoutExporterPayload(JSON.parse(workoutPayload)), true);
assert.equal(context.importers.isWorkoutExporterPayload({ workouts: [{ name: "not a workout" }] }), false);

const workoutDatasets = context.importers.parseJsonDatasets(workoutPayload);
const duration = workoutDatasets.find((dataset) => dataset.id === "workouts:duration");
assert.ok(duration, "Workout duration dataset should be created");
assert.equal(duration.unit, "min");
assert.equal(duration.aggregationMethod, "sum");
assert.equal(duration.displayMode, "event-bars");
assert.deepEqual(
  Array.from(duration.series, (series) => series.key),
  ["walking", "traditionalStrengthTraining"]
);
assert.equal(duration.points[0].values.walking, 30);
assert.equal(duration.points[1].values.traditionalStrengthTraining, 60);

const averageHeartRate = workoutDatasets.find(
  (dataset) => dataset.id === "workouts:HKQuantityTypeIdentifierHeartRate:average"
);
assert.ok(averageHeartRate, "Average workout heart-rate dataset should be created");
assert.equal(averageHeartRate.unit, "bpm");
assert.equal(averageHeartRate.aggregationMethod, "average");
assert.equal(averageHeartRate.displayMode, "event-points");

const unknownStatistic = workoutDatasets.find(
  (dataset) => dataset.id === "workouts:HKQuantityTypeIdentifierAppleExerciseTime:sum"
);
assert.ok(unknownStatistic, "Unknown numeric workout statistics should be imported");
assert.equal(unknownStatistic.label, "Workout Apple Exercise Time");

const healthDatasets = context.importers.parseJsonDatasets(healthPayload);
assert.equal(context.importers.isAppleHealthExporterPayload(JSON.parse(healthPayload)), true);
assert.equal(
  healthDatasets.find((dataset) => dataset.id === "dietaryProtein")?.label,
  "Dietary Protein"
);
assert.equal(
  healthDatasets.find((dataset) => dataset.id === "stepCount")?.aggregationMethod,
  "sum"
);

assert.equal(Number.isNaN(context.importers.toTimestamp(80)), true);
assert.equal(context.importers.toTimestamp(1735689600), 1735689600000);
assert.equal(context.importers.toTimestamp("2025-01-01T00:00:00Z"), 1735689600000);
assert.equal(Number.isNaN(context.importers.toNumber("12abc")), true);
assert.equal(context.importers.toNumber("1 234,5"), 1234.5);
assert.equal(context.importers.toNumber("1,234.5"), 1234.5);

const genericDatasets = context.importers.parseJsonDatasets(JSON.stringify({
  observations: [
    { duration: 120, recordedAt: "2025-01-01T00:00:00Z", value: "12abc", score: "3.5" },
    { duration: 180, recordedAt: "2025-01-02T00:00:00Z", value: "13abc", score: "4.5" }
  ]
}));
assert.equal(genericDatasets.length, 1);
assert.equal(genericDatasets[0].dateField, "recordedAt");
assert.deepEqual(
  Array.from(genericDatasets[0].series, (series) => series.key),
  ["duration", "score"]
);

const day = 24 * 60 * 60 * 1000;
const smoothed = context.importers.smoothPoints([
  { x: 0, y: 0 },
  { x: day, y: 10 },
  { x: day * 10, y: 20 }
], 7, "movingAverage");
assert.deepEqual(Array.from(smoothed, (point) => point.y), [0, 5, 20]);

const analyticalDataset = {
  id: "analysis",
  label: "Analysis",
  unit: "u",
  aggregationMethod: "average",
  series: [{ key: "value", label: "Value", color: "#000" }],
  points: [
    { x: Date.parse("2025-01-01T00:00:00Z"), values: { value: 1 } },
    { x: Date.parse("2025-01-03T00:00:00Z"), values: { value: 3 } }
  ]
};
context.importers.state.datasets = [analyticalDataset];
context.importers.state.chartSlots = [{
  id: "slot",
  datasetId: "analysis",
  selectedSeries: new Set(["value"])
}];
const aggregatedAverage = context.importers.computeAggregated("month");
assert.equal(aggregatedAverage.rows[0].values["0_value"], 2);
analyticalDataset.aggregationMethod = "sum";
assert.equal(context.importers.computeAggregated("month").rows[0].values["0_value"], 4);
analyticalDataset.aggregationMethod = "latest";
assert.equal(context.importers.computeAggregated("month").rows[0].values["0_value"], 3);

const rangeStats = context.importers.computeRangeStats({
  startX: Date.parse("2025-01-01T00:00:00Z"),
  endX: Date.parse("2025-01-03T00:00:00Z")
});
assert.equal(rangeStats[0].mean, 2);
assert.equal(rangeStats[0].deviation, 1);
assert.equal(rangeStats[0].count, 2);
assert.equal(
  context.importers.formatRangeStatText(rangeStats[0]),
  "Mean 2 u · SD 1 u · n=2"
);

console.log(`Importer tests passed: ${workoutDatasets.length} workout datasets, ${healthDatasets.length} health datasets`);

process.argv.slice(2).forEach((file) => {
  const payload = fs.readFileSync(file, "utf8");
  const datasets = context.importers.parseJsonDatasets(payload);
  assert.ok(datasets.length, `${path.basename(file)} should contain at least one supported dataset`);
  const pointCount = datasets.reduce((total, dataset) => total + dataset.points.length, 0);
  console.log(`${path.basename(file)}: ${datasets.length} datasets, ${pointCount} imported points`);
});
