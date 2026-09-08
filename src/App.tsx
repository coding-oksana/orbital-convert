import { Field } from './components/Field';

const KEPLERIAN = {
  a:     '6 786',
  e:     '0.002',
  i:     '51.6',
  raan:  '247.0',
  omega: '130.0',
  nu:    '332.5',
};

const CARTESIAN = {
  x:  '−2 768.3',
  y:  '5 897.1',
  z:  '2 211.6',
  vx: '−5.214',
  vy: '−3.892',
  vz: '4.671',
  r:  '6 799.1',
  v:  '7.656',
};

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
      <span className="text-[9px] font-semibold tracking-[0.14em] text-slate-400 uppercase whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

export default function App() {
  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* header */}
      <header className="flex items-center justify-between px-8 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-slate-800 tracking-tight">Orbital element converter</h1>
          <span className="text-xs text-blue-500 border border-blue-200 bg-blue-50 rounded-full px-2.5 py-0.5">
            Keplerian ↔ Cartesian
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors">
            ↺ Reset
          </button>
          <button className="text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors">
            ⧉ Copy JSON
          </button>
        </div>
      </header>

      {/* panels */}
      <main className="flex flex-1 min-h-0">

        {/* keplerian */}
        <section className="flex-1 px-8 py-5 border-r border-slate-100 flex flex-col">
          <PanelHeader dot="blue" title="Keplerian elements" badge="inputs" />

          <SectionDivider label="Shape" />
          <Field symbol="a" label="Semi-major axis" value={KEPLERIAN.a}     unit="km"  />
          <Field symbol="e" label="Eccentricity"    value={KEPLERIAN.e}     unit="—"   />

          <SectionDivider label="Orientation" />
          <Field symbol="i" label="Inclination"       value={KEPLERIAN.i}     unit="deg" />
          <Field symbol="Ω" label="RAAN"              value={KEPLERIAN.raan}  unit="deg" />
          <Field symbol="ω" label="Arg. of periapsis" value={KEPLERIAN.omega} unit="deg" />

          <SectionDivider label="Position" />
          <Field symbol="ν" label="True anomaly" value={KEPLERIAN.nu} unit="deg" />
        </section>

        {/* exchange */}
        <div className="flex items-center justify-center w-12 shrink-0 border-r border-slate-100">
          <span className="text-base text-slate-300 select-none">⇌</span>
        </div>

        {/* cartesian */}
        <section className="flex-1 px-8 py-5 flex flex-col">
          <PanelHeader dot="green" title="Cartesian state vector" badge="computed" />

          <SectionDivider label="Position (ECI)" />
          <Field symbol="x"  value={CARTESIAN.x}  unit="km"   readOnly />
          <Field symbol="y"  value={CARTESIAN.y}  unit="km"   readOnly />
          <Field symbol="z"  value={CARTESIAN.z}  unit="km"   readOnly />

          <SectionDivider label="Velocity (ECI)" />
          <Field symbol="vx" value={CARTESIAN.vx} unit="km/s" readOnly />
          <Field symbol="vy" value={CARTESIAN.vy} unit="km/s" readOnly />
          <Field symbol="vz" value={CARTESIAN.vz} unit="km/s" readOnly />

          <SectionDivider label="Derived" />
          <Field symbol="|r|" label="Distance from Earth" value={CARTESIAN.r} unit="km"   readOnly />
          <Field symbol="|v|" label="Speed"               value={CARTESIAN.v} unit="km/s" readOnly />
        </section>

      </main>
    </div>
  );
}