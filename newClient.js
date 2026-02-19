//**!!FILE MUST BE EXECUTABLE VIA JAVASCRIPTS'S eval() FUNCTION. I AM AWARE OF CONCERNS WITH IT.!!**

// Globals
let d=document,w,u,h=[],n=new TextDecoder(),p=new Map(),a=0,si=0,dl=!!0,dld=!!0,c=!!0,svrInd=0,atmps=4,vdld=!!0,mpbU='https://cdn.jsdelivr.net/npm/mp4box@latest/dist/mp4box.all.min.js',
ge=i=>d.getElementById(i),pdfdl=!!0,getwkr=!!0,mp4boxLoaded=!!0,mp4box,isFading=!!0,firstLoad=!!1,cnclFade=!!0,showBase='https://archive.org/download/',archiveBase='https://archive.org/details/';

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
#overlay {display:none;position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,0.8);z-index:100000999;font-family:system-ui,sans-serif;align-items:center;justify-content:center}
#overlay div {background:#222;color:#eee;padding:2em;border-radius:8px;text-align:center;max-width:500px}
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
const mediaExts = ['.mp4', '.webm'];

// HTML setup (overlay, player, header, content, sidebar)
d.body.innerHTML=`
<div id='overlay'><div><h2>Media Paused</h2><p>Double-Tap To Resume</p></div></div>
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
<button id='hide'>🔇</button>
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

// Element refs
let bck=ge('bck'),iu=ge('iu'),rf=ge('rf'),sv=ge('sv'),cb=ge('cb'),hide=ge('hide'),pg=ge('pg'),overlay=ge('overlay'),bs=ge('bs'),pl=ge('pl'),ct=ge('ct'),msgs=ge('msgs'),pb=ge('pb'),sidebar=ge('sidebar'),tree=ge('sidebar-treeview');

// Shadow DOM
let sd=ct.attachShadow({mode:'open'});
sd.innerHTML='<style>:host{all:initial}*{box-sizing:border-box}</style>';

// Utils
let U=async (i)=>pg.textContent=i,
ic=(e,i)=>e.includes(i),
sw=(e,i)=>e.startsWith(i),
rm=(e,i)=>e.removeChild(i),
J=(e,i)=>e.appendChild(i),
W=(e,i)=>e.innerHTML=i;

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



// Load external libraries via proxy
ldJSZip=()=>{
  Z(new URL('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'),'',!!0,0);
};

ldEpubJS=()=>{
  Z(new URL('https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.2.15/epub.min.js'),'',!!0,0);
  U(`E-Book Reader Magic Loaded Ya'll`);
};

// Load pdf.js via proxy
ldpdfJS=()=>{
  Z(new URL('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js'),'',!!0,0);
  getwkr=!!1;
  Z(new URL('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js'),'',!!0,0);
};

// NOTE: the real ldmp4box helper is defined later alongside the MP4/MSE helpers
// to keep related code together and avoid duplication.
// The earlier version of this function has been removed.

// MSE threshold check
shouldUseMSE=r=>r.tl && r.tl > MP4_MSE_THRESHOLD,

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
      if(r.o){
        if(cb.checked&&vdld){
          cngSvr();
          await Rw();
          Z(r.u,r.q,!!0,r.chunking ? r.offset : r.b,r.method,r.chunking ? Math.min((r.chunking ? r.offset : r.b) + chunkSize -1, r.tl -1) : null);
        } else {
          vdld=!!0;
          let e=l('button'),ee=l('button');
          e.innerText='Play Partial?';
          e.style.margin='4px';
          e.onclick=a=>{vdld=!!1;W(sd,'');handleEndOfStream(r.q)};
          J(sd,e);
          ee.innerText='Continue Downloading?';
          ee.onclick=async a=>{await Rw();W(sd,`<h2>Continuing from ${r.b} of ${r.tl}</h2>`);Z(r.u,r.q,!!0,r.b,r.method,r.chunking ? r.b + chunkSize -1 : null)};
          J(sd,ee);
        }
        break;
      }
    }
  };
  w.onopen=i=>{
   c=!!1;S();
 if(firstLoad){try{joke()}catch(e){U(e)}}
  };
  w.onmessage=m=>{
    if(m.data instanceof ArrayBuffer)handleStream(m.data);
    if(typeof m.data==='string')handleResponse(m.data);
  };
  m=null;
},

// MP4/MSE helpers (imported from working client.js)
setUpMp4=async r=>{
  // ensure mp4box library is loaded
  if(!mp4box){
    try{ await ldmp4box() }catch(er){mlog(`ldmp4box: ${er.message||er}`); throw er}
  }
  // return a promise that resolves when mp4box onReady has completed and MSE is ready
  return new Promise((resolve,reject)=>{
    try{
      if(!r.mp4) r.mp4 = mp4box.createFile();
      r.mp4.onReady=async info=>{
        try{
          r.codec = info.tracks[0].codec;
          r.trackId = info.tracks[0].id;
          mlog(`MP4 Ready: codec=${r.codec}`);
          r.mp4.setSegmentOptions(r.trackId,'vid',segOptions);
          r.mp4.initializeSegmentation();
          r.mp4.start();
          await setUpMSE(r);
          mlog(`MSE Setup complete`);

          // drain any chunks that arrived early
          try{
            if(r.f && r.f.length){
              mlog(`Draining ${r.f.length} queued chunk(s) into mp4box`);
              for(const chunk of r.f){
                try{
                  const ab = (chunk.buffer && (chunk.byteOffset||chunk.byteOffset===0)) ? chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) : (new Uint8Array(chunk)).buffer;
                  processChk(r, ab);
                }catch(er){mlog(`drain chunk: ${er.message||er}`)}
              }
              r.f = [];
            }
          }catch(er){mlog(`drain queued chunks: ${er.message||er}`)}

          resolve();
        }catch(er){mlog(`setUpMp4 onReady: ${er.message||er}`);reject(er)}
      };
      r.mp4.onSegment=(id,user,buffer,sampleNumber,last)=>{
        try{
          if(!r.srcBfr||r.srcBfr.updating) r.Q.push(buffer);
          else r.srcBfr.appendBuffer(buffer);
          mlog(`Segment ${sampleNumber} (last=${last}): ${buffer.byteLength} bytes`);
          if(last) r.mp4.flush();
        }catch(er){mlog(`onSegment: ${er.message||er}`)}
      };
      r.mp4.onError=er=>{mlog(`mp4box error: ${er}`);reject(er)};
    }catch(er){mlog(`setUpMp4: ${er.message||er}`);reject(er)}
  })
},

ldmp4box=async i=>{
  try{
    let ws=new WebSocket('wss://mitre.paytel.workers.dev');
    ws.onopen=()=>{
      ws.send(JSON.stringify({u:'CMD_KV_GET?key=mp4box',au:P()}));
    };
    ws.onmessage=async m=>{
      ws.close();ws='';
      const b=new Blob([JSON.parse(m.data).d],{type:'application/javascript'});
      const url=window.URL.createObjectURL(b);
      const mod=await import(url);
      mp4box=mod;
      mp4boxLoaded=!!1;
      mlog('mp4box loaded');
    };
  }catch(er){mlog(`ldmp4box: ${er.message||er}`)}
},

setUpMSE=async r=>{
  return new Promise((resolve,reject)=>{
    try{
      if(!r.MSE_mSrc) r.MSE_mSrc=new MediaSource();
      r.vid.src = window.URL.createObjectURL(r.MSE_mSrc);
      r.vid.controls = !!0;
      J(pl,r.vid);
      const onSourceOpen=async ()=>{
        try{
          if(!r.codec){mlog('onSourceOpen: no codec available');reject(new Error('No codec'));return}
          let mime = (r.c||'video/mp4').split(';')[0].trim();
          let codec=`${mime}; codecs="${r.codec}"`;
          mlog(`Testing codec: ${codec}`);
          if(!MediaSource.isTypeSupported(codec)){mlog(`Codec NOT supported: ${codec}`);reject(new Error('Codec not supported'));return}
          r.srcBfr = r.MSE_mSrc.addSourceBuffer(codec);
          r.srcBfr.mode='sequence';
          r.srcBfr.onupdateend=()=>{
            try{
              if(r.vid.currentTime && r.srcBfr.buffered && r.srcBfr.buffered.length>0){
                const keepStart = Math.max(0, r.vid.currentTime - 30);
                for(let i=0;i<r.srcBfr.buffered.length;i++){
                  const start = r.srcBfr.buffered.start(i);
                  if(start < keepStart){ try{r.srcBfr.remove(start, keepStart)}catch(er){} }
                }
              }
            }catch(er){mlog(`trim buffer: ${er}`)}
            if(r.Q.length){try{r.srcBfr.appendBuffer(r.Q.shift())}catch(er){mlog(`appendBuffer: ${er.message||er}`)}}
            else if(r.mp4Done) tryEndOfStream(r);
          };
          r.srcBfr.onerror=err=>{mlog(`SourceBuffer error: ${err.message||err}`)};
          processQ(r);
          resolve();
        }catch(er){mlog(`onSourceOpen: ${er.message||er}`);reject(er)}
      };
      r.MSE_mSrc.addEventListener('sourceopen',onSourceOpen,{once:!!1});
      try{if(r.MSE_mSrc.readyState==='open'){setTimeout(()=>onSourceOpen(),0)}}catch(er){}
      setTimeout(()=>{if(r.srcBfr===null)reject(new Error('MediaSource timeout'))},5000);
    }catch(er){mlog(`setUpMSE: ${er.message||er}`);reject(er)}
  })
},

tryEndOfStream=r=>{
  try{if(r.MSE_mSrc&&r.MSE_mSrc.readyState==='open')r.MSE_mSrc.endOfStream()}catch(er){mlog(`endOfStream: ${er}`)}
},

processQ=r=>{
  try{
    if(r.Q.length&&r.srcBfr&&!r.srcBfr.updating){
      r.srcBfr.appendBuffer(r.Q.shift());
    }
  }catch(er){mlog(`processQ: ${er.message||er}`)}
},

processChk=(r, u8)=>{
  try{
    u8.fileStart = r.bfrInd || 0;
    r.bfrInd = r.mp4.appendBuffer(u8);
  }catch(er){mlog(`mpAppBfr: ${er}`)}
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
  u=new window.URL(x);
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
    if(ic(r.c,'application/pdf'))r.pdf=!!1;
    if(ic(r.c,'epub'))r.epub=!!1;

    r.usesMSE=shouldUseMSE(r);
    if(r.v && r.usesMSE){
        try{await setUpMp4(r);}catch(er){mlog(`setUpMp4 init: ${er}`)}
    }
    if(r.v && !r.usesMSE){r.vid=l('video');r.vid.controls=!!1;r.vid.addEventListener('canplaythrough',loadDone)}
    if(r.a && !r.usesMSE){r.vid=l('video');r.vid.controls=!!1;r.vid.addEventListener('canplaythrough',loadDone)}
  }
  else if(t==='r'){if(ic(f.c,'/html')){H(f.d)}else if(ic(f.c,'/javascript')){JS(f.d)}else if(ic(f.c,'/css')){z(f.d)}else{W(sd,`<pre>${escapeHtml(f.d)}</pre>`)}}
  else if(t==='e'){await handleEndOfStream(f.q)}
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
  try{
    let x=new Uint8Array(buf),
        reqIdBytes=9,
        reqIdStr=n.decode(x.subarray(0,reqIdBytes)).trim(),
        r=p.get(reqIdStr),
        f=x.subarray(reqIdBytes);
    if(!r) return;

    // keep raw chunks only until mp4box is ready when using MSE
    if(!r.usesMSE || !r.mp4){
      r.f.push(f);
    }
    r.b += f.length;

    // feed mp4box if using MSE
    if(r.usesMSE){
      try{
        if(r.mp4 && r.Q && r.Q.length < SEG_QUEUE_LIMIT){
          let ab = (f.buffer && (f.byteOffset||f.byteOffset===0)) ?
                    f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength) :
                    (new Uint8Array(f)).buffer;
          processChk(r, ab);
        }
      }catch(er){mlog(`mp4.appendBuffer: ${er.message||er}`)}
    }

    let prct = r.tl ? ((r.b/r.tl)*100).toFixed(2) : '';
    if(!dld && prct !== ''){
      U(`${prct}% of ${r.mb}MB (queue: ${r.Q? r.Q.length:0})`);
      pb.style.width=`${prct}%`;
    }
  }catch(er){mlog(`handleStream: ${er}`)}
},

// End stream/chunk
handleEndOfStream=async q=>{
  let r = p.get(q);
  if (!r) return;
  if (r.mp4) r.mp4Done = !!1; // tell the mp4 layer the stream has finished

  // avoid allocating blob for MSE video/audio streams
  if(!(r.usesMSE && (r.v||r.a))){
    r.ou = window.URL.createObjectURL(new Blob(r.f,{type:r.c}));
  }

  if(r.i){
    I(Q('',sd,`img[data-pq="${q}"]`),r);
  } else if(r.pdf){
    try{
      // let pdf.js script run (insertion is synchronous)
      await Wt('',()=>pdfjsLib,0);
      HPDF(r);
    }catch(er){U(er)}
  } else if(r.epub){
    try{
      // similarly wait for the epub.js global to exist
      await Wt('',()=>ePub,0);
      const book = ePub(r.ou);
      const rendition = book.renderTo(pl,{method:"default",width:"100%",height:"100%"});
      rendition.display();
    }catch(er){W(pl,er)}
  } else if(r.v||r.a){
    if(r.usesMSE){
      tryEndOfStream(r);
      U(`Video loaded (${r.mb}MB)`);
    } else {
      pb.style.width = '0%';
      U('Loading Media...').then(DL(1000).then(Mm(r)));
      vdld = !!0;
    }
  } else {
    Mm(r);
  }
  if(r.usesMSE){ r.f = []; }
}
/*  if(r.chunking && (r.usesMSE ? r.offset : r.b) < r.tl){
    mlog('Fetching next chunk');
    let next_os = r.usesMSE ? r.offset : r.b;
    let next_oe = Math.min(next_os + chunkSize -1, r.tl -1);
    Z(r.u, r.q, false, next_os, r.method, next_oe);
  }*/
;

// Media events
let E=(e,r)=>{if(r.i){ e.onload=i=>V(r) }else{ e.onended=i=>r.o=!!0}e.onerror=i=>V(r)},

// Insert image
I=(i,r)=>{
  if(r.k){
    r.img.src=r.ou;
    E(r.img,r);
   if(!cb.checked){
     J(sd,r.img);
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
   if(firstLoad){firstLoad=!!0;iu.value='';}
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

// Render PDF
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
        const rndctx={canvasContext:ctx,viewport: vp};
        pg.render(rndctx).promise.then(()=>{
          J(sd,e)
        })
      })
    }
  })
},

// Set all open
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
V=r=>{if(r.ou)window.URL.revokeObjectURL(r.ou);if(r.MSE_mSrc){try{r.MSE_mSrc.endOfStream()}catch(er){}}p.delete(r.q)}

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
  if(!p.has(q))p.set(q,{q:q,u:uu,f:[],k:t,b:b,vid:l('video'),img:null,mp4:null,codec:null,trackId:null,Q:[],mp4Done:!!0,bfrInd:0,usesMSE:!!0,method:method,firstMessage:true,isMedia:isMedia(uu),chunking:false});
 //let key='clientCode';
 // let val=encodeURIComponent(localStorage.getItem('a'))
 //uu=`CMD_KV_PUT?key=${key}&val=${val}`;

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
      So();K();U('');
      el.style.opacity=1;
     isFading=!!0
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
bck.onclick=async i=>{if(h.length>1){if(!c)await Rw();h.pop();u=h[h.length-1];Su();Yy(!!1) }};
rf.onclick=i=>{fade(pg);w.close();atmps=1;cngSvr();C()};
bs.onclick=i=>{dl=!dl;if(dl){dld=!!1;bs.value='↓';k(g(),0)}else{dld=!!0;bs.value=''}};
sv.ondblclick=i=>{sv.readOnly=!sv.readOnly};
sv.onkeyup=i=>{if(i.key==='Enter'){sv.readOnly=!!1;C()}};
hide.onclick=i=>{overlay.style.display='flex';mute(!!1)};
overlay.ondblclick=i=>{overlay.style.display='none';mute(!!0)};
Q('',d,'meta[name="viewport"]').setAttribute('content','user-scalable=yes');
svrInd=Math.floor(Math.random()*svrs.length);
ldmp4box().catch(er=>mlog(er));
const st=l('style');
st.textContent=cssStyles;
J(d.head,st);

// Sidebar toggle
ge('btnOpn').onclick = () => sidebar.classList.add('open');
ge('btnCls').onclick = () => sidebar.classList.remove('open');

// Initial setup
getShows();
ldJSZip();
ldEpubJS();
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
 let x='img.freepik.com/premium-photo/prisoner-being-released-from-prison-greeting-freedom-with-open-gates_126267-19875.jpg';
 let quote=`Enjoy a minute or two audio of quotes from the Stoic <a href='https://en.wikipedia.org/wiki/Seneca_the_Younger'>Seneca the Younger</a>`;
 //let quote=`Enjoy a minute or two audio of quotes from the Stoic Seneca the Younger`
 iu.value=x;Yy(!!1);
W(sd,`<h2>${quote}</h2>`);h.pop();L();
};
C();