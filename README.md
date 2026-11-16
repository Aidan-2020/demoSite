# Downtrace Site Atlas

A buildless Leaflet prototype for researching locations of interest. The initial ten records are real places with fictional research statuses and notes; they do not describe Downtrace's actual interests.

## Run or host

Serve `dist/` with any static web server, or deploy its contents to GitHub Pages. No build step, access token, or backend is required. Leaflet and fonts load from public CDNs; map tiles require an internet connection. The dark map is a CSS treatment of OpenStreetMap's standard tiles. Keep visible attribution and follow https://operations.osmfoundation.org/policies/tiles/ . Select an appropriate tile service before scaling traffic.

## Data

Add, edit, delete, search, and filter locations. Browser localStorage holds changes for this origin and browser only. Export regularly: a deployment, GitHub repository, or GeoJSON export does not automatically synchronize edits with colleagues. Imports replace the atlas after confirmation and are validated before replacement. Moving to another domain uses a separate browser data store; export and import to transfer data.

GeoJSON imports use a FeatureCollection of Point features with `[longitude, latitude]` coordinates. Properties: `name`, `country`, `type` (Industrial, Logistics, Energy, Research), `status` (Researching, Shortlisted, Monitoring), `priority` (High, Standard), `notes`, and optional `demo` boolean. Name and country are required. The other fields have defaults. Exports preserve stable feature IDs; imports create fresh IDs.

## Next phase

Replace the demo records with Downtrace's actual locations. For collaboration, add a shared database and access controls. Keep GeoJSON as the interchange format for a later Unity/Cesium viewer. This version has no 3D/globe viewer, shared backend, or live telemetry.

Cesium Unity web deployment requires Unity 6+, and its web support is documented as experimental: https://cesium.com/learn/unity/building-an-app-for-the-web/ . A Unity implementation should be a separate viewer over the same location data.

## Project files

`dist/index.html`: interface; `dist/style.css`: responsive visual styles; `dist/app.js`: Leaflet map, data validation, browser persistence, and GeoJSON import/export. `.openai/hosting.json` contains the private Sites deployment identity; it is not required by GitHub Pages.
