// Universal embed served at https://quuik.com/api/pc.js. Drop
//   <script src="https://quuik.com/api/pc.js" defer></script>
// on any partner / CDN site to beacon pageviews into the network visitor data and show the
// Private Cloud consent bar. Add data-bar="off" to the tag to track silently (no visible bar).
export const dynamic = "force-dynamic";

const JS = `(function(){try{
var TRACK="https://quuik.com/api/net/track",TERMS="https://quuik.com/private-cloud/terms",C="pc_consent",V="pc_vid";
function ck(n){var m=document.cookie.split("; ").find(function(c){return c.indexOf(n+"=")===0});return m?m.slice(n.length+1):""}
function sk(n,v,d){document.cookie=n+"="+v+"; path=/; max-age="+(d*86400)+"; samesite=lax"}
function vid(){var v=ck(V);if(!v){v=(window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2));sk(V,v,730)}return v}
function be(k){try{var b=JSON.stringify({site:location.hostname.replace(/^www\\./,""),path:location.pathname,kind:k,vid:vid()});navigator.sendBeacon?navigator.sendBeacon(TRACK,new Blob([b],{type:"text/plain"})):fetch(TRACK,{method:"POST",body:b,keepalive:true,mode:"no-cors"})}catch(e){}}
be("pageview");
var s=document.currentScript;if((s&&s.getAttribute("data-bar")==="off")||ck(C))return;
function draw(){
var w=document.createElement("div");w.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:2147483000;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif";
var panel=document.createElement("div");panel.style.cssText="display:none;background:#fff;border-top:1px solid #f4cfa6;padding:12px 16px;font-size:13px;color:#4a3a2c;box-shadow:0 -8px 24px rgba(0,0,0,.08);align-items:center;gap:14px;flex-wrap:wrap";
panel.innerHTML='<b style="font-size:13px">Your preferences</b><label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input id="pc_em" type="checkbox" checked> Receive consolidated email through <b>siimpler.com</b></label><span style="color:#8a7a6a;font-size:12px">Use of this site is acknowledgment. You can change these settings any time.</span><button id="pc_save" style="margin-left:auto;background:#F5821F;color:#fff;border:0;border-radius:100px;padding:7px 16px;font-size:12.5px;font-weight:800;cursor:pointer">Save &amp; close</button>';
var b=document.createElement("div");b.style.cssText="min-height:30px;background:#fdefe0;border-top:1px solid #f4cfa6;display:flex;align-items:center;gap:10px;padding:4px 12px;font-size:11.5px;color:#4a3a2c;line-height:1.3";
b.innerHTML='<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Powered by <b>Quuik Private Cloud</b> \\u2014 we collect basic site activity to create savings &amp; efficiencies across our network of businesses, and you may receive consolidated email through siimpler.com. Continuing to use this site is your consent.</span><a href="'+TERMS+'" target="_blank" rel="noopener" style="flex:0 0 auto;color:#F5821F;font-weight:800;text-decoration:none;letter-spacing:.04em">NTOS</a><button id="pc_set" style="flex:0 0 auto;background:#fff;color:#4a3a2c;border:1px solid #f4cfa6;border-radius:100px;padding:4px 12px;font-size:11.5px;font-weight:700;cursor:pointer">Change settings</button><button id="pc_x" aria-label="Close" style="flex:0 0 auto;background:transparent;color:#b3261e;border:0;font-size:16px;font-weight:800;line-height:1;cursor:pointer;padding:0 4px">\\u2715</button>';
w.appendChild(panel);w.appendChild(b);document.body.appendChild(w);
document.getElementById("pc_set").onclick=function(){panel.style.display=(panel.style.display==="none"?"flex":"none");be("pcbar_settings")};
document.getElementById("pc_save").onclick=function(){var on=document.getElementById("pc_em").checked;be(on?"pcbar_email_on":"pcbar_email_off");sk(C,"1",180);w.remove()};
document.getElementById("pc_x").onclick=function(){be("pcbar_ack");sk(C,"1",180);w.remove()};
be("pcbar_view");
}
if(document.body)draw();else document.addEventListener("DOMContentLoaded",draw);
}catch(e){}})();`;

export function GET() {
  return new Response(JS, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
