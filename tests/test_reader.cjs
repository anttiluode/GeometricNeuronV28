// Source-reported V28 assays. No learned parameters, no private libraries.
// Run: node tests/test_reader.cjs
'use strict';
const assert=require('node:assert/strict');
require('../taps.js');
const E=require('../v28_reader.js');

let total=0,correct=0,pos=0,unsolicited=0;
const cases=E.patterns(),first=[];
for(const [idx,bits] of cases.entries()){
  const r=E.study(bits);
  total+=r.total;correct+=r.correct;pos+=r.positives;unsolicited+=r.unsolicited;
  assert.equal(r.total,71,'The 59-tick clock provides 71 samples in the fixed assay');
  assert.equal(r.correct,r.total,'Native reader must report each clock-window OR');
  assert.equal(r.falsePositive,0);
  assert.equal(r.falseNegative,0);
  assert.equal(r.unsolicited,0,'No unscheduled beat in the checked interval');
  assert.equal(r.stable,true,'Reading did not alter the ring');
  assert.equal(new Set(r.samples.slice(0,32).map(s=>s.phase)).size,32,'Clock scans every ring phase');
  first.push([idx,r.positives]);
}
assert.equal(total,1917);assert.equal(correct,1917);assert.equal(pos,819);
console.log('Native clock: '+correct+'/'+total+' correct, '+pos+' positive, '+unsolicited+' unclocked output beats');

const target=cases[10];
const full=E.study(target),noRing=E.study(target,{mode:'clockOnly'}),noClock=E.study(target,{mode:'ringOnly'});
assert.ok(full.positives>0);
assert.equal(full.correct,71);
assert.equal(noRing.samples.filter(s=>s.observed).length,0,'Clock alone cannot make the readout fire');
assert.equal(noClock.samples.filter(s=>s.observed).length,0,'Ring alone cannot make the readout fire');
console.log('Ablations: 0 positive readouts when either incoming wire is missing');

const singleton=Array.from({length:32},(_,i)=>+(i===7));
const yes=E.singleProbe(singleton,7),no=E.singleProbe(singleton,4),
      withoutCue=E.singleProbe(singleton,7,{noCue:true}),
      withoutWrite=E.singleProbe(singleton,7,{noWrite:true}),
      shifted=E.singleProbe(singleton,7,{shift:8});
assert.equal(yes.reader,1);
assert.equal(no.reader,0);
assert.equal(withoutCue.reader,0);
assert.equal(withoutWrite.reader,0);
assert.equal(shifted.reader,0);
assert.equal(yes.stable,true);
console.log('One-slot manual probe: present, absent, no-cue, no-write and phase-shift controls pass');

// Separate held-out stress check: same predetermined weights, one reader and one
// externally cued slot per trial. This diagnostic intentionally DOES show failures.
let manual=0,misses=[];
for(const [patternNo,bits] of cases.slice(7,13).entries())
  for(let slot=0;slot<32;slot++){
    const r=E.singleProbe(bits,slot);
    if(r.reader===bits[slot])manual++;
    else misses.push({patternNo,slot,expected:bits[slot],got:r.reader});
    assert.equal(r.stable,true);
  }
assert.equal(manual,190,'Pin the actual, imperfect held-out single-slot score');
assert.deepEqual(misses.map(m=>[m.patternNo,m.slot]),[[1,13],[1,14]]);
console.log('Independent manual single-slot probes: '+manual+'/192 correct; documented misses '+JSON.stringify(misses));

const dense=E.study(Array(32).fill(1));
assert.equal(dense.stable,false,'Dense all-ones pattern breaks the original relay');
assert.ok(dense.correct<dense.total,'Dense original loop is not a reliable memory');
console.log('Known failure retained: all-ones memory is unstable ('+dense.correct+'/'+dense.total+' window reads)');

console.log('PASS V28: native reading, phase census, input ablations, preservation, and negative controls');
