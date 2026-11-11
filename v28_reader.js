// Geometric Neuron V28 — clock-gated readout of V27 ring memory.
// The neural dynamics are wholly inherited from v27.js, unchanged.
// Every network element is an original constant-1.6 relay or constant-1.0 clock.
// The only extra mechanism is two fixed one-way wires into one additional relay.
// No training, no after-the-fact output override, no query label on the input.
(function(root){
  'use strict';
  const G=root.GN27 || (typeof require!=='undefined'?require('./v27.js'):null);
  if(!G)throw Error('Load taps.js and v27.js before v28_reader.js');
  const N=8, READER=8, CLOCK=9, LAP=32, HOP=4, TICKS=4500, EVAL_START=180, EVAL_END=4400;
  const RING_WEIGHT=-6, MEMORY_WEIGHT=-2, CLOCK_WEIGHT=-4;
  const zeros=(n)=>new Float64Array(n);
  const bit=(v)=>v?1:0;
  function validate(bits){
    if(!bits || bits.length!==32 || !Array.from(bits).every(v=>v===0||v===1))throw Error('Memory must be 32 binary slots');
    return Array.from(bits);
  }
  function build(mode='both'){
    const edges=G.ringEdges(N,RING_WEIGHT,0);
    if(mode!=='clockOnly'&&mode!=='none')edges.push([0,READER,MEMORY_WEIGHT,0]);
    if(mode!=='ringOnly'&&mode!=='none')edges.push([CLOCK,READER,CLOCK_WEIGHT,0]);
    return new G.Net([...Array(N+1).fill(G.RELAY),G.CLOCK],edges,null).settle(1500);
  }
  // A single experiment. The input pattern is written once; afterwards no
  // external query is sent. Clock 9 oscillates entirely by its original loop.
  // The readout is the original beat wire of relay 8.
  function study(pattern,options={}){
    const bits=validate(pattern),mode=options.mode||'both',net=build(mode);
    const ring=new Uint8Array(TICKS),clock=new Uint8Array(TICKS),read=new Uint8Array(TICKS);
    const snapshots={before:[],after:[]};
    for(let t=0;t<TICKS;t++){
      const sp=zeros(net.n);
      if(t<32&&bits[t])sp[0]=-10; // Native setpoint writing (same as V27).
      const own=net.step(null,sp);
      ring[t]=bit(own[0]>3);clock[t]=bit(own[CLOCK]>3);read[t]=bit(own[READER]>3);
      if(t>=4+32*5&&t<4+32*6)snapshots.before.push(ring[t]);
      if(t>=4+32*135&&t<4+32*136)snapshots.after.push(ring[t]);
    }
    const samples=[],allowed=new Uint8Array(TICKS);
    for(let t=EVAL_START;t<EVAL_END;t++){
      // The measurement of clock start is for auditing only:
      // it never controls the simulation or writes to the reader.
      if(clock[t]&&!clock[t-1]){
        const phase=(t-4+LAP*100)%LAP;
        const expected=bit(bits[phase]||bits[(phase+1)%LAP]);
        const observed=bit(read[t+4]||read[t+5]);
        allowed[t+4]=1;allowed[t+5]=1;
        samples.push({tick:t,phase,expected,observed,correct:expected===observed});
      }
    }
    let unsolicited=0;
    for(let t=EVAL_START+10;t<EVAL_END;t++)if(read[t]&&!allowed[t])unsolicited++;
    const correct=samples.filter(s=>s.correct).length, positives=samples.filter(s=>s.expected).length;
    const exact=a=>a.length===bits.length&&a.every((v,i)=>v===bits[i]);
    return {
      bits,mode,samples,correct,total:samples.length,positives,
      falsePositive:samples.filter(s=>s.observed&&!s.expected).length,
      falseNegative:samples.filter(s=>s.expected&&!s.observed).length,
      unsolicited,stable:exact(snapshots.before)&&exact(snapshots.after),
      before:snapshots.before,after:snapshots.after,
      // Only needed for transparent waveform plots, never to generate the query.
      trace: options.trace?{ring:Array.from(ring),clock:Array.from(clock),reader:Array.from(read)}:null
    };
  }
  // A separate single-slot instrument: the operator supplies a one-tick cue
  // at a known phase. It has 1-tick resolution but is *not* autonomous reading.
  function singleProbe(pattern,slot,options={}){
    const bits=validate(pattern),j=Number(slot);
    if(!Number.isInteger(j)||j<0||j>=32)throw Error('Slot must be 0..31');
    const net=new G.Net(Array(9).fill(G.RELAY),[
      ...G.ringEdges(8,-6,0),
      ...(options.noRingWire?[]:[[0,8,-3.2,0]])
    ],null).settle(1500);
    const q=4+32*6+j+(options.shift||0);
    let reader=null,source=null;
    let before=[],after=[],readerEvents=[];
    const end=4+32*16;
    for(let t=0;t<end;t++){
      const sp=zeros(9);
      if(!options.noWrite&&t<32&&bits[t])sp[0]=-10;
      if(!options.noCue&&t===q)sp[8]=-4;
      const own=net.step(null,sp);
      if(t===q+4)reader=bit(own[8]>3);
      if(t===q)source=bit(own[0]>3);
      if(t>=4+32*5&&t<4+32*6)before.push(bit(own[0]>3));
      if(t>=4+32*15&&t<4+32*16)after.push(bit(own[0]>3));
      if(t>=q&&t<=q+8&&own[8]>3)readerEvents.push(t);
    }
    return{slot:j,actual:bits[j],reader,source,queryTick:q,readerEvents,
      stable:before.join('')===after.join(''),before,after};
  }
  // Source-reported reproducibility patterns, with a fully specified PRNG.
  function patterns(){
    let x=2463534242;function random(){x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}
    const out=[Array(32).fill(0)];
    for(const j of [0,1,7,15,23,31])out.push(Array.from({length:32},(_,i)=>bit(i===j)));
    for(let i=0;i<20;i++)out.push(Array.from({length:32},()=>bit(random()<.32)));
    return out;
  }
  const api={N,READER,CLOCK,LAP,HOP,MEMORY_WEIGHT,CLOCK_WEIGHT,RING_WEIGHT,
    build,study,singleProbe,patterns};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.GN28=api;
})(typeof globalThis!=='undefined'?globalThis:this);
