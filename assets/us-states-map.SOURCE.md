# United States map geometry

`us-states-map.json` contains the 50 state paths from
`@svg-maps/usa.states-territories@2.0.0`. The upstream package dedicates the
map data to the public domain under the Unlicense.

- Source: https://github.com/VictorCazanave/svg-maps/tree/master/packages/usa.states-territories
- Vendored endpoint: https://unpkg.com/@svg-maps/usa.states-territories@2.0.0/index.js
- Regeneration: `node scripts/vendor-us-states-map.cjs`

The generated public asset excludes territories and Washington, D.C. because
the current congressional forecast data covers the 50 states only.
