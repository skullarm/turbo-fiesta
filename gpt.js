/* ===========================
   TURBO-FIESTA CLIENT (FINAL)
   =========================== */

let d=document,w,u,h=[],n=new TextDecoder(),p=new Map(),a=0,si=0,dl=!!0,dld=!!0,c=!!0,
svrInd=0,atmps=4,vdld=!!0,mp4boxLoaded=!!0,mp4box;

const svrs=['osric','wit','offal','bilboes'];
const MP4_MSE_THRESHOLD=50*1024*1024;
const SEG_QUEUE_LIMIT=30;
const segOptions={ nbSamples:250 };

/* ========= LOGGING ========= */

const mlog=e=>{
 let cur=(localStorage.getItem('error')||'')+
 `\n${new Date().toISOString()} ${JSON.stringify(e).slice(0,200)}`;
 localStorage.setItem('error',cur.slice(-10000));
};

/* ========= DOM SETUP (UNCHANGED) ========= */

d.body.innerHTML=`<div id='overlay' style='display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);z-index:999999;align-items:center;justify-content:center;color:#fff'>Paused</div>
<div id='pl'></div>
<div id='ct'></div>`;

const ge=i=>d.getElementById(i);
let pl=ge('pl'),ct=ge('ct'),overlay=ge('overlay');
let sd=ct.attachShadow({mode:'open'});
sd.innerHTML=`<style>:host{font-family:system-ui;color:#eee}</style>`;

/* ========= MP4BOX LOADER ========= */

async function ldmp4box(){
 if(mp4boxLoaded) return;
 try{
  const b=new Blob([localStorage.getItem('mp4box')||''],{type:'application/javascript'});
  const u=URL.createObjectURL(b);
  const m=await import(u);
  mp4box=m.default||m;
  mp4boxLoaded=!!1;
  mlog("mp4box loaded");
 }catch(e){mlog(e);throw e}
}

/* ========= MSE ========= */

function setUpMSE(r){
 return new Promise((res,rej)=>{
  r.mse=new MediaSource();
  r.vid.src=URL.createObjectURL(r.mse);
  r.vid.controls=true;
  pl.appendChild(r.vid);

  r.mse.addEventListener('sourceopen',()=>{
   try{
    const mime=`video/mp4; codecs="${r.codec}"`;
    if(!MediaSource.isTypeSupported(mime))
     throw "codec not supported";

    r.sb=r.mse.addSourceBuffer(mime);
    r.sb.mode="segments";
    r.sbQueue=[];
    r.sbBusy=false;

    r.sb.addEventListener('updateend',()=>{
     r.sbBusy=false;
     drainSB(r);
    });

    res();
   }catch(e){mlog(e);rej(e)}
  },{once:true});
 });
}

function drainSB(r){
 if(!r.sb||r.sbBusy) return;
 if(!r.sbQueue.length){
  if(r.streamEnded&&r.mse.readyState==="open"){
   try{r.mse.endOfStream()}catch{}
  }
  return;
 }
 try{
  r.sbBusy=true;
  r.sb.appendBuffer(r.sbQueue.shift());
 }catch(e){mlog(e)}
}

/* ========= MP4BOX ========= */

async function setUpMp4(r){
 await ldmp4box();

 r.mp4=mp4box.createFile();
 r.offset=0;

 r.mp4.onReady=async info=>{
  r.codec=info.tracks[0].codec;
  r.trackId=info.tracks[0].id;
  await setUpMSE(r);
  r.mp4.setSegmentOptions(r.trackId,null,segOptions);
  r.mp4.initializeSegmentation();
  r.mp4.start();
 };

 r.mp4.onSegment=(id,u,buf)=>{
  r.sbQueue.push(buf);
  if(r.sbQueue.length>SEG_QUEUE_LIMIT)r.sbQueue.shift();
  drainSB(r);
 };

 r.mp4.onError=e=>mlog(e);
}

function processChunk(r,u8){
 const ab=u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);
 ab.fileStart=r.offset;
 r.offset+=ab.byteLength;
 try{r.mp4.appendBuffer(ab)}catch(e){mlog(e)}
}

/* ========= STREAM ========= */

function handleStream(buf){
 const u8=new Uint8Array(buf);
 const q=n.decode(u8.slice(0,9));
 const r=p.get(q);
 if(!r) return;

 const pay=u8.slice(9);

 if(r.usesMSE) processChunk(r,pay);
 else r.f.push(pay);
}

/* ========= EOS ========= */

function handleEndOfStream(q){
 const r=p.get(q);
 if(!r) return;
 if(r.usesMSE){
  r.streamEnded=true;
  drainSB(r);
 }else{
  r.ou=URL.createObjectURL(new Blob(r.f,{type:r.c}));
  r.vid.src=r.ou;
  pl.appendChild(r.vid);
 }
}

/* ========= WS ========= */

function C(){
 w=new WebSocket(`wss://${svrs[svrInd]}.paytel.workers.dev`);
 w.binaryType='arraybuffer';

 w.onopen=()=>c=!!1;
 w.onclose=()=>c=!!0;
 w.onmessage=m=>{
  if(m.data instanceof ArrayBuffer)handleStream(m.data);
  else{
   const f=JSON.parse(m.data);
   if(f.t==='s'){
    const r=p.get(f.q);
    r.c=f.c;
    r.tl=JSON.parse(f.d).totalLength;
    if(r.c.startsWith('video')){
     r.usesMSE=r.tl>MP4_MSE_THRESHOLD;
     if(r.usesMSE) setUpMp4(r);
     else r.vid=document.createElement('video');
    }
   }
   if(f.t==='e') handleEndOfStream(f.q);
  }
 };
}

/* ========= REQUEST ========= */

function Z(u,q){
 if(!q)q=Math.random().toString(36).slice(2,11);
 p.set(q,{
  q,
  u,
  f:[],
  vid:document.createElement('video'),
  mp4:null,
  mse:null,
  sb:null,
  sbQueue:[],
  offset:0,
  streamEnded:false,
  usesMSE:false
 });
 w.send(JSON.stringify({u,q,au:btoa(Date.now())}));
}

/* ========= INIT ========= */

svrInd=Math.floor(Math.random()*svrs.length);
C();
