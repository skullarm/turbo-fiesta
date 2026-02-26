//**!!FILE MUST BE EXECUTABLE VIA JAVASCRIPTS'S eval() FUNCTION. I AM AWARE OF CONCERNS WITH IT.!!**

// Globals
let d=document,w,u,h=[],n=new TextDecoder(),p=new Map(),a=0,si=0,dl=!!0,dld=!!0,c=!!0,svrInd=0,atmps=4,vdld=!!0,mpbU='https://cdn.jsdelivr.net/npm/mp4box@latest/dist/mp4box.all.min.js',
ge=i=>d.getElementById(i),pdfdl=!!0,getwkr=!!0,mp4boxLoaded=!!0,mp4box,isFading=!!0,firstLoad=!!1,cnclFade=!!0,showBase='https://archive.org/download/',archiveBase='https://archive.org/details/',pdfjsLib=null,dimmed=!!0;

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

// Constants
const svrs=['osric','wit','bilboes','phone','call','text','kazak','argos','sv1','skip','trace','alice','harley','turbo'];
const chunkSize=500*1024*1024,segOptions={nbSamples:250},MP4_MSE_THRESHOLD=385*1024*1024,SEG_QUEUE_LIMIT=30;
const mediaExts = ['.mp4', '.webm', '.ogv'];

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
<!--<div id='sidebar-options'>
<p/>
<input type='checkbox' checked id='dm'/><label for='dm'>Dark Mode?</label>
 </div>-->
<div id='sidebar-treeview'>LOADING...
</div>
</div>
`;

const originalURL=globalThis.URL;
// Element refs
let bck=ge('bck'),iu=ge('iu'),rf=ge('rf'),sv=ge('sv'),cb=ge('cb'),hide=ge('hide'),pg=ge('pg'),overlay=ge('overlay'),bs=ge('bs'),pl=ge('pl'),ct=ge('ct'),msgs=ge('msgs'),pb=ge('pb'),sidebar=ge('sidebar'),tree=ge('sidebar-treeview');

// Shadow DOM
let sd=ct.attachShadow({mode:'open'});
sd.innerHTML='<style>:host{all:initial}*{box-sizing:border-box}</style>';

let toggleInvert=root=>{
 let el=root.getElementById('cvspdf');
 if(el.style.filter.includes('invert')){
  el.style.filter='none';
 }else{
   el.style.filter='invert(1) grayscale(20%)';
 }
};
let pdfHTMLStr=`
<DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PDF Viewer</title>
</head>
<body>
<div style='background-color:#2a2a2a'>
<span style='font-size:17'>Page <input type="number"  id="pg" min="1" value=1 style="width:4%; font-size:17"> of <span id="pgcnt" style="font-size:17">-1</span></span>   <button id='tgl'>Mode</button>
</div>
<canvas id="cvspdf" style="filter: invert(1) grayscale(20%)"></canvas>
</body>
`;
// Utils
let U=i=>new Promise((res)=>{ pg.textContent=i;res(pg);}),
ic=(e,i)=>e.includes(i),
sw=(e,i)=>e.startsWith(i),
rm=(e,i)=>e.removeChild(i),
J=(e,i)=>e.appendChild(i),
W=(e,i)=>e.innerHTML=i,
getBuffer=ck=>{
 if(ck instanceof ArrayBuffer){
 return ck;
 }else if(ck instanceof Uint8Array){
  return ck.buffer(ck.byteOffSet,ck.byteOffSet+ck.byteLength);
 }
 return new Uint8Array(ck).buffer;
},
loadScript=(url,isModule=false)=>{
 return new Promise((res,rej)=>{
  const sc=l('script');
   if(isModule)sc.type='module';
   sc.src=url;
   
   sc.onload=()=>res(window.pdfjsLib);
   sc.onerror=er=>rej(W(pl,`Failed to load ${url}`));
   J(d.head,sc);
 });
},

prevPage=r=>{
 r.pageNum--;
 queueRenderPage(r);
},
nextPage=r=>{
 r.pageNum++;
 queueRenderPage(r);
},
setUpPDF=r=>{
r.scale=1.5;r.touchStartX=0;r.touchEndX=0;r.swipeThresh=50;r.pdfDoc=null;r.pageNum=1;r.isRendering=!!0;r.pending=null;r.html=new DOMParser().parseFromString(pdfHTMLStr,'text/html');W(sd,r.html.body.innerHTML);r.canvas=sd.getElementById('cvspdf');r.ctx=r.canvas.getContext('2d');r.pgInput=sd.getElementById('pg');r.cntSpan=sd.getElementById('pgcnt');
r.canvas.addEventListener('dblclick',e=>{
 e.stopPropagation();
 const {width,height,left,top}=r.canvas.getBoundingClientRect();
 const x=e.clientX-left;
 const y=e.clientY-top;
 if(x<width/3){prevPage(r);return;}
 if(x>(width*2)/3){nextPage(r);return;}
 if(y<height/3){r.scale+=0.2;}
 else if(y>(height*2)/3){r.scale=Math.max(0.3,r.scale-0.2)}
 else{r.scale=1.5}
 queueRenderPage(r);
});
r.pgInput.onkeydown=e=>{
 if(e.key==='Enter'){
  e.preventDefault();
  let num=parseInt(r.pgInput.value);
  
  if(!isNaN(num) && num>=1 && num<=r.pdfDoc.numPages){
   r.pageNum=num;
   queueRenderPage(r);
  }
 }
};
let el=sd.getElementById('tgl').onclick=()=>toggleInvert(sd);
},

// Server change
cngSvr=i=>{
  const svr=svrs[svrInd];
  sv.value=svr;
  DL();
  atmps--;
  if(atmps<=0){ svrInd=(svrInd+1)%svrs.length;atmps=4;}
},
//get shows json string
getShows=()=>{
let ws=new WebSocket('wss://mitre.paytel.workers.dev');
ws.onopen=()=>{
 ws.send(JSON.stringify({u:'CMD_KV_GET?key=shows',au:P()}));
};
ws.onmessage=m=>{
 ws.close();ws='';
let showData=JSON.parse(m.data).d;
 try{treeSU(JSON.parse(showData))}catch(er){W(pl,er)};m='';
}
},

//set up tree for media content
treeSU=(data)=>{
  if(!data)return;
  const genres=Object.keys(data).sort();
  const sorted={};
  for(const genre of genres){
   const shows=data[genre].sort((a,b)=>{
     const titCmp= a.title.localeCompare(b.title);
    if(titCmp!==0)return titCmp;
    return a.ssn-b.ssn;
   });
   sorted[genre]=shows;
  }
   let ht=`<ul class='col'>`;
   for(const genre in sorted){
     ht+=`<li>${genre}`;
     ht+='<ul>';
     for(const show of sorted[genre]) {
       ht+=`<li>${show.title} (S${show.ssn} | ${show.lang} | ${show.src})`;
       ht+='<ul>';
      for(const ep of show.episodes){
      if(!show.isArchive){ ht+=`<li><a href="${showBase+show.path + ep.file+show.format}">Episode ${ep.num}</a></li>`;}
      else{ht+=`<li><a href="${archiveBase+show.path+ep.file}">Archive ${ep.num}</a></li>`;}
      }
    ht+='</ul></li>';
    }
   ht+='</ul></li>';
 }
 ht+='</ul>';
 W(tree,ht);
 Q(1,tree,'.col ul').forEach(itm=>{
  let tog=l('div');
  tog.innerHTML=itm.previousSibling.textContent;
  tog.className='toggle';
  tog.onclick=()=>tog.classList.toggle('show');
  itm.parentElement.removeChild(itm.previousSibling);
  itm.parentElement.insertBefore(tog,itm);
 });L();
},

// Set input URL
Su=i=>{
  i='';
  if(ic(u.protocol,'p:'))i='http://';
  iu.value=i+u.hostname+u.pathname+u.search+u.hash;
  if(ic(iu.value,'RU=https://')){let val=iu.value;val=val.split('RU=https://')[1].split('/RK=')[0];iu.value=val};
},

ldJSZip=()=>{
 let sc=l('script');
 sc.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
 sc.onload=()=>{ldEpubJS()};
 J(d.head,sc);
},

ldEpubJS=()=>{
 let sc=l('script');
 sc.src='https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.2.15/epub.min.js';
 J(d. head,sc);
},

// Load pdf.js via proxy
ldpdfJS=async()=>{
  pdfjsLib=await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs',!!1);
   pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs';
},

// Load mp4box via proxy
ldmp4box=async i=>{
  if(mp4boxLoaded) return;
  try{
    let ws=new WebSocket('wss://mitre.paytel.workers.dev');
    ws.onopen=()=>{
      ws.send(JSON.stringify({u:'CMD_KV_GET?key=mp4box',au:P()}));
    };
    ws.onmessage=async m=>{
      ws.close();ws='';
      const b=new Blob([JSON.parse(m.data).d],{type:'application/javascript'});
      const url=URL.createObjectURL(b);
      const mod=await import(url);
      mp4box=mod;
      mp4boxLoaded=!!1;
      mlog('mp4box loaded');
    };
  }catch(er){mlog(`ldmp4box: ${er.message||er}`)}
},

// MSE threshold check
shouldUseMSE=r=>!!0,//r.tl>MP4_MSE_THRESHOLD,

// Media detection
isMedia=u=>mediaExts.some(ext=>u.pathname.toLowerCase().endsWith(ext)),

// WebSocket setup
C=i=>{
  w=new WebSocket(`wss://${sv.value}.paytel.workers.dev`);
  w.binaryType='arraybuffer';
  w.onclose=async i=>{
    c=!!0;
    S();
    for(let r of p.values()){
      if(r.o && !r.i && !r.overThreshold){
        if(cb.checked&&vdld){cngSvr();await Rw();Z(r.u,r.q,!!0,r.chunking ? r.offset : r.b,r.method,r.chunking ? Math.min((r.chunking ? r.offset : r.b) + chunkSize -1, r.tl -1) : null)}
        else{vdld=!!0;
          let e=l('button'),ee=l('button');
          e.innerText='Play Partial?';
          e.style.margin='4px';
          e.onclick=a=>{vdld=!!1;W(sd,'');handleEndOfStream(r.q)};
          J(sd,e);
          ee.innerText='Continue Downloading?';
          ee.onclick=async a=>{await Rw();W(sd,`<h2>Continuing from ${r.b} of ${r.tl}</h2>`);Z(r.u,r.q,!!0,r.b,r.method,r.chunking ? r.b + chunkSize -1 : null)};
          J(sd,ee);
          break;
        }
      }
    }
  };
  w.onopen=i=>{
   c=!!1;S();
   if(firstLoad)joke()
  };
  w.onmessage=m=>{
    if(m.data instanceof ArrayBuffer)handleStream(m.data);
    if(typeof m.data==='string')handleResponse(m.data);
  };
  m=null;
},

/* MP4BOX + MSE CORE
   setUpMp4: init mp4box, callbacks, MSE
   setUpMSE: create MediaSource, add buffers
   processChk: append to mp4box
   drainSB: append from queue
   trimSourceBuffer: remove old ranges
   endMSEStream: end when ready
*/
setUpMp4=async r=> {
  if (!mp4boxLoaded) await ldmp4box();
  r.mp4boxFile= mp4box.createFile();
  r.offset = 0;
  r.pendingSegments = [];
  r.streamEnded = false;
  r.mp4boxFile.onError = e => mlog(`mp4box error: ${e}`);
  r.mp4boxFile.onReady = async info => {
    mlog('mp4box onReady fired – tracks: ' + info.tracks.length);
    r.mp4Info = info;
    await setUpMSE(r, info);
  for(const track of info.tracks){
      r.mp4.setSegmentOptions(track.id, track.type==='video'?'vid':'aud', segOptions);
   }
    const initSegs = r.mp4boxFile.initializeSegmentation();
      const sb = r.sourceBuffer;
      if (sb && !sb.updating) {
      //  sb.appendBuffer(initSegs.buffer); HOW DO I APPEND THE INITSEGS buffer?? The documentation says the initializeSegmentation function returns an array of tracks, each with their own buffer, but this seems to no longer be true. Instead, an object is returned with a single buffer. Docs seem to be outdated?? Can you check mp4box.js's source code?
      }
   
    for (const seg of r.pendingSegments) {
        drainSB(r, seg.trackId);
    }
    r.mp4boxFile.start();
  };
  r.mp4boxFile.onSegment = (trackId, user, buffer, sampleNum, last) => {
    if (!r.sourceBuffer) {
      r.pendingSegments.push(buffer);
      return;
    }

      drainSB(r, trackId);

    if (last) {
      endMSEStream(r);
    }
  };
},
setUpMSE=(r, info)=> {
  return new Promise((resolve, reject) => {
    r.mse = new MediaSource();
    r.vid.src = window.URL.createObjectURL(r.mse);
    r.vid.controls = true;
    r.vid.autoplay = true;
    r.vid.onerror = (e) => mlog(`Video error: ${e.message||e}`);
    pl.appendChild(r.vid);
    r.mse.addEventListener('sourceopen', () => {
      try {
        r.sourceBuffer='';
         const vidTrack=info.videoTracks?.[0];
         const audTrack=info.audioTracks?.[0];
         let codecParts=[];
        codecParts.push(vidTrack.codec);
        if(audTrack)codecParts.push(audTrack.codec);
        const codec=codecParts.join(', ');
          const mime = `video/mp4; codecs="${codec}"`;
          if (!MediaSource.isTypeSupported(mime)) {
            U(`Unsupported MIME: ${mime}`);
            return;
          }
          const sb = r.mse.addSourceBuffer(mime);
          sb.mode = 'segment';
          sb.addEventListener('updateend', () => {
            drainSB(r, track.id);
            trimSourceBuffer(sb, r.vid);
          });
          r.sourceBuffer = sb;
       resolve();
      } catch (e) {
        reject(e);
      }
    }, { once: true });
  });
},
processChk=(r, u8)=> {
  if (r.offset === undefined) r.offset = 0;
  const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  ab.fileStart = r.offset;
  const nextOffset = r.mp4boxFile.appendBuffer(ab);
  r.offset = nextOffset;
},
drainSB=(r, trackId)=> {
  const sb = r.sourceBuffer;
   const q=r.pendingSegments;
  if (!sb || sb.updating || !q.length) return;
  const chunk=q.shift();
  sb.appendBuffer(chunk);
},
trimSourceBuffer=(sb, vid)=> {
  if (sb.buffered.length > 0) {
    const start = sb.buffered.start(0);
    const end = sb.buffered.end(sb.buffered.length - 1);
    if (vid.currentTime > 60 && start < vid.currentTime - 60) {
      sb.remove(start, vid.currentTime - 30);
      mlog('Trimmed SourceBuffer');
    }
  }
},
endMSEStream=(r)=> {
  const tryEnd = () => {
    const busy = r.sourceBuffer.updating || r.pendingSegments.length > 0;
    if (!busy && r.mse.readyState === 'open') {
      r.mse.endOfStream();
    }
  };
  r.sourceBuffer.addEventListener('updateend', tryEnd, { once: true })
  tryEnd();
},

// Connection status color
S=i=>{if(c){bs.style.backgroundColor='#4a9eff'}else{bs.style.backgroundColor='#ee4455'}},

// Proxy URL (handle specials, detect media for chunk)
Yy=async t=>{
  if(t)pg.style.opacity=1;
  if(!c)await Rw();
  let x='';
  if(ic(iu.value,'p:')){
    x=iu.value
  }else if(sw(iu.value,'?')){
    x=`https://search.aol.com/search?q=${iu.value.slice(1)}`
  }else if(sw(iu.value,'!')){
    x=`https://search.aol.com/search?q=archive.org ${iu.value.slice(1)}`
  }else if(sw(iu.value,'anysex.com')&&ic(iu.value,'/?br=')){
    x='https://'+iu.value.split('?br=')[0]+'?br=10000';
  }else if(sw(iu.value,'xcafe.com')&&ic(iu.value,'/?download=')){
    x='https://'+iu.value.split('?download=')[0]+'?br=10000';
  }else{
    x=`https://${iu.value}`
  }
  u=new URL(x);
 let method = 'GET';
 /* let oe = null;
  let q = O();
  let r = {q:q, u:u, f:[], k:t, b:0, vid:l('video'), img:null, mp4:null, codec:null, trackId:null, usesMSE:false, method:method, tl:0, mb:'', c:'', o:!!1, chunking:false};
  p.set(q, r);
  if(isMedia(u)){
    r.chunking = !!1;
    oe = chunkSize - 1;
  }*/
  Z(u,'',t,0,method,'');
},

// Exec JS response
JS=async i=>{let e=l('script');e.textContent=i;try{J(document.body,e)}catch(er){U(er)}await Wt('',()=>pdfjsLib,0);if(getwkr){let src=window.URL.createObjectURL(new Blob([i],{type:'application/javascript'}));try{pdfjsLib.GlobalWorkerOptions.workerSrc=src;getwkr=!!0}catch(er){U(er)}}},

// Handle string msgs
handleResponse=async i=>{
  let f=JSON.parse(i),t=f.t;
  if(t==='s'){
    let r=p.get(f.q);
    if(!r)return;
    r.c=f.c;r.o=!!1;
    let meta=JSON.parse(f.d);
    if(!r.tl)r.tl=meta.totalLength||0;
    r.mb=(r.tl/1048576).toFixed(2);
    if(sw(r.c,'video')){
      r.v=!!1;vdld=!!1;
    }
    if(sw(r.c,'audio')){r.a=!!1;}
    if(sw(r.c,'image')){r.i=!!1;r.img=l('img')}
    if(ic(r.c,'application/pdf')){r.pdf=!!1;/*setUpPDF(r)*/}
    if(ic(r.c,'epub'))r.epub=!!1;

    r.usesMSE=shouldUseMSE(r);

    if(r.v && !r.usesMSE){r.vid=l('video');r.vid.controls=!!1;r.vid.addEventListener('canplaythrough',loadDone)}
    if(r.a && !r.usesMSE){r.vid=l('video');r.vid.controls=!!1;r.vid.addEventListener('canplaythrough',loadDone)}
  }
  else if(t==='r'){if(ic(f.c,'/html')){H(f.d)}else if(ic(f.c,'/javascript')){JS(f.d)}else if(ic(f.c,'/css')){z(f.d)}else{W(sd,`<pre>${escapeHtml(f.d)}</pre>`)}}
  else if(t==='e'){handleEndOfStream(f.q)}
  else if(t==='er'){U(f.d);await Rw()}
  else if(t==='info'){U(f.d)}
},
loadDone=r=>{
 r.target.removeEventListener('canplaythrough',loadDone);
 U(`${pg.innerText}..DONE!`);
 fade(pg);
},
// Handle binary chunks
handleStream=async buf=>{
  let x=new Uint8Array(buf),
   reqIdBytes = 9,
   reqIdStr = n.decode(x.subarray(0, reqIdBytes)).trim(),
   r = p.get(reqIdStr),
   payload = x.subarray(reqIdBytes);
   if(!r) return;
   r.f.push(payload);
   r.b += payload.length;
   let prct=((r.b/r.tl)*100).toFixed(2);
   if(!dld&&prct<=100){
    U(`Download Progress: ${(r.b/1048576).toFixed(2)} of ${r.mb} mb (${prct}%)`);
    pb.style.width=`${prct}%`;
  }
 if(r.b>MP4_MSE_THRESHOLD){
  r.overThreshold=!!1;
  w.close();
  handleEndOfStream(r.q);
//  fade(pg);
 }
},

// End stream/chunk
handleEndOfStream=async q=>{
  const r = p.get(q);
  if (!r) return;
  if (r.usesMSE) {
    r.streamEnded = true;
    if (r.mp4boxFile) {
      try {
        r.mp4boxFileflush();
        endMSEStream(r);
      } catch (e) {
        mlog(`flush failed: ${e}`);
      }
    }
    return;
  }else{
    r.ou=window.URL.createObjectURL(new Blob(r.f,{type:r.c}));
    if(r.i){I(Q('',sd,`img[data-pq="${q}"]`),r)}
    else if(r.pdf){r.h=!!1;setUpPDF(r);HPDF(r);}
    else if(r.epub){try{var book=ePub(r.ou).ready.then(function(){ var rend=book.renderTo("pl",{method:"default",width:"100%",height:"100%"}); var dis=rend.display()} );}catch(er){W(pl,er)}}
    else if(r.v||r.a){pb.style.width='0%';await U('Loading Media...');await DL(200);Mm(r);vdld=!!0;}
  }
/*  if(r.chunking && (r.usesMSE ? r.offset : r.b) < r.tl){
    mlog('Fetching next chunk');
    let next_os = r.usesMSE ? r.offset : r.b;
    let next_oe = Math.min(next_os + chunkSize -1, r.tl -1);
    Z(r.u, r.q, false, next_os, r.method, next_oe);
  }*/
},

// Media events
E=(e,r)=>{if(r.i){ e.onload=i=>V(r) }else{ e.onended=i=>r.o=!!0}e.onerror=i=>V(r)},

// Insert image
I=(i,r)=>{
  if(r.k){
    r.img.src=r.ou;
    E(r.img,r);
   if(firstLoad){
     J(sd,r.img);firstLoad=!!0;iu.value='';
   }else{
     let x=mediaDiv(r);
     J(r.tmpDiv,r.img);
     J(r.tmpDiv,x);
     J(pl,r.tmpDiv);
   }
    fade(pg)
   }else if(!r.k&&!i){V(r)
   }else{
    si--;E(i,r);i.src=r.ou;
    if(si<=0)dld=!!0
   }
},

// Media player div
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
  x.onclick=a=>{rm(pl,r.tmpDiv);V(r);};
  x.innerText='❎ Close';
  return x;
},
Mm=r=>{
 let x=mediaDiv(r);
  cb.checked=!!0;
  J(r.tmpDiv,r.vid);
  J(r.tmpDiv,x);
  if (!r.usesMSE) r.vid.src=r.ou;
  r.h=!!1;
  E(r.vid,r);
  J(pl,r.tmpDiv);
},

queueRenderPage=r=>{
 if(r.isRendering)r.pending=r.pageNum;
 else renderPage(r);
},

renderPage=r=>{
 r.isRendering=!!1;
 r.pdfDoc.getPage(r.pageNum).then(pg=>{
   const scale=r.scale;
   const vp=pg.getViewport({scale: scale});
   r.canvas.height=vp.height;
   r.canvas.width=vp.width;
   const renderContext={canvasContext: r.ctx, viewport: vp};
   pg.render(renderContext).promise.then(()=>{
    r.isRendering=!!0;
    r.pgInput.value=r.pageNum;
   });
 });
},

// Render PDF
HPDF=r=>{
pdfjsLib.getDocument({url: r.ou}).promise.then(pdf=>{
 r.pdfDoc=pdf;
 r.cntSpan.textContent=r.pdfDoc.numPages;
 if(r.pagePending!==null){
   renderPage(r);
   r.pagePending=null;
 }fade(pg);
 }).catch(err=>{W(pl,err.message||err)});
},

// Set all open tofalse
So=i=>p.forEach(r=>r.o=!!0),

// Delay
DL=async(i=100)=>new Promise(x=>setTimeout(x,i)),

// Wait loop
Wt=async(f,t,j)=>{
  if(f)f();while(t()&&j<55){await DL();j++}
},

// Reconnect
Rw=async i=>{
  await Wt(()=>w.close(),()=>c,0);await Wt(C,()=>!c,0)
},

// Query selector
Q=(t,i,j)=>{if(t)return i.querySelectorAll(j);return i.querySelector(j)},

// Revoke non-hold/open
K=i=>p.forEach(r=>{ if(!r.h&&!r.o)V(r) }),

// Cleanup request
V=r=>{if(r.ou)window.URL.revokeObjectURL(r.ou);if(r.mse){try{r.mse.endOfStream()}catch(er){}}p.delete(r.q)},

// Handle HTML
H=i=>{U(`${pg.innerText}...DONE!`);a=0;si=0;dl=!!0;dld=!!0;bs.value='';let x=new DOMParser().parseFromString(i,'text/html');v(x);if(cb.checked)s(x);W(sd,x.body.innerHTML);L();Q(1,sd,'form').forEach(x=>addFormIntercept(x));fade(pg)},

// Inject styles
s=f=>Q(1,f,'style,link[rel="stylesheet"]').forEach(x=>{if(x.tagName.toLowerCase()==='link'){Z(y(x.href),'',!!0,0)}else{let e=l('style');e.textContent=x.textContent;J(sd,e)}}),

// Random ID
O=i=>Math.random().toString(36).substr(2,9),

// Auth token
P=f=>{
  let x=new Date(),t=x.getUTCFullYear(),i=x.getUTCMonth(),j=x.getUTCDate();return btoa(`${t}${i}${j}`);
},

// Unloaded images
g=j=>Array.from(Q(1,sd,'img')).filter(i=>!i.naturalWidth),

// URL transform
T=i=>i.split('my/learner_')[0].replace('https://learning.paytel.com',''),

// Create URL
y=i=>new window.URL(T(decodeURIComponent(i)),u.origin || 'https://archive.org'),

// Intercept links
L=f=>{
  Q(1,sd,'a').forEach(l=>l.onclick=e=>{e.preventDefault();u=y(l.href);Su();Yy(!!1)})
  Q(1,tree,'a').forEach(l=>l.onclick=e=>{e.preventDefault();sidebar.classList.remove('open');u=y(l.href);Su();if(isMedia(u))cb.checked=!!1;else cb.checked=!!0;Yy()})
},

// Inject CSS
z=i=>{
  let e=l('style');
  e.textContent=i,
  J(sd,e)
},

// Prep media in HTML
v=f=>Q(1,f,`${!cb.checked ? 'img,' : ''}video,embed,iframe,audio`).forEach(x=>{
  if(!ic(x.src,'data:')){
    let vs=x.src,j,h,e;
    if(!vs){ j=Q('',x,'source');if(j&&j.src)vs=j.src; }
    if(vs){e=l('a');h=l('h1');e.href=vs;e.innerText=x.tagName;J(h,e);J(x.parentNode,h) }
    x.dataset.pq=O();
    x.dataset.pu=x.src;
    x.src='';
  }
}),

// Batch images
k=async(x,j)=>{for(let i of x){if(!dl){return}dld=!!1;si++;Z(y(i.dataset.pu),i.dataset.pq,!!0,0);j++;if(!(j%7)){await Wt('',()=>si>0,0);si=0;await Rw()}}if(g().length&&a<5){a++;k(g(),0)}else{a=0;si=0;dl=!!0;bs.value=''}},

// Create elem
l=t=>d.createElement(t),

// Send proxy req
Z=(ur,q,t,b,method,oe=null)=>{
  let uu=y(ur.href||ur);
  if(t){u=uu;if(ic(u.href,'dash.clo')){window.location.href='https://dash.cloudflare.com';return}else if(ic(u.href,'ai.clo')){window.location.href='https://playground.ai.cloudflare.com';return}
  if(h.length){if(h[h.length-1].href!==u.href)h.push(u)}else{h.push(u)}
  Su();W(sd,`<h2>${u}</h2>`)
  }
  if(!q)q=O();
  if(!method)method='GET';
  if(!p.has(q))p.set(q,{q:q,u:uu,f:[],k:t,b:b,vid:l('video'),img:null,mp4boxFile:null,codec:null,trackId:null,usesMSE:!!0,method:method,firstMessage:true,isMedia:isMedia(uu),chunking:false});
 //  let key='clientCode';
 //   let val=encodeURIComponent(localStorage.getItem('a'))
 //  uu=`CMD_KV_PUT?key=${key}&val=${val}`;
  if(p.get(q).isMedia)setUpMp4();
  let msg={u:uu.toString(),q:q,au:P(),os:b,method:method};
  if(oe!==null)msg.oe=oe;
  if(method!=='GET'){msg.body=''}
  w.send(JSON.stringify(msg));
  if(t)U(`Proxying ${u} | Request Id: ${q}..`);
},

// Mute/pause
mute=i=>Q(1,pl,'video,audio').forEach(x=>{x.muted=i;if(i){x.pause()}else{x.play()}}),

// Sanitize HTML
escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'),

// Form data to obj
extractFormData=frm=>{let fd=new FormData(frm),obj={};fd.forEach((v,k)=>{obj[k]=(obj[k]?Array.isArray(obj[k])?[...obj[k],v]:[obj[k],v]:v)});return obj},

// Intercept forms
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
        if(el.enctype==='application/json'){body=JSON.stringify(fd)}else{
          let sp=new URLSearchParams();for(let k in fd){sp.append(k,fd[k])};body=sp.toString()
        }
      }else{
        let fd=extractFormData(el);
        let sp=new URLSearchParams();for(let k in fd){sp.append(k,fd[k])};
        u=new window.URL(u.href.split('?')[0]+'?'+sp.toString());
      }
      Su();
      if(method==='GET'){Yy(!!1)}else{Z(u,'',!!1,0,method)}
    }
  }
},

// Log error
mlog=er=>{let dd=new Date();let cur=(localStorage.getItem('error')||'')+`\n${dd}-${JSON.stringify(er).slice(0,200)}`;localStorage.setItem('error',cur.slice(-10000))},

// Fade elem
fade=el=>{
 if(vdld||isFading)return;
  pb.style.width='0%';
  isFading=!!1;
  var op=1;
  var fps=1000/60;
  function decrease(){
    op-=0.01;
    if(op<=0){
     if(el.id==='pg'){ So();K();U('');
      el.style.opacity=1;}else{el.style.display='none'}
     isFading=!!0;
      return !!1;
    }
    el.style.opacity=op;
    if(window.requestAnimationFrame!=='undefined')window.requestAnimationFrame(decrease);
    else setTimeout(decrease,fps);
  }
  decrease();
};
// Events
iu.onkeyup=i=>{if(i.key==='Enter'){Yy(!!1);pb.style.width='0%'}};
iu.ondblclick=()=>fade(pg);
msgs.ondblclick=()=>fade(pg);
pg.ondblclick=()=>fade(pg);
bck.onclick=async i=>{if(h.length>1){for(let r of p.values()){if(r.pdf)r.h=!!0} if(!c)await Rw();h.pop();u=h[h.length-1];Su();Yy(!!1) }};
rf.onclick=i=>{fade(pg);w.close();atmps=1;cngSvr();C()};
bs.onclick=i=>{dl=!dl;if(dl){dld=!!1;bs.value='↓';k(g(),0)}else{dld=!!0;bs.value=''}};
sv.ondblclick=i=>{sv.readOnly=!sv.readOnly};
sv.onkeyup=i=>{if(i.key==='Enter'){sv.readOnly=!!1;C()}};
hide.onclick=async i=>{let el=ge('dimmsg');
 overlay.style.display='flex';dimmed=!!1;el.style.opacity=1;el.style.display='block';await DL(1500);fade(el);
};
d.body.ondblclick=i=>{
if(dimmed){if(i.target.id==='iu' || i.target.id==='sv')return; overlay.style.display='none';dimmed=!!0}
};
Q('',d,'meta[name="viewport"]').setAttribute('content','user-scalable=yes');
svrInd=Math.floor(Math.random()*svrs.length);
//ldmp4box().catch(er=>mlog(er));
const st=l('style');
st.textContent=cssStyles;
J(d.head,st);

// Sidebar toggle
ge('btnOpn').onclick = () => sidebar.classList.add('open');
ge('btnCls').onclick = () => sidebar.classList.remove('open');

// Initial setup
getShows();
//ldJSZip();
ldpdfJS();
d.addEventListener('click',(ev)=>{
const sbar=Q('',d,'.sidebar');
const btnO=ge('btnOpn');
if(ev.target===btnO)return;
if(!sbar.contains(ev.target)&&sbar.classList.contains('open')){
sbar.classList.remove('open');
}
});
cngSvr();
//sv.value='offal';

let joke=()=>{
//cb.checked=!!1;
//et x='mindfulnessexercises.com/wp-content/uploads/2024/02/Seneca-Quotes.mp3';
 let x='burningforsuccess.com/wp-content/uploads/2024/07/Peter-Griffin.jpg';
//let quote=`Enjoy a minute or two audio of quotes from the Stoic <a href='https://en.wikipedia.org/wiki/Seneca_the_Younger'>Seneca the Younger</a>`;
  let quote=`You can download .pdf books/docs now from archive.org or whereever you find them. Just make sure to tap the download link that says .pdf on archive.<p>To turn pages: Double-tap right side of a document for Next page; the opposite for Previous page.<p>Zooming: Double-tap the upper-middle of the page to zoom in; the lower-middle to zoom out.<p>Example: <a href='https://bop.utah.gov/wp-content/uploads/Parole-Notifications-and-Conditions_Dec-2025.pdf'>Utah Parole Conditions</a>`;
 iu.value=x;Yy(!!1);
W(sd,`<h2>${quote}</h2>`);h.pop();L();
},
addURLParse=()=>{
if(typeof globalThis.URL==='undefined' || globalThis.URL.parse)return;
 globalThis.URL= class URL extends originalURL{ 
    constructor(url, base=undefined){
       let finalUrl=url;
       if(typeof url==='string' && url.startsWith('blob:')){
       finalUrl=url;
      }
   super(finalUrl, base);
  }
  static parse(url,base){
   try{return new URL(url,base);}catch{return null}
  }
 }
};
addURLParse();
U('Patience is a virtue...').then(C());