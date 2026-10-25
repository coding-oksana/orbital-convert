import { describe, expect, it } from 'vitest';
import {
  MU_EARTH,
  cartesianToKeplerian,
  formatNum,
  keplerianToCartesian,
  parseNum,
  type Keplerian,
} from './orbital';

const D2R = Math.PI / 180;

const length = (x: number, y: number, z: number) =>
  Math.sqrt(x * x + y * y + z * z);

// difference between two angles in degrees, ignoring whole turns (359.9° vs 0.1° → 0.2°)
const angleDiff = (a: number, b: number) => {
  const d = (((a - b) % 360) + 360) % 360;
  return Math.min(d, 360 - d);
};

const ORBITS: Record<string, Keplerian> = {
  ISS: { a: 6786, e: 0.002, i: 51.6, raan: 247, omega: 130, nu: 332.5 },
  GPS: { a: 26560, e: 0.01, i: 55, raan: 60, omega: 40, nu: 90 },
  Molniya: { a: 26600, e: 0.74, i: 63.4, raan: 80, omega: 270, nu: 20 },
  'polar, low': { a: 7200, e: 0.001, i: 90, raan: 10, omega: 20, nu: 30 },
  'retrograde, sun-synchronous': {
    a: 7078,
    e: 0.0012,
    i: 98.2,
    raan: 300,
    omega: 85,
    nu: 200,
  },
  'very eccentric': {
    a: 100000,
    e: 0.93,
    i: 30,
    raan: 150,
    omega: 10,
    nu: 170,
  },
  'circular, inclined': { a: 7000, e: 0, i: 45, raan: 100, omega: 0, nu: 200 },
  'equatorial ellipse': { a: 9000, e: 0.2, i: 0, raan: 0, omega: 70, nu: 300 },
  'equatorial ellipse, retrograde': {
    a: 9000,
    e: 0.2,
    i: 180,
    raan: 0,
    omega: 70,
    nu: 300,
  },
  geostationary: { a: 42164, e: 0, i: 0, raan: 0, omega: 0, nu: 123 },
  'circular equatorial, retrograde': {
    a: 8000,
    e: 0,
    i: 180,
    raan: 0,
    omega: 0,
    nu: 250,
  },
};

describe('parseNum', () => {
  it.each([
    ['6786', 6786],
    ['0.002', 0.002],
    ['-255.5', -255.5],
    ['−255.5', -255.5], // typographic minus, as shown by formatNum
    ['–12', -12], // en dash
    ['—12', -12], // em dash
    [' 6 786 ', 6786],
    ['12.', 12],
    ['.5', 0.5],
  ])('reads %j as %d', (text, expected) => {
    expect(parseNum(text)).toBe(expected);
  });

  it.each(['', '-', '−', '.', 'abc'])('returns NaN for %j', (text) => {
    expect(parseNum(text)).toBeNaN();
  });
});

describe('formatNum', () => {
  it.each([
    [6786.04, 0, '6786'],
    [6786.04, 1, '6786.0'],
    [0.0024, 3, '0.002'],
    [7.6786, 3, '7.679'],
    [-255.46, 1, '−255.5'],
    [0, 1, '0.0'],
  ])('formats %d with %d decimals as %j', (num, decimals, expected) => {
    expect(formatNum(num, decimals)).toBe(expected);
  });

  it('never shows a minus sign on a value that rounds to zero', () => {
    expect(formatNum(-0.04, 1)).toBe('0.0');
    expect(formatNum(-0, 3)).toBe('0.000');
  });

  it.each([NaN, Infinity, -Infinity])(
    'returns an empty string for %d',
    (num) => {
      expect(formatNum(num, 2)).toBe('');
    }
  );

  it('is undone by parseNum', () => {
    for (const num of [-22964.2, 35361.7, -1.308, 0.002]) {
      expect(parseNum(formatNum(num, 3))).toBeCloseTo(num, 10);
    }
  });
});

describe('keplerianToCartesian', () => {
  it('matches Vallado, Fundamentals of Astrodynamics, Example 2-6', () => {
    const p = 11067.79;
    const e = 0.83285;
    const c = keplerianToCartesian({
      a: p / (1 - e * e),
      e,
      i: 87.87,
      raan: 227.89,
      omega: 53.38,
      nu: 92.335,
    });

    expect(c.x).toBeCloseTo(6525.368, 0);
    expect(c.y).toBeCloseTo(6861.532, 0);
    expect(c.z).toBeCloseTo(6449.119, 0);
    expect(c.vx).toBeCloseTo(4.902279, 3);
    expect(c.vy).toBeCloseTo(5.53314, 3);
    expect(c.vz).toBeCloseTo(-1.97571, 3);
  });

  it('places a circular equatorial orbit on the x axis at ν = 0, moving along +y', () => {
    const c = keplerianToCartesian({
      a: 7000,
      e: 0,
      i: 0,
      raan: 0,
      omega: 0,
      nu: 0,
    });

    expect(c.x).toBeCloseTo(7000, 9);
    expect(c.y).toBeCloseTo(0, 9);
    expect(c.z).toBeCloseTo(0, 9);
    expect(c.vx).toBeCloseTo(0, 9);
    expect(c.vy).toBeCloseTo(Math.sqrt(MU_EARTH / 7000), 9);
    expect(c.vz).toBeCloseTo(0, 9);
  });

  it('puts a polar orbit over the North Pole a quarter turn after the node', () => {
    const c = keplerianToCartesian({
      a: 7000,
      e: 0,
      i: 90,
      raan: 0,
      omega: 0,
      nu: 90,
    });

    expect(c.x).toBeCloseTo(0, 6);
    expect(c.y).toBeCloseTo(0, 6);
    expect(c.z).toBeCloseTo(7000, 6);
  });

  it('is closest to Earth at periapsis and farthest at apoapsis', () => {
    const orbit = ORBITS.Molniya;
    const peri = keplerianToCartesian({ ...orbit, nu: 0 });
    const apo = keplerianToCartesian({ ...orbit, nu: 180 });

    expect(peri.r).toBeCloseTo(orbit.a * (1 - orbit.e), 6);
    expect(apo.r).toBeCloseTo(orbit.a * (1 + orbit.e), 6);
  });

  describe.each(Object.entries(ORBITS))('%s', (_, orbit) => {
    const c = keplerianToCartesian(orbit);

    it('reports |r| and |v| as the lengths of the position and velocity', () => {
      expect(c.r).toBeCloseTo(length(c.x, c.y, c.z), 9);
      expect(c.v).toBeCloseTo(length(c.vx, c.vy, c.vz), 12);
    });

    it('obeys the vis-viva equation v² = μ(2/r − 1/a)', () => {
      expect(c.v ** 2).toBeCloseTo(MU_EARTH * (2 / c.r - 1 / orbit.a), 9);
    });

    it('has the angular momentum and inclination of the orbit', () => {
      const hx = c.y * c.vz - c.z * c.vy;
      const hy = c.z * c.vx - c.x * c.vz;
      const hz = c.x * c.vy - c.y * c.vx;
      const h = length(hx, hy, hz);

      expect(h).toBeCloseTo(
        Math.sqrt(MU_EARTH * orbit.a * (1 - orbit.e ** 2)),
        6
      );
      expect(hz / h).toBeCloseTo(Math.cos(orbit.i * D2R), 9);
    });
  });
});

describe('cartesianToKeplerian', () => {
  it('matches Vallado, Fundamentals of Astrodynamics, Example 2-5', () => {
    const k = cartesianToKeplerian({
      x: 6524.834,
      y: 6862.875,
      z: 6448.296,
      vx: 4.901327,
      vy: 5.533756,
      vz: -1.976341,
    });

    expect(k.a * (1 - k.e ** 2)).toBeCloseTo(11067.79, 0); // semi-latus rectum p
    expect(k.e).toBeCloseTo(0.83285, 4);
    // the book prints angles to two decimals, so allow ±0.05°
    expect(k.i).toBeCloseTo(87.87, 1);
    expect(k.raan).toBeCloseTo(227.89, 1);
    expect(k.omega).toBeCloseTo(53.38, 1);
    expect(k.nu).toBeCloseTo(92.335, 1);
  });

  it('puts ν past 180° when the satellite is moving toward Earth', () => {
    const outbound = keplerianToCartesian({ ...ORBITS.Molniya, nu: 60 });
    const inbound = keplerianToCartesian({ ...ORBITS.Molniya, nu: 300 });

    expect(cartesianToKeplerian(outbound).nu).toBeCloseTo(60, 9);
    expect(cartesianToKeplerian(inbound).nu).toBeCloseTo(300, 9);
  });

  describe('orbits where some angles are undefined', () => {
    it('circular: ω = 0 and ν is measured from the ascending node', () => {
      const k = cartesianToKeplerian(
        keplerianToCartesian(ORBITS['circular, inclined'])
      );

      expect(k.e).toBeCloseTo(0, 9);
      expect(k.raan).toBeCloseTo(100, 6);
      expect(k.omega).toBe(0);
      expect(k.nu).toBeCloseTo(200, 6);
    });

    it('equatorial: Ω = 0 and ω is measured from the x axis', () => {
      const k = cartesianToKeplerian(
        keplerianToCartesian(ORBITS['equatorial ellipse'])
      );

      expect(k.i).toBeCloseTo(0, 6);
      expect(k.raan).toBe(0);
      expect(k.omega).toBeCloseTo(70, 6);
      expect(k.nu).toBeCloseTo(300, 6);
    });

    it('circular and equatorial: Ω = ω = 0 and ν is measured from the x axis', () => {
      const k = cartesianToKeplerian(
        keplerianToCartesian(ORBITS.geostationary)
      );

      expect(k.raan).toBe(0);
      expect(k.omega).toBe(0);
      expect(k.nu).toBeCloseTo(123, 6);
    });

    it('retrograde equatorial orbits keep their direction', () => {
      const k = cartesianToKeplerian(
        keplerianToCartesian(ORBITS['circular equatorial, retrograde'])
      );

      expect(k.i).toBeCloseTo(180, 6);
      expect(k.nu).toBeCloseTo(250, 6);
    });
  });

  describe.each(Object.entries(ORBITS))('round trip: %s', (_, orbit) => {
    const there = keplerianToCartesian(orbit);
    const elements = cartesianToKeplerian(there);
    const back = keplerianToCartesian(elements);

    it('gives back the same elements', () => {
      expect(elements.a).toBeCloseTo(orbit.a, 6);
      expect(elements.e).toBeCloseTo(orbit.e, 9);
      expect(angleDiff(elements.i, orbit.i)).toBeLessThan(1e-6);
      expect(angleDiff(elements.raan, orbit.raan)).toBeLessThan(1e-6);
      expect(angleDiff(elements.omega, orbit.omega)).toBeLessThan(1e-6);
      expect(angleDiff(elements.nu, orbit.nu)).toBeLessThan(1e-6);
    });

    it('puts the satellite back in the same place with the same velocity', () => {
      expect(
        length(back.x - there.x, back.y - there.y, back.z - there.z)
      ).toBeLessThan(1e-6);
      expect(
        length(back.vx - there.vx, back.vy - there.vy, back.vz - there.vz)
      ).toBeLessThan(1e-9);
    });
  });

  it('round-trips 1000 random orbits', () => {
    // small seeded generator, so a failure can be reproduced
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 2 ** 32;
      return seed / 2 ** 32;
    };

    for (let n = 0; n < 1000; n++) {
      const orbit: Keplerian = {
        a: 6600 + random() * 60000,
        e: random() * 0.95,
        i: random() * 180,
        raan: random() * 360,
        omega: random() * 360,
        nu: random() * 360,
      };
      const there = keplerianToCartesian(orbit);
      const back = keplerianToCartesian(cartesianToKeplerian(there));

      expect(
        length(back.x - there.x, back.y - there.y, back.z - there.z),
        JSON.stringify(orbit)
      ).toBeLessThan(1e-5);
    }
  });

  it('always returns angles between 0° and 360°', () => {
    for (const orbit of Object.values(ORBITS)) {
      const k = cartesianToKeplerian(keplerianToCartesian(orbit));
      for (const angle of [k.raan, k.omega, k.nu]) {
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(360);
      }
      expect(k.i).toBeGreaterThanOrEqual(0);
      expect(k.i).toBeLessThanOrEqual(180);
    }
  });
});
