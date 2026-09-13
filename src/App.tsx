import { useState } from 'react';
import { Field } from './components/Field';
import {
  parseNum,
  formatNum,
  keplerianToCartesian,
  cartesianToKeplerian,
} from './lib/obrital';

const DECIMALS = {
  a: 0, e: 3, i: 1, raan: 1, omega: 1, nu: 1,
  x: 1, y: 1, z: 1, vx: 3, vy: 3, vz: 3, r: 1, v: 3,
};

const INITIAL_KEPLERIAN = { a: 6786, e: 0.002, i: 51.6, raan: 247.0, omega: 130.0, nu: 332.5 };

function PanelHeader({ dot, title, badge }: { dot: 'blue' | 'green'; title: string; badge: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
        <span className="text-[10px] font-semibold tracking-[0.12em] text-slate-600 uppercase">{title}</span>
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

  const [kepStr, setKepStr] = useState({
    a: formatNum(INITIAL_KEPLERIAN.a, DECIMALS.a),
    e: formatNum(INITIAL_KEPLERIAN.e, DECIMALS.e),
    i: formatNum(INITIAL_KEPLERIAN.i, DECIMALS.i),
    raan: formatNum(INITIAL_KEPLERIAN.raan, DECIMALS.raan),
    omega: formatNum(INITIAL_KEPLERIAN.omega, DECIMALS.omega),
    nu: formatNum(INITIAL_KEPLERIAN.nu, DECIMALS.nu),
  });

  const [cartStr, setCartStr] = useState({
    x: formatNum(initialCartesian.x, DECIMALS.x),
    y: formatNum(initialCartesian.y, DECIMALS.y),
    z: formatNum(initialCartesian.z, DECIMALS.z),
    vx: formatNum(initialCartesian.vx, DECIMALS.vx),
    vy: formatNum(initialCartesian.vy, DECIMALS.vy),
    vz: formatNum(initialCartesian.vz, DECIMALS.vz),
    r: formatNum(initialCartesian.r, DECIMALS.r),
    v: formatNum(initialCartesian.v, DECIMALS.v),
  });

  const [lastEdited, setLastEdited] = useState<'keplerian' | 'cartesian'>('keplerian');

  function handleKeplerianChange(field: keyof typeof kepStr, raw: string) {
    const next = { ...kepStr, [field]: raw };
    setKepStr(next);
    setLastEdited('keplerian');

    const parsed = {
      a: parseNum(next.a), e: parseNum(next.e), i: parseNum(next.i),
      raan: parseNum(next.raan), omega: parseNum(next.omega), nu: parseNum(next.nu),
    };
    if (Object.values(parsed).some((n) => Number.isNaN(n))) return;

    const cart = keplerianToCartesian(parsed);
    setCartStr({
      x: formatNum(cart.x, DECIMALS.x), y: formatNum(cart.y, DECIMALS.y), z: formatNum(cart.z, DECIMALS.z),
      vx: formatNum(cart.vx, DECIMALS.vx), vy: formatNum(cart.vy, DECIMALS.vy), vz: formatNum(cart.vz, DECIMALS.vz),
      r: formatNum(cart.r, DECIMALS.r), v: formatNum(cart.v, DECIMALS.v),
    });
  }

  function handleCartesianChange(field: 'x' | 'y' | 'z' | 'vx' | 'vy' | 'vz', raw: string) {
    const next = { ...cartStr, [field]: raw };
    setLastEdited('cartesian');

    const parsed = {
      x: parseNum(next.x), y: parseNum(next.y), z: parseNum(next.z),
      vx: parseNum(next.vx), vy: parseNum(next.vy), vz: parseNum(next.vz),
    };
    if (Object.values(parsed).some((n) => Number.isNaN(n))) {
      setCartStr(next);
      return;
    }

    const kep = cartesianToKeplerian(parsed);
    const r = Math.sqrt(parsed.x ** 2 + parsed.y ** 2 + parsed.z ** 2);
    const v = Math.sqrt(parsed.vx ** 2 + parsed.vy ** 2 + parsed.vz ** 2);

    setCartStr({ ...next, r: formatNum(r, DECIMALS.r), v: formatNum(v, DECIMALS.v) });
    setKepStr({
      a: formatNum(kep.a, DECIMALS.a), e: formatNum(kep.e, DECIMALS.e), i: formatNum(kep.i, DECIMALS.i),
      raan: formatNum(kep.raan, DECIMALS.raan), omega: formatNum(kep.omega, DECIMALS.omega), nu: formatNum(kep.nu, DECIMALS.nu),
    });
  }

  function handleReset() {
    setKepStr({
      a: formatNum(INITIAL_KEPLERIAN.a, DECIMALS.a), e: formatNum(INITIAL_KEPLERIAN.e, DECIMALS.e),
      i: formatNum(INITIAL_KEPLERIAN.i, DECIMALS.i), raan: formatNum(INITIAL_KEPLERIAN.raan, DECIMALS.raan),
      omega: formatNum(INITIAL_KEPLERIAN.omega, DECIMALS.omega), nu: formatNum(INITIAL_KEPLERIAN.nu, DECIMALS.nu),
    });
    const cart = keplerianToCartesian(INITIAL_KEPLERIAN);
    setCartStr({
      x: formatNum(cart.x, DECIMALS.x), y: formatNum(cart.y, DECIMALS.y), z: formatNum(cart.z, DECIMALS.z),
      vx: formatNum(cart.vx, DECIMALS.vx), vy: formatNum(cart.vy, DECIMALS.vy), vz: formatNum(cart.vz, DECIMALS.vz),
      r: formatNum(cart.r, DECIMALS.r), v: formatNum(cart.v, DECIMALS.v),
    });
    setLastEdited('keplerian');
  }

  function handleCopyJSON() {
    const payload = { keplerian: kepStr, cartesian: cartStr, source: lastEdited };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
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
            <span className="text-base text-slate-300 select-none">⇌</span>
          </div>

          {/* cartesian */}
          <section className="w-100 shrink-0 flex flex-col bg-white rounded-xl shadow-sm shadow-slate-200/60 border border-slate-100 px-5 py-4">
            <PanelHeader
              dot="green"
              title="Cartesian state vector"
              badge={lastEdited === 'cartesian' ? 'source' : 'computed'}
            />

            <SectionDivider label="Position (ECI)" />
            <Field symbol="x" value={cartStr.x} unit="km" onChange={(v) => handleCartesianChange('x', v)} />
            <Field symbol="y" value={cartStr.y} unit="km" onChange={(v) => handleCartesianChange('y', v)} />
            <Field symbol="z" value={cartStr.z} unit="km" onChange={(v) => handleCartesianChange('z', v)} />

            <SectionDivider label="Velocity (ECI)" />
            <Field symbol="vx" value={cartStr.vx} unit="km/s" onChange={(v) => handleCartesianChange('vx', v)} />
            <Field symbol="vy" value={cartStr.vy} unit="km/s" onChange={(v) => handleCartesianChange('vy', v)} />
            <Field symbol="vz" value={cartStr.vz} unit="km/s" onChange={(v) => handleCartesianChange('vz', v)} />

            <SectionDivider label="Derived" />
            <Field symbol="|r|" label="Distance from Earth" value={cartStr.r} unit="km" readOnly />
            <Field symbol="|v|" label="Speed" value={cartStr.v} unit="km/s" readOnly />
          </section>
        </div>
      </main>
    </div>
  );
}