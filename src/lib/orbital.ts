export const MU_EARTH = 398600.4418; // km^3/s^2
export const EARTH_RADIUS = 6378.137; // km, equatorial

export function parseNum(str: string): number {
  const cleaned = str.replace(/\s/g, '').replace(/[−–—]/g, '-');
  return parseFloat(cleaned);
}

export function formatNum(num: number, decimals: number): string {
  if (!isFinite(num)) return '';
  const fixed = num.toFixed(decimals);
  return fixed.startsWith('-') ? `−${fixed.slice(1)}` : fixed;
}

export interface Keplerian {
  a: number;
  e: number;
  i: number;
  raan: number;
  omega: number;
  nu: number;
}

export interface Cartesian {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  v: number;
}

export function keplerianToCartesian(
  { a, e, i, raan, omega, nu }: Keplerian,
  mu = MU_EARTH
): Cartesian {
  const rad = Math.PI / 180;
  const iR = i * rad,
    raanR = raan * rad,
    omegaR = omega * rad,
    nuR = nu * rad;

  const p = a * (1 - e * e);
  const r = p / (1 + e * Math.cos(nuR));
  const xpf = r * Math.cos(nuR);
  const ypf = r * Math.sin(nuR);

  const h = Math.sqrt(mu * p);
  const vxpf = (-mu / h) * Math.sin(nuR);
  const vypf = (mu / h) * (e + Math.cos(nuR));

  const cosO = Math.cos(raanR),
    sinO = Math.sin(raanR);
  const cosi = Math.cos(iR),
    sini = Math.sin(iR);
  const cosw = Math.cos(omegaR),
    sinw = Math.sin(omegaR);

  const R11 = cosO * cosw - sinO * sinw * cosi;
  const R12 = -cosO * sinw - sinO * cosw * cosi;
  const R21 = sinO * cosw + cosO * sinw * cosi;
  const R22 = -sinO * sinw + cosO * cosw * cosi;
  const R31 = sinw * sini;
  const R32 = cosw * sini;

  const x = R11 * xpf + R12 * ypf;
  const y = R21 * xpf + R22 * ypf;
  const z = R31 * xpf + R32 * ypf;
  const vx = R11 * vxpf + R12 * vypf;
  const vy = R21 * vxpf + R22 * vypf;
  const vz = R31 * vxpf + R32 * vypf;

  return {
    x,
    y,
    z,
    vx,
    vy,
    vz,
    r: Math.sqrt(x * x + y * y + z * z),
    v: Math.sqrt(vx * vx + vy * vy + vz * vz),
  };
}

export function cartesianToKeplerian(
  { x, y, z, vx, vy, vz }: Omit<Cartesian, 'r' | 'v'>,
  mu = MU_EARTH
): Keplerian {
  const r = Math.sqrt(x * x + y * y + z * z);
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);

  const hx = y * vz - z * vy;
  const hy = z * vx - x * vz;
  const hz = x * vy - y * vx;
  const h = Math.sqrt(hx * hx + hy * hy + hz * hz);

  const nx = -hy,
    ny = hx;
  const n = Math.sqrt(nx * nx + ny * ny);

  const rdotv = x * vx + y * vy + z * vz;
  const ex = ((v * v - mu / r) * x - rdotv * vx) / mu;
  const ey = ((v * v - mu / r) * y - rdotv * vy) / mu;
  const ez = ((v * v - mu / r) * z - rdotv * vz) / mu;
  const e = Math.sqrt(ex * ex + ey * ey + ez * ez);

  const energy = (v * v) / 2 - mu / r;
  const a = -mu / (2 * energy);
  const i = Math.acos(Math.min(1, Math.max(-1, hz / h)));

  let raan = n > 1e-8 ? Math.acos(Math.min(1, Math.max(-1, nx / n))) : 0;
  if (ny < 0) raan = 2 * Math.PI - raan;

  let omega = 0;
  if (n > 1e-8 && e > 1e-8) {
    omega = Math.acos(Math.min(1, Math.max(-1, (nx * ex + ny * ey) / (n * e))));
    if (ez < 0) omega = 2 * Math.PI - omega;
  }

  let nu = 0;
  if (e > 1e-8) {
    nu = Math.acos(
      Math.min(1, Math.max(-1, (ex * x + ey * y + ez * z) / (e * r)))
    );
    if (rdotv < 0) nu = 2 * Math.PI - nu;
  }

  const deg = 180 / Math.PI;

  return {
    a,
    e,
    i: i * deg,
    raan: raan * deg,
    omega: omega * deg,
    nu: nu * deg,
  };
}
