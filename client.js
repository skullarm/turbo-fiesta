localStorage.setItem('9',cd.value);
//## Section 1: HTML/CSS Shell & Globals

(function initShell() {
  const doc = document;
 
  const css = `
    :root{--accent:#4a9eff;--bg:#1a1a1a;--surface:#2a2a2a;--text:#eee;--border1:#655}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;}
  
 #toastContainer {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000001000;
  display: flex;
  flex-direction: column-reverse;
  gap: 6px;
  align-items: center;
  pointer-events: none;
  max-width: 92vw;
}
.toast {
  background: rgba(30,30,30,0.95);
  color: #fff;
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid var(--accent);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  font-size: 13px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.68,-0.55,0.27,1.55);
  pointer-events: auto;
  max-width: 80vw;
  text-align: center;
}

.toast.show { opacity: 1; transform: translateY(0); }

  
  #tab-options {
  position: relative;   /* creates sticky context */
}

#opt-save {
  position: sticky;
  bottom: 0;
  background: #1f1f1f;   /* opaque so text doesn’t show through */
  border-top: 1px solid #4a9eff;
  margin: 12px -10px 0;  /* bleed to edges if you want a full bar */
  z-index: 10;
  width: 100%;
  padding: 10px;
}
 .mse-minute-seek {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
  pointer-events: auto;
}
.mse-minute-seek input {
  width: 50px;
  padding: 2px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--accent);
  border-radius: 3px;
  font-size: 11px;
  text-align: center;
}
.mse-minute-seek button {
  padding: 2px 6px;
  font-size: 10px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 3px;
}

    .drag-handle{font-size:2.5em;font-family:sans-serif;margin:1px 3px;cursor:grab;user-select:none}
    .track-num{vertical-align:middle;font-size:0.6em}
    button{user-select:none;cursor:pointer}
  
.media-info-box {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 101;
  background: rgba(0,0,0,0.7);
  color: #eee;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.3;
  pointer-events: none;
  opacity: 0;
  min-width: 60px;
  text-align: left;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
  border-width: 2px;
  border-style: solid;
  border-color: transparent;
  transition: opacity 0.35s ease;
}

.media-info-box.show {
  opacity: 1;
}

/* Expanded = full view */
.media-info-box.expanded {
  background: rgba(0,0,0,0.7);
  font-size: 11px;
  min-width: 140px;
  transition:
    opacity 0.2s ease,
    background 0.2s ease,
    font-size 0.2s ease,
    padding 0.2s ease,
    min-width 0.2s ease,
    border-width 0.2s ease;
}

/* Mini view: shrink after the labels have faded out */
.media-info-box.show:not(.expanded) {
  background: rgba(0,0,0,0.45);
  opacity: 0.4;
  border-width: 0.03125rem;
  font-size: 8.5px;
  min-width: 60px;
  padding: 2px 2px;
  transition:
    opacity 0.35s ease,
    background 0.35s ease 0.45s,
    font-size 0.35s ease 0.45s,
    padding 0.35s ease 0.45s,
    min-width 0.35s ease 0.45s,
    border-width 0.35s ease 0.45s;
}

.media-info-box div {
  margin: 2px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.media-info-box:not(.expanded) div {
  justify-content: flex-start;
}

/* Detail / smart rows: disappear first in mini view */
.media-info-box .detail,
.media-info-box .smart-only {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: opacity 0.2s ease, max-height 0.2s ease;
}

.media-info-box.expanded .detail {
  max-height: 60px;
  opacity: 1;
}

.media-info-box.expanded.show-smart .smart-only {
  max-height: 60px;
  opacity: 1;
}

/* Labels: fade after detail rows are gone, then shrink */
.media-info-box label {
  font-weight: normal;
  opacity: 0;
  pointer-events: none;
  max-width: 0;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.25s ease 0.25s, max-width 0.2s ease 0.45s;
  margin-right: 2px;
}

.media-info-box.expanded label {
  opacity: 0.8;
  max-width: 120px;
  transition-delay: 0s;
}

/* Values: slide left once the label fade completes */
.media-info-box .value {
  font-weight: 600;
  min-width: 0;
  text-align: left;
  transition: text-align 0.25s ease 0.45s, min-width 0.25s ease 0.45s;
}

.media-info-box.expanded .value {
  min-width: 56px;
  text-align: right;
  transition-delay: 0s;
}

/* collapse hidden rows completely in mini mode */
.media-info-box:not(.expanded) div.detail,
.media-info-box:not(.expanded) div.smart-only {
  display: none;
}

/* keep only the rows you want in mini mode tight */
.media-info-box:not(.expanded) div.time-row,
.media-info-box:not(.expanded) div.bytes-row,
.media-info-box:not(.expanded) div.buffer-row {
  display: flex;
  margin: 0 0 2px 0;
}

.media-info-box:not(.expanded) {
  line-height: 1.05 !important;
  padding: 1px 4px !important;
}
.media-info-box:not(.expanded) div {
  margin: 0 !important;
  min-height: 0;
}
.media-info-box:not(.expanded) label {
  margin: 0 !important;
  padding: 0 !important;
  max-width: 0 !important;
  opacity: 0 !important;
}
.media-info-box:not(.expanded) .value {
  min-width: 0 !important;
  margin: 0;
  padding: 0;
  text-align: left;
}
.media-info-box.fatal {
  border-color: #ff0000 !important;
}

    .custom-cb{display:flex;align-items:center;cursor:pointer;border:none;padding:10px 14px;border-radius:8px;transform: translateY(2px)}
    .custom-cb input{display:none}
    .checkmark{background-color:var(--bg);width:24px;height:24px;border:2px solid var(--border1);border-radius:6px;margin-right:11px;position:relative;transition:all 0.3s ease}
    .checkmark::after{content:"";position:absolute;left:6px;top:2px;width:8px;height:13px;border:solid white;border-width:0 2px 2px 0;transform:rotate(45deg);display:none}
    .custom-cb input:checked+.checkmark{background-color:var(--accent);border-color:var(--accent);box-shadow:0 0 12px rgba(74,148,255,0.6)}
    .custom-cb input:checked+.checkmark::after{display:block}
    
   #sv{ width:32px;height:32px;border:1px solid #444;border-radius:6px;display:flex;flex-direction:column;overflow:hidden;position: relative;}
   #sv .sv-top,#sv .sv-bottom{flex:1;width:100%;transition:background-color 0.2s ease}
   #sv .sv-top{background-color:#3a1a1a;}
   #sv .sv-bottom{background-color:#3a1a1a}
   #sv.connected .sv-top{background-color:#1a3a1a}
   #sv.media-connected .sv-bottom{background-color:#1a3a1a}
   
    .msg-container{
   position: relative;
   display:flex;
   justify-content:space-between;
   align-items:center;
   width:100%;
   padding:1px 3px;min-height: 24px
  }
  #pg {
     font-family: monospace;
    font-size:12px;
     color: var(--accent);
    z-index: 2;
    flex:1
   }
   #pg2{
   font-family: monospace;
    font-size: 12px;
   color: #ffaa44;
   z-index:2;
   margin-left:8px;
   padding-left: 8px;
   max-width:50%;
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
  }
   #btn-stop-download{
     margin-right:8px;
    background: #c00;
    color: white;
    border:none;
    padding: 2px 8px;
    border-radius:4px;
    font-size:11px;
    display: none;
    z-index:3
   }
   #btn-stop-download.show{
    display: block !important ;
   }
   #btn-stop-download:active{
    transform:scale(0.95);
   }
    .player-wrapper{display:none;font-size:15px;flex-direction:column;align-items:center;gap:2px;position:relative;transition:opacity 0.5s ease,transform 0.5s cubic-bezier(0.68,-0.55,0.27,1.55);opacity:0;transform:translateX(100%)}
    .player-wrapper.is-visible{opacity:1;transform:translateX(0);display:flex}
    
    .track-marquee{width:100%;overflow:hidden;position:relative;height:18px;border-radius:4px}
    .marquee-content{position:absolute;white-space:nowrap;padding-left:100%;animation:marqueeScroll 18s linear infinite}
    @keyframes marqueeScroll{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
    .playlist-item .marquee-content{animation:none;padding-left:0}
    .playlist-item.playing .marquee-content{padding-left:100%;animation:marqueeScroll 18s linear infinite}
    
    .col,.col ul{list-style-type:none;padding-left:10px}
    .col li{padding:5px}
    .toggle{padding:12px;cursor:pointer}
    .toggle::before{display:inline-block;width:17px;content:'➕ '}
    .toggle.show::before{content:'➖ '}
    .col ul{display:none}
    .toggle.show+ul{display:block}
    
.sidebar{border-radius: 3px; position:fixed;left:-300px;top:0;height:100%;width:300px;background:var(--surface);transition:left 0.5s ease;z-index:100000100;display:flex;flex-direction:column;padding:3px}
   // .sidebar.open{left:0}
    #sidebar-content{flex:1;display:flex;flex-direction:column;overflow:hidden}
    .sidebar-tab{flex:1;display:none;overflow:auto}
    .sidebar-tab.active{display:block}
    #sidebar-treeview{flex:1;padding:3px;margin:5px;max-height:100vh;overflow-y:auto;overflow-x:auto}
    #sidebar-tabs{display:flex;justify-content:space-around;padding:4px;background:var(--bg);border-top:1px solid #444}
    .tab-btn{flex:1;padding:8px 0;background:transparent;border:none;cursor:pointer;font-size:14px;color:var(--border1)}
    .tab-btn.active{color:var(--text);border:1px solid var(--accent);background:rgba(0,0,0,0.8);box-shadow:0 0 10px 2px rgba(74,158,255,0.4)}
    
.sidebar.open {
  left: 0;
  border-right: 1px solid var(--border1);
    border-top:1px solid var(--border1);
    border-bottom: 1px solid var(--border1);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.6);
}
    .sticky-header{position:sticky;top:0;z-index:100000099;background:var(--surface);padding:8px;border-bottom:1px solid #444}
    .sticky-header>div{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .sticky-header button,.sticky-header input{padding:6px 12px;background:#444;color:#fff;border:1px solid var(--border1);border-radius:4px}
    .sticky-header button:active{transform:scale(0.95)}
    #iu{flex:1;min-width:200px;background:var(--bg);color:var(--text);font-family:monospace;font-size:12px}
    #icon{font-size:1.75em;background:transparent;cursor:pointer;display:none}
   
    #overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100000999;align-items:center;justify-content:center;pointer-events:none}
    #overlay > span{pointer-events:auto;background:#222;color:var(--text);padding:2em;border-radius:8px;border:1px solid #665;text-align:center}
    #pl{position:relative;width:100%;height:0vh;overflow:hidden;background:#000;transition:height 0.5s ease}
    #pl.active{height:100vh}
    
    .md-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.5);padding:8px;font-size:28px;z-index:11;opacity:0;transition:opacity 0.6s ease}
    .md-nav.show{opacity:1}
    #prev-media{left:10px}
    #next-media{right:10px}
    
    .media-content{position:absolute;inset:0;display:none;justify-content:center;align-items:center;border:1px solid black;z-index:1}
    .media-content.active{display:flex;z-index:2;animation:fadeIn 0.8s ease}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .media-close-btn{position:absolute;top:10px;right:10px;z-index:100;background:rgba(255,0,0,0.7);color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;opacity:0;transition:opacity 0.6s ease;z-index:1}
   .media-close-btn.show{opacity:1}
    
    .seek-slider-container{position:fixed;bottom:0;left:0;right:0;height:0;background:var(--bg);border-top:2px solid var(--accent);opacity:0;transform:translateY(100%);transition:all 0.2s ease;z-index:100001000;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .seek-slider-container.active{height:140px;opacity:1;transform:translateY(0);pointer-events:all;padding:12px}
    .slider-track{width:90%;height:8px;background:#444;border-radius:4px;position:relative;cursor:pointer;box-shadow:0 0 6px 2px rgba(74,158,255,0.7)}
    .slider-fill{height:100%;background:var(--accent);border-radius:4px;width:0%}
    .slider-handle{position:absolute;top:50%;transform:translate(-50%,-50%);width:32px;height:32px;background:var(--accent);border-radius:50%;box-shadow:0 2px 8px rgba(74,158,255,0.6);cursor:grab}
    
    #ct{width:100vw;height:calc(100vh - 85px);overflow:auto;background:var(--bg)}
    #ct a{color:var(--accent);text-decoration:none}
    #ct a:hover{text-decoration:underline}
    #ct pre{background:#111;padding:12px;border-left:3px solid var(--accent);overflow:auto}
    #ct img,#ct video{max-width:100%;height:auto;margin:8px 0;border-radius:4px}
    
    .proxy-media-link{display:block;padding:8px;background:var(--surface);border:1px solid #444;margin:4px 0;border-radius:4px;color:var(--accent);cursor:pointer}
    .proxy-media-link:hover{background:#333}

     /*Tab Bar & Tabs*/
    #tab-bar{display:flex;gap:2px;align-items:center;width:100%;padding:2px 2px;background:transparent;overflow-x:auto}

    .tab{flex:0 1 125px;min-width:50px;padding: 3px 6px;background:#333;color:#aaa;border-radius:4px;display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:12px;white-space:nowrap;overflow:hidden;border:1px solid transparent;transition:0.5s}

     .tab.active{background:#2a4a6a;color:#fff;border-color:var(--accent);box-shadow:0 0 8px rgba(74,158,255,0.3)}

    .tab-title{overflow:hidden;text-overflow:ellipsis;flex:1;font-size:1.22em}   

    .tab-close{width:18px;height:18px;border-radius:50%;background: #c00;color:#fff;border:none;font-size:1.22em;display:flex;align-items:center;justify-content:center;flex-shrink:0}

    #btnAddTab{min-width:28px;height:28px;border-radius:4px;background:transparent;color:#fff;border:none;font-size:19px;line-height:1;flex-shrink:0;margin-left:auto}

    /*Image placeholder styling*/
   .img-placeholder{background:var(--surface);border:1px dashed #555;display:inline-block;min-width:50px;min-height:50px;margin:8px 0}

    /* pdf Nav */
     #pdf-nav{position:absolute;bottom:20px;right:20px;top:auto;left:auto;transform:none;background: rgba(0,0,0,0.85);padding:12px;border-radius:8px;z-index:20;opacity:0;transition:opacity 0.3s;display:flex;gap:8px;pointer-events:none;border:1px solid var(--accent);box-shadow:0 4px 20px rgba(0,0,0,0.5)}

    /*med ind */
     #media-index{position: absolute; bottom: 20px; left: 50%;transform: translateX(-50%);z-index:20;transition: opacity 0.3s;opacity:0}

    /* Chat Styles */
    .chat-container{position:fixed;top:8px;right:8px;width:650px;height:362px;background:var(--bg);border:1px solid var(--accent);border-radius:12px;box-shadow:0 4px 20px rgba(74,148,255,0.3);display:none;flex-direction:column;z-index:100000987;opacity:0;transform:translateY(20px);transition:all 0.3s ease;overflow:hidden}
    .chat-container.active{display:flex;opacity:1;transform:translateY(0)}
    .chat-header{background:var(--surface);padding:12px 16px;border-bottom:1px solid var(--accent);display:flex;justify-content:space-between;align-items:center;cursor:pointer}
    .chat-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#0a0a0a}
    .chat-message{max-width:85%;padding:8px 12px;border-radius:8px;word-wrap:break-word}
    .chat-message.user{align-self:flex-end;background:var(--accent);color:#000}
    .chat-message.ai{align-self:flex-start;background:var(--surface);border:1px solid var(--text);color:var(--text)}
    .chat-input-container{background:var(--surface);padding:12px;border-top:1px solid var(--accent);display:flex;gap:8px}
    .chat-input{flex:1;background:var(--bg);border:1px solid #444;color:var(--text);padding:8px 12px;border-radius:6px;font-size:13px}
    .chat-send{background:var(--accent);border:none;color:#000;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold}
    .chat-model-select{background:var(--bg);border:1px solid var(--text);color:#eee;padding:6px 10px;border-radius:6px;font-size:12px}
    .chat-loading{display:inline-block;width:14px;height:14px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px}
    @keyframes spin{to{transform:rotate(360deg)}}

/* ---------- Picture‑in‑Picture container ---------- */
#pipContainer{
  position:fixed;
  bottom:12px;
  right:12px;
  width:260px;               /* start size – user can resize */
  height:146px;              /* 16:9 approx for 260px width */
  background:#111;
  border:2px solid var(--accent);
  border-radius:6px;
  overflow:hidden;
  z-index:1000002000;        /* above everything */
  display:none;
  flex-direction:column;
  user-select:none;
  touch-action:none;
  contain:layout;
  box-shadow:0 4px 24px rgba(0,0,0,0.45);
}
#pipContainer.show{display:flex}

/* title bar – drag handle + close */
#pipTitleBar{
  min-height:28px;
  line-height:28px;
  background:rgba(0,0,0,0.6);
  color:#eee;
  font-size:13px;
  padding:0 6px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:6px;
  cursor:grab;
  user-select:none;
  pointer-events:auto;
  flex-shrink:0;
}
#pipTitleBar:active{cursor:grabbing}
#pipTitleLabel{
  flex:1;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  text-align:center;
  font-weight:600;
  margin:0 4px;
}
#pipCloseBtn,#pipPrevBtn,#pipNextBtn{
  width:22px;height:22px;
  background:#444;
  color:#fff;
  border:none;
  border-radius:4px;
  font-size:13px;
  line-height:1;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  flex-shrink:0;
}
#pipCloseBtn{background:#c00;margin-right:4px}
#pipCloseBtn:hover{background:#e00}
#pipPrevBtn:hover,#pipNextBtn:hover{background:#666}
#pipPrevBtn:disabled,#pipNextBtn:disabled,#pipCloseBtn:disabled{opacity:0.45;cursor:not-allowed}
#pipNavControls{display:flex;gap:4px;margin-left:auto;flex-shrink:0}

/* content area – the media element will be placed here */
#pipContent{
  flex:1;
  min-height:0;
  overflow:hidden;
  background:#000;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
  isolation:isolate;
}
#pipContent > .media-content{
  position:relative;
  width:100%;
  height:100%;
  z-index:0;
  display:flex;
  align-items:center;
  justify-content:center;
  border:none;
  overflow:hidden;
  background:#000;
}
#pipContent > .media-content > *{
  max-width:100%;
  max-height:100%;
}

/* optional resize handle (bottom‑right) – very lightweight */
#pipResizeHandle{
  position:absolute;
  right:0;bottom:0;
  width:12px;height:12px;
  background:rgba(255,255,255,0.2);
  cursor:se-resize;
  user-select:none;
    pointer-events:auto; 
}
.pip-mode .media-info-box {
    display: none !important;
}
#pipContainer {
    min-width: 120px;   /* matches the JS min width */
    min-height: 80px;   /* matches the JS min height */
}
 #pipContent > * {
  width: 100%;
  height: 100%;
  object-fit: contain;   /* keep aspect ratio, never exceed the box */
}
  `;
  
  const style = doc.createElement('style');
  style.textContent = css;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
  <div id="overlay">
 </div>
  <div id="pl">
    <button class="md-nav" id="prev-media">↩</button>
    <button class="md-nav" id="next-media">↪</button>
      <div id="media-index" style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#eee;padding:4px 8px;border-radius:4px;font-size:14px;pointer-events:none;z-index:20">
<span id="media-index-num">0</span> of <span id="media-index-total">0</span>
   </div>
  <div id="pdf-nav">
  <button id="pdf-dark-toggle" style="padding:4px 8px;background:var(--accent);border:none;border-radius:4px;color:#000;font-size:12px">🌚</button>
  <button id="pdf-bookmark-del" style="padding:4px 8px;background:#c00;border:none;border-radius:4px;color:#fff;font-size:12px" title="Delete bookmark">🗑</button>
  <input type="number" min=1 id="pdf-page-inp" placeholder="#" style="width:50px;padding:4px;border-radius:4px;border:1px solid var(--accent);background:var(--bg);color:var(--text);text-align:center">
  of
  <span id="pdf-num-pages" style="padding:4px 12px;background:var(--bg);color:var(--text);border:none">@</span>
</div>
  </div>
  <div class="sticky-header">
    <div>
      <button id="btnOpn">🌫</button>
      <button id="bck">🔙 BCK</button>
      <button id="rf">🔄 RF</button>
      <input id="iu" placeholder="https://..." />
      <span id="icon">🎶</span>
      <div id="sv">
        <div class="sv-top"></div>
        <div class="sv-bottom"></div>
      </div>
      <label class="custom-cb">
        <input id="cb" type="checkbox"/>
        <span class="checkmark"></span>
        <span>Auto</span>
      </label>
      <input id="bs" type="button" value="↓" />
      <button id="hide">💡</button>
     <button id="btnPiP" title="Pop‑out media">⛶</button>
      <button id="btnChat">🤖</button>
    </div>
    <div id="msgs" class="msg-container">
      <span id="pg" style="font-family:monospace;font-size:12px;color:var(--accent);z-index:2">Be patient.</span>
     <span id="pg2" style="display:none"></span>
      <div id="aud-wrapper" class="player-wrapper">
        <div id="trackTimeDetail" style="font-size:12px">0:00:00</div>
        <div class="aud-controls" style="display:flex;gap:10px">
          <button id="btn-prev">⏮</button>
          <button id="btn-play">▶</button>
          <button id="btn-next">⏭</button>
          <button id="btn-close-player">✖</button>
        </div>
        <div class="track-marquee"><div id="marqueeContent" class="marquee-content">...</div></div>
      </div>
    </div>
    <div id="tab-bar" style="display:none"></div>
    <div id="pb"style="position:relative;bottom:-8;left:0;height:6px;background:linear-gradient(to right,black 0%,#1a1a1a 16%,#c00 32%,gold 73%,green 100%);width:0%;transition: width 0.3s ease;z-index:1"></div>
  </div>
 <!-- <textarea id='tmp'rows=8 style='width:100%'></textarea>
  <button onclick="tmp.value=''">¶¶</button> | <button onclick="localStorage.setItem(iu.value,tmp.value);U('svd')">🐸</button>-->
  <div id="ct"></div>
  <div id="seekSliderContainer" class="seek-slider-container">
    <div style="width:90%;display:flex;align-items:center;gap:12px">
      <button id="scrubBack" style="font-size:20px;background:var(--accent);border:none;border-radius:50%;width:40px;height:40px;color:#000;flex-shrink:0">◀</button>
   <div style="flex:1">
      <div style="color:#eee;font-size:13px;text-align:center;margin-bottom:8px">Slide to seek</div>
      <div class="slider-track" id="sliderTrack">
        <div class="slider-fill" id="sliderFill"></div>
        <div class="slider-handle" id="sliderHandle"></div>
      </div>
      <div style="color:#4a9eff;font-size:14px;font-weight:bold;text-align:center;margin-top:6px"><span id="sliderTime">0:00</span> / <span id="sliderDuration">0:00</span></div>
    </div>
  <button id="scrubForward" style="font-size:20px;background:var(--accent);border:none;border-radius:50%;width:40px;height:40px;color:#000;flex-shrink:0">▶</button>
 </div>
  </div>
   <div id="toastContainer"></div>
  <div id="sidebar" class="sidebar">
  <!--  <button id="btnCls" style="position:absolute;top:8px;right:8px;padding:10px;background:#444;color:#fff;border:1px solid #665;border-radius:4px;cursor:pointer;display:none">✖</button>-->
    <div style="padding:10px;border-bottom:1px solid #444">🍿 Clandestine Entertainment 🎵</div>
    <div id="sidebar-content">
      <div id="tab-shows" class="sidebar-tab active">
        <div id="sidebar-treeview">LOADING...</div>
      </div>
      <div id="tab-music" class="sidebar-tab">
        <div id="sidebar-playlist" style="padding:10px;color:#ccc">No music added</div>
      </div>
    <div id="tab-options" class="sidebar-tab">
      <div id="sidebar-options" style="padding:10px;color:#ccc"></div>
    </div>
    </div>
    <div id="sidebar-tabs">
      <button id="tab-btn-shows" class="tab-btn active">Shows</button>
      <button id="tab-btn-music" class="tab-btn">Music</button>
       <button id="tab-btn-options" class="tab-btn">Opts</button>
    </div>
  </div>
  `;
  
  const ct = doc.getElementById('ct');
  const sd = ct.attachShadow({mode:'open'});
  sd.innerHTML = '<style>{box-sizing:border-box} img,video,audio{max-width:100%}</style>';
})();

//## Section 2: State, Utilities & URL Polyfill 

(function initUtils() {
  window.AppState = {
   version: 9.0,
   wsEpoch: 0,
    pipContainer: null,
   poppedId: null,
options: (() => {
  const defaults = {
    mseThresholdMB: 45,
    maxBufferAhead: 200,
    bufferTarget: 90,
    cleanupBehind: 12,
    useSmartDefaults: false,
    maxBufferMemoryMB: 200,
    bufferMemoryTargetMB: 60,
    nbSamples: 35,
    useToast: false,
    useMediaChunking: false,
    mediaChunkSize: 1024 * 1024
  };
  const stored = JSON.parse(localStorage.getItem('options') || 'null');
  return stored ? { ...defaults, ...stored } : defaults;
})(),
   wsPool: {text:[],media:[]},
   wsPoolMax: {text:1,media: 4},
   ws: null, wsMedia: null,requests: new Map(),  serverIndex: 0, mediaServerIndex: 4,
    isConnected: false, isMediaConnected: false, dimmed: false, isAnimating: false,pdfDownloading: false,
    videoDownloading: false, audioDownloading: false,
    playlist: [], mediaKeys: [], currentMediaIndex: -1,
    domCache: new Map(), firstLoad: true,
    mp4box: null, mp4boxLoaded: false,
    sliderActive: false, sliderDragging: false,
    sliderInitialized: false,
    currentFadeEl: null, isFading: false,
    clickTimers: {}, longPressTimer: null,
    downloadingImages: false, imageAttempts: 0,
    linkText: '',
    currentURL: '',
    baseURL:'',
    timeoutMS:8000,
    requestTimeouts: new Map(),
    mediaTimeout: null,
    tabs:[],
    activeTabId:null,
    nextTabId:1,
    prevTabId:-1,
    bufferedAhead:0,
   
   };
 let numberedServers =  /*['8','9','10','11']*/
['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','51','52','53','54'];

let namedServers=/*['light','dark','truth','mitre'];*/
['m','n','o','p','q','r','s','t','alice','argos','bilboes','chatt','dark','harley','kazak','light','mitre','omega','offal','osric','phone','skip','sv1','text','trace','truth','turbo','uwtb','wit','turbo-fiesta','languid'];

 
 const servers=numberedServers.concat(namedServers);
 const chunkedMediaServers = numberedServers;
  window.servers = servers;
  window.numberedServers = numberedServers;
  window.namedServers = namedServers;
  window.chunkedMediaServers = chunkedMediaServers;
  window.getServerList = (socketType = 'text', req = null) => {
    const S = window.AppState;
    const useChunkedMediaServers = socketType === 'media' && !!S?.options?.useMediaChunking;
    return useChunkedMediaServers ? chunkedMediaServers : servers;
  };
  window.currentUrl = null;

  // URL.parse polyfill for PDF.js
  const OriginalURL = window.URL;
  window.URL = class extends OriginalURL {
    constructor(url, base) {
      let final = url;
      if (typeof url === 'string' && url.startsWith('blob:')) final = url;
      super(final, base);
    }
    static parse(url, base) {
      try { return new URL(url, base); } catch { return null; }
    }
  };

  window.$ = (sel, el = document) => el.querySelector(sel);
  window.$$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  window.el = tag => document.createElement(tag);
  window.DL = ms => new Promise(r => setTimeout(r, ms));

  window.checkBuffer = async function (r, aggressive = false) {
  if (!r || r.fatalError || r.isRecovering) return;
  if (!r.usesMSE || !r.videoEl) return;
    const msReady = r.ms ? r.ms.readyState : null;
   if (msReady !== 'open' && msReady !== 'ended') return; 

  const S = window.AppState;
  const now = Date.now();

  // watchdog: unlock a stuck checkBuffer
  if (r.checkingBuffer && r._checkBufferStartedAt && (now - r._checkBufferStartedAt > 15000)) {
    r.checkingBuffer = false;
  }
  if (r.checkingBuffer) return;

 // if (!r.usesMSE || !r.ms || r.ms.readyState !== 'open'  || !r.videoEl) return;

  try {
    r.checkingBuffer = true;
    r._checkBufferStartedAt = now;

    const vid = r.videoEl;
    const ct = vid.currentTime || 0;
    const buf = vid.buffered;

    let buffAhead = 0;
    for (let i = 0; i < buf.length; i++) {
      if (ct >= buf.start(i) && ct <= buf.end(i)) {
        buffAhead = buf.end(i) - ct;
        break;
      }
    }
    r.bufferedAhead = buffAhead;
    S.bufferedAhead = buffAhead;//can delete??

    const BUFFER_AHEAD_TARGET = (S.options.useSmartDefaults && r.smartBuffer)
      ? r.smartBuffer.bufferTarget
      : (S.options.bufferTarget || 90);
    const BUFFER_AHEAD_MAX = (S.options.useSmartDefaults && r.smartBuffer)
      ? r.smartBuffer.maxAheadTime
      : (S.options.maxBufferAhead || 180);
    const BUFFER_BEHIND_CLEAN = (S.options.useSmartDefaults && r.smartBuffer)
      ? r.smartBuffer.cleanupBehind
      : (S.options.cleanupBehind || 12);

    const needMore = r.isOpen && !r.fatalError && r.bytesReceived < r.totalBytes;
    const wsAlive = S.wsMedia && S.wsMedia.readyState === WebSocket.OPEN && S.isMediaConnected && !S.medRotating;

    // 1. Pause because the buffer is full (but only if the user isn't forcing a stop)
    if (!r.dlPaused && !r.userPaused && needMore && buffAhead >= BUFFER_AHEAD_MAX) {
      r.dlPaused = true;
      r._chunkPending = false;
      r._chunkDone = false;
      U(`Download paused – buffer ahead ≥ ${BUFFER_AHEAD_MAX}s`);
      closeMediaWS();
       S.domCache.forEach(div=>{
        if(div.requestId=r.id){
          setTimeout(()=>div.infoBox.classList.remove('show','exanded'),1250);
        }
       });
      return;
    }

    // 2. Resume if we fell below target and we aren't user-paused
    if (r.dlPaused && !r.userPaused && needMore && buffAhead < BUFFER_AHEAD_TARGET) {
      r.dlPaused = false;
      r._chunkPending = false;
      r._chunkDone = false;
      S.domCache.forEach(div => { if (div.requestId === r.id) div.infoBox.classList.add('show'); });
      U(`Resuming download – buffer ahead < ${BUFFER_AHEAD_TARGET}s`);

      if (wsAlive) sendChunkRequest(r);
      else {
        r.isRecovering = true;
        try {
          await rotateServer({
            url: r.url, id: r.id,
            bytesReceived: r.expectedOffset ?? r.bytesReceived,
            method: r.method, socketType: 'media'
          }, 'media');
        } finally {
          r.isRecovering = false;
        }
      }
      return;
    }

    // 3. Stalled detection (both chunked and non-chunked)
    //    Works whether wsAlive is true or false: if no data/request activity, rotate.
    const lastLife = Math.max(
      r.lastDataAt || 0,
      r.lastChunkAt || 0,
      r.lastActivity || 0
    );
    const idle = now - lastLife;

    if (needMore && !r.dlPaused && idle > 6000) {
      r.staleRotations = (r.staleRotations || 0) + 1;

      if (r.staleRotations > 10) {
        U('Server keeps dropping – pausing stream.', 'toast');
        r.dlPaused = true;
        r.userPaused = true;
        r.isRecovering = false;
        closeMediaWS();
        showResumeOptions(r);
        return;
      }

      U(`Stall detected (${Math.round(idle / 1000)}s). Rotating #${r.staleRotations}…`);

      r.isRecovering = true;
      try {
        await rotateServer({
          url: r.url, id: r.id,
          bytesReceived: r.expectedOffset ?? r.bytesReceived,
          method: r.method, socketType: 'media'
        }, 'media');
      } finally {
        r.isRecovering = false;
        // do NOT reset lastDataAt here. Only set lastChunkAt so we give the new
        // connection a moment to actually send the restart request.
        r.lastChunkAt = Date.now();
        r._chunkPending = false;
        r._chunkDone = false;
      }
      return;
    }

    // 4. If the socket is dead and we still need data, reconnect
    if (!wsAlive && needMore && !r.dlPaused && !r.isRecovering) {
      U('Media socket missing – reconnecting', 'toast');
      r.isRecovering = true;
      try {
        await rotateServer({
          url: r.url, id: r.id,
          bytesReceived: r.expectedOffset ?? r.bytesReceived,
          method: r.method, socketType: 'media'
        }, 'media');
      } finally {
        r.isRecovering = false;
      }
      return;
    }

   //this is causing biffer errors
    // 5. In chunk mode, fire the next chunk if nothing is in flight
    if (wsAlive && needMore && !r.dlPaused && r.useChunking && !r._chunkPending) {
//      sendChunkRequest(r);
    }

    // 6. Cleanup behind playhead
    const removeUpTo = ct - BUFFER_BEHIND_CLEAN;
    if (removeUpTo > 0) {
      for (const sb of r.ms.sourceBuffers) {
        if (!sb.updating && sb.buffered.length > 0) {
          const start = sb.buffered.start(0);
          if (start < removeUpTo) {
            try { sb.remove(0, removeUpTo); } catch (e) { U(`SB Remove Error: ${e}`); }
          }
        }
      }
    }

    // 7. End-of-stream
    if (r.bytesReceived >= r.totalBytes && r.eosSent && r.ms.readyState === 'open') {
      try { r.ms.endOfStream(); } catch (_) {}
    }
  } finally {
    r.checkingBuffer = false;
    r._checkBufferStartedAt = null;
    S.domCache.forEach(div => {
      if (div.requestId === r.id) updateMSEInfoBox(div);
    });
  }
};

  window.clearRequestTimeouts= () =>{
   const tab = AppState.tabs.find(t=>t.id===AppState.activeTabId);
  if(!tab)return;
   tab.requestTimeouts.forEach((val,key,map)=>{clearTimeout(val),map.delete(key)})
  };

  window.revokeAllRequests=()=>AppState.requests.forEach((val,key,map)=>{
  val.hold=false;val.isOpen=false;revokeRequest(key)
  });

  window.closeAllTabs=()=>AppState.tabs.forEach(tab=>Tabs.close(tab.id));

  window.waitWhile=async(func,criteria,limiter=75)=>{
      let count=0;
    if(func)func();
     while(criteria && criteria() && count <  limiter){
       await DL(100);
       count++
     }
   return count < limiter;
  };
   
  window.fmtTime = s => {
    if (!isFinite(s)) return '0:00';
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
    const mm = m.toString().padStart(2,'0'), ss = sec.toString().padStart(2,'0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };
  
  window.truncate = (str, len=100) => {
    if (str.length <= len) return str;
    const half = Math.floor((len-3)/2);
    return str.slice(0,half)+'...'+str.slice(-half);
  };
  
  window.escapeHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  window.randomId = () => Math.random().toString(36).substr(2,9);

  window.getAuth = () => btoa(`${new Date().getUTCFullYear()}${new Date().getUTCMonth()}${new Date().getUTCDate()}`);

  window.getFileName = url => {
    const p = decodeURIComponent(url.pathname.split('/').pop());
    const idx = p.lastIndexOf('.');
    return idx === -1 ? p : p.substr(0,idx);
  };
  
  // Transform URL with special prefixes and cleaning
  window.transformURL = i => {
    if (i.includes('p:')) {
      if(i.includes('learning.paytel.com')){
       if(i.includes('my/learner_')) return i.split('my/learner_')[0].replace('https://learning.paytel.com','');
       return i.replace('https://learning.paytel.com','');
     }
      return i;
    }
    if (i.includes('traffic.megaphone.fm'))return `https://traffic.megaphone.fm${i.split('traffic.megaphone.fm')[1]}`;
    if (i.startsWith('?')) return `https://search.yahoo.com/search?q=${i.slice(1)}`;
    if (i.startsWith('!')) return `https://search.yahoo.com/search?q=archive.org ${i.slice(1)}`;
   if(i.includes('tnaflix') && i.includes('.mp4') && i.includes('?'))return `https://${i}&br=10000`;
    if (i.includes('anysex.com') && i.includes('/?br=')) return 'https://'+i.split('?br=')[0]+'?br=10000';
    if (i.includes('xcafe.com') && i.includes('/?download=')) return 'https://'+i.split('?download=')[0]+'?br=10000';
    if(i.includes('learning.paytel.com')){
      if (i.includes('my/learner_')) return i.split('my/learner_')[0].replace('https://learning.paytel.com','');
      return i.replace('https://learning.paytel.com','');
    }
    if (i.includes('RU=https://')) {
      let val=i.split('RU=https://')[1].split('/RK=')[0];
      return 'https://' + val;
    }
    return i.startsWith('http') ? i : `https://${i}`;
  };

  // Resolve relative URLs against base
  window.resolveURL = (href) => {
    const S=window.AppState;
    try {
      const activeTab = S.tabs.find(t=>t.id===S.activeTabId);
      const base = activeTab?.url || S.currentProxiedURL || S.baseURL || 'https://archive.org';
      const cleaned = transformURL(decodeURIComponent(href));
      const resolved = new URL(cleaned, base);
      return resolved;
    } catch {
      return null;
    }
  };

  window.fade = async (elem,delay=1750) => {
    const S = window.AppState;
  if(S.isFading && S.currentFadeEl===elem)return;
   S.isFading=true;
    if(S.fadeRaf){
     cancelAnimationFrame(S.fadeRaf);
     S.fadeRaf=null;
    }

    S.currentFadeEl = elem;
    let op = 1;

    elem.style.opacity = 1;
    elem.style.display='block';

    const fadeStep = () => {
      op -= 0.02;
      if (op <= 0) {
        elem.style.opacity = 1;
        elem.style.display = elem.id === 'pg' ? 'block' : 'none';
        if (elem.id === 'pg' || elem.id==='pg2') {
          S.requests.forEach((r,k) => { if (!r.hold && !r.isOpen) window.revokeRequest(k); });
          elem.textContent='';
        }
        S.isFading = false;
        S.currentFadeEl=null;
        S.fadeRaf=null;
        return;
      }
      elem.style.opacity = op;
      S.fadeRaf = requestAnimationFrame(fadeStep);
    };
    if(delay>0){
      await DL(delay);    
      if(!S.isFading)return;
     }
   S.fadeRaf = requestAnimationFrame(fadeStep)
  };

  window.updateDLProgress=txt=>{
   const pg2=$('#pg2');
   pg2.textContent=txt;
   pg2.style.opacity=1;
   pg2.style.display='block';
  };

window.U = (txt, preferMode = null) => {
  const S = window.AppState;
  const mode = preferMode || (S.options.useToast ? 'toast' : 'span');

  if (mode === 'toast') {
    showToast(txt);
    return;
  }

  const pg = $('#pg');

  if (S.fadeRaf) {
    cancelAnimationFrame(S.fadeRaf);
    S.fadeRaf = null;
  }
  S.isFading = false;

  pg.textContent = txt;
  pg.style.opacity = 1;
  pg.style.display = 'block';
};

window.showToast = (txt) => {
  const c = $('#toastContainer');
  if (!c) return;
  const t = el('div');
  t.className = 'toast';
  t.textContent = txt;
  c.appendChild(t);

  // cap visible toasts
  const all = $$('.toast', c);
  while (all.length > 4) all.shift().remove();

  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
  }, 3000);
};

  window.Tabs= {
    create(url=null, title='New Tab', activate=true){
      const S=window.AppState;
      const id=S.nextTabId++;
      
      const tab={
        id,
        url:url || '',
        title,
        fragment: document.createDocumentFragment(),
        scrollPos:0,
        history:[],
        requestTimeouts: new Map(),
        autoChecked: false
      };
     S.tabs.push(tab);
     if(activate)this.switch(id);
     else this.render();
     $('#tab-bar').style.display='flex';
     return id;
    },

   switch(id){
    const S=window.AppState;
    if(S.activeTabId===id)return;
   
    //save current state
    const cur=S.tabs.find(t=>t.id===S.activeTabId);
    if(cur){
      if(S.prevTabId !== cur.id)S.prevTabId=cur.id;
      cur.scrollPos=$('#ct').scrollTop;
      cur.url= $('#iu').value;
      const sr=$('#ct').shadowRoot;
      cur.autoChecked=$('#cb').checked;
      while(sr.firstChild)cur.fragment.appendChild(sr.firstChild);
    }

    //restore tab
    S.activeTabId=id;
    const next=S.tabs.find(t=>t.id===id);
    const sr=$('#ct').shadowRoot;
    sr.innerHTML='<style>{box-sizing:border-box} img,video,audio{max-width:100%}</style>';
    while(next.fragment.firstChild)sr.appendChild(next.fragment.firstChild);

    $('#ct').scrollTop=next.scrollPos || 0;
    $('#iu').value=next.url || '';
   $('#cb').checked = next.autoChecked;

     this.render();
   },

   close(id){
    const S=window.AppState;
    const idx=S.tabs.findIndex(t=>t.id===id);
    if(idx===-1)return;

   const tab=S.tabs[idx];

   tab.requestTimeouts.forEach((timeout,key)=>clearTimeout(timeout));
   tab.requestTimeouts.clear();

 try{
  for(const [reqId,req] of S.requests) {
   if(req.tabId===tab.id){
     revokeRequest(reqId);
     U('');
    }
   }
  } catch(e){U(e)}
   $$('img[src^="blob:"], video[src^="blob:"]',tab.fragment).forEach(el=>URL.revokeObjectURL(el.src));

    tab.fragment.textContent='';

    S.tabs.splice(idx,1);

    if(S.activeTabId===id){
     if(S.tabs.length===0){
      this.create(null,null,true);
      $('#ct').shadowRoot.innerHTML='<style>{box-sizing:border-box} img,video,audio{max-width: 100%}</style><h2 style="color:#888;padding:24px">New Tab</h2>';
      }else{
        const stillExists=S.tabs.find(t=>t.id===S.prevTabId);
          if(stillExists){
           this.switch(S.prevTabId);
          }else{
             this.switch(S.tabs[Math.max(0,idx-1)].id);
          }
      }
     }else this.render();

     if(S.tabs.length===0) $('#tab-bar').style.display='none';
   },

   render(){
     const S=window.AppState, bar=$('#tab-bar');
     bar.innerHTML='';
     S.tabs.forEach(tab=>{
      const div=el('div');
      div.className='tab'+(tab.id===S.activeTabId ? ' active' : '');
      div.title=(tab.title || 'Unknown')+'\n'+(tab.url || '');
      div.innerHTML=`<span class="tab-title">${escapeHtml(tab.title||'New Tab')}</span><button class="tab-close" style="background:#c00;opacity:0.8" data-id="${tab.id}">×</button>`;
      div.onclick=e=>{
       if(e.target.classList.contains('tab-close'))this.close(tab.id);
       else this.switch(tab.id);
      };
     bar.appendChild(div);
     });
    const btnStop=el('button');
    btnStop.id='btn-stop-download';
    btnStop.textContent='⏹ Stop';
    bar.appendChild(btnStop);

    const addBtn=el('button');
    addBtn.id='btnAddTab';
    addBtn.textContent='➕';
    addBtn.onclick=()=>this.create();
    bar.appendChild(addBtn);

    setupStopBtn();
    updateStopButton();
   },

   pushHistory(url, tabId){
    const tab=window.AppState.tabs.find(t=>t. id===tabId);
    if(tab){
       if(!tab.history.length||tab.history[tab.history.length-1].href!==url.href)tab.history.push(url);
    }
   },

   updateMeta(url,title){
     const tab=window.AppState.tabs.find(t=>t.id===window.AppState.activeTabId);
     if(tab){
        tab.url=url;tab.title=title||tab.title;
        this.render();
     }
   }
  };
})();

//## Section 3: WebSocket, Requests & Batch Image Handling

(function initNetwork() {
  const S = window.AppState;
  
const IMAGE_BATCH_SIZE      = 9;
const MAX_CONCURRENT_IMAGES = 3;   // lower = fewer CF subrequest errors
const IMAGE_BATCH_TIMEOUT   = 9000;
const IMAGE_PER_TIMEOUT     = 4000;
const MAX_IMAGE_ATTEMPTS    = 6;

function getUnloadedImages() {
  return Array.from($('#ct').shadowRoot.querySelectorAll('img[data-pq]'))
    .filter(img => !img.naturalWidth);
// && !img.src.startsWith('blob:'));
//&& !img.dataset.loading);
}

function loadOneImage(img) {
  return new Promise(resolve => {
    if (img.naturalWidth || img.src.startsWith('blob:')) { resolve(); return; }
    img.dataset.loading = 'true';
    const url = new URL(img.dataset.pu);
    const id  = img.dataset.pq;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (!img.naturalWidth && !img.src.startsWith('blob:'))
        delete img.dataset.loading;
      resolve();
    };

    img.addEventListener('load',  finish, { once: true });
    img.addEventListener('error', finish, { once: true });
    const t = setTimeout(finish, IMAGE_PER_TIMEOUT);
    sendRequest(url, id, false, 0, 'GET', null, false);
  });
}

async function runImageBatch(batch) {
  let active = 0, finished = 0, resolved = false;
  const start = Date.now();

  return new Promise(resolve => {
    const check = () => {
      if (resolved) return;
      if (finished >= batch.length || Date.now() - start > IMAGE_BATCH_TIMEOUT) {
        resolved = true;
        batch.forEach(img => {
          if (!img.naturalWidth && !img.src.startsWith('blob:')) delete img.dataset.loading;
        });
        resolve();
      }
    };

    const next = () => {
      while (active < MAX_CONCURRENT_IMAGES && batch.length > 0) {
        const img = batch.shift();
        active++;
        loadOneImage(img).finally(() => { active--; finished++; next(); check(); });
      }
      if (active === 0) check();
    };

    setTimeout(check, IMAGE_BATCH_TIMEOUT);
    next();
  });
}

async function processImageQueue() {
  const S = window.AppState;
  while (S.downloadingImages && S.imageAttempts < MAX_IMAGE_ATTEMPTS) {
    const batch = getUnloadedImages().slice(0, IMAGE_BATCH_SIZE);
    if (batch.length === 0) break;

    S.imageAttempts++;
    await runImageBatch(batch);

    if (S.downloadingImages && getUnloadedImages().length > 0) {
      await rotateServer();          // rotate the text proxy
      await DL(250);                 // small CF breath
    }
  }
}

window.startBatchDownload = async () => {
  const S = window.AppState;
  const shadow = $('#ct').shadowRoot;

  if (S.downloadingImages) {
    S.downloadingImages = false;
    $('#bs').value = '↓';
    U('Image download stopped');
    return;
  }

  const images = $$('img[data-pq]', shadow).filter(img =>
    !img.naturalWidth && !img.src.startsWith('blob:'));

  if (images.length === 0) {
    U('No images to download');
    return;
  }

  S.downloadingImages = true;
  S.imageAttempts = 0;
  $('#bs').value = '⏹';
  U(`Batch downloading ${images.length} images...`);

  await processImageQueue();

  S.downloadingImages = false;
  $('#bs').value = '↓';

  const remaining = $$('img[data-pq]', shadow).filter(img =>
    !img.naturalWidth && !img.src.startsWith('blob:')).length;

  if (remaining === 0) U('All images loaded');
  else U(`Stopped. ${remaining} images remaining.`, 'toast');
};

  window.updateStopButton=()=>{
   const btn = $('#btn-stop-download');
   if(!btn)return;

   const isDL = S.videoDownloading || S.audioDownloading || S.pdfDownloading;

   if(isDL){btn.classList.add('show');}
   else {btn.classList.remove('show');}
  };

  window.updateConnectionIndicator=()=>{
   const sv=$('#sv');

   //top half
   if(S.isConnected){sv.classList.add('connected');}
   else {sv.classList.remove('connected')}
   
   //bottom
   if(S.isMediaConnected){
     sv.classList.add('media-connected');
   }
  else{ sv.classList.remove('media-connected');}
  };

// ---------- WebSocket pool helpers ----------

window.prewarmConnection = (idx, socketType = 'text', req = null) => new Promise((resolve, reject) => {
  const serverList = window.getServerList(socketType, req);
  const host = serverList[Math.abs(idx) % serverList.length];
  const ws = new WebSocket(`wss://${host}.paytel.workers.dev`);
  ws.binaryType = 'arraybuffer';

  let done = false;
  const finish = (ok) => {
    if (done) return;
    done = true;
    if (ok) {
      resolve(ws);
    } else {
      try { ws.close(); } catch (_) {}
      reject(new Error('prewarm failed'));
    }
  };

  ws.onopen  = () => finish(true);
  ws.onclose = () => finish(false);
  ws.onerror = () => finish(false);

  // Cloudflare seems to be slow on cold starts
   setTimeout(() => finish(false), 15000);
});

window.bindSocket = (ws, socketType) => {
  const S = window.AppState;
  const isMedia = socketType === 'media';
  const wsKey = isMedia ? 'wsMedia' : 'ws';
  const connKey = isMedia ? 'isMediaConnected' : 'isConnected';

  ws.onclose = async () => {
     if (ws._isCandidate) {
    if (S[wsKey] === ws) S[wsKey] = null;
    S[connKey] = false;
    updateConnectionIndicator();
    return;
  }
    S[connKey] = false;
    if (S[wsKey] === ws) S[wsKey] = null;
    updateConnectionIndicator();

    const autoChecked = $('#cb').checked;
    for (const [id, r] of S.requests) {
      if (!r.isOpen || r.socketType !== socketType) continue;
     if(r.useChunking){r._chunkPending=false;r._chunkDone=false; }
      if (r.bytesReceived >= r.totalBytes && r.totalBytes > 0) {
        r.isOpen = false;
        continue;
      }
      if (r.usesMSE && (r.dlPaused || r.isRecovering)) continue;

      if ((autoChecked && (r.isVideo || r.isAudio || r.isPDF)) || (r.usesMSE && !r.dlPaused)) {
        S.videoDownloading = r.isVideo;
        S.audioDownloading = r.isAudio;
        updateStopButton();
        await rotateServer({
          url: r.url, id: r.id, bytesReceived:r.expectedOffset ?? r.bytesReceived,
          method: r.method, socketType
        }, socketType);
        return;
      } else if (!autoChecked && (r.isVideo || r.isAudio || r.isPDF)) {
        if (isMedia) {
          U(`Connection lost. Downloaded ${(r.bytesReceived / 1048576).toFixed(2)}MB`);
        }
        showResumeOptions(r);
        return;
      }
    }
  };

  ws.onerror = (err) => {
    S[connKey] = false;
    U(`WS Error: ${err.message || err}`);
    try { ws.close(); } catch (_) {}
    updateConnectionIndicator();
  };

  ws.onmessage = (ev) => {
    if (ev.data instanceof ArrayBuffer) handleBinary(ev.data,ws._epoch);
    else handleText(ev.data,ws._epoch);
  };
};

window.activateSocket = (ws, socketType, resumeRequest) => {
  const S = window.AppState;
  const isMedia = socketType === 'media';
  const wsKey = isMedia ? 'wsMedia' : 'ws';
  const connKey = isMedia ? 'isMediaConnected' : 'isConnected';

  S[wsKey] = ws;
  S[connKey] = true;
const newEpoch = ++S.wsEpoch;
ws._epoch = newEpoch;
S[wsKey + '_epoch'] = newEpoch;
  delete ws._isCandidate;

  fade($('#pg'));
  setTimeout(()=>updateConnectionIndicator(),75)

  if (S.firstLoad && !isMedia) {
    S.firstLoad = false;
    setTimeout(() => {
      if (S.tabs.length === 0) {
        Tabs.create(null, 'Home', true);
        loadLandingPage();
      }
    }, 150);
  }

  if (resumeRequest) {
    const r = S.requests.get(resumeRequest.id);
  //  if (r) r.wsEpoch = newEpoch;
  }

  if (resumeRequest && resumeRequest.socketType === socketType) {
    const { url, id, bytesReceived, method } = resumeRequest;
    sendRequest(url, id, false, bytesReceived, method, null, false);
  }
};

window.createAndConnectWS = (serverIdx, socketType, resumeRequest) => {
  return new Promise((resolve) => {
    const S = window.AppState;
    const isMedia = socketType === 'media';
    const wsKey = isMedia ? 'wsMedia' : 'ws';
    const serverList = window.getServerList(socketType, resumeRequest);
    const safeIdx = Math.abs(serverIdx ?? 0) % serverList.length;
    const sv = serverList[safeIdx];

    let resolved = false;
    const ws = new WebSocket(`wss://${sv}.paytel.workers.dev`);
    ws._isCandidate = true;
    ws.binaryType = 'arraybuffer';

   if(S[wsKey] && S[wsKey]!==ws){
   try{ 
     S[wsKey].onclose = S[wsKey].onopen = S[wsKey].onmessage = S[wsKey].onerror = null;
   }catch(_){S[wsKey]=null}
   S[wsKey]=null;
   }
    S[wsKey] = ws;

    ws.onopen = () => {
      if (resolved) return;
      bindSocket(ws,socketType);
      resolved = true;
      activateSocket(ws, socketType, resumeRequest);
      resolve(true);
    };

    const fail = () => {
      if (resolved) return;
      resolved = true;
      resolve(false);
    };

    const origClose = ws.onclose;
    ws.onclose = async function (e) {
      fail();
      await origClose.call(ws, e);
    };
    const origError = ws.onerror;
    ws.onerror = function (e) {
      fail();
      origError.call(ws, e);
    };
  });
};
 window.evictDeadSpares = (socketType) => {
  const pool = AppState.wsPool[socketType];
  if (!pool) return;
  const now = Date.now();
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    const stale = p.ws.readyState !== WebSocket.OPEN ||
                  (p.createdAt && now - p.createdAt > 45000);//1 min
    if (stale) {
      try { p.ws.close(); } catch (_) {}
      pool.splice(i, 1);
    }
  }
};

window.getNextPoolCandidate = (socketType, fromIdx) => {
  const S = AppState;
  const idxKey = socketType === 'media' ? 'mediaServerIndex' : 'serverIndex';
  const activeIdx = S[idxKey];
  const pool = S.wsPool[socketType];
  const serverList = window.getServerList(socketType);
  let idx = fromIdx;
  for (let i = 0; i < serverList.length; i++) {
    idx = (idx + 1) % serverList.length;
    if (idx === activeIdx) continue;
    if (pool.some(p => p.idx === idx)) continue;
    return idx;
  }
   if (pool.length) {
    const oldest = pool.reduce((a, b) => a.createdAt < b.createdAt ? a : b);
    return oldest.idx;
  }
  // fallback if every server is already in use
  return (fromIdx + 1) % serverList.length;
};

window.prewarmPool = async (socketType) => {
  const S = window.AppState;
  const lockKey = socketType + '_prewarming';
  const cursorKey = socketType + '_poolCursor';

  if (S[lockKey]) return S[lockKey];              // already warming this type

  const max = S.wsPoolMax?.[socketType] || 1;
  evictDeadSpares(socketType);
  if (S.wsPool[socketType].length >= max) return; // already full

  const serverList = window.getServerList(socketType);
  const idxKey = socketType === 'media' ? 'mediaServerIndex' : 'serverIndex';
  let cursor = S[cursorKey] ?? S[idxKey];

  S[lockKey] = (async () => {
    try {
      let noProgress = 0;

      while (S.wsPool[socketType].length < max && noProgress < serverList.length) {
        let added = false;

        for (let i = 0; i < serverList.length && S.wsPool[socketType].length < max; i++) {
          const idx = getNextPoolCandidate(socketType, cursor);
          cursor = idx;

          try {
            const ws = await prewarmConnection(idx, socketType);
          if (ws.readyState !== WebSocket.OPEN) {//check for open
            noProgress++;
            continue;
          }

            // Pool-only handlers; active handlers are installed by bindSocket() later
            ws.onclose = () => evictDeadSpares(socketType);
            ws.onerror = () => {
              evictDeadSpares(socketType);
              try { ws.close(); } catch (_) {}
            };ws.onopen=null;
          S.wsPool[socketType].push({ ws, idx, createdAt: Date.now() });
            added = true;
            noProgress = 0;    // reset because we got a socket
            break;             // fill one slot per loop, then refresh pool state
          } catch (e) {
            noProgress++;
          }
        }
        if (!added) break;
      }

      S[cursorKey] = cursor;
    } finally {
      S[lockKey] = null;
    }
  })();
  return S[lockKey];
};

window.useSpareWS = (socketType) => {
  evictDeadSpares(socketType);
  const pool = AppState.wsPool[socketType];
  if (pool.length) {
    const { ws, idx } = pool.shift();
    // remove pool handlers before binding this socket as the active one
    ws.onclose = ws.onerror = ws.onopen=ws.onmessage= null;
    ws._isCandidate = false
    return { ws, idx };
  }
  return null;
};

// ----------  connect/rotate ----------
 window.connectWS = (resumeRequest = null, socketType = 'text') => {
  return new Promise(async (resolve) => {
    const S = window.AppState;
    const isMedia = socketType === 'media';
    const wsKey = isMedia ? 'wsMedia' : 'ws';
    const idxKey = isMedia ? 'mediaServerIndex' : 'serverIndex';

    const spareObj = useSpareWS(socketType);
    if (spareObj) {
      S[idxKey] = spareObj.idx;
      S[wsKey] = spareObj.ws;

      bindSocket(spareObj.ws, socketType);
      activateSocket(spareObj.ws, socketType, resumeRequest);
      resolve(true);

      // make sure the pool is full again for the next rotation
      prewarmPool(socketType).catch(() => {});
      return;
    }

    const ok = await createAndConnectWS(S[idxKey], socketType, resumeRequest);
    prewarmPool(socketType).catch(() => {});
    resolve(ok);
  });
};

window.rotateServer = async (resumeObj = null, socketType = 'text') => {
  const S = window.AppState;
  const isMedia = socketType === 'media';
  const idxKey = isMedia ? 'mediaServerIndex' : 'serverIndex';
  const wsKey = isMedia ? 'wsMedia' : 'ws';
  const rotKey = isMedia ? 'medRotating' : 'txtRotating';

   // throttle new connections so I don't hammer CF during a death spiral
   const lastRotate = S._lastRotateAt?.[socketType] || 0;
  const wait = Math.max(0, 200 - (Date.now() - lastRotate));
  if (wait) await DL(wait);
  S._lastRotateAt = S._lastRotateAt || {};
  S._lastRotateAt[socketType] = Date.now();

  if (S[rotKey]) {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (!S[rotKey]) {
          clearInterval(check);
          rotateServer(resumeObj, socketType).then(resolve);
        }
      }, 50);
    });
  }

  S[rotKey] = true;
  try {
    if (S[wsKey]) {
      const active = S[wsKey];
      active.onclose = active.onerror = active.onmessage = active.onopen = null;
      try { active.close(); } catch (_) {}
      S[wsKey] = null;
    }

    S[isMedia ? 'isMediaConnected' : 'isConnected'] = false;
    updateConnectionIndicator();

    const spareObj = useSpareWS(socketType);
    if (spareObj) {
      S[idxKey] = spareObj.idx;
      S[wsKey] = spareObj.ws;
      bindSocket(spareObj.ws, socketType);
      activateSocket(spareObj.ws, socketType, resumeObj);
      prewarmPool(socketType).catch(() => {});
    } else {
      const serverList = window.getServerList(socketType);
      S[idxKey] = (S[idxKey] + 1) % serverList.length;
      let ok = await connectWS(resumeObj, socketType);
      if (!ok && resumeObj) ok = await connectWS(resumeObj, socketType);
    }
  } catch (e) {
    U(e);
  } finally {
    S[rotKey] = false;
    if(resumeObj && resumeObj.id){
      const req = S.requests.get(resumeObj.id);
      if(req)req.lastActivity = Date.now();
    }
    prewarmPool(socketType).catch(() => {});
  }
};

window.showResumeOptions=(r)=>{
  const container = $('#ct').shadowRoot || document.body;
   const existing =$('#resume-dialog',container);
   if(existing)existing.remove();
 
 const div = el('div');
   div.id='resume-dialog';

  div.style.cssText= 'position: fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2a2a2a;padding:20px;border: 1px solid #4a9eff;z-index:1000000;border-radius:8px;box-shadow:0 0 20px rgba(0,0,0,0.8)';
   div.innerHTML=`
    <p>Download interrupted</p>
    <button id="btnPlayPart" style="margin:5px;padding:8px">Play Partial</button>
    <button id="btnResume" style="margin:5px;padding:8px">Continue Download</button>
    <button id="btnCancelRequest" style="margin:5px;padding:8px;background:#c00;color:#fff;border:none;border-radius:4px">Cancel</button>
   `;

   div.style.zIndex=12000000000;
   container.appendChild(div);

   $('#btnPlayPart',container).onclick=()=>{
    div.remove();
    r.isOpen = false;S.videoDownloading=false;S.audioDownloading=false;
    handleEndOfStream(r);
   };
  
   $('#btnResume',container).onclick = async ()=>{
   div.remove();
   r.dlPaused=false;
    r.isRecovering=false;
    r._chunkPending=false;
    r.userPaused=false;
    if(r.staleRotations)r.staleRotations=0;
    const resumeObj = {url: r.url,id: r.id,bytesReceived: r.bytesReceived,method: r.method,socketType:r.socketType || 'text'};
  S['medRotating']=false;S['txtRotating']=false;
   await rotateServer(resumeObj,r.socketType || 'text');
   };

  $('#btnCancelRequest',container).onclick = async ()=>{
   div.remove();
   r.isOpen= false;
   r.hold=false;
   r.chunks=[];
     if(r.objectUrl)URL.revokeObjectURL(r.objectUrl);
   if(r.isVideo)S.videoDownloading=false;
   if(r.isAudio)S.audioDownloading=false;
   if(r.isPDF)S.pdfDownloading=false;
   updateStopButton();
   closeMedia(r.id);
   U('Download Cancelled Sucka','toast');
 //setTimeout(()=>fade($('#pg')),2000);
   $('#pb').style.width='0%';
    connectWS(null,'media');
  };
};
 
  window.isMedia = (url) =>{
    const ext=url.pathname.toLowerCase();
    return ['.mp4', '.webm', '.mp3', '.flac', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.m4a', '.mkv', '.ogg', '.ogv','.wav','.bmp'].some(e=>ext.includes(e));
  };

//*****SEND REQ*********
  window.sendRequest = async (urlObj, id, trackHistory, byteStart=0, method='GET', byteEnd=null, isLink=false) => {
    const S = window.AppState;
    const tab =S.tabs.find(t=>t.id===S.activeTabId);
  //  if(!tab)return;
    let url = typeof urlObj === 'string' ? 
     new URL(transformURL(urlObj), tab?.url || S.currentProxiedURL || 'https://archive.org') : urlObj;

   if(url.href.includes('https//'))url=new URL(url.href.replace('https//',''));
   if(url.href.includes('ai.clo')){location.href='https://paytel.com';return;}
  if(url.href.includes('close.tabs')){closeAllMedia();closeAllTabs();return;}
 
   if (!id) id = randomId();

    const ext = url.pathname.toLowerCase();
    const isVideo = ['.mp4','.webm','.ogv','.mkv'].some(e => ext.includes(e));
    const isAudio = ['.mp3','.flac','.m4a','.ogg','.wav'].some(e => ext.includes(e));
    const isImage = ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.svg'].some(e => ext.includes(e));
    const isPDF = ext.endsWith('.pdf');
    const isMedia = isVideo || isAudio || isImage || isPDF;

    //determine socket type and ensure connection
    const socketType = (isMedia && !isImage) ? 'media' : 'text';//keep images on text ws
    const wsKey = (isMedia && !isImage) ? 'wsMedia' : 'ws';
    const connKey = (isMedia && !isImage) ? 'isMediaConnected' : 'isConnected';

   if(!S[connKey]){
     U(`${isMedia && !isImage ? 'Media' : 'Text'} WS not ready, connecting..`);
     const connected = await connectWS(null,socketType);
     if(!connected){
     U(`Failed to connect ${isMedia && !isImage ? 'Media' : 'Text'} WS`);
      return;
     }
   }
     const originatingTabId = S.activeTabId;

    if (!S.requests.has(id)) {
      S.requests.set(id, {
        id, url, chunks: [], bytesReceived: byteStart, totalBytes: 0,
        isOpen: true, isMedia, isVideo, isAudio, isImage, isPDF,
        contentType: '', objectUrl: null, hold: (isVideo ||isAudio||isPDF), method, byteEnd,isLink,
        retryCount: 0, linkText: window.linkText || getFileName(url),
        usesMSE: false, mp4boxFile: null, ms: null,
        tabId: originatingTabId,socketType: socketType,
        lastActivity: Date.now(),lastDataAt: Date.now(),dlPaused: false,isRecovering: false,expectingData: true
      });
    } else{
      const existing = S.requests.get(id);
        existing.isOpen=true;
      existing.dlPaused=false;
      existing.lastActivity=Date.now();
       existing.lastDataAt=Date.now();
      existing.bytesReceived=byteStart;
    }

    const r = S.requests.get(id);

    // ---------- media range chunking ----------
    if (r && socketType === 'media' && byteEnd === null) {
      const wantsChunking = r.useChunking || (
        S.options.useMediaChunking &&
        (isVideo || isAudio || isPDF) &&
        !isImage        // keep images on text socket
      );
      if (wantsChunking) {
        r.useChunking = true;
        if (!r.chunkSize) r.chunkSize = S.options.mediaChunkSize || 1048576;
        byteEnd = byteStart + r.chunkSize;
       r._chunkPending=true;
       r._chunkDone=false;
       r.lastChunkAt=Date.now();
        r.lastDataAt  = Date.now();
      }
    }

    // never ask past EOF once we know the real size
    if (r && r.totalBytes > 0 && byteEnd !== null && byteEnd > r.totalBytes) {
      byteEnd = r.totalBytes;
    }

    // keep expected offset + current chunk in sync 
    if (r){
       r.expectedOffset = byteStart;
      if(byteEnd!==null)r.chunkEnd=byteEnd
     }

    const reqTab=S.tabs.find(t=>t.id===r.tabId);

   if ((isMedia && isLink) || isLink) {
     reqTab?.requestTimeouts.set(id,setTimeout(()=>{
        if(reqTab.id===S.activeTabId){
          U(`Time Out: ${truncate(r.url.href)}`); 
          $('#iu').value = r.url.href;
          r.isOpen=false;
          r.hold=false;
          revokeRequest(r.id);
        }
        setTimeout(()=>fade($('#pg')),2000);
       },S.timeoutMS));
    }

    const msg = {
      u: url.toString(), 
      q: id, 
      au: getAuth(), 
      os: byteStart, 
      method 
    };

    if (byteEnd !== null) msg.oe = byteEnd;

    try {
      if(S[wsKey].readyState===WebSocket.OPEN){
      S[wsKey].send(JSON.stringify(msg));
      if(trackHistory || isLink) {
        U(decodeURIComponent(`Proxying: ${truncate(url.hostname + url.pathname + url.search)}`));
       }
      }else{
       throw new Error('WebSocket not open');
     }
    } catch(e) {
   U(`Send failed, rotating server..`);
     if(r.useChunking){r._chunkPending=false;r._chunkDone = false;}
    setTimeout(() => rotateServer({
      url: r.url,
      id: r.id,
      bytesReceived: r.expectedOffset ?? r.bytesReceived,
      method: r.method,
      socketType
    }, socketType), 0);
     }
  };
 window.sendChunkRequest = (r) => {
  const S = window.AppState;
  if (
    !r?.useChunking ||
    r.dlPaused ||
    r.isRecovering ||
    r.fatalError ||
    r._chunkPending ||
    r.bytesReceived >= r.totalBytes
  ) return;

  const ws = S.wsMedia;
  if (!ws || ws.readyState !== WebSocket.OPEN || S.medRotating) return;

  const size = r.chunkSize || S.options.mediaChunkSize || 1048576;
  const start = r.bytesReceived;          // always fetch from the committed offset
  const end = r.totalBytes > 0 ? Math.min(r.totalBytes, start + size) : start + size;
  if (end <= start) return;

  r._chunkPending = true;
  r._chunkDone = false;                    
  r.chunkEnd = end;
  r.lastChunkAt = Date.now();

  try {
    sendRequest(r.url, r.id, false, start, r.method, end, false);
  } catch (e) {
    r._chunkPending = false;
  }
};
 
  function handleText(txt,epoch) {
    const S = window.AppState;
    const data = JSON.parse(txt);
    const r = S.requests.get(data.q);
    if (!r) return;

    r.lastActivity=Date.now();
    // ignore delayed packets from a WebSocket I already replaced
  const activeEpoch = S[r.socketType === 'media' ? 'wsMedia_epoch' : 'ws_epoch'];
  if (activeEpoch && epoch !== activeEpoch) return;
    const tab = S.tabs.find(t=>t.id===r.tabId);
    if(!tab){revokeRequest(r.id);return;}

    r.contentType = data.c || '';
    
    if (data.t === 's') {
      r.totalBytes =r.totalBytes > 0 ? r.totalBytes : JSON.parse(data.d).totalLength;
      r.isVideo =  r.contentType.startsWith('video');
      r.isAudio = r.contentType.startsWith('audio');
      r.isImage = r.contentType.startsWith('image');

     if(r.isAudio)S.audioDownloading=true;
     if(r.isVideo)S.videoDownloading=true;
      if(r.isPDF)S.pdfDownloading=true;
     updateStopButton();

      clearTimeout(tab.requestTimeouts.get(r.id));
      tab.requestTimeouts.delete(r.id);

    const threshold=S.options?.mseThresholdMB || 45;
    const thresholdBytes = threshold *1024 *  1024;
      if (r.totalBytes > thresholdBytes && r.isVideo && S.mp4box) {
         r.usesMSE = true;        
         initMSE(r);
      }
    } else if (data.t === 'r') {
      r.isOpen = false;
      if (r.contentType.includes('html')){
      //successful proxy
      if(S.backing){
       S.backing=false
       tab.history.pop();
      }
         handleHTML(data.d, r);
      
         S.currentProxiedURL= r.url;
        clearInterval(tab.requestTimeouts.get(r.id));
        tab.requestTimeouts.delete(r.id);
        if($('#cb').checked)fetchPageStyles(data.d,r.url);   
      }
      else if (r.contentType.includes('css')) injectCSS(data.d);
      else if (r.contentType.includes('javascript')) injectJS(data.d);
      else if(r.contentType.includes('octet')) handleOctet(data.c);
      else $('#ct').shadowRoot.innerHTML += `<pre>${data.d}\n\n${escapeHtml(data.d)}</pre>`;
     revokeRequest(r.id);
    } else if (data.t === 'e') {
      // chunked ranges can finish before the whole file; keep going
    if (r.useChunking && !r.fatalError && r.bytesReceived < r.totalBytes) {
   if(!r._chunkDone){
     r._chunkDone=true;
    r._chunkPending = false;
    sendChunkRequest(r);
    }
    return;
  }
     r.isOpen = false;
      finalizeRequest(r);
    } else if (data.t === 'er') {
      U(`Error: ${data.d}`);
      r.isOpen = false;
      revokeRequest(r.id);
    }
  }

  function handleBinary(buf,epoch) {
    const S = window.AppState;
    const bytes = new Uint8Array(buf);
    const reqId = new TextDecoder().decode(bytes.subarray(0,9)).trim();
    const payload = bytes.subarray(9);
    const r = S.requests.get(reqId);
    if (!r) return;
    const activeEpoch = S[r.socketType === 'media' ? 'wsMedia_epoch' : 'ws_epoch'];
  if (activeEpoch && epoch !== activeEpoch) return;

     r.lastActivity=Date.now();
    if (r.usesMSE) {
     r.lastChunkAt=Date.now();
      // --- validate contiguous payload before accepting it ---
      const chunkStart = r.bytesReceived;
      const chunkEnd = chunkStart + payload.length;

      if (r.expectedOffset !== undefined && chunkStart !== r.expectedOffset) {
        if (chunkStart < r.expectedOffset) {
          // stale/duplicate packet from a previous socket — ignore
          return;
        }
        if (!r.isRecovering && !AppState.medRotating) {
          U(`Offset gap (${chunkStart} vs ${r.expectedOffset}). Re-syncing…`, 'toast');
          r._chunkPending = false;
          r.isRecovering = true;
          rotateServer({
            url: r.url,
            id: r.id,
            bytesReceived: r.expectedOffset,
            method: r.method,
            socketType: 'media'
          }, 'media').finally(() => { r.isRecovering = false; });
        }
        return;
      }
     r.lastActivity = Date.now();
r.lastDataAt   = Date.now();        
r.lastChunkAt  = Date.now();
      r.bytesReceived = chunkEnd;
      r.expectedOffset = r.bytesReceived;

      if(!r.chunkAcc){
         r.chunkAcc=[];
         r.accSize=0;
      }
      r.chunkAcc.push(payload);
      r.accSize+=payload.length;
    if(!r.sessionDL)r.sessionDL=0;
     r.sessionDL+=payload.length;

    const pct = Math.min((r.bytesReceived/r.totalBytes)*100,100).toFixed(1);
    updateDLProgress(`Streaming: ${pct}% • ${(r.bytesReceived/1048576).toFixed(2)}MB`);
  //const ACC_THRESHOLD = r.moovParsed ? Math.min(1024*1024,Math.max(512*1024,(r.bitrate || 5000000)/5)) : 512*1024;
     const ACC_THRESHOLD = r.moovParsed ? Math.max(2*1024*1024,(r.bitrate || 5000000)/5) : 512 * 1024;
// r.moovParsed ?  2 * 1024 * 1024 : 0.75 * 1024*1024;
    
     if(r.accSize >= ACC_THRESHOLD || (r.bytesReceived>=r.totalBytes)){
       const accumulated = new Uint8Array(r.accSize);
        let offset =0;
        for(const chunk of r.chunkAcc){
          accumulated.set(chunk, offset);
          offset+=chunk.length;
        }
      r.chunkAcc=[];
      r.accSize=0;

      const ab = accumulated.buffer.slice(accumulated.byteOffset, accumulated.byteOffset + accumulated.byteLength);

    ab.fileStart= r.bytesReceived - accumulated.length;
     if(!r.mp4boxFile) { 
       if(!r.pendingMP4Chunks)r.pendingMP4Chunks = [];
       r.pendingMP4Chunks.push(ab);
     }else{
       if(!r.mp4Queue)r.mp4Queue=[];
       r.mp4Queue.push(ab);
       if(!r.mp4Processing)processMP4Queue(r);
     }
    }
  
   if (
  r.useChunking &&
  r.totalBytes > 0 &&
  r.bytesReceived >= r.chunkEnd &&
  r.bytesReceived < r.totalBytes
) {
  if (!r._chunkDone) {
    r._chunkDone = true;
    r._chunkPending = false;
    if (!r.dlPaused && !r.isRecovering && !r.fatalError && !AppState.medRotating) {
     setTimeout(()=>sendChunkRequest(r),0);
    }
  }
}
      return;
    }
  r.bytesReceived+=payload.length;
   
    r.chunks.push(payload);
    
    if (r.totalBytes > 0 && (r.isAudio || r.isVideo || r.isPDF)) {
      const pct = (r.bytesReceived / r.totalBytes * 100).toFixed(1);
      $('#pb').style.width = `${pct}%`;
      updateDLProgress(`Download Progress: ${(r.bytesReceived/1048576).toFixed(2)}MB / ${(r.totalBytes/1048576).toFixed(2)}MB (${pct}%)`);
     updateStopButton();
    }
  }

   function processMP4Queue(r) {
    if (!r.mp4boxFile || !r.mp4Queue || r.mp4Queue.length === 0) {
      r.mp4Processing = false;
      return;
    }
    r.mp4Processing = true;
    const ab = r.mp4Queue.shift();
    
    try {
 r.mp4boxFile.appendBuffer(ab);
       r.mp4Retries=0;
    } catch(e) {
      if(e.name === 'QuotaExceededError') {
        r.mp4Retries=(r.mp4Retries || 0)+1;
         if(r.mp4Retries > 5){stopMSEStream(r,'MP4 quota loop');return}
        checkBuffer(r, true); // aggressive cleanup
        r.mp4Queue.unshift(ab); // requeue
        setTimeout(() => processMP4Queue(r), 500); // wait before retrying
        return;
      } else if (e.name.toLowerCase() !== 'typeerror') {
        U(`MP4 Append Error: ${e.message || e}`);
      }
    }
    
    // Yield to the event loop! Allows video to paint and prevent CPU lockup.
    setTimeout(() => processMP4Queue(r), 0);
  }
   
/*function processMP4Queue(r) {
  if (!r.mp4boxFile || !r.mp4Queue || r.mp4Queue.length === 0) {
    r.mp4Processing = false;
    return;
  }
  r.mp4Processing = true;
  let count = 0;
  while (r.mp4Queue.length && count < 3) {
    const ab = r.mp4Queue.shift();
    count++;
    try {
      r.mp4boxFile.appendBuffer(ab);
      r.mp4Retries = 0;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        r.mp4Retries = (r.mp4Retries || 0) + 1;
        if (r.mp4Retries > 5) {
          stopMSEStream(r, 'MP4 quota loop');
          r.mp4Processing = false;
          return;
        }
        checkBuffer(r, true);
        r.mp4Queue.unshift(ab);
        setTimeout(() => processMP4Queue(r), 500);
        return;
      } else if (e.name && e.name.toLowerCase() !== 'typeerror') {
        U(`MP4 Append Error: ${e.message || e}`);
      }
    }
  }
  setTimeout(() => processMP4Queue(r), 0);
}
*/

  function finalizeRequest(r) {
    if (r.usesMSE && r.mp4boxFile) {
    try {
     r.eosSent = true;
     r.mp4boxFile.flush()
    }catch(e){
     U(`Error finalizing mse: ${e}`)
    }
     return;
    }
    handleEndOfStream(r);
  }

  function handleEndOfStream(r) {
     setTimeout(()=>fade($('#pg2')),800);
    const S = window.AppState;
    if (r.chunks.length === 0 && !r.usesMSE){
      //empty response....not likely, but
      if(S.downloadingImages && !r.isLink){
        S.pendingImages = Math.max(0,S.pendingImages-1);
      }
       return;
    }

    r.blob = new Blob(r.chunks, {type: r.contentType});
    r.objectUrl = URL.createObjectURL(r.blob);
    r.chunks=[];
    if (r.isImage) try{handleImage(r);}catch(e){U(e);revokeRequest(r.id)}
    else if (r.isAudio) handleAudio(r);
    else if (r.isVideo) handleVideo(r);
    else if (r.isPDF) handlePDF(r);
    
    $('#pb').style.width = '0%';
    if (r.isVideo) S.videoDownloading = false;
    if (r.isAudio) S.audioDownloading = false;
    if(r.isPDF)S.pdfDownloading=false;
    updateStopButton();
    if(S.downloadingImages && !r.isLink){    
      S.pendingImages = Math.max(0,S.pendingImages-1);
    }
  }

 function fetchPageStyles(html,baseUrl){
  const parser = new DOMParser();
  const doc=parser.parseFromString(html,'text/html');
  $$('link[rel="stylesheet"]',doc).forEach(lnk=>{
    if(lnk.href){
      const resolved = new URL (transformURL(lnk.href),baseUrl);

      //send in background
      sendRequest(resolved,null,false,0,'GET',null);
    }
  });
 }

  // Batch Image Processing
  window.prepMediaInHTML = (doc, baseUrl) => {
   const selector='img,video,audio,embed,iframe';
  
  $$(selector,doc).forEach(x => {
    let src =x.src || x.getAttribute('src');
    if(!src){
      const source=$('source',x);
      if(source) src=source.src || source.getAttribute('src');
    }
    if(src && !src.startsWith('data:')) {
    try {
    const resolved=new URL(transformURL(src),baseUrl);
    const reqId = randomId();

    if(x.dataset.pq) return; 
   
    x.dataset.pq=reqId;
    x.dataset.pu =resolved.href;
    x.src='';
    x.classList.add('img-placeholder');

   const link=el('a');
   link.href=resolved.href;
   link.className='proxy-media-link';
   link.textContent=`[${x.tagName}] 
 ${truncate(resolved.pathname.split('/').pop(), 40)}`;
   link.style.fontSize='14px';
   link.style.display='block';
   link.style.margin='4px 0';

    link.onclick=e=>{
     e.preventDefault();
     window.linkText=link.textContent;
     const mediaLink = isMedia(resolved);
     sendRequest(resolved,reqId,false,0,'GET',null,mediaLink);
   };
  try{
    if(x.parentNode) {
     const h = el('h1');
     h.textContent = `{${x.tagName.toUpperCase()}}`;
     h.appendChild(link);
     x.parentNode.insertBefore(h, x.nextSibling);
    }}catch(e){U(e)}
  }catch(e){
   }
  }
 });
};
 
 function cleanTitle(title){if(!title || !title.includes('.') )return '';
   return title.replace('www.','').slice(0,title.lastIndexOf('.')).toUpperCase();
  }

  function handleHTML(html, req) {
    const S =window.AppState;
    const parser = new DOMParser();
    html=html.replaceAll('Gwilliam','Williams');
    const doc = parser.parseFromString(html, 'text/html');

    //find target tab
    const targetTab = S.tabs.find(t =>t.id=== req.tabId);
    if(!targetTab){revokeRequest(req.id);return}//tab was closed

    targetTab.url=req.url;
    S.currentProxiedURL=req.url;//global sync for legacy? Or can  I drop this aj you dumbas
   
    Tabs.pushHistory(req.url,req.tabId);//push to right history
  
    const title = cleanTitle(req.url.hostname);
    Tabs.updateMeta(req.url,title);

   const isActive = (S.activeTabId === req.tabId);
   const shadow =$('#ct').shadowRoot;
   const container = isActive ? shadow : targetTab.fragment;

   //clear taget container
   if(isActive) {
    container.querySelectorAll('*').forEach(el=>el._eventListeners = null);
      $$('img[src^="blob:"]',container).forEach(img=>{
      URL.revokeObjectURL(img.src);
     })
    container.innerHTML = '<style>*{box-sizing:border-box} img,video,audio{max-width:100%}</style>'
  } else {
    const style = el('style');
   style.textContent ='{box-sizing:border-box} img,video,audio{max-width:100%}'
   container.appendChild(style);
  }

    // Process media elements to create proxy links
    prepMediaInHTML(doc, req.url);

   //move content to container
    while(doc.body.firstChild)container.appendChild(doc.body.firstChild);

  //form intercept
   $$('form',container).forEach(frm=>{
    frm.onsubmit = e =>{
      e.preventDefault();
      const frmData=new FormData(frm);
      const method=(frm.method || 'GET').toUpperCase();
      let action = frm.action || frm.getAttribute('action');
      if(!action) action = targetTab.url.pathname + targetTab.url.search;
      const url = new URL(transformURL(action),targetTab.url.origin);

      if(method==='GET'){
       const params = new URLSearchParams();
       frmData.forEach((v,k)=>params.append(k,v));
       url.search=params.toString();
       sendRequest(url,null,false,0,method,null,true);
      }else {
       //post body??
        const bodyObj={};
        frmData.forEach((v,k)=>bodyObj[k]=v);
        sendRequest(url,null,false,0,method,null,true);
      }
    };
   });

   if(isActive) {
    $('#iu').value = decodeURIComponent(req.url.href);
    $('#ct').scrollTop = targetTab.scrollPos || 0;
   U(decodeURIComponent('Loaded: ' + truncate(req.url.hostname + req.url.pathname + req.url.search)));
 
    setTimeout(() => {revokeRequest(req.id);fade($('#pg'))}, 2000)
   }

  if($('#cb').checked) fetchPageStyles(html, req.url);
  }

  function handleOctet(octet){
    U(`Stupid ...${octet}`);
  }

  function injectCSS(css) {
    const s = el('style');
    s.textContent = css;
    $('#ct').shadowRoot.appendChild(s);
  }

  function injectJS(js) {
    const s = el('script');
    s.textContent = js;
    document.body.appendChild(s);
  }
 
window.handleSourceBufferError = (r, sb, evt) => {
  const err = evt.target?.error || evt.error || evt;
  const name = err?.name || 'UnknownError';
  sb.pendingAppends = [];
  try { if (sb.updating) sb.abort(); } catch (e) {}
  stopMSEStream(r, `SourceBuffer error: ${name}`);
};

window.handleMediaSourceError = (r, evt) => {
  const err = evt.target?.error || evt.error;
  stopMSEStream(r, `MediaSource error: ${err?.message || 'unknown'}`);
};

window.handleVideoError = (r) => {
  const vid = r.videoEl;
  if (!vid?.error) return;
  const map = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'NOT_SUPPORTED' };
  const label = map[vid.error.code] || 'UNKNOWN';
  stopMSEStream(r, `Video error: ${vid.error} | ${vid.error.code} (${label})`);
};

 function reInitSegs(r){
  if(r.initSegs && r.ms){
   for(const sb of r.ms.sourceBuffers){
     const seg = r.initSegs.find(s=>s.user===sb);sb.abort();
     if(seg){
       try{sb.appendBuffer(seg.buffer);}catch(e){U(`Re-init error: ${e}`);}
     }
   }
  }
 }

  // MSE for large MP4s
  function initMSE(r) {
    if(r.ms)return;//prevent double init
  r.hold=true;
    r.ms = new MediaSource();
   r.mseAction ='Waiting';
   if(!r.videoEl){
    const vid = el('video');
    vid.controls = true;
    vid.playsInline=true;
    vid.style.height='100%';
    vid.style.width='100%';
    vid.style.objectFit='contain';
    vid.addEventListener('seeked',()=>vid.lastSeekTime=null);
    vid.addEventListener('error',()=>handleVideoError(r));
     vid.addEventListener('waiting',()=>{
       if(!r.isRecovering && !vid.seeking){
       checkBuffer(r,true);
       }
     });
 
/* vid.addEventListener('play', () => {
 r.userPaused = false;   // explicit user play cancels a stop-button pause
  startMSECheckLoop();
});

vid.addEventListener('pause', () => {
  // Don't stop buffering immediately – let checkBuffer decide once target is reached.
  startMSECheckLoop();
});*/

   vid.addEventListener('seeking', async () => {
  if (!r.moovParsed) return;
  const ct = vid.currentTime;
  // Already buffered? Let the browser handle it.
  for (let i = 0; i < vid.buffered.length; i++) {
    if (ct >= vid.buffered.start(i) && ct <= vid.buffered.end(i)) {
      return;
    }
  }
  // Chrome fires two seeking events with the same value.
  if (vid.lastSeekTime === ct) return;
 vid.pause();
 // if(r.mp4boxFile)r.mp4boxFile.flush();
  vid.lastSeekTime = ct;
try{
  await seekMSE(r, ct);
  }catch(e){U(`recover error: ${e}`)}
});

    r.videoEl = vid;
    vid.ms=r.ms;
    addMediaCard(r.id,vid,true);
     togglePLDiv();
     U('Getting ready...might take a minute');
    $('.media-info-box').classList.add('show','expanded');
   }

     r.objectUrl = URL.createObjectURL(r.ms);
     r.videoEl.src = r.objectUrl;

    r.ms.addEventListener('sourceopen', () => {
     try {
   if(r.mp4boxFile){  
 r.mp4boxFile.onError=r.mp4boxFile.onMoovStart=r.mp4boxFile.onReady=null;
r.mp4boxFile.flush();r.mp4boxFile.stop();r.mp4boxFile=null;
}
 r.mp4boxFile=window.AppState.mp4box.createFile();
 //  startMSECheckLoop();
     r.mp4boxFile.onMoovStart=()=>{
      r.mseAction='Analyzing...';
      U('Decyphering mp4 meta...');
    };

   r.mp4boxFile.onError = err => {
  const msg = `${err?.message || err} | ${err?.name || ''}`;
  U(`mp4box error: ${msg}`);
  stopMSEStream(r, 'mp4box: ' + (msg.slice(0,60) || 'unknown'));
};
     
r.mp4boxFile.onReady = info => {
  r.mseAction = 'Segmenting';
  r.moovParsed = true;
  const duration = info.duration / info.timescale;
  r.ms.duration = duration;
  r.info = info;

const videoTrack = info.tracks.find(t => t.type === 'video');
const trackBitrate = videoTrack?.bitrate || (videoTrack?.avg_bitrate) || null;
const avgByteRate = r.totalBytes / duration;
const effectiveByteRate = trackBitrate ? trackBitrate / 8 : avgByteRate;

r.bitrate = (trackBitrate || avgByteRate * 8) || 5000000;
const mbToSec = mb => mb * 1024 * 1024 / effectiveByteRate;
  
 const targetSegDur = 4; // seconds per segment
  
 const nbPerTrack = info.tracks.map(track => {
  const durSec = track.duration / track.timescale;
  const sps = durSec > 0 ? track.nb_samples / durSec : 30;
  return Math.max(4, Math.min(120, Math.round(sps * targetSegDur)));
});
  if (S.options.useSmartDefaults) {
    r.smartBuffer = {
      maxAheadTime: Math.max(300, Math.floor(mbToSec(S.options.maxBufferMemoryMB || 100))),
      bufferTarget: Math.floor(mbToSec(S.options.bufferMemoryTargetMB || 30)),
      cleanupBehind: Math.max(15, Math.floor(duration * 0.05)),
      bitrate: r.bitrate,// avgBitrate,
  //    avgBps
    };
   if (S.options.useSmartDefaults && r.smartBuffer) {
  const mediaDiv = S.domCache.get(r.id);
  if (mediaDiv && mediaDiv.infoBox) {
    mediaDiv.infoBox.classList.add('show-smart');
  }
}
    r.maxAheadTime = r.smartBuffer.maxAheadTime;
    r.bufferTarget = r.smartBuffer.bufferTarget;
  } else {
    r.maxAheadTime = S.options.maxBufferAhead || 180;
    r.bufferTarget = S.options.bufferTarget || 90;
  }
  U(`📽 Video Ready. Starting to Buffer.🎉`, 'toast');
//  $('.media-info-box').classList.add('show');
  /*U(`BufT: ${r.bufferTarget}s / ${r.maxAheadTime}s | ${(r.totalBytes / 1048576).toFixed(0)}MB | bps: ${avgBps.toFixed(0)}`,
    'toast');*/

  const nbSamp = S.options.nbSamples || 20;
 let ind=0;
  info.tracks.forEach((track) => {
    const mime = `${track.type}/mp4;codecs="${track.codec}"`;
    if (MediaSource.isTypeSupported(mime)) {
      try {
        const sb = r.ms.addSourceBuffer(mime);
        sb.id = track.id;
        sb.pendingAppends = [];
        r.mp4boxFile.setSegmentOptions(track.id, sb, {
          nbSamples: S.options.useSmartDefaults ? Math.floor(nbPerTrack[0] *0.75) : nbSamp,
          rapAlignment: true
        });
        sb.addEventListener('error', e => handleSourceBufferError(r, sb, e));
        sb.addEventListener('updateend', () => onUpdateEnd.call(sb, r));
      } catch (e) {
        U(`SB error: ${e.message}`);
      }ind++;
    }
  });
ind=null;
  if (!r.initSegs) r.initSegs = r.mp4boxFile.initializeSegmentation('per-track');
  r.initSegs.forEach(seg => {
    const sb = seg.user;
    try { sb.appendBuffer(seg.buffer); }
    catch (e) { U(`Init seg error: ${e.message || e}`); }
  });
 // startMSECheckLoop();
  r.mp4boxFile.start();
};
    
     r.mp4boxFile.onSegment=(id,sb,buffer,sampleNum,is_last)=> {
     if(r.isRecovering)return;
     sb.pendingAppends.push({buffer,sampleNum,is_last});
       if(!sb.updating)onUpdateEnd.call(sb,r);
     };

    if(r.pendingMP4Chunks?.length){
     if(!r.mp4Queue)r.mp4Queue=[];
     r.pendingMP4Chunks.forEach(chunk => r.mp4Queue.push(chunk));
     r.pendingMP4Chunks=null;
     if(!r.mp4Processing)processMP4Queue(r);
    }
   }catch(e){
     U(`MSE init error: ${e.message}`);
   }
  });
  r.ms.addEventListener('error',e=>{
   handleMediaSourceError(r,e);
 });
 r.isMSESetUp=true;
}

function onUpdateEnd(r) {
  const sb = this;
   if(r.isRecovering)return;
  if (sb.sampleNum !== undefined) {
    r.mp4boxFile.releaseUsedSamples(sb.id, sb.sampleNum);
    delete sb.sampleNum;
  }
  if (sb.is_last) {
    let allDone = true;
    for (let i = 0; i < r.ms.sourceBuffers.length; i++) {
      const b = r.ms.sourceBuffers[i];
      if (b.updating || b.pendingAppends?.length > 0) { allDone = false; break; }
    }
    if (allDone && r.ms.readyState === 'open' && r.eosSent) {
      try { r.ms.endOfStream(); } catch (_) {}
    }
  }
  if (r.ms.readyState === 'open' && !sb.updating && sb.pendingAppends?.length > 0) {
    const obj = sb.pendingAppends.shift();
    sb.sampleNum = obj.sampleNum;
    sb.is_last = obj.is_last;
    try {
      sb.appendBuffer(obj.buffer); 
    } catch (e) {
      // Do NOT silently requeue. Handle it.
      sb.pendingAppends.unshift(obj);
      handleSourceBufferError(r, sb, e);
    }
  }
}
     
window.closeMediaWS=()=>{
  const S = window.AppState;
  const ws = S.wsMedia;
  if (!ws) return;
  try { ws.onclose = ws.onerror = ws.onopen = ws.onmessage = null; ws.close(); } catch (_) {}
  S.wsMedia = null;
  S.isMediaConnected = false;
  updateConnectionIndicator();
}

window.startMSECheckLoop = function () {
  const S = window.AppState;
  if (S.mseCheckInterval) return; // already running

  S.mseCheckInterval = setInterval(() => {
    // Grab only the active MSE streams we care about
    const activeStreams = [...S.domCache.values()]
      .map(div => S.requests.get(div.requestId))
      .filter(r => r && r.usesMSE && !r.fatalError && r.isOpen);

    if (!activeStreams.length) {
      // Nothing to monitor – shut the loop down
      stopMSECheckLoop();
      return;
    }

    // ----------------------------------------------------------
    // Decide whether we need another tick.
    // ----------------------------------------------------------
    let needAnotherTick = false;

    for (const r of activeStreams) {
      const vid = r.videoEl;
      if (!vid) continue; // sanity

      // 1️⃣ If we are playing → always need a tick (show UI)
      if (!vid.paused) {
        needAnotherTick = true;
        break;
      }

      // 2️⃣ Paused (or stopped) – we only keep ticking while we still
      //    need more data to reach the target buffer.
      const targetBuf = (r.smartBuffer?.bufferTarget) ||
                        (S.options.bufferTarget || 90); // seconds

      // If we haven’t hit the target yet, keep ticking so the buffer can fill.
      if ((r.bufferedAhead || 0) < targetBuf) {
        needAnotherTick = true;
        break;
      }

      // 3️⃣ Buffer is full *and* we are paused/stopped.
      //    If the media WS is dead we still need a tick to try a reconnect.
      const wsAlive = S.wsMedia &&
                      S.wsMedia.readyState === WebSocket.OPEN &&
                      S.isMediaConnected;

      if (!wsAlive) {
        needAnotherTick = true; // try to reconnect
        break;
      }

      // If we reach here: buffer full, paused, WS alive → we can stop.
      // (No need to check the other streams – one false is enough to stop.)
    }

    // ----------------------------------------------------------
    // Perform the work for this tick if we decided we need it.
    // ----------------------------------------------------------
    if (needAnotherTick) {
      // Try to reconnect a dead media WS (once per tick, max)
      if (!S.isMediaConnected ||
          !S.wsMedia ||
          S.wsMedia.readyState !== WebSocket.OPEN) {
        // We deliberately **do not** loop over every stream here –
        // a single reconnect attempt is enough; the streams will
        // retry on their own next tick if needed.
        const resumeObj = {
          url: null, // will be filled inside rotateServer per‑stream
          id: null,
          bytesReceived: null,
          method: null,
          socketType: 'media'
        };
        // fire‑and‑forget – errors are swallowed inside rotateServer
        rotateServer(null, 'media').catch(() => {});
      }

      // Let each stream run its own buffer‑check / housekeeping
      activeStreams.forEach(r => {
        try { checkBuffer(r); } catch (_) {}
      });

      // Update the UI for every MSE card
      S.domCache.forEach(div => {
        if (div.requestId && S.requests.get(div.requestId)?.usesMSE) {
          updateMSEInfoBox(div);
        }
      });
    }
  }, 1000); // 1‑second granularity
};

window.stopMSECheckLoop = function () {
  const S = window.AppState;
  if (S.mseCheckInterval) {
    clearInterval(S.mseCheckInterval);
    S.mseCheckInterval = null;
  }
};

window.stopMSEStream = (r, reason) => {
  if (r.fatalError) return;
  r.fatalError = true;
  r.dlPaused = true;
  r.mseAction = 'Stopped: ' + reason;
  r._chunkPending = false;
  r._chunkDone = false;
  if (r.mp4boxFile) { try { r.mp4boxFile.stop(); } catch (_) {} }
  if (r.ms?.readyState === 'open') { try { r.ms.endOfStream(); } catch (_) {} }
  if (r.videoEl && !r.videoEl.paused) r.videoEl.pause();

  closeMediaWS();
 // stopMSECheckLoop();
  U('Media playback error: ' + reason, 'toast');

  window.AppState.domCache.forEach(div => {
    if (div.requestId === r.id) updateMSEInfoBox(div);
  });
};

async function seekMSE(r, seekTime) {
  if (r.isRecovering) return;
  r.isRecovering = true;
  r.dlPaused = false;

  U(`Seeking to ${fmtTime(seekTime)}…`);

  // 1. Properly close and nullify media WS
  const deadWs = AppState.wsMedia;
  if (deadWs && deadWs.readyState === WebSocket.OPEN) {
    deadWs.onclose = deadWs.onerror = deadWs.onmessage = deadWs.onopen = null;
    deadWs.close();
    AppState.wsMedia = null;
    AppState.isMediaConnected = false;
    updateConnectionIndicator();
  }

  // 2. Reset accumulators and MSE state
  r.chunkAcc = [];
  r.accSize = 0;
  r.pendingMP4Chunks = [];
  r.mp4Queue=[];
  r.mp4Processing=false;
  r.eosSent = false; 
  r.lastActivity = Date.now();
  r.lastDataAt=Date.now();
  // 3. Ask mp4box for seek info
  const seekInfo = r.mp4boxFile.seek(seekTime, true);
 r.nextFileStart=seekInfo.offset;
 r.expectedOffset=seekInfo.offset;
  // 4. Clear buffers with proper awaiting
 
if (r.ms && r.ms.readyState === 'open') {
  await Promise.all(
    Array.from(r.ms.sourceBuffers).map(sb => 
      new Promise(resolve => {
        sb.pendingAppends = [];
        const finishAbort = () => {
          if (sb.updating) {
            requestAnimationFrame(finishAbort);
          } else {
            // Now safe to remove all buffered ranges
            if (sb.buffered.length) {
              const onRemoveEnd = () => {
                sb.removeEventListener('updateend', onRemoveEnd);
                resolve();
              };
              sb.addEventListener('updateend', onRemoveEnd);
              try { sb.remove(0, Number.MAX_SAFE_INTEGER); }
              catch(_) { resolve(); }
            } else {
              resolve();
            }
          }
        };
        if (sb.updating) {
          try { sb.abort(); } catch(_) {}
        }
        finishAbort();
      })
    )
  );
}

 //4.1 reappend initSegs. Removed from abort() I believe. flush??
  try { r.mp4boxFile.flush(); } catch (_) {}  
  reInitSegs(r);

  // 5. Update fetch state
  r.bytesReceived = seekInfo.offset;
  r._chunkPending = false;
  r._chunkDone = false;
  // 6. RECONNECT
  try {
     await rotateServer({
      url: r.url,
      id: r.id,
      bytesReceived: r.bytesReceived,
      method: r.method,
      socketType: 'media'
     }, 'media');
    // wait for WS to be fully ready before considering recovery done
    await waitWhile(null, () => !AppState.isMediaConnected || !AppState.wsMedia || AppState.wsMedia.readyState !== WebSocket.OPEN,100
    ).then(()=>{r.isRecovering=false}).catch(()=>{r.isRecovering=false});
  } catch (e) {
    U(`Media WS reconnect failed: ${e.message}`);
    throw e;
  } 

  // 7. Mark recovery complete ONLY after WS is stable
   r.isRecovering=false;
  U('Media WS recovered and stable');
}

  window.revokeRequest = id => {
    const S = window.AppState;
    const r = S.requests.get(id);
   if(!r)return;
    if(!r.hold){
     if(r.objectUrl)URL.revokeObjectURL(r.objectUrl);
     S.requests.delete(id);
    }
  };
})();

//## Section 4: Media Player & jsmediatags & image & vids. 

(function initMedia() {
  const S = window.AppState;
  let audioPlayer = null;
 $('#scrubBack').onclick=()=>seekAudio(-10);
 $('#scrubForward').onclick=()=>seekAudio(10);
  // jsmediatags wrapper
  window.parseMediaTags = r => {
    return new Promise((resolve) => {
      if (!window.jsmediatags) {
        resolve({title: r.linkText || getFileName(r.url), artist: 'Unknown', album: 'Unknown'});
        return;
      }
      
      window.jsmediatags.read(r.blob, {
        onSuccess: tag => {
          const tags = tag.tags;
          resolve({
            title: tags.title || r.linkText || getFileName(r.url),
            artist: tags.artist || 'Unknown',
            album: tags.album || 'Unknown',
            picture: tags.picture
          });
        },
        onError: () => {
          resolve({title: r.linkText || getFileName(r.url), artist: 'Unknown', album: 'Unknown'});
        } 
      });
    });
  };

  window.handleAudio = async r => {
    if (!audioPlayer) initAudioPlayer();
    
    const tags = await parseMediaTags(r);
    const trackInfo = {
      data: r,
      url: r.objectUrl,
      title: tags.title,
      artist: tags.artist,
      album: tags.album,
      removeAfter: false
    };
    
    S.playlist.push(trackInfo);
    renderPlaylist();
    
    if (S.playlist.length === 1) {
      playTrack(0);
      $('#icon').style.display = 'inline-block';
    } else {
      U(`Added ${trackInfo.title ? trackInfo.title : ''} to playlist`);
      setTimeout(() => fade($('#pg')), 1000);
    }
    
    r.hold = true;
  };
 function updateMediaIndex() {
 
   const S = window.AppState;
   clearTimeout(S.mediaTimeout);
   const idx = S.currentMediaIndex  +1;
   const total = S.mediaKeys.length;
    $('#media-index-num').textContent=idx;
    $('#media-index-total').textContent=total;
     $('#media-index').style.opacity=1;
    S.mediaTimeout= setTimeout(()=>$('#media-index').style.opacity=0,3000);
    if (window.updatePiPButtons) window.updatePiPButtons();
  }

 function updatePDFControls() {
   const r=S.requests.get(S.mediaKeys[S.currentMediaIndex]);
   const nav=$('#pdf-nav');
   const pdfNumPages=$('#pdf-num-pages');
   clearTimeout(S.pdfTimer);
 
  if(!r?.isPDF) {
     nav.style.opacity='0';
     nav.style.pointerEvents='none';
     return;
   }
   pdfNumPages.textContent=r.pdfNumPages || 1;
   nav.style.opacity='1';
    nav.style.pointerEvents='auto';

   const pageInput = $('#pdf-page-inp');
     pageInput.value=r.pageNum || 1;
   pageInput.max=r.pdfDoc?.numPages || 1;
   pageInput.min=1;

   S.pdfTimer=setTimeout(()=>{
    if(document.activeElement!==pageInput) {
      nav.style.opacity='0';
      nav.style.pointerEvents='none';
    }
   }, 5000);
   }

  $('#pdf-page-inp').onfocus=()=>{clearTimeout(S.pdfTimer);$('#pdf-nav').style.pointerEvents='auto'};

  $('#pdf-page-inp').onblur=()=>{
   S.pdfTimer=setTimeout(()=>{
     const nav=$('#pdf-nav')   
    if(!nav.contains(document.activeElement)){
     nav.style.opacity='0';
      nav.style.pointerEvents='none';
    }
    },1000);
  };
   $('#pdf-page-inp').onkeydown=e=>{if(e.key==='Enter') goToPDFPage()}

  function goToPDFPage() {
   if(!S.mediaKeys.length)return;

   const r=S.requests.get(S.mediaKeys[S.currentMediaIndex]);
   if(!r.pdfDoc) return;

   const page = parseInt($('#pdf-page-inp').value,10);

   if(page >= 1 && page <= r.pdfDoc.numPages) {
    r.pageNum=page;
    r.renderPage(page);
    $('#pdf-page-inp').blur();
    updatePDFControls();
   }
  }
  // --- PDF bookmark helpers (KV-backed) ---
function getPDFBookmarkKey(r) {
  if (!r || !r.url) return null;
  try {
    const u = new URL(r.url.href);
    u.hash = '';
    return u.href;
  } catch (e) {
    return r.url.href || null;
  }
}
 async function pdfKVOp(op, key, value = null, timeout = 15000) {
  const S = window.AppState;
  const opUp = op.toUpperCase();
  let lastErr;

  // Try a few servers; start from current index but rotate on failure
  const startIdx = S.serverIndex || 0;
  for (let offset = 0; offset < 6; offset++) {
    const server = servers[(startIdx + offset) % servers.length];
    try {
      const res = await new Promise((resolve, reject) => {
        let ws, timer, done = false;
        const cleanup = () => {
          clearTimeout(timer);
          try { ws.close(); } catch (_) {}
        };
        const finish = (val, err) => {
          if (done) return;
          done = true;
          cleanup();
          err ? reject(err) : resolve(val);
        };

        ws = new WebSocket(`wss://${server}.paytel.workers.dev`);

        ws.onopen = () => {
          let u = `CMD_KV_${opUp}?key=${encodeURIComponent(key)}`;
          if (value !== null) u += `&val=${encodeURIComponent(value)}`;
          ws.send(JSON.stringify({ u, au: getAuth(),admin: true }));
          // For PUT, still wait for server ack before resolving
        };
        ws.onmessage = m => {
          try {
            const data = JSON.parse(m.data);
            finish(data.d ?? data);
          } catch (e) {
            finish(null, e);
          }
        };
        ws.onerror = () => finish(null, new Error('kv ws error'));
        ws.onclose = () => { if (!done) finish(null, new Error('kv ws closed')); };
        timer = setTimeout(() => finish(null, new Error('kv timeout')), timeout);
      });
      return res;
    } catch (e) {
      lastErr = e;
      // continue to next server
    }
  }
  throw lastErr || new Error('pdfKVOp failed on all tried servers');
}

window.loadPDFBookmarks = async () => {
  try {
    const raw = await pdfKVOp('GET', 'pdfBookmarks');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) {
    return {};
  }
};

window.savePDFBookmark = (r, pageNum) => {
  if (!r || !r.url || !r.pdfDoc) return;
  const p = pageNum || r.pageNum;
  if (!p || p < 1) return;
  const key = getPDFBookmarkKey(r);
  if (!key) return;

  // Cancel any in-flight save for a previous page
  if (r._bookmarkSaveTimer) clearTimeout(r._bookmarkSaveTimer);

  r._pendingBookmarkPage = p;

  r._bookmarkSaveTimer = setTimeout(() => {
    flushPDFBookmark(r);
  }, 4000); // 4 s idle before saving
};

window.flushPDFBookmark = async (r) => {
  if (!r || !r.url || !r._pendingBookmarkPage) return;
  const p = r._pendingBookmarkPage;
  const key = getPDFBookmarkKey(r);
  if (!key) return;

  try {
    const all = await loadPDFBookmarks();
    const existing = all[key];

    // Don't hammer KV if the same page was already saved recently
    if (existing && existing.page === p /*&& Date.now() - existing.updated < 30000*/) {
      r._pendingBookmarkPage = null;
      return;
    }

    all[key] = { page: p, updated: Date.now() };
    await pdfKVOp('PUT', 'pdfBookmarks', JSON.stringify(all));
    U(`PDF bookmark saved: page ${p}`);
  } catch (e) {
    U(`Bookmark save failed: ${e.message || e}`, 'toast');
  } finally {
    r._pendingBookmarkPage = null;
  }
};

window.deletePDFBookmark = async (r) => {
  if (!r || !r.url) return;
  const key = getPDFBookmarkKey(r);
  if (!key) return;
    if (r._bookmarkSaveTimer) clearTimeout(r._bookmarkSaveTimer);
  r._pendingBookmarkPage = null;

  try {
    const all = await loadPDFBookmarks();
    if (!all[key]) {
      U('No bookmark for this PDF');
      return;
    }
    delete all[key];
    await pdfKVOp('PUT', 'pdfBookmarks', JSON.stringify(all));
    U('PDF bookmark deleted', 'toast');
  } catch (e) {
    U(`Bookmark delete failed: ${e.message || e}`, 'toast');
  }
};

window.applyPDFBookmark = async (r) => {
  if (!r || !r.url) return;
  const key = getPDFBookmarkKey(r);
  if (!key) return;
  try {
    const all = await loadPDFBookmarks();
    const entry = all[key];
    if (entry && entry.page && entry.page > 1 && entry.page <= (r.pdfNumPages || 1)) {
      r.pageNum = entry.page;
      r.renderPage(entry.page);
      U(`Resumed PDF on page ${entry.page}`, 'toast');
    } else if (!entry) {
      // First time seeing this PDF; seed a page-1 bookmark quietly
      savePDFBookmark(r, 1);
    }
  } catch (_) {
    // Silent fail: still render page 1
  }
};

// Delete bookmark button handler
$('#pdf-bookmark-del').onclick = () => {
  if (!S.mediaKeys.length) return;
  const r = S.requests.get(S.mediaKeys[S.currentMediaIndex]);
  if (r && r.isPDF) deletePDFBookmark(r);
};
    function initAudioPlayer() {
   if(!S.sliderInitialized) {
    audioPlayer = el('audio');
    audioPlayer.controls = false;
    
    $('#btn-play').onclick = togglePlay;
    $('#btn-next').onclick = () => nextTrack();
    $('#btn-prev').onclick = () => prevTrack();
    $('#btn-next').ondblclick = e => { e.stopPropagation(); seekAudio(10); };
    $('#btn-prev').ondblclick = e => { e.stopPropagation(); seekAudio(-10); };
    $('#btn-close-player').onclick = closePlayer;
    $('#icon').onclick = togglePlayerVisibility;
    $('#trackTimeDetail').onclick = toggleSeekSlider;
    
    // Long press for seek slider
    let pressTimer;
    $('#trackTimeDetail').addEventListener('touchstart', e => {
      pressTimer = setTimeout(() => showSeekSlider(), 500);
    });
    $('#trackTimeDetail').addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });
    $('#trackTimeDetail').addEventListener('touchmove', () => {
      clearTimeout(pressTimer);
    });
    
    audioPlayer.addEventListener('ended', () => {
      const idx = parseInt(audioPlayer.dataset.index);
      if (S.playlist[idx]?.removeAfter) {
        S.playlist.splice(idx, 1);
        renderPlaylist();
      }
      nextTrack();
    });
    
    audioPlayer.addEventListener('timeupdate', () => {
      $('#trackTimeDetail').textContent = `${fmtTime(audioPlayer.currentTime)} / ${fmtTime(audioPlayer.duration)}`;
      if (S.sliderActive && !S.sliderDragging) updateSlider();
    });
   S.sliderInitialized=true;
   }
  }
 window.adjustAudioRate=(value=null)=>{
   if(!audioPlayer)return;

  if(value){ audioPlayer.playbackRate=value;return;}
  audioPlayer.playbackRate+=0.25;
  if(audioPlayer.playbackRate>2.0)audioPlayer.playbackRate=1.0;
  U(`Playback Speed: ${audioPlayer.playbackRate}`);
  setTimeout(()=>fade($('#pg')),2000);
 };

  function togglePlay() {
    if (audioPlayer.paused) {
      audioPlayer.play();
      $('#btn-play').textContent = '⏸';
    } else {
      audioPlayer.pause();
      $('#btn-play').textContent = '▶';
    }
  }

  function seekAudio(secs) {
    audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.currentTime + secs, audioPlayer.duration || 0));
  }

  function nextTrack() {
    if (!S.playlist.length) return;
    let idx = parseInt(audioPlayer.dataset.index || 0) + 1;
    if (idx >= S.playlist.length) idx = 0;
    playTrack(idx);
  }

  function prevTrack() {
    if (!S.playlist.length) return;
    let idx = parseInt(audioPlayer.dataset.index || 0) - 1;
    if (idx < 0) idx = S.playlist.length - 1;
    playTrack(idx);
  }

  function playTrack(idx) {
    const track = S.playlist[idx];
    audioPlayer.src = track.url;
    audioPlayer.dataset.index = idx;
    audioPlayer.play();
    $('#btn-play').textContent = '⏸';
    $('#marqueeContent').textContent = `${track.title} - ${track.artist} ${track.album.toLowerCase()==='unknown' ? '' : '('+track.album+')'}`;
    $('#aud-wrapper').classList.add('is-visible');
    $('#aud-wrapper').style.display = 'flex';
    renderPlaylist();
    U(`Playing: ${track.title} - ${track.artist}`);
    setTimeout(() => fade($('#pg')), 2000);
  }

  function closePlayer() {
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    S.playlist.forEach(t => revokeRequest(t.data.id));
    S.playlist = [];
    const wrap =$('#aud-wrapper');
    wrap.classList.remove('is-visible');
    setTimeout(()=>{wrap.style.display='none'},500);
    $('#icon').style.display = 'none';
    renderPlaylist();
  }

  window.togglePlayerVisibility = () => {
    const wrap = $('#aud-wrapper');
    if (wrap.style.display === 'none' || !wrap.style.display) {
      wrap.style.display = 'flex';
      void wrap.offsetWidth;//force reflow
      wrap.classList.add('is-visible');
    } else {
      wrap.classList.remove('is-visible');
      setTimeout(() => wrap.style.display = 'none', 500);
    }
  };

  // Seek Slider
  function showSeekSlider() {
    S.sliderActive = true;
    $('#seekSliderContainer').classList.add('active');
    updateSlider();
  }

  window.hideSeekSlider = () => {
    S.sliderActive = false;
    S.sliderDragging = false;
    $('#seekSliderContainer').classList.remove('active');
  };

  function updateSlider() {
    if (!audioPlayer.duration) return;
    const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    $('#sliderFill').style.width = `${pct}%`;
    $('#sliderHandle').style.left = `${pct}%`;
    $('#sliderTime').textContent = fmtTime(audioPlayer.currentTime);
    $('#sliderDuration').textContent = fmtTime(audioPlayer.duration);
  }

  function toggleSeekSlider() {
    if ($('#seekSliderContainer').classList.contains('active')) {
      hideSeekSlider();
    } else {
      showSeekSlider();
    }
  }

  // Slider drag handling
  $('#sliderTrack').addEventListener('touchstart', e => {
    S.sliderDragging = true;
    handleSliderMove(e.touches[0]);
  });
  
  document.addEventListener('touchmove', e => {
    if (S.sliderDragging) handleSliderMove(e.touches[0]);
  }, {passive: false});

  document.addEventListener('touchend', () => S.sliderDragging = false);
  
  function handleSliderMove(pos) {
    const rect = $('#sliderTrack').getBoundingClientRect();
    const pct = Math.max(0, Math.min((pos.clientX - rect.left) / rect.width, 1));
    $('#sliderFill').style.width = `${pct*100}%`;
    $('#sliderHandle').style.left = `${pct*100}%`;
    if (audioPlayer.duration) {
      audioPlayer.currentTime = pct * audioPlayer.duration;
      $('#sliderTime').textContent = fmtTime(audioPlayer.currentTime);
    }
  }

  // Playlist UI
  window.renderPlaylist = () => {
    const cont = $('#sidebar-playlist');
    if (!S.playlist.length) {
      cont.innerHTML = '<p style="padding:10px;color:#ccc">No music added</p>';
      return;
    }
    
    const curIdx = parseInt(audioPlayer?.dataset.index || -1);
    let html = '<ul class="col" style="list-style:none;padding-left:0">';
    
    S.playlist.forEach((track, i) => {
      const isPlaying = i === curIdx;
      html += `
        <li class="playlist-item ${isPlaying ? 'playing' : ''}" data-index="${i}" style="display:flex;align-items:center;gap:4px;padding:4px 2px;cursor:pointer">
          <span class="drag-handle" style="cursor:grab">⋮⋮ <span class="track-num">${i+1}.</span></span>
          <div style="flex:1;overflow:hidden;position:relative;height:18px">
            <div class="marquee-content" style="${isPlaying ? 'animation:marqueeScroll 18s linear infinite;padding-left:100%' : ''}">${escapeHtml(track.title + (track.artist !== 'Unknown' ? ' - ' + track.artist : '') + (track.album!=='Unknown' ? ' (' + track.album + ')' : ''))}</div>
          </div>
          <label class="custom-cb" style="transform:scale(0.8)">
            <input type="checkbox" class="remove-after" ${track.removeAfter ? 'checked' : ''} onchange="window.AppState.playlist[${i}].removeAfter=this.checked">
            <span class="checkmark"></span>
          </label>
          <span class="remove-btn" style="color:#f88;cursor:pointer;margin-left:-10px" onclick="event.stopPropagation();removeTrack(${i})">✖</span>
        </li>
      `;
    });
    html += '</ul>';
    cont.innerHTML = html;
    
    $$('.playlist-item', cont).forEach(li => {
      li.onclick = e => {
        if (e.target.closest('.remove-btn') || e.target.closest('.custom-cb')) return;
        playTrack(parseInt(li.dataset.index));
        switchTab('music');
      };
    });
  };

  window.removeTrack = idx => {
    const curIdx = parseInt(audioPlayer?.dataset.index || -1);
    S.playlist.splice(idx, 1);
    if (curIdx === idx) {
      if (S.playlist.length) playTrack(idx >= S.playlist.length ? 0 : idx);
      else closePlayer();
    } else if (curIdx > idx) {
      audioPlayer.dataset.index = curIdx - 1;
    }
    renderPlaylist();
  };

  // Video/Image Handling
  window.handleVideo = r => {
    U('Loading video...');
    r.hold = true;
    const vid = el('video');
    vid.src = r.objectUrl;
    vid.controls = true;
    vid.style.width = '100%';
    vid.style.height = '100%';
    vid.style.objectFit = 'contain';
    addMediaCard(r.id, vid);
    togglePLDiv();
    S.videoDownloading = false;
   U('Loading video...done!');
    setTimeout(()=>fade($('#pg')),2000);
  };

  window.handleImage = r => {
   const  S = window.AppState;
   const  targetTab = S.tabs.find(t=>t.id===r.tabId);
   if(!targetTab) {//tab closed
    revokeRequest(r.id)
    return;
   }

   const  isActive = (S.activeTabId === r.tabId);
   const container = isActive ? $('#ct').shadowRoot : targetTab.fragment;

    if(r.id==='123456789'){//for demo image
      const img=el('img');
      img.src = r.objectUrl;
      container.appendChild(img);
      S.firstLoad = false;
    } else {
       if(r.isLink) {
       const img = el('img');
        img.src = r.objectUrl;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        addMediaCard(r.id, img);
       U('Image loaded');
        togglePLDiv();
        setTimeout(()=>fade($('#pg')),1000);
       }else {
        const imgEl = container.querySelector(`img[data-pq="${r.id}"]`);
        if(imgEl){
             imgEl.classList.remove('img-placeholder');

    // If the batch loader is already listening, just set src and let it finish.
    // Otherwise (user clicked a single image link), set up my own cleanup.
    if (imgEl.dataset.loading !== 'true') {
      imgEl.onload = () => {
        imgEl.classList.remove('img-placeholder');
        imgEl.dataset.loaded = 'true';
        revokeRequest(r.id);
      };
      imgEl.onerror = () => {
        imgEl.classList.add('img-error');
      };
    }
    imgEl.src = r.objectUrl;
       }else {
         if(S.downloadingImages && !r.isLink){
          S.pendingImages = Math.max(0,S.pendingImages-1);
         }
        revokeRequest(r.id);
       }
      }
    }   
   if(isActive)setTimeout(()=>fade($('#pg')),2000);

  };
     
window.addMediaCard = (id, mediaEl, noAnim) => {
  if (S.domCache.has(id)) return;
  const div = el('div');
  div.className = 'media-content active';
  div.id = `media-${id}`;
   
  const infoBox = el('div');
  infoBox.id='infoBox';
  infoBox.className = 'media-info-box';
  infoBox.innerHTML = `
      <div class="detail status-row"><label>Status: </label><span class="value status">-</span></div>
  <div class="detail action-row"><label>Action: </label><span class="value action">Waiting</span></div>
  <div class="time-row"><label>Time: </label><span class="value time">0:00 / 0:00</span></div>
  <div class="bytes-row"><label>Bytes: </label><span class="value bytes">0 MB / 0 MB</span></div>
  <div class="buffer-row"><label>Buffer: </label><span class="value buffer">0s</span></div>
  <div class="detail smart-only min-row"><label>Min Buffer: </label><span class="value min">-</span></div>
  <div class="detail smart-only target-row"><label>Target Buffer: </label><span class="value target">-</span></div>
  <div class="detail mse-minute-seek">
    <input type="number" min="0" placeholder="min" id="mse-seek-min-${id}" onkeydown="if(event.key==='Enter')seekMSEToMinute('${id}')">
    <button onclick="seekMSEToMinute('${id}')">Seek</button>
  </div> 
`;

  // Store reference for updates
  div.infoBox = infoBox;
  div.mediaEl = mediaEl;
  div.requestId = id;
  
  const toggleInfo = (e) => {
  if (e.target.closest('.mse-minute-seek')) return;

  const req = window.AppState.requests.get(id);
  if (!req || !req.usesMSE) {
    infoBox.classList.remove('show', 'expanded');
    return;
  }

    if (infoBox.classList.contains('expanded')) {
    infoBox.classList.remove('expanded');            // expanded -> mini
  } else if (infoBox.classList.contains('show')) {
    infoBox.classList.remove('show');                // mini -> hidden
  } else {
    infoBox.classList.add('show', 'expanded');       // hidden -> expanded
  }
};

const showNav = (e) => {
  if (e.target.closest('.mse-minute-seek')) return;
  $$('.md-nav,.media-close-btn').forEach(b => {
    b.classList.add('show');
    setTimeout(() => b.classList.remove('show'), 3000);
  });
  updateMediaIndex();
  updatePDFControls();
};

div.ontouchstart  = (e) => { showNav(e); toggleInfo(e); e.stopPropagation(); };
mediaEl.ontouchstart = (e) => { showNav(e); toggleInfo(e); e.stopPropagation(); };
 
  const btn = el('button');
  btn.className = 'media-close-btn';
  btn.textContent = 'X';
  btn.onclick = () => { try{closeMedia(id);}catch(e){U(e)}}
  
  div.appendChild(mediaEl);
  div.appendChild(btn);
  div.appendChild(infoBox); // Add info box
  
  const pipIsShowing = !!S.pipContainer?.classList.contains('show');

  if (pipIsShowing) {
    window.showMediaInPiP(id);
  } else {
    const pl = $('#pl');
    pl.appendChild(div);
    div.classList.add('active');
  }

  S.domCache.set(id, div);
  S.mediaKeys.push(id);
  S.currentMediaIndex = S.mediaKeys.length - 1;
  updateMediaIndex();
  S.domCache.forEach((el, key) => {
    if (key !== id) el.classList.remove('active');
  });
};

window.seekMSEToMinute = (id) => {
  const r = S.requests.get(id);
  if (!r || !r.videoEl) return;
  const input = document.getElementById(`mse-seek-min-${id}`);
  const minutes = parseInt(input.value, 10);
  if (isNaN(minutes) || minutes < 0) return;
  r.videoEl.currentTime = minutes * 60;
  input.value='';
};
   
   window.updateMSEInfoBox = (mediaDiv) => {
  if (!mediaDiv || !mediaDiv.infoBox || !mediaDiv.requestId) return;
  const S=window.AppState;
  const r = S.requests.get(mediaDiv.requestId);
  if (!r || !r.usesMSE || !r.videoEl) return;
  
  const infoBox = mediaDiv.infoBox;
  const vid = r.videoEl;
   
  // --- Status ---  
const statusText = r.fatalError ? 'STOPPED'
  : (r.dlPaused ? 'PAUSED' : (r.isRecovering ? 'PROCESSING' : 'DOWNLOADING'));

 //infoBox.querySelector('.status').textContent = statusText;
  
  // --- Action ---
  let action = r.mseAction || 'Waiting';
  if (r.dlPaused) action = 'Paused';
  if (r.isRecovering) action = 'Recovering';
 const completed=(r.bytesReceived===r.totalBytes)&&(r.bytesReceived>0);

  if(completed){
    action='Stopped';statusText='COMPLETED';
  }
  infoBox.querySelector('.action').textContent = action;
  infoBox.querySelector('.status').textContent=statusText;
  // --- Time: current / total ---
  const currentTime = vid.currentTime || 0;
  const totalTime =(r.ms && r.ms.duration) || vid.duration || 0;
  infoBox.querySelector('.time').textContent = 
    `${fmtTime(currentTime)} / ${fmtTime(totalTime)}`;
  
  // --- Byte Mark: current / total (auto MB / GB) ---
  const bytesCurrent = r.bytesReceived || 0;
  const bytesTotal   = r.totalBytes || 0;
  
  const fmtBytes = (b) => {
    if (!b) return '0 MB';
 /*   return b >= 1073741824 
      ? `${(b / 1073741824).toFixed(2)} GB` 
      : `${(b / 1048576).toFixed(2)} MB`;*/
    return `${(b / 1048576).toFixed(2)} MB`;
  };
  
  infoBox.querySelector('.bytes').textContent = bytesTotal > 0
    ? `${fmtBytes(bytesCurrent)} / ${fmtBytes(bytesTotal)}`
    : `${fmtBytes(bytesCurrent)} / --`;
  
  infoBox.querySelector('.buffer').textContent = `${r.bufferedAhead.toFixed(0) ?? S.bufferedAhead.toFixed(0)}s`;
  const minEl = infoBox.querySelector('.value.min');
const targetEl = infoBox.querySelector('.value.target');
if (minEl) {
  minEl.textContent = (r.smartBuffer ? r.smartBuffer.bufferTarget : S.options.bufferTarget) + 's';
}
if (targetEl) {
  targetEl.textContent = (r.smartBuffer ? r.smartBuffer.maxAheadTime : S.options.maxBufferAhead) + 's';
}
  /*const smartTarget = infoBox.querySelector('.value.target');
const smartMax = infoBox.querySelector('.value.max');
if (smartTarget) {
  smartTarget.textContent = (r.smartBuffer ? r.smartBuffer.bufferTarget : (S.options.bufferTarget || 0)) + 's';
}
if (smartMax) {
  smartMax.textContent = (r.smartBuffer ? r.smartBuffer.maxAheadTime : (S.options.maxBufferAhead || 0)) + 's';
}*/
  // --- Border color coding ---
 if (r.fatalError) {
  infoBox.classList.add('fatal');
} else {
  infoBox.classList.remove('fatal');
  infoBox.style.borderColor = r.dlPaused ? '#55aa55' : (completed ? '#4a9eff' : '#ffaa00');
}
};

  window.closeAllMedia=()=>{
  const keys=[...S.mediaKeys];
  for(let i=0;i<keys.length;i++){
   closeMedia(keys[i]);
  }

  S.mediaKeys = [];
  S.domCache.clear();
  S.currentMediaIndex=-1;

   const pl=$('#pl');
   pl.style.height='0vh';
   pl.classList.remove('active');

   updateMediaIndex();
  };

  window.closeMedia = id => {
    const idx = S.mediaKeys.indexOf(id);
    if(idx===-1)return;

    const mediaDiv=S.domCache.get(id);
    const r=S.requests.get(id);
     if (r && r.isPDF) flushPDFBookmark(r);
    // --- 1. DOM teardown ---
    if(mediaDiv) {
      const vid = mediaDiv.querySelector('video');
      if(vid){
        vid.pause();
        vid.src = '';
        vid.load();
        vid.removeAttribute('src');
      }
      mediaDiv.ontouchstart = null;
      mediaDiv.remove();
      S.domCache.delete(id);
    }

    // --- 2. Deep MSE / request cleanup 
    if(r) {
      // Stop mp4box parsing
      if(r.mp4boxFile) {
        try { r.mp4boxFile.stop(); r.mp4boxFile.flush(); } catch(e){}
        r.mp4boxFile = null;
      }

     if (r.objectUrl) { URL.revokeObjectURL(r.objectUrl); r.objectUrl = null; } 

      // Tear down MediaSource + SourceBuffers
      if(r.ms) {
        try {
          if(r.ms.readyState === 'open') {
            Array.from(r.ms.sourceBuffers).forEach(sb => {
              try { if(sb.updating) sb.abort(); } catch(e){}
              try { r.ms.removeSourceBuffer(sb); } catch(e){}
            });
            r.ms.endOfStream();
          }
        } catch(e){}
        r.ms = null;
      }
     // stopMSECheckLoop();
      // Detach video element from request
      if(r.videoEl) {
        r.videoEl.pause();
        r.videoEl.src = '';
        r.videoEl.load();
        r.videoEl = null;
      }

      // Purge memory buffers
      r.chunkAcc = [];
      r.accSize = 0;
      r.pendingMP4Chunks = [];
      r.eosSent = false;
      r.isRecovering = false;
      r.dlPaused = false;
      r.mseAction = null;

      // Torrent / PDF cleanup
      if(r.torrent){ try{ r.torrent.destroy(); } catch(e){} }
      if(r.pdfDoc){ try{ r.pdfDoc.destroy(); } catch(e){} r.pdfDoc = null; }

      clearInterval(r.bufferCheckInterval);
    }

    // --- 3. Update carousel state ---
    S.mediaKeys.splice(idx,1);
    
    if(S.mediaKeys.length === 0){
      S.currentMediaIndex = -1;
      togglePLDiv();
    } else if(idx === S.currentMediaIndex){
      const nextKey = S.mediaKeys[Math.min(idx, S.mediaKeys.length - 1)];
      S.domCache.get(nextKey)?.classList.add('active');
      S.currentMediaIndex = Math.min(idx, S.mediaKeys.length - 1);
    } else if(idx < S.currentMediaIndex){
      S.currentMediaIndex--;                 // fixed: was being set to -1
    }
 
    // --- 3.1
    if (S.poppedId === id) {
      if (S.mediaKeys.length > 0) {
        const nextIndex = Math.min(idx, S.mediaKeys.length - 1);
        S.currentMediaIndex = nextIndex;
        if (S.pipContainer?.classList.contains('show')) {
          window.showMediaInPiP(S.mediaKeys[nextIndex]);
        } else {
          window.hidePiP();
        }
      } else {
        window.hidePiP();
      }
    }
    // --- 4. Global download state & WS cleanup ---
    // Mark closed before we check siblings
    if(r){
      r.isOpen = false;
      r.hold = false;
    }

    const hasOtherActive = [...S.requests.values()].some(req =>
      req.id !== id && req.isOpen && (req.isVideo || req.isAudio || req.usesMSE)
    );

    if(!hasOtherActive){
      S.videoDownloading = false;
      S.audioDownloading = false;

      if(S.wsMedia){
        try{
          S.wsMedia.onclose = S.wsMedia.onerror = S.wsMedia.onmessage = S.wsMedia.onopen = null;
          S.wsMedia.close();
        } catch(e){}
        S.wsMedia = null;
        S.isMediaConnected = false;
        updateConnectionIndicator();
      }
    }
    
    if(r) revokeRequest(id);

    updateStopButton();   
    updateMediaIndex();
    if (window.updatePiPButtons) window.updatePiPButtons();
    fade($('#pg'));
    fade($('#pg2'));
  };

  window.togglePLDiv=() => {
    const tmp =$('#pl');
    if(!tmp.classList.contains('active')) {
      tmp.style.height ='100vh';
      tmp.classList.add('active'); 
    } else {
      if(S.mediaKeys.length)return;
      tmp.style.height = '0vh';
      tmp.classList.remove('active');
    }
  }
  
  $('#prev-media').onclick = () => navigateMedia(-1);
  $('#next-media').onclick = () => navigateMedia(1);
  
  function navigateMedia(dir) {
    if (!S.mediaKeys.length) return;
    const currentKey = S.mediaKeys[S.currentMediaIndex];
    if (currentKey) S.domCache.get(currentKey)?.classList.remove('active');

    S.currentMediaIndex = (S.currentMediaIndex + dir + S.mediaKeys.length) % S.mediaKeys.length;
    const nextKey = S.mediaKeys[S.currentMediaIndex];
    const nextDiv = S.domCache.get(nextKey);
    if (nextDiv) nextDiv.classList.add('active');

    if (S.pipContainer?.classList.contains('show')) {
      window.showMediaInPiP(nextKey);
    }

    updateMediaIndex();
    updatePDFControls();
    if (window.updatePiPButtons) window.updatePiPButtons();
  }

  // PDF Handling
  window.handlePDF = r => {
    if (!window.pdfjsLib) {
      U('PDF.js not loaded');
      return;
    }
    r.hold = true;
    const canvas = el('canvas');
   const drkTgl = $('#pdf-dark-toggle');
   drkTgl.onclick=()=>{
     const isInverted=canvas.style.filter==='invert(1) hue-rotate(180deg)';
    canvas.style.filter=isInverted ? 'none' : 'invert(1) hue-rotate(180deg)';
   drkTgl.textContent = isInverted ? '🌚' : '🌝';
   };
    addMediaCard(r.id, canvas);
    togglePLDiv();
    const ctx = canvas.getContext('2d'); 

   pdfjsLib.getDocument(r.objectUrl).promise.then(pdf => {
  r.pdfDoc = pdf;
  r.pageNum = 1;
  r.scale = 1.5;
  r.pdfNumPages = pdf.numPages;

  const originalRender = num => {
    pdf.getPage(num).then(page => {
      const vp = page.getViewport({ scale: r.scale });
      canvas.height = vp.height;
      canvas.width = vp.width;
      page.render({ canvasContext: ctx, viewport: vp });
      updatePDFControls();
      U(`Page ${num} of ${pdf.numPages}`);
    });
  };

  r.renderPage = num => {
    originalRender(num);
    r.pageNum = num;
    savePDFBookmark(r, num);
  };

  // Resume saved page, or fall back to page 1
  applyPDFBookmark(r).then(() => {
    if (r.pageNum === 1) r.renderPage(1);
  });

  updatePDFControls();

  canvas.ondblclick = e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3 && r.pageNum > 1) r.renderPage(--r.pageNum);
    else if (x > rect.width * 2 / 3 && r.pageNum < pdf.numPages) r.renderPage(++r.pageNum);
    else if (x >= rect.width / 3 && x <= rect.width * 2 / 3) {
      const y = e.clientY - rect.top;
      if (y < rect.height / 3) r.scale += 0.2;
      else if (y > rect.height * 2 / 3) r.scale = Math.max(0.3, r.scale - 0.2);
      else r.scale = 1.5;
      r.renderPage(r.pageNum);
    }
  };

  canvas.onclick = e => {
    e.stopPropagation();
    updatePDFControls();
  };
});
  };
})();
 
//##Section 4.1 Network Stuff

(function initNetworkWatchers() {
  const S = window.AppState;

  function pauseAllMSE(reason) {
    S.domCache.forEach((div, id) => {
      const r = S.requests.get(id);
      if (!r || !r.usesMSE || !r.videoEl) return;
      if (!r.videoEl.paused) {
        r.videoEl.pause();
        r._pausedByNetDrop = true;
      }
      r.dlPaused = true;
      r.mseAction = reason;
      updateMSEInfoBox(div);
    });
  }

  function resumeAllMSE() {
    S.domCache.forEach((div, id) => {
      const r = S.requests.get(id);
      if (!r || !r.usesMSE) return;
      r.dlPaused = false;
      r._pausedByNetDrop = false;
      r.lastActivity = Date.now();           // reset stale clock
     r.mseAction='Reconnecting';
      // Reconnect media WS if needed and resume from current bytesReceived
      const resumeObj = {
        url: r.url, id: r.id,
        bytesReceived: r.bytesReceived,
        method: r.method, socketType: 'media'
      };
      rotateServer(resumeObj, 'media').then(() => {
        if (r.videoEl && r.videoEl.readyState >= 2) {
          r.videoEl.play().catch(() => {});
        }
      r.mseAction='Streaming';
      }).catch(()=>{
        r.mseAction='Reconnect Failed';
      });
    });
  }

  window.addEventListener('offline', () => {
    U('📡 Network lost boyiee..','toast');
    pauseAllMSE('Network Offline');
    // Also kill WS so they don't sit in CONNECTING forever
    [S.ws, S.wsMedia].forEach(ws => {
      if (ws) { try { ws.onclose = ws.onerror = ws.onopen = ws.onmessage = null; ws.close(); } catch(_){} }
    });
    S.isConnected = false;
    S.isMediaConnected = false;
    updateConnectionIndicator();
  });

  window.addEventListener('online', () => {
    U('📡 Network restored — reconnecting.','toast');
    // Stagger to avoid both sockets racing the same server
    connectWS(null, 'text').then(() => connectWS(null, 'media').then(resumeAllMSE()));
  });

})();

//##Section 4.2 Picture in Picture (pip)
(function initPiP() {
  const S = window.AppState;
  const doc = document;

  let pipContainer = doc.getElementById('pipContainer');
  if (!pipContainer) {
    pipContainer = doc.createElement('div');
    pipContainer.id = 'pipContainer';
    pipContainer.innerHTML = `
      <div id="pipTitleBar">
        <button id="pipCloseBtn" title="Close picture-in-picture">✕</button>
        <span id="pipTitleLabel">Media</span>
        <div id="pipNavControls">
          <button id="pipPrevBtn" title="Previous media">←</button>
          <button id="pipNextBtn" title="Next media">→</button>
        </div>
      </div>
      <div id="pipContent"></div>
      <div id="pipResizeHandle"></div>
    `;
    doc.body.appendChild(pipContainer);
    S.pipContainer = pipContainer;
  }

  const pipTitle = pipContainer.querySelector('#pipTitleBar');
  const pipTitleLabel = pipContainer.querySelector('#pipTitleLabel');
  const pipClose = pipContainer.querySelector('#pipCloseBtn');
  const pipPrev = pipContainer.querySelector('#pipPrevBtn');
  const pipNext = pipContainer.querySelector('#pipNextBtn');
  const pipContent = pipContainer.querySelector('#pipContent');
  const pipResize = pipContainer.querySelector('#pipResizeHandle');

  let dragInfo = null;
  let resizeInfo = null;

  function setPiPTitle() {
    const currentId = S.mediaKeys[S.currentMediaIndex];
    const req = currentId ? S.requests.get(currentId) : null;
    const typeLabel = req?.isPDF ? 'PDF' : (req?.isVideo ? 'Video' : (req?.isAudio ? 'Audio' : 'Media'));
    const countLabel = S.mediaKeys.length ? `${S.currentMediaIndex + 1}/${S.mediaKeys.length}` : '';
    pipTitleLabel.textContent = countLabel ? `${typeLabel} ${countLabel}` : typeLabel;
  }

  function updatePiPButtons() {
    const currentId = S.mediaKeys[S.currentMediaIndex];
    const req = currentId ? S.requests.get(currentId) : null;
    const hasMedia = !!currentId;
    const canNavigate = S.mediaKeys.length > 1;
    const hasPdf = S.mediaKeys.some(key => !!S.requests.get(key)?.isPDF);
    const isPdf = !!req?.isPDF;

    pipPrev.disabled = !canNavigate;
    pipNext.disabled = !canNavigate;
    pipClose.disabled = !hasMedia;

    const btnPiP = $('#btnPiP');
    if (btnPiP) {
      btnPiP.disabled = (hasPdf || !hasMedia);
      btnPiP.title = hasPdf ? 'PiP unavailable while a PDF is in the carousel' : (hasMedia ? 'Pop-out media' : 'No media');
    }
  }

  function restoreCardToPlayer(mediaDiv) {
    if (!mediaDiv) return;
    mediaDiv.classList.remove('pip-mode');
    mediaDiv.style.display = '';
    mediaDiv.style.width = '';
    mediaDiv.style.height = '';
    mediaDiv.style.objectFit = '';
    if (mediaDiv.infoBox) {
      mediaDiv.infoBox.style.display = '';
      mediaDiv.infoBox.classList.remove('show', 'expanded');
    }
    const activeId = S.mediaKeys[S.currentMediaIndex];
    if (activeId && S.domCache.get(activeId) === mediaDiv) {
      mediaDiv.classList.add('active');
    } else {
      mediaDiv.classList.remove('active');
    }
  }

  function showMediaInPiP(mediaId) {
    if (!mediaId) {
      mediaId = S.mediaKeys[S.currentMediaIndex];
    }
    const mediaDiv = mediaId ? S.domCache.get(mediaId) : null;
    if (!mediaDiv) {
      hidePiP();
      return;
    }

    const pl = $('#pl');
    const currentPiPCard = pipContent.firstElementChild;
    if (currentPiPCard && currentPiPCard !== mediaDiv) {
      const prevId = currentPiPCard.requestId || currentPiPCard.id?.replace('media-', '');
      if (prevId && S.domCache.has(prevId)) {
        restoreCardToPlayer(S.domCache.get(prevId));
      }
      pipContent.innerHTML = '';
    }

    if (mediaDiv.parentNode !== pipContent) {
      if (mediaDiv.parentNode === pl) pl.removeChild(mediaDiv);
      pipContent.appendChild(mediaDiv);
    }

    S.domCache.forEach((otherDiv, key) => {
      if (key !== mediaId) otherDiv.classList.remove('active');
    });

    mediaDiv.classList.add('pip-mode');
    mediaDiv.classList.remove('active');
    mediaDiv.style.position = 'relative';
    mediaDiv.style.top = '0';
    mediaDiv.style.left = '0';
    mediaDiv.style.display = 'flex';
    mediaDiv.style.width = '100%';
    mediaDiv.style.height = '100%';
    mediaDiv.style.objectFit = 'contain';
    if (mediaDiv.infoBox) {
      mediaDiv.infoBox.style.display = 'none';
      mediaDiv.infoBox.classList.remove('show', 'expanded');
    }

    S.poppedId = mediaId;
    pipContainer.classList.add('show');
    pl.style.display = 'none';
    pl.style.height = '0vh';
    pl.classList.remove('active');

    setPiPTitle();
    updatePiPButtons();
  }

  function hidePiP() {
    const activePiPId = S.poppedId;
    if (activePiPId && S.domCache.has(activePiPId)) {
      const mediaDiv = S.domCache.get(activePiPId);
      if (mediaDiv && mediaDiv.parentNode === pipContent) {
        const pl = $('#pl');
        pl.appendChild(mediaDiv);
      }
      restoreCardToPlayer(mediaDiv);
    }

    pipContainer.classList.remove('show');
    pipContent.innerHTML = '';
    S.poppedId = null;

    const pl = $('#pl');
    pl.style.display = '';
    pl.style.height = '100vh';
    pl.classList.add('active');

    setPiPTitle();
    updatePiPButtons();
  }

  function ensurePiPInteractions() {
    function startDrag(e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      const isTouch = e.type.startsWith('touch');
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      const rect = pipContainer.getBoundingClientRect();
      dragInfo = { offsetX: clientX - rect.left, offsetY: clientY - rect.top };
      doc.addEventListener(isTouch ? 'touchmove' : 'mousemove', moveDrag, { passive: false });
      doc.addEventListener(isTouch ? 'touchend' : 'mouseup', endDrag, { passive: false });
    }

    function moveDrag(e) {
      if (!dragInfo) return;
      const isTouch = e.type.startsWith('touch');
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      pipContainer.style.left = `${clientX - dragInfo.offsetX}px`;
      pipContainer.style.top = `${clientY - dragInfo.offsetY}px`;
    }

    function endDrag() {
      dragInfo = null;
      doc.removeEventListener('touchmove', moveDrag);
      doc.removeEventListener('mousemove', moveDrag);
      doc.removeEventListener('touchend', endDrag);
      doc.removeEventListener('mouseup', endDrag);
    }

    function startResize(e) {
      e.preventDefault();
      const isTouch = e.type.startsWith('touch');
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      const rect = pipContainer.getBoundingClientRect();
      resizeInfo = { startX: clientX, startY: clientY, startW: rect.width, startH: rect.height };
      doc.addEventListener(isTouch ? 'touchmove' : 'mousemove', moveResize, { passive: false });
      doc.addEventListener(isTouch ? 'touchend' : 'mouseup', endResize, { passive: false });
    }

    function moveResize(e) {
      if (!resizeInfo) return;
      const isTouch = e.type.startsWith('touch');
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      const dx = clientX - resizeInfo.startX;
      const dy = clientY - resizeInfo.startY;
      const w = Math.max(120, resizeInfo.startW + dx);
      const h = Math.max(80, resizeInfo.startH + dy);
      pipContainer.style.width = `${w}px`;
      pipContainer.style.height = `${h}px`;
    }

    function endResize() {
      resizeInfo = null;
      doc.removeEventListener('touchmove', moveResize);
      doc.removeEventListener('mousemove', moveResize);
      doc.removeEventListener('touchend', endResize);
      doc.removeEventListener('mouseup', endResize);
    }

    pipTitle.addEventListener('mousedown', startDrag, false);
    pipTitle.addEventListener('touchstart', startDrag, { passive: false });
    pipResize.addEventListener('mousedown', startResize, false);
    pipResize.addEventListener('touchstart', startResize, { passive: false });
  }

  ensurePiPInteractions();
  updatePiPButtons();
  setPiPTitle();

  window.togglePiP = function (mediaId) {
    if (!mediaId) return;
    if (S.poppedId === mediaId) {
      hidePiP();
    } else {
      showMediaInPiP(mediaId);
    }
  };

  window.popOutMedia = showMediaInPiP;
  window.popInMedia = hidePiP;
  window.showMediaInPiP = showMediaInPiP;
  window.hidePiP = hidePiP;
  window.updatePiPButtons = updatePiPButtons;

  pipClose.addEventListener('click', () => {
    if (S.poppedId) {
      hidePiP();
    } else if (S.mediaKeys.length) {
      const curId = S.mediaKeys[S.currentMediaIndex];
      if (curId) window.togglePiP(curId);
    }
  });

  pipPrev.addEventListener('click', () => navigateMedia(-1));
  pipNext.addEventListener('click', () => navigateMedia(1));

  window.addPiPToggleToMediaCard = function (mediaDiv) {
    const req = mediaDiv.requestId ? S.requests.get(mediaDiv.requestId) : null;
    if (req?.isPDF) return;

    const btn = doc.createElement('button');
    btn.title = 'Pop‑out / Picture‑in‑Picture';
    btn.innerHTML = '⛶';
    btn.style.position = 'absolute';
    btn.style.top = '4px';
    btn.style.right = '4px';
    btn.style.background = 'rgba(255,255,255,0.2)';
    btn.style.border = 'none';
    btn.style.color = '#eee';
    btn.style.fontSize = '18px';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      const id = mediaDiv.requestId;
      if (id) window.togglePiP(id);
    };
    mediaDiv.appendChild(btn);
  };
})();
//## Section 5: Sidebar, Chat & Bootstrap

(function initSidebar() {
  const S = window.AppState;
  
  window.switchTab = tab => {
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b.id === `tab-btn-${tab}`));
    $$('.sidebar-tab').forEach(t => t.classList.toggle('active', t.id === `tab-${tab}`));
  };
  
  $('#tab-btn-shows').onclick = () => switchTab('shows');
  $('#tab-btn-music').onclick = () => switchTab('music');
  $('#btnOpn').onclick = () => {
    $('#sidebar').classList.add('open');
  };

  window.getShows = () => {
    let ws = new WebSocket('wss://mitre.paytel.workers.dev');
    ws.onopen = () => ws.send(JSON.stringify({u: 'CMD_KV_GET?key=shows', au: getAuth()}));
    ws.onclose=()=>ws=null;
    ws.onmessage = m => {
    ws.close();
      try {
        const resp = JSON.parse(m.data);
        const data = JSON.parse(resp.d);
        const tree = $('#sidebar-treeview');
        
        let html = '<ul class="col">';
        const genres = Object.keys(data).sort();
        
        for (const genre of genres) {
          html += `<li><div class="toggle">${genre}</div><ul>`;
          const shows = data[genre].sort((a,b) => {
            const t = a.title.localeCompare(b.title);
            return t !== 0 ? t : a.ssn - b.ssn;
          });
          
          for (const show of shows) {
            const base = show.isArchive ? 'https://archive.org/details/' : 'https://archive.org/download/';
            html += `<li><div class="toggle">${show.title} (S${show.ssn} | ${show.lang} | ${show.src})</div><ul>`;
            
            for (const ep of show.episodes) {
              const href = show.isArchive ? 
                `${base}${show.path}${ep.file}` : 
                `${base}${show.path}${ep.file}${show.format || ''}`;
              html += `<li><a href="${href}">${show.isArchive ? 'Archive' : 'Episode'} ${ep.num}</a></li>`;
            }
            html += '</ul></li>';
          }
          html += '</ul></li>';
        }
        html += '</ul>';
        tree.innerHTML = html;
        
        $$('.toggle', tree).forEach(t => {
          t.onclick = () => t.classList.toggle('show');
        });
        
        $$('a', tree).forEach(a => {
          a.onclick = e => {
            e.preventDefault();
            $('#sidebar').classList.remove('open');
            const url = new URL(transformURL(a.href));
            $('#iu').value = url.href;
            window.currentUrl = url;
            window.linkText = a.textContent;
            if (url.pathname.match(/\.(mp3|mp4|flac|ogg|webm)$/i)) $('#cb').checked = true;
            sendRequest(url, null, true);
          };
        });
      } catch(e) {
        $('#sidebar-treeview').textContent = `Error loading shows: ${e.message || e}`;
      }
    };
  };

  // AI Chat Module
  S.chatHistory = [];
  S.aiWs = null;
  
  const chatHTML = `
    <div class="chat-container" id="aiChatContainer">
      <div class="chat-header">
        <span class="chat-title">🤖 AI Assistant</span>
        <div style="display:flex;gap:4px">
          <button class="chat-send" onclick="saveChat()">Save</button>
          <button class="chat-send" onclick="loadChat()">Load</button>
          <button class="chat-send" onclick="clearChat()">Clear</button>
          <button class="chat-close" onclick="closeChat()" style="background:#4a9eff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer">✖</button>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-container">
        <select class="chat-model-select" id="chatModel">
          <optgroup label="Fast">
            <option value="@cf/meta/llama-3.2-1b-instruct">Llama 3.2 1B</option>
            <option value="@cf/meta/llama-3.2-3b-instruct">Llama 3.2 3B</option>
          </optgroup>
          <optgroup label="Powerful">
            <option value="@cf/meta/llama-3.1-8b-instruct">Llama 3.1 8B</option>
          </optgroup>
          <optgroup label="Other">
            <option value="@cf/nvidia/nemotron-3-120b-a12b">NVIDIA</option>
            <option value="@cf/moonshotai/kimi-2.7-code">Moonshot</option>
          </optgroup>
        </select>
        <textarea class="chat-input" id="chatInput" placeholder="Ask anything..." rows="2"></textarea>
        <button class="chat-send" onclick="sendChat()">Send</button>
      </div>
    </div>
  `;
  
  const chatDiv = el('div');
  chatDiv.innerHTML = chatHTML;
  document.body.appendChild(chatDiv.firstElementChild);
  
  window.toggleChat = () => $('#aiChatContainer').classList.toggle('active');
  window.closeChat = () => $('#aiChatContainer').classList.remove('active');
  $('#btnChat').onclick = toggleChat;
  
  window.clearChat = () => {
    S.chatHistory = [];
    $('#chatMessages').innerHTML = '';
  };
  
  window.saveChat = () => {
    const key = $('#chatInput').value.trim() || 'chat_' + Date.now();
    localStorage.setItem(key, JSON.stringify(S.chatHistory));
    U('Saved: ' + key);
  };
  
  window.loadChat = () => {
    const key = $('#chatInput').value.trim();
    if (!key) return U('Enter key in input');
    const data = localStorage.getItem(key);
    if (!data) return U('Not found');
    S.chatHistory = JSON.parse(data);
    $('#chatMessages').innerHTML = '';
    S.chatHistory.forEach(m => addChatMsg(m.content, m.role));
  };
  
  function addChatMsg(text, role) {
    const div = el('div');
    div.className = `chat-message ${role}`;
    div.textContent = text;
    $('#chatMessages').appendChild(div);
    $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  }
  
  window.sendChat = () => {
    const input = $('#chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    
    addChatMsg(msg, 'user');
    S.chatHistory.push({role: 'user', content: msg});
    input.value = '';
    
    const loadDiv = el('div');
    loadDiv.className = 'chat-message ai';
    loadDiv.innerHTML = '<span class="chat-loading"></span>Thinking...';
    $('#chatMessages').appendChild(loadDiv);
    
    const model = $('#chatModel').value;
    
    if (!S.aiWs || S.aiWs.readyState !== WebSocket.OPEN) {
      S.aiWs = new WebSocket('wss://chatt.paytel.workers.dev');
      
      S.aiWs.onopen = () => {
        S.aiWs.send(JSON.stringify({
          u: 'ai_chat', q: randomId(), au: getAuth(),
          prompt: msg, model: model, history: S.chatHistory
        }));
      };
      S.aiWs.onclose=()=>S.aiWs=null;
      S.aiWs.onmessage = ev => {

        const data = JSON.parse(ev.data);
        loadDiv.remove();
        
        if (data.t === 'ai_response') {
          addChatMsg(data.d, 'ai');
          S.chatHistory.push({role: 'assistant', content: data.d});
        } else {
        
          addChatMsg('Error: ' + data.d, 'ai');
        }S.aiWs.close();
      };
      
      S.aiWs.onerror = () => {S.aiWs.close();
        loadDiv.remove();
        addChatMsg('Connection error', 'ai');
      };
    } else {
      S.aiWs.send(JSON.stringify({
        u: 'ai_chat', q: randomId(), au: getAuth(),
        prompt: msg, model: model, history: S.chatHistory
      }));
    }
  };
})();

// Bootstrap
(async function bootstrap() {
  const S = window.AppState;
  try{
  //clear any intervals from paytel
  const topInt=setInterval(function(){},0);
  for (var i=topInt;i>0;i--){
    window.clearInterval(i);
     window.clearTimeout(i);
  }
  }catch(e){U(e)}
   //Click event delegation for shadow dom links
  $('#ct').addEventListener('click',e=>{
   
    const path = e.composedPath();
    const shadow =$('#ct').shadowRoot;
   
    if(!shadow || !path.includes(shadow))return;//ignore outside of shadow

   //pierce shadow
     const a= path.find(el=>el.tagName.toUpperCase()==='A' && el.hasAttribute('href'));

    if(!a || a.className==='proxy-media-link' || a.dataset.pu)return;
 
   //what to.do with special protocols??
  if(['javascript:', 'mailto:', 'tel:', 'data:', 'magnet:'].includes(a.protocol))return;

   //handle anchor links
   const href=a.getAttribute('href') || '';
   if(href.startsWith('#')){
    e.preventDefault();
    const targetId = href.slice(1);
    const target=shadow.getElementById(targetId) || shadow.querySelector(`[name="${targetId}"]`);
   if(target) {
    target.scrollIntoView({behavior: 'smooth'});
   }
   return;
  }

   e.preventDefault();
   e.stopPropagation();
  
   const resolved = resolveURL(a.href);
   if(!resolved)return;
  
   window.linkText = a.textContent;
   const mediaLink = isMedia(resolved);
   const currentTab = S.tabs.find(t=>t.id===S.activeTabId);

   if($('#cb').checked && !mediaLink) {
     const newTabId= Tabs.create(resolved.href,'Loading...',true);
     const newTab = S.tabs.find(t=>t.id===newTabId);
     $('#cb').checked=false;
     if(newTab)newTab.url=resolved;
      sendRequest(resolved,null,!mediaLink,0,'GET',null,mediaLink);
   }else{
      if(currentTab)currentTab.url = resolved;
      sendRequest(resolved,null,!mediaLink,0,'GET',null,mediaLink);
   }
  });

  //Event delegation for forms
   $('#ct').addEventListener('submit',e=>{
    e.preventDefault();
     const path = e.composedPath();
     const shadow=$('#ct').shadowRoot;

     if(!shadow || !path.includes(shadow))return;

    const form = path.find(el=>el.tagName.toUpperCase()==='FORM')
    if(form.tagName.toUpperCase() !== 'FORM')return;
    if(!form)return;

     e.preventDefault();

    const currentTab = S.tabs.find(t=>t.id===S.activeTabId);
    if(!currentTab) return;

    const frmData = new FormData(form);
    const method = (form.method || 'GET').toUpperCase();
    let action = form.getAttribute('action') || '';
    if(!action) action = currentTab.url.pathname+currentTab.url.search;

    const url = new URL(transformURL(action),currentTab.url.origin);

    if(method==='GET'){
     const params = new URLSearchParams();
     frmData.forEach((v,k)=>params.append(k,v));
     url.search = params.toString();
     sendRequest(url,null,false,0,method,null,true);
    }else{
     sendRequest(url,null,false,0,method,null,true);
    }
    });

   //enable zooming
  $('meta[name="viewport"]').setAttribute('content','user-scalable=yes');

  $('#iu').onkeyup = e => {
    if (e.key === 'Enter') {
      let val = $('#iu').value;
      S.currentURL= new URL(transformURL(val));
      sendRequest(S.currentURL, null, true,0,'GET',null,false);
    }
  };
   $('#msgs').ondblclick= () =>adjustAudioRate();
  $('#iu').ondblclick = () => {fade($('#pg'));fade($('#pg2'))}
  $('#pg').ondblclick = () =>{
    const el = $('#pg'); 
    if(el.textContent.startsWith('Proxying')){
      $('#iu').value=el.textContent.replace('Proxying: ','');
   }
  };
  $('#bck').onclick = async () => {
    clearRequestTimeouts();
   const tab=window.AppState.tabs.find(t=>t.id===window.AppState.activeTabId)
    if (tab && tab.history.length > 1) {
     // tab.history.pop();//wait to to pop until succesful successful proxy (handleText)
      const prev = tab.history[tab.history.length-2];//2 to account for current
      window.AppState.backing=true;
      U(`⬅Back that thang up 🚛 ${prev}`);
      sendRequest(prev, null, false);//,0,'GET',null,true);
    }
  };
  
  $('#rf').onclick =async() => {
   S['medRotating']=false;
   S['txtRotating']=false;
   clearRequestTimeouts();
   U('Rotating Server.');
  rotateServer();
  await DL(10);
  rotateServer(null,'media');
  };
  
  // Batch download button
  $('#bs').onclick = () => {
    if (S.downloadingImages) {
      S.downloadingImages = false;
      $('#bs').value = '↓';
    } else {
    try{
      startBatchDownload();
    }catch(e){U(e)}
    }
  };
    window.setupStopBtn=()=>{
      const btn=$('#btn-stop-download');
      if(!btn)return;

    btn.onclick=()=>{
    const S=window.AppState;
    btn.classList.remove('show');

    //find active vid/aud request
     let actReq=null;
    for(const [id, r] of S.requests){
     if((r.isVideo || r.isAudio) && (r.isOpen || r.usesMSE)){
      actReq=r;break;
     }
    }

   if(!actReq)return;
   actReq.userPaused=true;
   actReq.dlPaused=true;
   actReq.isRecovering=false;
   actReq.emergency=false;

    if(S.wsMedia){
    S.wsMedia.onclose = S.wsMedia.onerror = S.wsMedia.onmessage = S.wsMedia.onopen = null;
   S.wsMedia.close();
   S.wsMedia=null;
   S.isMediaConnected=false;
   updateConnectionIndicator();
    }
  prewarmPool('media').catch(()=>{});
  updateStopButton();
  requestAnimationFrame(()=>{
   if(!actReq.dlPaused)btn.classList.remove('show')
  });
   showResumeOptions(actReq);
   };
  }

  $('#hide').onclick = async () => {
   if($('#overlay').style.display==='flex'){
    $('#overlay').style.display='none';
   }else{
    $('#overlay').style.display = 'flex';
    }
  };
 $('#btnPiP').onclick = () => {
  if (S.mediaKeys.length) {
    const curId = S.mediaKeys[S.currentMediaIndex];
    window.togglePiP(curId);
  }
};  
$('#tab-btn-options').onclick = () => switchTab('options');

const optsDiv = $('#sidebar-options');
optsDiv.innerHTML = `
  <div style="display:flex;flex-direction:column;gap:12px;padding:6px">
    <h3 style="margin:0 0 6px;color:var(--accent);font-size:16px">Streaming Options</h3>

    <label class="custom-cb" style="padding:0">
      <input id="opt-smart" type="checkbox" ${S.options.useSmartDefaults ? 'checked' : ''}>
      <span class="checkmark"></span>
      <span>Use smart bitrate-based defaults</span>
    </label>

    <label style="font-size:11px;opacity:0.8">Max Buffer Memory (MB)</label>
    <input id="opt-mem-max" type="number" value="${S.options.maxBufferMemoryMB}" min="20" max="2000"
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">

    <label style="font-size:11px;opacity:0.8">Buffer Target Memory (MB)</label>
    <input id="opt-mem-target" type="number" value="${S.options.bufferMemoryTargetMB}" min="10" max="1500"
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">

    <label style="font-size:11px;opacity:0.8">Streaming Threshold (MB)</label>
    <input id="opt-threshold" type="number" value="${S.options.mseThresholdMB}" min="5" max="5000"
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">

    <label style="font-size:11px;opacity:0.8">Target Buffer (sec)</label>
    <input id="opt-max-ahead" type="number" value="${S.options.maxBufferAhead}" min="20"
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">

    <label style="font-size:11px;opacity:0.8">Min Buffer (sec)</label>
    <input id="opt-target" type="number" value="${S.options.bufferTarget}" min="10"
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">

    <label style="font-size:11px;opacity:0.8">Cleanup Behind (sec)</label>
    <input id="opt-cleanup" type="number" value="${S.options.cleanupBehind}" min="0"
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">

    <label style="font-size:11px;opacity:0.8">mp4box nbSamples</label>
    <input id="opt-nbsamples" type="number" value="${S.options.nbSamples}" min="1" max="200"
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">
   
    <label class="custom-cb" style="padding:0;margin-top:4px">
      <input id="opt-chunking" type="checkbox" ${S.options.useMediaChunking ? 'checked' : ''}>
      <span class="checkmark"></span>
      <span>Range-chunk media downloads</span>
    </label>

    <label style="font-size:11px;opacity:0.8">Chunk size (MB)</label>
    <input id="opt-chunk-size" type="number"
      value="${(S.options.mediaChunkSize/(1024*1024)).toFixed(2)}" min="0.25" max="5" step="0.25" 
      style="padding:6px;background:#111;border:1px solid #555;color:#eee;border-radius:4px">

    <label class="custom-cb" style="padding:0;margin-top:4px">
      <input id="opt-toast" type="checkbox" ${S.options.useToast ? 'checked' : ''}>
      <span class="checkmark"></span>
      <span>Use toast popups (bottom)</span>
    </label>

    <button id="opt-save" style="margin-top:8px;padding:8px;background:var(--accent);color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold">Save</button>
  </div>
`;

function updateOptsDisabled() {
  const smart = $('#opt-smart').checked;
  const chunking = $('#opt-chunking').checked;
  $('#opt-max-ahead').disabled = smart;
  $('#opt-target').disabled = smart;
  $('#opt-cleanup').disabled = smart;
  $('#opt-mem-max').disabled = !smart;
  $('#opt-mem-target').disabled = !smart;
   $('#opt-chunk-size').disabled=!chunking;
}

$('#opt-smart').onchange = updateOptsDisabled;
$('#opt-toast').onchange = updateOptsDisabled;
updateOptsDisabled();

$('#opt-save').onclick = () => {
  S.options.useSmartDefaults = $('#opt-smart').checked;
  S.options.useToast = $('#opt-toast').checked;
  S.options.useMediaChunking=$('#opt-chunking').checked;
  
  const mb = Math.min(5, Math.max(0.25,
    parseFloat($('#opt-chunk-size').value) || 1
  ));
  S.options.mediaChunkSize = Math.round(mb * 1024 * 1024);
  S.options.mseThresholdMB = parseInt($('#opt-threshold').value, 10) || 45;
  S.options.maxBufferAhead = parseInt($('#opt-max-ahead').value, 10) || 180;
  S.options.bufferTarget = parseInt($('#opt-target').value, 10) || 90;
  S.options.cleanupBehind = parseInt($('#opt-cleanup').value, 10) || 12;
  S.options.maxBufferMemoryMB = parseInt($('#opt-mem-max').value, 10) || 100;
  S.options.bufferMemoryTargetMB = parseInt($('#opt-mem-target').value, 10) || 60;
  S.options.nbSamples = parseInt($('#opt-nbsamples').value, 10) || 20;
  localStorage.setItem('options', JSON.stringify(S.options));
  updateOptsDisabled();
   $('#sidebar').classList.remove('open');
  U('Options saved','toast');
};

  $('#overlay').ondblclick = (e) =>{
     $('#overlay').style.display = 'none';
  }

  window.addEventListener('beforeunload',()=>{
   closeAllTabs();
   clearRequestTimeouts();
   revokeAllRequests();
  window.onerror=null;

  [...(S.wsPool?.text || []), ...(S.wsPool?.media || [])].forEach(({ws}) => {
    try { ws.onclose = ws.onopen = ws.onmessage = ws.onerror = null; ws.close();ws=null } catch (_) {}
  });

});

  document.addEventListener('click', e => {
    const sb = $('#sidebar');
    if (sb.classList.contains('open') && 
        !sb.contains(e.target) && 
        e.target.id !== 'btnOpn' && 
        !$('#aud-wrapper').contains(e.target) &&
        !$('#seekSliderContainer').contains(e.target)) {
       sb.classList.remove('open');
    }
    
    if (S.sliderActive && 
        !$('#seekSliderContainer').contains(e.target) && 
        !$('#trackTimeDetail').contains(e.target)) {
      hideSeekSlider();
    }
  });
 
  // Load libraries via proxy
  const loadLib = (url, cb, svr=null) => {
    let ws = new WebSocket(`wss://${svr || servers[Math.floor(Math.random()*servers.length)]}.paytel.workers.dev`);
    ws.onclose=()=>{ws.onmessage=null;ws.onopen=null;ws.onclose=null;ws=null;}
    ws.onopen = () => ws.send(JSON.stringify({u: url, au: getAuth()}));
    ws.onmessage = m => {
      ws.close();
      const r = JSON.parse(m.data);
      if (r.c?.includes('javascript')) {
        const s = el('script');
        s.textContent = r.d;
        document.head.appendChild(s);
        if (cb) cb();
      }
    };
  };

  // Load PDF.js with worker
  loadLib('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', () => {
    let wss = new WebSocket('wss://bn.paytel.workers.dev');
    wss.onclose=()=>{wss.onopen=null;wss.onmessage=null;wss.onclose=null;wss=null;}
    wss.onopen = () => {
      wss.send(JSON.stringify({
       u: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
       au: getAuth()
      }));
    };
    wss.onmessage = ev => {
      wss.close();
      const r = JSON.parse(ev.data);
      if (r.c?.includes('javascript')) {
        const blob = new Blob([r.d], {type: 'application/javascript'});
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
      }
    };
  },'kazak');

  // Load jsmediatags
  loadLib('https://cdn.jsdelivr.net/npm/jsmediatags@3.9.7/dist/jsmediatags.min.js',()=>{
    if(typeof jsmediatags !=='undefined'){
      window.jsmediatags = jsmediatags;
    }
   }); 

  // Load mp4box
  let mws = new WebSocket('wss://mitre.paytel.workers.dev');
  mws.onclose=()=>{mws.onclose=null;mws.onmessage=null;mws.onclose=null;mws=null;}
  mws.onopen = () => mws.send(JSON.stringify({u: 'CMD_KV_GET?key=mp4Beta', au: getAuth()}));
  mws.onmessage = async m => {
    mws.close();
    const code = JSON.parse(m.data).d;
    const blob = new Blob([code], {type: 'application/javascript'});
    const objUrl = URL.createObjectURL(blob);
   try{ S.mp4box = await import(objUrl);}catch(e){$('#iu').value=e}
    S.mp4boxLoaded = true;//U(typeOf S.mp4box.createFile);
   URL.revokeObjectURL(objUrl);
  };
 
  window.loadLandingPage =async () => {
   const S=window.AppState;
    const demo = new URL('https://burningforsuccess.com/wp-content/uploads/2024/07/Peter-Griffin.jpg');
   const id='123456789';
    const shadow = $('#ct').shadowRoot;
    shadow.innerHTML = `<h2 style="color:#eee;padding:20px">You can download .pdf books/docs now from archive.org. Double-tap right side of doc for Next page; left for Previous. Double-tap upper-middle to zoom in; lower-middle to zoom out.<br><br>Batch download images with the ↓ button.</h2>`;

   if(!S.isConnected){
    await waitWhile(null,()=> !S.isConnected,15);
   }
    if(S.isConnected){
    sendRequest(demo, id, false);
    }
 
   if(!S.isMediaConnected){
    await waitWhile(null,()=>!S.isMediaConnected,100);
   }
  /* if(S.isMediaConnected){
   try{    $('#cb').checked=true;
     const demoAud=new URL('https://archive.org/download/tvtunes_2280/Dawsons Creek - 1998.mp3');
    sendRequest(demoAud,'981276345',false);
    }catch(e){U(e,'toast')}
   }*/
  };
  await waitWhile(()=>connectWS(null,'text'),()=>!S.isConnected,15);
 // await DL(55);
  await waitWhile(()=>connectWS(null,'media'),()=>!S.isMediaConnected,15);

  prewarmPool('text').catch(()=>{});
  prewarmPool('media').catch(()=>{});

   setInterval(()=>{
    if(document.hidden)return;
   prewarmPool('text').catch(()=>{});
   prewarmPool('media').catch(()=>{});
   },20000);

 setInterval(()=>{
   try{
   const S=window.AppState;
   
    // reconnect if an active MSE stream has no live media socket
    if (!S.isMediaConnected || !S.wsMedia || S.wsMedia.readyState !== WebSocket.OPEN) {if(S.medRotating)return;
      for (const [id, r] of S.requests) {
        if (r.usesMSE && r.isOpen && !r.dlPaused && !r.fatalError && !r.isRecovering && r.bytesReceived < r.totalBytes) {
          const resumeObj = {
            url: r.url,
            id: r.id,
            bytesReceived: r.bytesReceived,
            method: r.method,
            socketType: 'media'
          };
          rotateServer(resumeObj, 'media');
          break;
        }
      }
    }  
   if(!S.domCache.size)return;
    S.domCache.forEach((div, id)=>{
     const r = S.requests.get(id);
     if(r&& r.usesMSE){checkBuffer(r);}
    });
   }catch(_){
   }
 },1000);
   //startMSECheckLoop();
  getShows();
   U(`👀 Clandestine Entertainment - Version: ${S.version}🎵🎥`,'toast');
   await DL(2300);
   U('Welcome Friend ✌','toast');
//  bootstrapWebTorrent();
})();
