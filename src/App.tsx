import { useState } from 'react';
import { Field } from './components/Field';
import {
  parseNum,
  formatNum,
  keplerianToCartesian,
  cartesianToKeplerian,
  type Keplerian,
  type Cartesian,
} from './lib/orbital';

const DECIMALS = {
  a: 0,
  e: 3,
  i: 1,
  raan: 1,
  omega: 1,
  nu: 1,
  x: 1,
  y: 1,
  z: 1,
  vx: 3,
  vy: 3,
  vz: 3,
  r: 1,
  v: 3,
};

const INITIAL_KEPLERIAN = {
  a: 6786,
  e: 0.002,
  i: 51.6,
  raan: 247.0,
  omega: 130.0,
  nu: 332.5,
};

const KEPLERIAN_KEYS = ['a', 'e', 'i', 'raan', 'omega', 'nu'] as const;
const CARTESIAN_KEYS = ['x', 'y', 'z', 'vx', 'vy', 'vz'] as const;

// returns null if any field is not a valid number yet (e.g. mid-typing)
function parseFields<K extends string>(
  values: Record<K, string>,
  keys: readonly K[]
): Record<K, number> | null {
  const parsed = {} as Record<K, number>;
  for (const key of keys) {
    const n = parseNum(values[key]);
    if (Number.isNaN(n)) return null;
    parsed[key] = n;
  }
  return parsed;
}

function formatKeplerian(k: Keplerian) {
  return {
    a: formatNum(k.a, DECIMALS.a),
    e: formatNum(k.e, DECIMALS.e),
    i: formatNum(k.i, DECIMALS.i),
    raan: formatNum(k.raan, DECIMALS.raan),
    omega: formatNum(k.omega, DECIMALS.omega),
    nu: formatNum(k.nu, DECIMALS.nu),
  };
}

function formatCartesian(c: Cartesian) {
  return {
    x: formatNum(c.x, DECIMALS.x),
    y: formatNum(c.y, DECIMALS.y),
    z: formatNum(c.z, DECIMALS.z),
    vx: formatNum(c.vx, DECIMALS.vx),
    vy: formatNum(c.vy, DECIMALS.vy),
    vz: formatNum(c.vz, DECIMALS.vz),
    r: formatNum(c.r, DECIMALS.r),
    v: formatNum(c.v, DECIMALS.v),
  };
}

function PanelHeader({
  dot,
  title,
  badge,
}: {
  dot: 'blue' | 'green';
  title: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${dot === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`}
        />
        <span className="text-[10px] font-semibold tracking-[0.12em] text-slate-600 uppercase">
          {title}
        </span>
      </div>
      <span className="text-xs text-slate-400">{badge}</span>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-1">
      <span className="text-[9px] font-semibold tracking-[0.14em] text-slate-400 uppercase whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

export default function App() {
  const initialCartesian = keplerianToCartesian(INITIAL_KEPLERIAN);

  const [kepStr, setKepStr] = useState(formatKeplerian(INITIAL_KEPLERIAN));

  const [cartStr, setCartStr] = useState(formatCartesian(initialCartesian));

  const [lastEdited, setLastEdited] = useState<'keplerian' | 'cartesian'>(
    'keplerian'
  );

  function handleKeplerianChange(field: keyof typeof kepStr, raw: string) {
    const next = { ...kepStr, [field]: raw };
    setKepStr(next);
    setLastEdited('keplerian');

    const parsed = parseFields(next, KEPLERIAN_KEYS);
    if (!parsed) return;

    const cart = keplerianToCartesian(parsed);
    setCartStr(formatCartesian(cart));
  }

  function handleCartesianChange(
    field: (typeof CARTESIAN_KEYS)[number],
    raw: string
  ) {
    const next = { ...cartStr, [field]: raw };
    setLastEdited('cartesian');

    const parsed = parseFields(next, CARTESIAN_KEYS);
    if (!parsed) {
      setCartStr(next);
      return;
    }

    const kep = cartesianToKeplerian(parsed);
    const r = Math.sqrt(parsed.x ** 2 + parsed.y ** 2 + parsed.z ** 2);
    const v = Math.sqrt(parsed.vx ** 2 + parsed.vy ** 2 + parsed.vz ** 2);

    setCartStr({
      ...next,
      r: formatNum(r, DECIMALS.r),
      v: formatNum(v, DECIMALS.v),
    });
    setKepStr(formatKeplerian(kep));
  }

  function handleReset() {
    setKepStr(formatKeplerian(INITIAL_KEPLERIAN));
    setCartStr(formatCartesian(keplerianToCartesian(INITIAL_KEPLERIAN)));
    setLastEdited('keplerian');
  }

  function handleCopyJSON() {
    const payload = {
      keplerian: kepStr,
      cartesian: cartStr,
      source: lastEdited,
    };
    void navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* header */}
      <header className="border-b border-slate-200 bg-white shrink-0">
        <div className="w-[900px] mx-auto flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold text-slate-800 tracking-tight">
              Orbital element converter
            </h1>
            <span className="text-xs text-blue-500 border border-blue-200 bg-blue-50 rounded-full px-2.5 py-0.5">
              Keplerian ↔ Cartesian
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              ↺ Reset
            </button>
            <button
              onClick={handleCopyJSON}
              className="text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              ⧉ Copy JSON
            </button>
          </div>
        </div>
      </header>

      {/* panels */}
      <main className="flex flex-1 min-h-0 items-center justify-center px-8 py-6">
        <div className="flex items-center gap-6">
          {/* keplerian */}
          <section className="w-100 shrink-0 flex flex-col bg-white rounded-xl shadow-sm shadow-slate-200/60 border border-slate-100 px-5 py-4">
            <PanelHeader
              dot="blue"
              title="Keplerian elements"
              badge={lastEdited === 'keplerian' ? 'source' : 'computed'}
            />

            <SectionDivider label="Shape" />
            <Field
              symbol="a"
              label="Semi-major axis"
              value={kepStr.a}
              unit="km"
              onChange={(v) => handleKeplerianChange('a', v)}
            />
            <Field
              symbol="e"
              label="Eccentricity"
              value={kepStr.e}
              unit="—"
              onChange={(v) => handleKeplerianChange('e', v)}
            />

            <SectionDivider label="Orientation" />
            <Field
              symbol="i"
              label="Inclination"
              value={kepStr.i}
              unit="deg"
              onChange={(v) => handleKeplerianChange('i', v)}
            />
            <Field
              symbol="Ω"
              label="RAAN"
              value={kepStr.raan}
              unit="deg"
              onChange={(v) => handleKeplerianChange('raan', v)}
            />
            <Field
              symbol="ω"
              label="Arg. of periapsis"
              value={kepStr.omega}
              unit="deg"
              onChange={(v) => handleKeplerianChange('omega', v)}
            />

            <SectionDivider label="Position" />
            <Field
              symbol="ν"
              label="True anomaly"
              value={kepStr.nu}
              unit="deg"
              onChange={(v) => handleKeplerianChange('nu', v)}
            />
          </section>

          {/* exchange */}
          <div className="flex items-center justify-center w-8 shrink-0">
            <span
              className={`text-xl font-bold select-none transition-colors duration-300 ${
                lastEdited === 'keplerian'
                  ? 'text-blue-500'
                  : 'text-emerald-500'
              }`}
            >
              {lastEdited === 'keplerian' ? '→' : '←'}
            </span>
          </div>

          {/* cartesian */}
          <section className="w-100 shrink-0 flex flex-col bg-white rounded-xl shadow-sm shadow-slate-200/60 border border-slate-100 px-5 py-4">
            <PanelHeader
              dot="green"
              title="Cartesian state vector"
              badge={lastEdited === 'cartesian' ? 'source' : 'computed'}
            />

            <SectionDivider label="Position (ECI)" />
            <Field
              symbol="x"
              value={cartStr.x}
              unit="km"
              onChange={(v) => handleCartesianChange('x', v)}
            />
            <Field
              symbol="y"
              value={cartStr.y}
              unit="km"
              onChange={(v) => handleCartesianChange('y', v)}
            />
            <Field
              symbol="z"
              value={cartStr.z}
              unit="km"
              onChange={(v) => handleCartesianChange('z', v)}
            />

            <SectionDivider label="Velocity (ECI)" />
            <Field
              symbol="vx"
              value={cartStr.vx}
              unit="km/s"
              onChange={(v) => handleCartesianChange('vx', v)}
            />
            <Field
              symbol="vy"
              value={cartStr.vy}
              unit="km/s"
              onChange={(v) => handleCartesianChange('vy', v)}
            />
            <Field
              symbol="vz"
              value={cartStr.vz}
              unit="km/s"
              onChange={(v) => handleCartesianChange('vz', v)}
            />

            <SectionDivider label="Derived" />
            <Field
              symbol="|r|"
              label="Distance from Earth"
              value={cartStr.r}
              unit="km"
              readOnly
            />
            <Field
              symbol="|v|"
              label="Speed"
              value={cartStr.v}
              unit="km/s"
              readOnly
            />
          </section>
        </div>
      </main>
    </div>
  );
}
