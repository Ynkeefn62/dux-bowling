'use client';
import { useState } from 'react';

type State = 'done' | 'now' | 'next';
type Step = { n: string; title: string; state: State; body: string };

const STEPS: Step[] = [
  {
    n: 'Stage 01',
    title: 'Design complete',
    state: 'done',
    body:
      'The full 3D machine design, engineering drawings and bill of materials are released. Every motor, rail, belt, conveyor and sensor is a stock industrial part; the fabricated pieces are simple plates and weldments any local shop can make.',
  },
  {
    n: 'Stage 02',
    title: 'Patent filing',
    state: 'now',
    body:
      'A provisional patent application covering the configurable distributor and the machine is being prepared for filing, with legal review through the University of Maryland Carey Law IP clinic.',
  },
  {
    n: 'Stage 03',
    title: 'Prototype build',
    state: 'now',
    body:
      'Fabrication quotes are in hand with a Frederick, Maryland machine shop. We build and prove each sub-assembly on its own, starting with the pin distribution system — the core of the machine — before assembling the full pinsetter.',
  },
  {
    n: 'Stage 04',
    title: 'Pilot installs',
    state: 'next',
    body:
      'A small group of duckpin houses put the Dux Setter on a few lanes: free, supported, and shaped by their feedback. This is where operators come in, and where we prove the machine holds up in live play.',
  },
  {
    n: 'Stage 05',
    title: 'Rollout',
    state: 'next',
    body:
      'Full machines plus the software platform, with parts you can order and service any automation tech can perform. New duckpin lanes become buildable again for the first time in fifty years.',
  },
];

export default function Timeline() {
  const [open, setOpen] = useState(1);
  const step = STEPS[open];
  return (
    <div>
      <div className="tl">
        {STEPS.map((s, i) => (
          <button
            key={s.n}
            className="tl-step"
            data-state={s.state}
            data-on={i === open ? '1' : '0'}
            onClick={() => setOpen(i)}
            aria-expanded={i === open}
          >
            <div className="tl-bar" />
            <span className="n">{s.n}</span>
            <span className="t">{s.title}</span>
          </button>
        ))}
      </div>
      <div className="card tl-detail">
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          {step.n}
          {step.state === 'done' && ' · complete'}
          {step.state === 'now' && ' · in progress'}
          {step.state === 'next' && ' · ahead'}
        </div>
        <h3 className="stripe sub">{step.title}</h3>
        <p className="lede" style={{ fontSize: 14 }}>{step.body}</p>
      </div>
    </div>
  );
}
