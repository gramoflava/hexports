# hexports — Health Export Visualizer

A static browser tool for exploring JSON and CSV exports from the [Health Exporter – Shortcuts](https://apps.apple.com/de/app/health-exporter-shortcuts/id6759006922) iOS app (and any other time-series JSON/CSV).

## Goals

- Load a health data export locally in the browser — no server, no uploads, no tracking.
- Pick one or more metrics (datasets/series) and see them on an interactive chart.
- Zoom, pan, and smooth the data to spot trends.
- Annotate the chart with dated markers and analyzed periods.

## Usage

Serve this folder with a local web server and open `index.html` in any modern
browser (Safari, Chrome, Firefox).

1. **File** — click *Choose File* and pick a `.json` or `.csv` export.
2. **Series** — select a dataset from the dropdown, then toggle the series checkboxes. Adjust line color and width per series.
3. **Processing** — drag the *Smoothing* slider (calendar-time moving average or EMA) to reduce noise.
4. **Chart interaction**
   - Scroll to zoom, drag to pan, double-click to reset.
   - Pinch to zoom on a Mac trackpad.
   - *Fit selection* zooms to the current data range; *Reset view* shows everything.
   - The chart also supports keyboard panning, zooming, and reset.
   - *Copy PNG* and *Download PNG* export the chart with its source, visible range, legend, and units.
5. **Annotations**
   - In *Marker* mode, click the chart to add a dated marker.
   - In *Period* mode, drag across the chart to analyze a range.
   - Analyzed periods show the mean, population standard deviation, and observation count for each selected raw series.

The Light / Auto / Dark switch is shared with the other gramoflava tools.
Health and workout files never leave the browser and are not persisted.
Appearance, processing preferences, markers, and analyzed periods are stored
locally in the browser. Annotations are associated with a one-way content hash,
not with the source filename.

The initial page load makes no third-party requests. The optional Ko-fi panel is
loaded only after the user opens it.

## Development

Run the importer checks with:

```sh
node tests/importers.test.js
```

## Supported formats

| Format | Notes |
| --- | --- |
| Health Exporter JSON | Auto-detected; all exported metric types are listed as separate datasets |
| Health Exporter workouts JSON | Auto-detected; duration and every numeric workout statistic become datasets, grouped by activity type |
| Generic JSON | Any array of objects with a date field and numeric fields |
| CSV | Header row required; date column auto-detected |

Workout duration, energy, distance, stroke counts, and similar totals are summed
in the monthly/yearly table. Heart rate and other sampled workout statistics are
averaged. Unknown numeric statistics are supported automatically.

Health metrics declare their own aggregation rule: cumulative metrics such as
steps and nutrition show totals, sampled vitals show averages, and body
measurements show the latest observation in each period. Missing days are never
interpolated.

## Design

Shared tokens, components, themes and Tabler icons live in `gramofdesign/`.
Hexports-specific styles live in `hexports.css`; parsing, processing, state, and
chart rendering live in `hexports.js`. The HTML remains a static entry point and
the project still has no build step.
