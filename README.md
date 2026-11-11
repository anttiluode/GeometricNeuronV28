# Geometric Neuron V28 — a clock reads a memory

**Browser lab (after Pages deployment):** https://anttiluode.github.io/GeometricNeuronV28/  
**Measured results:** [results/v28_clock_reader.json](results/v28_clock_reader.json)  
**Reproduce:** node tests/test_reader.cjs

V27 kept beats circulating in a ring. **V28 asks whether another unmodified Perception Lab node can READ those beats when its own autonomous clock overlaps them.**

**Source-reported result:** YES for a native two-tick-window coincidence reader with hand-selected fixed connections. This is not associative memory, learning, or a biological neuron model.

## Machine — V27 dynamics unchanged

The copied source files [v27.js](v27.js), [taps.js](taps.js), [gn27.py](gn27.py), [taps.json](taps.json) and [original parity fixture](tests/js_parity.cjs) preserve V27's measured core. All extra coupling is in [v28_reader.js](v28_reader.js).

~~~text
Ring:  eight silent 1.6 relays, weight −6 per edge, 0 extra cable length
       0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 0     (32 ticks / lap)
                                     (ring 0) --weight −2--+
                                                           |
Clock: original constant-1.0 loop (~59 ticks) --weight −4--+--> reader
                                                                |
Reader: another constant-1.6 silent relay                         beat out
~~~

The ring-to-reader input alone is insufficient to evoke a beat, and so is the clock-to-reader input alone. Their **coincident beat wires** enter the reader's original setpoint_mod port and evoke the reader's own beat four or five ticks later. No conditional output override, injected fake spike, extra refractory rule, trained parameters, or new neuron equation is involved.

The clock is a real tenth original loop generating its own 59-tick rhythm, not a JavaScript timer or a hand-injected query. Each clock beat stays high for **two ticks**. Therefore a query tests an OR of adjacent ring slots, not an exact individual bit:

~~~text
clock starts at t
expected   = ring_beat(t) OR ring_beat(t+1)
observed   = reader_beat(t+4) OR reader_beat(t+5)
~~~

The external instrument labels the clock phase relative to the known writing origin. The network receives no address, label, target pattern or expected result. Since 59 and 32 are coprime, 32 successive clock beats visit all 32 possible starting phases: it is a **two-slot scanning aperture**. OR windows alone do not uniquely identify every arbitrary dense binary pattern.

## The measured result — 11 November 2026

Protocol: settle the ten original units for 1,500 ticks, write one 32-tick pattern at ring unit zero, then run 4,500 ticks without *any externally supplied read query*. Analyze clock leading edges between ticks 180 and 4,400. Compare observed reader outputs against the known pattern and verify the memory remains intact.

| Measure | Result |
|---|---:|
| Stored patterns | 27 (one empty, six single-event, twenty seeded sparse random) |
| Clock-scheduled two-tick reads | **1,917** |
| Correct answers | **1,917 / 1,917** |
| Positive windows | 819 |
| False positives / false negatives | 0 / 0 |
| Reader beats outside clock-output windows | 0 |
| Ring patterns unchanged after reading | 27 / 27 |
| Distinct phases in the first 32 clock queries | 32 / 32 |

The fixed read weights were chosen using exploratory probes, then evaluated on these predetermined 27 patterns. This is a specific result from the simulator, not a proof of error-free retrieval under arbitrary noise, patterns or weights.

### Critical ablations

On one random pattern with **35 positive query windows**:

| Configuration | Positive readouts |
|---|---:|
| Ring input AND native clock | 35 |
| Clock wire without ring-to-reader wire | 0 |
| Ring wire without clock-to-reader wire | 0 |

The reader has no return connection into the ring. Its nondestructive behavior is therefore a **topological design choice**, and the verified unchanged patterns are an implementation check, not evidence of a mysterious no-disturbance principle.

## Failures kept in view

- **All 32 bits set to 1:** the ring leaves the stable relay regime. Only **55/71** clock queries match the originally written dense pattern; memory changes. This inherits V27's 50-sample variance-window limitation.
- **Single-bit operator-timed reads:** a separate manual one-tick cue through the setpoint port improves temporal resolution, but only **190/192** reads succeeded in a separate diagnostic. The two misses remain recorded. This mode is externally timed, unlike the autonomous clock scanner.
- **No learning, adaptive connection selection, noise resilience, semantic retrieval, or arbitrary-pattern capacity demonstrated.** All weights are fixed. No extra return/readback path is tested.
- **The old Geometric Neuron mathematical lines are not silently imported.** V5/V9's chirality and skew operator, V24's active observation, and V25's adaptive causal lifetime inspired questions but are not implemented in V28.

## Why this is a step past V27

V27 produced circulating memory, while the lab directly inspected the ring. V28 makes the readout a **physical part of the same mathematical machine**: one original relay's own beat depends on whether another original loop's autonomous clock coincides with a circulating memory event. The browser may observe that beat without inspecting the ring state.

The next defensible question would be whether useful phase selection could become learned or conditional rather than hand-scheduled. No such learning is claimed here.

## Genealogy

- [GeometricNeuronOriginReview](https://github.com/anttiluode/GeometricNeuronOriginReview) and [GeometricNeuronV21](https://github.com/anttiluode/GeometricNeuronV21) established that the original ECG-like loop is a scalar quantized feedback/variance controller, **not** the later Geometric Neuron skew-operator object.
- [GeometricNeuronSurfaceListener (V26)](https://github.com/anttiluode/GeometricNeuronSurfaceListener) reopened the native setpoint input and demonstrated silent relays.
- [GeometricNeuronV27](https://github.com/anttiluode/GeometricNeuronV27) added measured ring memory, selective erase, cable lengths and negative controls.
- [GeometricNeuronV24](https://github.com/anttiluode/GeometricNeuronV24) investigated active observation and persistent write. The V28 reader is narrower and does not implement its reader policy.
- [GeometricNeuronV25GeneticAlgoAndFanningNeuron](https://github.com/anttiluode/GeometricNeuronV25GeneticAlgoAndFanningNeuron) studied separate route histories and local causal lifetimes, still missing here.

## Run

Open [index.html](index.html) directly in Chrome or Edge: no server or build step, no external assets or model download. Edit the 32-slot tape, run the scanner, inspect real waveforms, try the single-slot manual cue and the all-ones failure.

For CI or local checks, Node.js 18+ suffices:

~~~bash
node --check v27.js
node --check v28_reader.js
node --check site.js
node tests/js_parity.cjs
node tests/test_reader.cjs
~~~

GitHub Pages: **Settings → Pages → Source: GitHub Actions**, then run or re-run the provided Pages workflow. This site is static.

**Claim boundary:** a hand-wired, native coincidence gate can read two-tick windows from a V27 delay-line memory under the stated conditions. No biological, novelty, robustness, or commercial-performance claim follows from this test.

MIT license.
