import { describe, expect, it } from 'vitest';
import {
  EARTH_RADIUS,
  MU_EARTH,
  cartesianToKeplerian,
  keplerianToCartesian,
} from './orbital';
import {
  checkCartesian,
  checkKeplerian,
  type CartesianKey,
  type Issue,
  type KeplerianKey,
} from './validation';

// the ISS orbit as typed in the fields, with overrides for one test
const kep = (overrides: Partial<Record<KeplerianKey, string>> = {}) => ({
  a: '6786',
  e: '0.002',
  i: '51.6',
  raan: '247.0',
  omega: '130.0',
  nu: '332.5',
  ...overrides,
});

// 7000 km out on the x axis, moving along +y at about circular speed
const cart = (overrides: Partial<Record<CartesianKey, string>> = {}) => ({
  x: '7000',
  y: '0',
  z: '0',
  vx: '0',
  vy: '7.546',
  vz: '0',
  ...overrides,
});

const errors = <K extends string>(result: { issues: Issue<K>[] }) =>
  result.issues.filter((issue) => issue.severity === 'error');
const warnings = <K extends string>(result: { issues: Issue<K>[] }) =>
  result.issues.filter((issue) => issue.severity === 'warning');

describe('checkKeplerian', () => {
  it('accepts the ISS orbit with no messages', () => {
    const result = checkKeplerian(kep());

    expect(result.issues).toEqual([]);
    expect(result.values).toEqual({
      a: 6786,
      e: 0.002,
      i: 51.6,
      raan: 247,
      omega: 130,
      nu: 332.5,
    });
  });

  it('reads typographic minus signs', () => {
    // a negative angle is still an error, but it must be read as a number first
    const result = checkKeplerian(kep({ nu: '−10' }));

    expect(result.issues[0].message).toBe(
      'True anomaly must be between 0° and 360°.'
    );
  });

  it('asks for a number and marks every empty field', () => {
    const result = checkKeplerian(kep({ e: '', i: '-' }));

    expect(result.values).toBeNull();
    expect(result.issues).toEqual([
      {
        severity: 'error',
        fields: ['e', 'i'],
        message: 'Enter a number in every field.',
      },
    ]);
  });

  it.each([
    ['a', '0', 'Semi-major axis must be greater than 0 km.'],
    ['a', '-7000', 'Semi-major axis must be greater than 0 km.'],
    ['e', '-0.1', 'Eccentricity must be at least 0 and less than 1.'],
    ['e', '1', 'Eccentricity must be at least 0 and less than 1.'],
    ['e', '1.5', 'Eccentricity must be at least 0 and less than 1.'],
    ['i', '-1', 'Inclination must be between 0° and 180°.'],
    ['i', '180.1', 'Inclination must be between 0° and 180°.'],
    ['raan', '360.1', 'RAAN must be between 0° and 360°.'],
    ['omega', '-0.1', 'Argument of periapsis must be between 0° and 360°.'],
    ['nu', '400', 'True anomaly must be between 0° and 360°.'],
  ] as const)('rejects %s = %s', (key, value, message) => {
    const result = checkKeplerian(kep({ [key]: value }));

    expect(result.values).toBeNull();
    expect(errors(result)).toHaveLength(1);
    expect(result.issues[0].fields).toEqual([key]);
    expect(result.issues[0].message).toContain(message);
  });

  it.each([
    ['e', '0'],
    ['i', '0'],
    ['i', '180'],
    ['raan', '0'],
    ['raan', '360'],
    ['nu', '360'],
  ] as const)('accepts the edge value %s = %s', (key, value) => {
    expect(checkKeplerian(kep({ [key]: value })).values).not.toBeNull();
  });

  it('reports every bad field at once', () => {
    const result = checkKeplerian(kep({ a: '0', e: '2', i: '200' }));

    expect(errors(result).flatMap((issue) => issue.fields)).toEqual([
      'a',
      'e',
      'i',
    ]);
  });

  it('warns but still converts when periapsis is below the surface', () => {
    // periapsis = 7000 × (1 − 0.2) = 5600 km
    const result = checkKeplerian(kep({ a: '7000', e: '0.2' }));

    expect(result.values).not.toBeNull();
    expect(errors(result)).toEqual([]);
    expect(warnings(result)).toEqual([
      {
        severity: 'warning',
        fields: ['a', 'e'],
        message:
          "Periapsis is 5600 km from Earth's centre, below the surface (6378 km), so this orbit would hit Earth.",
      },
    ]);
  });

  it('does not warn when periapsis is just above the surface', () => {
    const result = checkKeplerian(kep({ a: '6400', e: '0' }));

    expect(result.issues).toEqual([]);
  });
});

describe('checkCartesian', () => {
  it('accepts a normal low orbit with no messages', () => {
    const result = checkCartesian(cart());

    expect(result.issues).toEqual([]);
    expect(result.values).toEqual({
      x: 7000,
      y: 0,
      z: 0,
      vx: 0,
      vy: 7.546,
      vz: 0,
    });
  });

  it('asks for a number and marks every empty field', () => {
    const result = checkCartesian(cart({ y: '', vz: '.' }));

    expect(result.values).toBeNull();
    expect(result.issues[0].fields).toEqual(['y', 'vz']);
  });

  it('rejects a position inside Earth', () => {
    const result = checkCartesian(cart({ x: '6000' }));

    expect(result.values).toBeNull();
    expect(result.issues).toEqual([
      {
        severity: 'error',
        fields: ['x', 'y', 'z'],
        message:
          "Position is 6000 km from Earth's centre, which is inside Earth (radius 6378 km).",
      },
    ]);
  });

  it('rejects the centre of Earth without dividing by zero', () => {
    const result = checkCartesian(cart({ x: '0' }));

    expect(result.values).toBeNull();
    expect(result.issues[0].message).toContain('inside Earth');
  });

  it.each([
    ['zero velocity', { vy: '0' }],
    ['straight away from Earth', { vx: '5', vy: '0' }],
    ['straight toward Earth', { vx: '-5', vy: '0' }],
  ])('rejects %s, which has no orbit plane', (_, overrides) => {
    const result = checkCartesian(cart(overrides));

    expect(result.values).toBeNull();
    expect(result.issues[0].fields).toEqual(['vx', 'vy', 'vz']);
    expect(result.issues[0].message).toContain('no orbit');
  });

  it('rejects a speed above escape speed and says what escape speed is', () => {
    const result = checkCartesian(cart({ vy: '11' }));
    const escape = Math.sqrt((2 * MU_EARTH) / 7000);

    expect(result.values).toBeNull();
    expect(result.issues[0].fields).toEqual(['vx', 'vy', 'vz']);
    expect(result.issues[0].message).toContain('11.000 km/s');
    expect(result.issues[0].message).toContain(`${escape.toFixed(3)} km/s`);
  });

  it('accepts a speed just below escape speed', () => {
    const escape = Math.sqrt((2 * MU_EARTH) / 7000);
    const result = checkCartesian(cart({ vy: (escape - 0.001).toFixed(4) }));

    expect(errors(result)).toEqual([]);
  });

  it('warns but still converts when the path dips below the surface', () => {
    // too slow for a circle at 7000 km, so it falls toward Earth
    const result = checkCartesian(cart({ vy: '6' }));

    expect(result.values).not.toBeNull();
    expect(errors(result)).toEqual([]);
    expect(warnings(result)[0].message).toContain('would hit Earth');
  });

  it('agrees with cartesianToKeplerian about periapsis', () => {
    // the check computes periapsis its own way; both must agree on the warning
    for (const vy of ['5', '6', '6.5', '7', '7.546', '9', '10']) {
      for (const vz of ['0', '1', '-2']) {
        const result = checkCartesian(cart({ vy, vz }));
        if (!result.values) continue;
        const k = cartesianToKeplerian(result.values);
        const hitsEarth = k.a * (1 - k.e) < EARTH_RADIUS;

        expect(warnings(result).length > 0, `vy=${vy} vz=${vz}`).toBe(
          hitsEarth
        );
      }
    }
  });

  it('accepts what keplerianToCartesian produces for a valid orbit', () => {
    const c = keplerianToCartesian({
      a: 26600,
      e: 0.74,
      i: 63.4,
      raan: 80,
      omega: 270,
      nu: 20,
    });
    const result = checkCartesian({
      x: String(c.x),
      y: String(c.y),
      z: String(c.z),
      vx: String(c.vx),
      vy: String(c.vy),
      vz: String(c.vz),
    });

    expect(result.issues).toEqual([]);
  });
});
