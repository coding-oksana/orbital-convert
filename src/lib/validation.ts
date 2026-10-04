import {
  EARTH_RADIUS,
  MU_EARTH,
  formatNum,
  parseNum,
  type Keplerian,
} from './orbital';

export const KEPLERIAN_KEYS = ['a', 'e', 'i', 'raan', 'omega', 'nu'] as const;
export const CARTESIAN_KEYS = ['x', 'y', 'z', 'vx', 'vy', 'vz'] as const;

export type KeplerianKey = (typeof KEPLERIAN_KEYS)[number];
export type CartesianKey = (typeof CARTESIAN_KEYS)[number];
export type StateVector = Record<CartesianKey, number>;

// errors block the conversion; warnings are shown but the conversion still runs
export interface Issue<K extends string = string> {
  severity: 'error' | 'warning';
  fields: K[];
  message: string;
}

export interface CheckResult<K extends string, T> {
  values: T | null; // null when there is any error
  issues: Issue<K>[];
}

function parseAll<K extends string>(
  strings: Record<K, string>,
  keys: readonly K[]
): { values: Record<K, number> | null; issues: Issue<K>[] } {
  const values = {} as Record<K, number>;
  const empty: K[] = [];
  for (const key of keys) {
    const n = parseNum(strings[key]);
    if (Number.isNaN(n)) empty.push(key);
    values[key] = n;
  }
  if (empty.length === 0) return { values, issues: [] };
  return {
    values: null,
    issues: [
      {
        severity: 'error',
        fields: empty,
        message: 'Enter a number in every field.',
      },
    ],
  };
}

function hitsEarthWarning<K extends string>(
  periapsis: number,
  fields: K[]
): Issue<K> {
  return {
    severity: 'warning',
    fields,
    message: `Periapsis is ${formatNum(periapsis, 0)} km from Earth's centre, below the surface (${formatNum(EARTH_RADIUS, 0)} km), so this orbit would hit Earth.`,
  };
}

function checkAngle(
  issues: Issue<KeplerianKey>[],
  key: KeplerianKey,
  name: string,
  value: number,
  max: number
) {
  if (value < 0 || value > max) {
    issues.push({
      severity: 'error',
      fields: [key],
      message: `${name} must be between 0° and ${max}°.`,
    });
  }
}

export function checkKeplerian(
  strings: Record<KeplerianKey, string>
): CheckResult<KeplerianKey, Keplerian> {
  const parsed = parseAll(strings, KEPLERIAN_KEYS);
  if (!parsed.values) return parsed;
  const { a, e, i, raan, omega, nu } = parsed.values;
  const issues: Issue<KeplerianKey>[] = [];

  if (a <= 0) {
    issues.push({
      severity: 'error',
      fields: ['a'],
      message: 'Semi-major axis must be greater than 0 km.',
    });
  }
  if (e < 0 || e >= 1) {
    issues.push({
      severity: 'error',
      fields: ['e'],
      message:
        'Eccentricity must be at least 0 and less than 1. At 1 or above the satellite escapes Earth instead of orbiting.',
    });
  }
  checkAngle(issues, 'i', 'Inclination', i, 180);
  checkAngle(issues, 'raan', 'RAAN', raan, 360);
  checkAngle(issues, 'omega', 'Argument of periapsis', omega, 360);
  checkAngle(issues, 'nu', 'True anomaly', nu, 360);

  if (issues.length > 0) return { values: null, issues };

  const periapsis = a * (1 - e);
  if (periapsis < EARTH_RADIUS)
    issues.push(hitsEarthWarning(periapsis, ['a', 'e']));

  return { values: parsed.values, issues };
}

export function checkCartesian(
  strings: Record<CartesianKey, string>
): CheckResult<CartesianKey, StateVector> {
  const parsed = parseAll(strings, CARTESIAN_KEYS);
  if (!parsed.values) return parsed;
  const { x, y, z, vx, vy, vz } = parsed.values;
  const position: CartesianKey[] = ['x', 'y', 'z'];
  const velocity: CartesianKey[] = ['vx', 'vy', 'vz'];

  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < EARTH_RADIUS) {
    return {
      values: null,
      issues: [
        {
          severity: 'error',
          fields: position,
          message: `Position is ${formatNum(r, 0)} km from Earth's centre, which is inside Earth (radius ${formatNum(EARTH_RADIUS, 0)} km).`,
        },
      ],
    };
  }

  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const h = Math.sqrt(
    (y * vz - z * vy) ** 2 + (z * vx - x * vz) ** 2 + (x * vy - y * vx) ** 2
  );
  // h ≈ 0: no sideways motion, the satellite falls straight down or flies straight up
  if (h <= 1e-9 * r * Math.max(v, 1)) {
    return {
      values: null,
      issues: [
        {
          severity: 'error',
          fields: velocity,
          message:
            'Velocity is zero or points straight toward or away from Earth, so there is no orbit. Add some sideways speed.',
        },
      ],
    };
  }

  const energy = (v * v) / 2 - MU_EARTH / r;
  if (energy >= 0) {
    const escape = Math.sqrt((2 * MU_EARTH) / r);
    return {
      values: null,
      issues: [
        {
          severity: 'error',
          fields: velocity,
          message: `Speed ${formatNum(v, 3)} km/s is at or above escape speed here (${formatNum(escape, 3)} km/s), so the satellite would leave Earth instead of orbiting.`,
        },
      ],
    };
  }

  const a = -MU_EARTH / (2 * energy);
  const e = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / MU_EARTH ** 2));
  const periapsis = a * (1 - e);
  const issues: Issue<CartesianKey>[] =
    periapsis < EARTH_RADIUS ? [hitsEarthWarning(periapsis, [])] : [];

  return { values: parsed.values, issues };
}
