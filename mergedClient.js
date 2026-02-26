//**!!FILE MUST BE EXECUTABLE VIA JAVASCRIPTS'S eval() FUNCTION. I AM AWARE OF CONCERNS WITH IT.!!**

// Globals - Merged newest.js with fresh proven MP4/MSE logic
let d=document,w,u,h=[],n=new TextDecoder(),p=new Map(),a=0,si=0,dl=!!0,dld=!!0,c=!!0,svrInd=0,atmps=4,vdld=!!0,mpbU='https://cdn.jsdelivr.net/npm/mp4box@latest/dist/mp4box.all.min.js',
ge=i=>d.getElementById(i),pdfdl=!!0,getwkr=!!0,mp4boxLoaded=!!0,mp4box,isFading=!!0,firstLoad=!!1,cnclFade=!!0,showBase='https://archive.org/download/',archiveBase='https://archive.org/details/',pdfjsLib=null,dimmed=!!0;

const MP4_MSE_THRESHOLD=52428800; // 50MB threshold for MSE
const n2=new TextDecoder();
const svrs=['osric','wit','bilboes','phone','call','text','kazak','argos','sv1','skip','trace','alice','harley','turbo'];
// CSS styles (all moved here; sidebar collapsible, closed default)
const cssStyles = `
.col, .col ul {list-style-type: none;padding-left:10px;}
.col li{padding: 5px}
.toggle{padding:12px;}
.toggle::before{display:inline-block;width:17px;content:'➕';}
.toggle.show::before{content:'➖';}
.col ul{display:none;}
.toggle.show + ul{display:block;}
.sidebar {position: fixed; left: -300px; top: 0; height: 100%; width: 300px; background: #2a2a2a; padding: 3px; transition: left 0.3s ease; z-index: 100000100;color:#eee}
.sidebar.open { left: 0; }
#sidebar-options { padding:4px;margin: 10px; border:1px solid #fff}
#sidebar-treeview { flex:1;padding:3px;margin:5px;color: #eee; max-height:100vh;overflow-y:auto;overflow-x:auto} 
#btnCls {position: absolute; top: 15px; right: 15px; padding: 10px 15px; background: #444; color: #fff; border: 1px solid #665; border-radius: 4px; cursor: pointer; display: none;}
.sidebar.open #btnCls {display: inline-block;}
.sidebar.open #btnOpn {display: none;}
#overlay {display:none;position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,0.7);z-index:100000999;font-family:system-ui,sans-serif;align-items:center;justify-content:center;pointer-events: none}
#overlay span{background:#222;color:#eee;padding:2em;border-radius:8px;text-align:center;max-width:500px;border: 1px solid #665}
#pl {background:#1a1a1a;display:flex;flex-direction:column;align-items:center;justify-content:center}
.sticky-header {position:sticky;top:0;z-index:100000099;background:#2a2a2a;color:#eee;padding:8px;font-family:system-ui,sans-serif;border-bottom:1px solid #444}
.sticky-header div {display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sticky-header button, .sticky-header input {padding:6px 12px;background:#444;color:#fff;border:1px solid #665;border-radius:4px;cursor:pointer}
.sticky-header #iu {flex:1;min-width:200px;background:#1a1a1a;color:#eee;font-family:monospace;font-size:12px}
.sticky-header #sv {width:80px;padding:4px;background:#1a1a1a;color:#eee;font-size:11px;text-align:center}
.sticky-header label {cursor:pointer;font-size:12px}
#msgs {position: relative;width:100%;margin-top:8px;padding:8px;background:#1a1a1a;border-radius:4px;font-size:12px}
#pg {font-family:monospace;top:0;left:4px;z-index:2}
#pb {position: absolute;bottom:0;left:0;height:10px;background:linear-gradient(to right,#1a1a1a 0%, green 100%);width:0%;transition: width 0.3s ease;z-index:1}
#ct {display:block;font-family:system-ui,sans-serif;color:#eee;background:#1a1a1a}
#ct img, #ct video {max-width:100%;height:auto;margin:8px 0;border-radius:4px}
#ct a {color:#4a9eff;text-decoration:none}
#ct a:hover {text-decoration:underline}
#ct h1, #ct h2, #ct h3 {color:#fff;margin:16px 0 8px}
#ct pre {background:#111;padding:12px;overflow:auto;border-left:3px solid #4a9eff;margin:8px 0}
#ct button {padding:6px 12px;background:#4a9eff;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold}
#ct button:hover {background:#5ba4ff}
`;

// HTML setup (overlay, player, header, content, sidebar)
d.body.innerHTML=`
<div id='overlay'><span id='dimmsg'><h2>Double-Tap Anywhere</h2><p><h3>To Turn Dimmer Off</h3></span></div>
<div id='pl'></div>
<div class='sticky-header'>
<div>
<button id='btnOpn'>🌫</button>
<button id='bck'>🔙 BCK</button>
<button id='rf'>🔄 RF</button>
<input id='iu' placeholder='https://...' />
<input id='sv' placeholder='SVR' readOnly />
<input id='cb' type='checkbox'/> <label for='cb'>Auto</label>
<input id='bs' type='button' />
<button id='hide'>💡</button>
</div>
<div id='msgs'>
 <span id='pg'></span>
 <div id='pb'></div>
</div>
</div>
<div id='ct'></div>
<div id='sidebar' class='sidebar'>
<button id='btnCls'> ✖ </button>
🍿 For Your Viewing Delight  🎟
<div id='sidebar-treeview'>LOADING...</div>
</div>
`;

const originalURL=globalThis.URL;
// Element refs
let bck=ge('bck'),iu=ge('iu'),rf=ge('rf'),sv=ge('sv'),cb=ge('cb'),hide=ge('hide'),pg=ge('pg'),overlay=ge('overlay'),bs=ge('bs'),pl=ge('pl'),ct=ge('ct'),msgs=ge('msgs'),pb=ge('pb'),sidebar=ge('sidebar'),tree=ge('sidebar-treeview');

// Shadow DOM
let sd=ct.attachShadow({mode:'open'});
sd.innerHTML='<style>:host{all:initial}*{box-sizing:border-box}</style>';

// Server change
cngSvr=i=>{
  const svr=svrs[svrInd];
  sv.value=svr;
  DL();
  atmps--;
  if(atmps<=0){ svrInd=(svrInd+1)%svrs.length;atmps=4;}
},

// Utilities
U=i=>new Promise((res)=>{ pg.textContent=i;res(pg);}),
ic=(e,i)=>e.includes(i),
sw=(e,i)=>e.startsWith(i),
rm=(e,i)=>e.removeChild(i),
J=(e,i)=>e.appendChild(i),
W=(e,i)=>e.innerHTML=i,

// Load pdf.js
ldpdfJS=async()=>{
  let sc=l('script');
  sc.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs';
  sc.type='module';
  sc.onload=()=>{pdfjsLib=window.pdfjsLib;mlog('pdfjs loaded')};
  J(d.head,sc);
},

// === MP4BOX LOADING - PROVEN ===
ldmp4box=async i=>{
  if(mp4boxLoaded) return;
  try{
    const b=new Blob([localStorage.getItem('mp4box')||''],{type:'application/javascript'});
    const url=window.URL.createObjectURL(b);
    const mod=await import(url);
    mp4box=mod.default||mod;
    mp4boxLoaded=!!1;
    mlog('mp4box loaded');
  }catch(er){mlog(`ldmp4box: ${er.message||er}`)}
},

// === MSE THRESHOLD ===
shouldUseMSE=r=>r.tl && r.tl>MP4_MSE_THRESHOLD,

// === FRESH MP4BOX SETUP: Proper async callback sequencing ===
setUpMp4=async r=>{
 return new Promise((resolve,reject)=>{
  try{
   if(!mp4boxLoaded){reject(new Error('mp4box not loaded'));return}
   
   r.mp4=mp4box.createFile();
   r.bfrInd=0;
   r.Q=[];
   mlog(`mp4 created for request ${r.q}`);
   
   // onReady: Called when moov box is parsed
   r.mp4.onReady=async info=>{
    try{
     mlog(`mp4 ready: ${info.tracks.length} tracks, duration=${info.duration}`);
     
     // Extract video track codec
     let vt=info.tracks.find(t=>t.type==='video');
     if(!vt){reject(new Error('No video track'));return}
     
     r.trackId=vt.id;
     r.codec=extractCodecString(vt);
     if(!r.codec){reject(new Error('No codec detected'));return}
     
     mlog(`Video codec: ${r.codec}`);
     
     // Try audio track
     let at=info.tracks.find(t=>t.type==='audio');
     if(at)r.audioTrackId=at.id;
     
     // Initialize MSE with detected codec
     try{await setUpMSE(r)}
     catch(er){mlog(`MSE init failed: ${er.message||er}`);reject(er);return}
     
     resolve();
    }catch(er){mlog(`onReady: ${er.message||er}`);reject(er)}
   };
   
   // onSegment: Optional for advanced queueing
   r.mp4.onSegment=(id,user,buffer,sampleNumber,last)=>{
    try{
     if(!r.srcBfr) return;
     if(r.srcBfr.updating || r.Q.length>=30){
      if(r.Q.length<35)r.Q.push(buffer);
     }else{
      try{
       buffer.fileStart=r.bfrInd||0;
       r.bfrInd=r.mp4.appendBuffer(buffer);
      }catch(er){
       if(r.Q.length<35)r.Q.push(buffer);
      }
     }
    }catch(er){mlog(`onSegment: ${er}`)}
   };
   
  }catch(er){mlog(`setUpMp4: ${er.message||er}`);reject(er)}
 })
},

// Extract codec string in Chrome-compatible format
extractCodecString=track=>{
 try{
  if(!track.mdia||!track.mdia.minf||!track.mdia.minf.stbl||!track.mdia.minf.stbl.stsd)return null;
  const stsd=track.mdia.minf.stbl.stsd;
  if(!stsd.entries||!stsd.entries[0])return null;
  const entry=stsd.entries[0];
  
  if(entry.avcC){
   const avc=entry.avcC;
   const sps=avc.SPS[0];
   return `avc1.${sps[1].toString(16).padStart(2,'0')}${sps[2].toString(16).padStart(2,'0')}${sps[3].toString(16).padStart(2,'0')}`;
  }else if(entry.vpcC){
   return 'vp09.00.41.08';
  }else if(entry.hvcC){
   return 'hev1.1.6.L120.B0';
  }
  return 'avc1.42401e';
 }catch(er){mlog(`extractCodecString: ${er}`);return null}
},

// === MSE SETUP - PROVEN ===
setUpMSE=async r=>{
 return new Promise((resolve,reject)=>{
  try{
   if(!r.MSE_mSrc)r.MSE_mSrc=new MediaSource();
   if(!r.vid)r.vid=l('video');
   r.vid.src=window.URL.createObjectURL(r.MSE_mSrc);
   r.vid.controls=!!1;
   J(pl,r.vid);
   
   const onSourceOpen=async ()=>{
    try{
     if(!r.codec){mlog('onSourceOpen: no codec');reject(new Error('No codec'));return}
     
     let mime=(r.c||'video/mp4').split(';')[0].trim();
     let codec=`${mime}; codecs="${r.codec}"`;
     mlog(`Testing codec: ${codec}`);
     
     if(!MediaSource.isTypeSupported(codec)){
      mlog(`Codec NOT supported: ${codec}`);
      reject(new Error(`Codec not supported: ${codec}`));
      return
     }
     
     r.srcBfr=r.MSE_mSrc.addSourceBuffer(codec);
     r.srcBfr.mode='sequence';
     mlog('SourceBuffer created');
     
     // Smart buffer trimming on updateend
     r.srcBfr.onupdateend=()=>{
      try{
       if(r.vid.currentTime && r.srcBfr.buffered && r.srcBfr.buffered.length>0){
        const keepStart=Math.max(0, r.vid.currentTime-30);
        for(let i=0;i<r.srcBfr.buffered.length;i++){
         const start=r.srcBfr.buffered.start(i);
         if(start<keepStart){
          try{r.srcBfr.remove(start,keepStart)}catch(er){}
         }
        }
       }
      }catch(er){mlog(`trim: ${er}`)}
      
      if(r.Q.length){
       try{
        let buf=r.Q.shift();
        if(buf)r.srcBfr.appendBuffer(buf);
       }catch(er){mlog(`appendBuffer: ${er.message||er}`)}
      }
      else if(r.mp4Done)tryEndOfStream(r);
     };
     
     r.srcBfr.onerror=err=>{mlog(`SourceBuffer error: ${err.message||err}`)};
     
     processQ(r);
     resolve();
    }catch(er){mlog(`onSourceOpen: ${er.message||er}`);reject(er)}
   };
   
   r.MSE_mSrc.addEventListener('sourceopen',onSourceOpen,{once:!!1});
   
   if(r.MSE_mSrc.readyState==='open'){
    setTimeout(()=>onSourceOpen(),0);
   }
   
   setTimeout(()=>{if(!r.srcBfr)reject(new Error('MediaSource timeout'))},5000);
   
  }catch(er){mlog(`setUpMSE: ${er.message||er}`);reject(er)}
 })
},

tryEndOfStream=r=>{
 try{
  if(r.MSE_mSrc&&r.MSE_mSrc.readyState==='open')r.MSE_mSrc.endOfStream();
  mlog('Stream ended');
 }catch(er){mlog(`endOfStream: ${er}`)}
},

processQ=r=>{
 try{
  if(r.Q.length && r.srcBfr && !r.srcBfr.updating){
   r.srcBfr.appendBuffer(r.Q.shift());
  }
 }catch(er){mlog(`processQ: ${er.message||er}`)}
},

// Binary chunk handler
processChk=(bfr,r)=>{
 try{
  bfr.fileStart=r.bfrInd;
  r.bfrInd=r.mp4.appendBuffer(bfr);
 }catch(er){mlog(`mpAppBfr: ${er}`)}
},

// === WEBSOCKET CONNECTION ===
C=i=>{
  w=new WebSocket(`wss://${sv.value}.paytel.workers.dev`);
  w.binaryType='arraybuffer';
  w.onclose=async i=>{
   c=!!0;
   S();
   for(let r of p.values()){
    if(r.o){
     if(cb.checked&&vdld){
      cngSvr();
      await Rw();
      Z(r.u,r.q,!!0,r.b,r.method);
     }
     else{
      let e=l('button'), ee=l('button');
      e.innerText='Finish Loading';
      e.onclick=a=>{W(sd,'');handleEndOfStream(r.q)};
      J(sd,e);
      ee.innerText='Continue';
      ee.onclick=async a=>{await Rw();W(sd,`<h2>Continuing from ${r.b} of ${r.tl}</h2>`);Z(r.u,r.q,!!0,r.b,r.method)};
      J(sd,ee);
      break;
     }
    }
   }
  };
  w.onopen=i=>{
   c=!!1;
   S();
   if(!pdfdl){ldpdfJS();pdfdl=!!1}
   if(!mp4boxLoaded){ldmp4box().catch(er=>mlog(er))}
  };
  w.onmessage=m=>{
   if(m.data instanceof ArrayBuffer)handleStream(m.data);
   if(typeof m.data==='string')handleResponse(m.data);
  };
  m=null;
},

S=i=>{if(c){bs.style.backgroundColor='#4a9eff'}else{bs.style.backgroundColor='#ee4455'}},

Yy=async t=>{
  if(t)pg.style.opacity=1;
  if(!c)await Rw();
  let x='';
  if(ic(iu.value,'p:')){x=iu.value}
  else if(sw(iu.value,'?')){x=`https://search.aol.com/search?q=${iu.value.slice(1)}`}
  else if(sw(iu.value,'!')){x=`https://search.aol.com/search?q=archive.org ${iu.value.slice(1)}`}
  else{x=`https://${iu.value}`}
  u=new URL(x);
  Z(u,'',t,0,'GET','');
},

// === RESPONSE HANDLING ===
handleResponse=async i=>{
 let f=JSON.parse(i), t=f.t;
 
 if(t==='s'){
  let r=p.get(f.q);
  if(!r)return;
  r.c=f.c;
  r.o=!!0;
  
  if(!r.tl){
   let meta=JSON.parse(f.d);
   r.tl=meta.totalLength;
   r.mb=(r.tl/1048576).toFixed(2);
  }
  
  if(sw(r.c,'video')){
   r.usesMSE=shouldUseMSE(r);
   if(r.usesMSE){
    try{
     await setUpMp4(r);
     mlog(`MSE streaming for ${r.mb}MB`);
    }catch(er){
     mlog(`setUpMp4 init: ${er.message||er}`);
     r.usesMSE=!!0;
     r.vid=l('video');
     r.vid.controls=!!1;
    }
   }
   else{
    r.vid=l('video');
    r.vid.controls=!!1;
   }
   r.v=!!1;
   vdld=!!1;
  }
  
  if(sw(r.c,'audio')){
   r.a=!!1;
   r.vid=l('audio');
   r.vid.controls=!!1;
  }
  
  if(sw(r.c,'image')){
   r.i=!!1;
   r.img=l('img');
  }
  
  if(ic(r.c,'application/pdf')){
   r.pdf=!!1;
  }
 }
 else if(t==='r'){if(ic(f.c,'/html')){H(f.d)}else if(ic(f.c,'/javascript')){JS(f.d)}else if(ic(f.c,'/css')){z(f.d)}else{W(sd,`<pre>${escapeHtml(f.d).slice(0,5000)}</pre>`)}}
 else if(t==='e'){handleEndOfStream(f.q)}
 else if(t==='er'){U(f.d);await Rw()}
 else if(t==='info'){U(f.d)}
},

JS=async i=>{let e=l('script');e.textContent=i;try{J(d.body,e)}catch(er){U(er)}await Wt('',()=>pdfjsLib,0)},

// === BINARY STREAM HANDLING ===
handleStream=async buf=>{
  let x=new Uint8Array(buf),
   reqIdStr=n.decode(x.slice(0,9)).trim(),
   r=p.get(reqIdStr),
   payload=x.slice(9);
  if(!r)return;
  
  r.f.push(payload);
  r.b+=payload.length;
  
  if(r.usesMSE && r.mp4){
   try{
    if(r.Q.length<30){
     let ab=(payload.buffer && (payload.byteOffset||payload.byteOffset===0))?payload.buffer.slice(payload.byteOffset, payload.byteOffset+payload.byteLength):(new Uint8Array(payload)).buffer;
     processChk(ab, r);
    }
   }catch(er){mlog(`mp4.appendBuffer: ${er.message||er}`)}
  }
  
  if(!dld)U(`${((r.b/r.tl)*100).toFixed(2)}% of ${r.mb}MB (queue: ${r.Q.length})`);
},

handleEndOfStream=async q=>{
  const r=p.get(q);
  if(!r)return;
  if(r.mp4)r.mp4Done=!!0;
  r.ou=window.URL.createObjectURL(new Blob(r.f,{type:r.c}));
  if(r.i){
   I(Q('',sd,`img[data-pq="${q}"]`),r);
  }
  else if(r.pdf){
   try{HPDF(r)}catch(er){U(er)}
  }
  else if(r.v){
   if(r.usesMSE){
    tryEndOfStream(r);
    U(`Video ${r.mb}MB loaded`);
   }else{
    Mm(r);
   }
  }
  else{Mm(r)}
},

E=(e,r)=>{if(r.i){e.onload=i=>V(r)}else{e.onended=i=>r.o=!!0}e.onerror=i=>V(r)},

I=(i,r)=>{
  if(r.k){r.img.src=r.ou;E(r.img,r);J(sd,r.img)}
  else if(!r.k&&!i){V(r)}
  else{si--;E(i,r);i.src=r.ou}
},

mediaDiv=r=>{
  r.tmpDiv=l('div');
  r.tmpDiv.style.background='#1a1a1a';
  r.tmpDiv.style.display='flex';
  r.tmpDiv.style.flexDirection='column';
  r.tmpDiv.style.alignItems='center';
  r.tmpDiv.style.justifyContent='center';
  r.tmpDiv.style.margin='3px';
  r.tmpDiv.style.padding='2px';
  r.tmpDiv.style.border='1px solid #444';
  r.tmpDiv.style.borderRadius='4px';
  let x=l('button');
  x.style.margin='5px';
  x.style.borderRadius='5px';
  x.style.fontSize='17px';
  x.onclick=a=>{rm(pl,r.tmpDiv);V(r)};
  x.innerText='❎ Close';
  return x;
},

Mm=r=>{
 let x=mediaDiv(r);
  cb.checked=!!0;
  J(r.tmpDiv,r.vid);
  J(r.tmpDiv,x);
  if(!r.usesMSE)r.vid.src=r.ou;
  r.h=!!1;
  E(r.vid,r);
  J(pl,r.tmpDiv);
},

HPDF=r=>{
 pdfjsLib.getDocument({url: r.ou}).promise.then(pdf=>{
  let pgs=pdf.numPages;
  for(let i=1;i<=pgs;i++){
   pdf.getPage(i).then(pg=>{
    const e=l('canvas');
    const ctx=e.getContext('2d');
    const vp=pg.getViewport({scale:1.5});
    e.height=vp.height;
    e.width=vp.width;
    const rndctx={canvasContext:ctx,viewport:vp};
    pg.render(rndctx).promise.then(()=>{J(sd,e)});
   });
  }
 });
},

So=i=>p.forEach(r=>r.o=!!1),
DL=async(i=100)=>new Promise(x=>setTimeout(x,i)),
Wt=async(f,t,j)=>{if(f)while(t()&&j<55){await DL();j++}},
Rw=async i=>{await Wt(()=>w.close(),()=>c,0);await Wt(C,()=>!c,0)},
Q=(t,i,j)=>{if(t)return i.querySelectorAll(j);return i.querySelector(j)},
K=i=>p.forEach(r=>{if(!r.h&&!r.o)V(r)}),
V=r=>{if(r.ou)window.URL.revokeObjectURL(r.ou);if(r.MSE_mSrc){try{r.MSE_mSrc.endOfStream()}catch(er){}}p.delete(r.q)},

H=i=>{U(`${pg.innerText}...DONE!`);a=0;si=0;dl=!!0;dld=!!0;bs.value='';let x=new DOMParser().parseFromString(i,'text/html');v(x);if(cb.checked)s(x);W(sd,x.body.innerHTML);L();K();fade(pg)},

s=f=>Q(1,f,'style,link[rel="stylesheet"]').forEach(x=>{if(x.tagName.toLowerCase()==='link'){Z(y(x.href),'',!!0,0)}else{let e=l('style');e.textContent=x.textContent;J(sd,e)}}),

O=i=>Math.random().toString(36).substr(2,9),

P=f=>{
 let x=new Date(),t=x.getUTCFullYear(),i=x.getUTCMonth(),j=x.getUTCDate();return btoa(`${t}${i}${j}`);
},

g=j=>Array.from(Q(1,sd,'img')).filter(i=>!i.naturalWidth),

T=i=>i.split('my/learner_')[0].replace('https://learning.paytel.com',''),

y=i=>new window.URL(T(decodeURIComponent(i)),u.origin||'https://archive.org'),

L=f=>{
  Q(1,sd,'a').forEach(l=>l.onclick=e=>{e.preventDefault();u=y(l.href);Su();Yy(!!1)})
  Q(1,tree,'a').forEach(l=>l.onclick=e=>{e.preventDefault();u=y(l.href);Su();Yy(!!1)})
},

z=i=>{
  let e=l('style');
  e.textContent=i,
  J(sd,e)
},

v=f=>Q(1,f,`${!cb.checked?'img,':''}video,embed,iframe,audio`).forEach(x=>{
  if(!ic(x.src,'data:')){
   let vs=x.src,j,h,e;
   if(!vs){j=Q('',x,'source');if(j&&j.src)vs=j.src;}
   if(vs){e=l('a');h=l('h1');e.href=vs;e.innerText=x.tagName;J(h,e);J(x.parentNode,h)}
   x.dataset.pq=O();
   x.dataset.pu=x.src;
   x.src='';
  }
}),

k=async(x,j)=>{for(let i of x){if(!dl){dld=!!1;return}dld=!!0;si++;Z(y(i.dataset.pu),i.dataset.pq,!!0,0);j++;if(!(j%7)){await Wt('',()=>si>0,0);si=0;await Rw()}}if(g().length&&a<5){a++;k(g(),0)}else{a=0;si=0;dl=!!1;dld=!!1;bs.value=''}},

l=t=>d.createElement(t),

Su=i=>{
  i='';
  if(ic(u.protocol,'p:'))i='p:';
  iu.value=i+u.hostname+u.pathname+u.search+u.hash;
  if(ic(iu.value,'RU=https://')){iu.value=iu.value.split('RU=')[1]};
},

Z=(ur,q,t,b,method,oe=null)=>{
 let uu=y(ur.href||ur);
 if(t){
  u=uu;
  if(ic(u.href,'dash.clo')){window.location.href='https://dash.cloudflare.com';return}
  else if(ic(u.href,'ai.clo')){window.location.href='https://playground.ai.cloudflare.com';return}
  if(h.length){if(h[h.length-1].href!==u.href)h.push(u)}else{h.push(u)}
  Su();W(sd,`<h2>${u}</h2>`);
 }
 if(!q)q=O();
 if(!method)method='GET';
 if(!p.has(q))p.set(q,{q:q,u:uu,f:[],k:t,b:b,vid:l('video'),img:null,mp4:null,codec:null,trackId:null,MSE_mSrc:null,srcBfr:null,bfrInd:0,Q:[],mp4Done:!!0,usesMSE:!!0,processing:!!1,method:method,tl:0,mb:'',c:'',o:!!0});
 let msg={u:uu.toString(),q:q,au:P(),os:b,method:method};
 if(oe!==null)msg.oe=oe;
 if(method!=='GET'){msg.body=''}
 w.send(JSON.stringify(msg));
 if(t)U(q);
},

mute=i=>Q(1,pl,'video,audio').forEach(x=>{x.muted=i;if(i){x.pause()}else{x.play()}}),

escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'),

extractFormData=frm=>{let fd=new FormData(frm),obj={};fd.forEach((v,k)=>{obj[k]=(obj[k]?Array.isArray(obj[k])?[...obj[k],v]:[obj[k],v]:v)});return obj},

addFormIntercept=el=>{
 if(el.tagName==='FORM'){
  el.onsubmit=async e=>{
   e.preventDefault();
   let method=(el.method||'GET').toUpperCase();
   let action=el.getAttribute('action');
   if(!action)action=u.pathname+u.search;
   u=new window.URL(action,u.origin);
   let body='';
   if(method!=='GET'){
    let fd=extractFormData(el);
    if(el.enctype==='application/json'){body=JSON.stringify(fd)}else{let sp=new URLSearchParams();for(let k in fd){sp.append(k,fd[k])};body=sp.toString()}
   }else{
    let fd=extractFormData(el);
    let sp=new URLSearchParams();
    for(let k in fd){sp.append(k,fd[k])};
    u=new window.URL(u.href.split('?')[0]+'?'+sp.toString());
   }
   Su();
   if(method==='GET'){Yy(!!1)}else{Z(u,'',!!1,0,method)}
  };
 }
 Q(1,el,'form').forEach(addFormIntercept);
},

mlog=er=>{let dd=new Date();let cur=(localStorage.getItem('error')||'')+`\n${dd}-${JSON.stringify(er).slice(0,200)}`;localStorage.setItem('error',cur.slice(-10000))},

fade=el=>{
 if(vdld||isFading)return;
  pb.style.width='0%';
  isFading=!!1;
  var op=1;
  var fps=1000/60;
  function decrease(){
   op-=1/60;
   el.style.opacity=op;
   el.style.display=op<=0?'none':'block';
   if(op>0){setTimeout(decrease, fps)}else{isFading=!!0}
  }
  decrease();
};

// Events
iu.onkeyup=i=>{if(i.key==='Enter'){Yy(!!1)}};
iu.ondblclick=()=>fade(pg);
msgs.ondblclick=()=>fade(pg);
pg.ondblclick=()=>fade(pg);
bck.onclick=async i=>{if(h.length>1){if(!c)await Rw();h.pop();u=h[h.length-1];Su();Yy(!!1)}};
rf.onclick=i=>{fade(pg);w.close();atmps=1;cngSvr();C()};
bs.onclick=i=>{dl=!dl;if(dl){bs.value='↓';k(g(),0)}else{bs.value=''}};
sv.ondblclick=i=>{sv.readOnly=!sv.readOnly};
sv.onkeyup=i=>{if(i.key==='Enter'){sv.readOnly=!!1;C()}};
hide.onclick=async i=>{let el=ge('dimmsg');
 overlay.style.display='flex';dimmed=!!1;el.style.opacity=1;el.style.display='block';await DL(1500);fade(el);
};
d.body.ondblclick=i=>{
if(dimmed){overlay.style.display='none';dimmed=!!1}
};
Q('',d,'meta[name="viewport"]').setAttribute('content','user-scalable=yes');
svrInd=Math.floor(Math.random()*svrs.length);
const st=l('style');
st.textContent=cssStyles;
J(d.head,st);

// Sidebar toggle
ge('btnOpn').onclick=()=>sidebar.classList.add('open');
ge('btnCls').onclick=()=>sidebar.classList.remove('open');

// Initial setup
ldpdfJS();
d.addEventListener('click',(ev)=>{
const sbar=Q('',d,'.sidebar');
const btnO=ge('btnOpn');
if(ev.target===btnO)return;
if(!sbar.contains(ev.target)&&sbar.classList.contains('open')){sbar.classList.remove('open')}
});
cngSvr();

U('Patience is a virtue...').then(C());
