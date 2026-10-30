# Orbital element converter

[![npm](https://img.shields.io/npm/v/orbital-convert)](https://www.npmjs.com/package/orbital-convert)

**Live app:** https://coding-oksana.github.io/orbital-convert/  
**npm package:** https://www.npmjs.com/package/orbital-convert

A small web app that converts a satellite orbit between two descriptions:

- **Keplerian elements**: semi-major axis `a`, eccentricity `e`, inclination `i`, right ascension of the ascending node `Ω`, argument of periapsis `ω` and true anomaly `ν`.
- **Cartesian state vector**: position `x, y, z` and velocity `vx, vy, vz`.

Edit either panel and the other one updates. Values that don't make physical sense (for example `e ≥ 1`, a position inside Earth or a speed above escape speed) are flagged and are not converted.

[![Screenshot of the app: Keplerian elements on the left, the computed Cartesian state vector on the right](https://raw.githubusercontent.com/coding-oksana/orbital-convert/master/docs/screenshot.png)](https://coding-oksana.github.io/orbital-convert/)

## Use as a library

The conversion and validation code is published to npm as `orbital-convert`, with no dependencies and TypeScript types included.

```sh
npm install orbital-convert
```

```ts
import {
  keplerianToCartesian,
  cartesianToKeplerian,
  checkKeplerian,
} from 'orbital-convert';

// Keplerian elements → state vector (km, km/s)
const state = keplerianToCartesian({
  a: 7000, // km
  e: 0.01,
  i: 51.6, // degrees
  raan: 30,
  omega: 40,
  nu: 60,
});
// { x, y, z, vx, vy, vz, r, v }

// State vector → Keplerian elements
const elements = cartesianToKeplerian(state);
// { a, e, i, raan, omega, nu }

// Validate user input given as strings before converting
const { values, issues } = checkKeplerian({
  a: '7000',
  e: '1.2',
  i: '51.6',
  raan: '30',
  omega: '40',
  nu: '60',
});
// values is null when there is an error; issues explains what is wrong
```

| Export                               | What it does                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `keplerianToCartesian(elements, μ?)` | Keplerian elements → position, velocity, and their magnitudes `r` and `v`                       |
| `cartesianToKeplerian(state, μ?)`    | Position and velocity → Keplerian elements                                                      |
| `checkKeplerian(strings)`            | Parses and validates Keplerian input; returns `{ values, issues }`                              |
| `checkCartesian(strings)`            | Parses and validates a state vector; returns `{ values, issues }`                               |
| `MU_EARTH`, `EARTH_RADIUS`           | Constants used by default (see [Conventions](#conventions))                                     |
| `parseNum`, `formatNum`              | Number parsing that accepts Unicode minus signs, and formatting with a fixed number of decimals |

The converters default to Earth's μ. Pass your own as the second argument for another central body. They don't validate their input, so run the `check*` functions first if the values come from users.

## Conventions

|              |                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Frame        | Earth-centred inertial (ECI): origin at Earth's centre, `z` toward the North Pole, `x` toward the vernal equinox |
| Units        | km, km/s, degrees                                                                                                |
| Gravity      | Two-body only, μ = 398600.4418 km³/s²                                                                            |
| Earth radius | 6378.137 km (equatorial), used for the "inside Earth" checks                                                     |
| Orbits       | Closed (elliptical) orbits only: `0 ≤ e < 1`, `a > 0`                                                            |

Undefined angles are handled as follows:

- Circular orbits have no periapsis, so `ω = 0` and `ν` is measured from the ascending node (argument of latitude).
- Equatorial orbits have no ascending node, so `Ω = 0` and `ω` is measured from the `x` axis (longitude of periapsis).
- Circular equatorial orbits set `Ω = ω = 0`, and `ν` is measured from the `x` axis (true longitude).

## Getting started

Requires Node.js 22 or later (the version is pinned in `.nvmrc`, so `nvm use` picks it up).

```sh
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

| Command              | What it does                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| `npm run dev`        | Start the dev server                                                        |
| `npm run build`      | Type-check and build for production into `dist/`                            |
| `npm run build:lib`  | Build the npm library into `dist-lib/`                                      |
| `npm run preview`    | Serve the production build                                                  |
| `npm run typecheck`  | Type-check the app, Vite config and Cypress tests                           |
| `npm run lint`       | Run ESLint (includes Prettier formatting)                                   |
| `npm run fix`        | Fix lint and formatting problems where possible                             |
| `npm run prettier`   | Format every file with Prettier                                             |
| `npm run test`       | Run the unit tests once                                                     |
| `npm run test:watch` | Run the unit tests and re-run them when files change                        |
| `npm run test:e2e`   | Start the dev server and run the Cypress tests headlessly                   |
| `npm run cy:open`    | Open the Cypress app to run tests interactively (start `npm run dev` first) |

## Project structure

```
src/
  App.tsx               page layout and state for both panels
  components/Field.tsx  one labelled numeric input
  lib/orbital.ts        conversion maths, parsing and formatting
  lib/validation.ts     checks for values that don't make physical sense
  lib/*.test.ts         unit tests
cypress/e2e/            end-to-end tests
```

## Tests

Unit tests (Vitest) sit next to the code they test in `src/lib/`:

- `orbital.test.ts` checks parsing and formatting, compares both conversions with Vallado's _Fundamentals of Astrodynamics_ (Examples 2-5 and 2-6), checks physical laws (vis-viva, angular momentum), the handling of circular and equatorial orbits, and round trips for a set of named orbits plus 1000 random ones.
- `validation.test.ts` checks every validation rule, including edge values, and that the "would hit Earth" warning agrees with the conversion maths.

End-to-end tests live in `cypress/e2e/`. `converter.cy.ts` covers the conversions in both directions, a geostationary round trip, input filtering, every validation message, Reset and Copy JSON. `layout.cy.ts` checks the layout on phone, tablet and desktop widths. Elements are selected with `data-cy` attributes.

## CI and deployment

`.github/workflows/ci.yml` runs lint, the production build (including the type check) and the Cypress tests on every push to `master` and on pull requests. When all of them pass on `master`, the app is deployed to GitHub Pages.

Dependabot (`.github/dependabot.yml`) opens weekly pull requests for npm packages and GitHub Actions. Minor and patch npm updates are grouped into one pull request.

## License

[MIT](LICENSE)
