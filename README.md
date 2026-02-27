# hexports — Health Export Visualizer

A single-file browser tool for exploring JSON and CSV exports from the [Health Exporter – Shortcuts](https://apps.apple.com/de/app/health-exporter-shortcuts/id6759006922) iOS app (and any other time-series JSON/CSV).

## Goals

- Load a health data export locally in the browser — no server, no uploads, no tracking.
- Pick one or more metrics (datasets/series) and see them on an interactive chart.
- Zoom, pan, and smooth the data to spot trends.
- Annotate the chart with date markers (e.g. "started medication", "race day").

## Usage

Open `data_analyzer.html` directly in any modern browser (Safari, Chrome, Firefox).

1. **File** — click *Choose File* and pick a `.json` or `.csv` export.
2. **Series** — select a dataset from the dropdown, then toggle the series checkboxes. Adjust line color and width per series.
3. **Processing** — drag the *Smoothing* slider (moving average or EMA) to reduce noise.
4. **Chart interaction**
   - Scroll to zoom, drag to pan, double-click to reset.
   - Pinch to zoom on a Mac trackpad.
   - *Fit selection* zooms to the current data range; *Reset view* shows everything.
5. **Date markers** — enter a date (defaults to today), optionally a label and color, then click *Add marker*. Markers appear as vertical dashed lines on the chart.

## Supported formats

| Format | Notes |
| --- | --- |
| Health Exporter JSON | Auto-detected; all exported metric types are listed as separate datasets |
| Generic JSON | Any array of objects with a date field and numeric fields |
| CSV | Header row required; date column auto-detected |
