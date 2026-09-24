import { getCloud } from "@/lib/moneycloud";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "siimpler — one inbox for every business you trust",
  description: "siimpler consolidates the businesses you love into one clean daily, weekly, or monthly email — billing, notifications, and offers in a single dashboard. Save time, money, and declutter your inbox. Powered by medigap.ai and the quuik.com answer engine.",
  robots: { index: true, follow: true },
};

const TEAL = "#0d9488", INK = "#0f2a33", MUT = "#5b7079", ACC = "#ff6a4d";

function Logo({ size = 30 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: size * 0.72, letterSpacing: "-.02em", color: INK }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill={TEAL} /><path d="M9 15h22M9 21h22M9 27h13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".5" /><path d="M9 15h22M9 21h13" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /><circle cx="30" cy="27" r="6" fill="#fff" /><path d="M27.4 27l1.8 1.8 3.2-3.4" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
      siimpler
    </span>
  );
}

export default async function SiimplerHome() {
  const cloud = await getCloud();
  const scroller = [...cloud, ...cloud]; // duplicate for seamless marquee loop

  return (
    <div className="sp">
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var b=JSON.stringify({site:'siimpler.com',path:location.pathname,kind:'pageview'});navigator.sendBeacon?navigator.sendBeacon('/api/net/track',new Blob([b],{type:'application/json'})):fetch('/api/net/track',{method:'POST',headers:{'content-type':'application/json'},body:b,keepalive:true});}catch(e){}})();` }} />
      <style dangerouslySetInnerHTML={{ __html: SP_CSS }} />

      <header className="sp-hdr"><div className="sp-wrap sp-hdr-in">
        <a href="/" className="sp-brand"><Logo /></a>
        <nav className="sp-nav"><a href="#how">How it works</a><a href="#save">Why siimpler</a><a href="#biz">For businesses</a></nav>
        <a href="#join" className="sp-btn sp-btn-sm" onClick={undefined}>🚀 Get free membership</a>
        <button className="sp-menu" data-open="join">Join</button>
      </div></header>

      {/* HERO */}
      <section className="sp-hero"><div className="sp-wrap">
        <div className="sp-eyebrow">The trusted network · powered by medigap.ai + quuik.com</div>
        <h1>One inbox for every business you trust.</h1>
        <p className="sp-lead">The businesses you love, consolidated into a single <b>daily, weekly, or monthly</b> email — billing, notifications, and offers in one clean dashboard. Empty the clutter. Save time and money. Never miss what matters.</p>
        <div className="sp-cta">
          <a href="#join" className="sp-btn sp-btn-lg" data-open="join">🚀 Save time &amp; money — get free membership</a>
          <a href="#biz" className="sp-btn sp-btn-line sp-btn-lg">For businesses →</a>
        </div>
        <div className="sp-trust">No more inbox overload · You choose the cadence · Cancel anytime</div>
      </div></section>

      {/* FEATURED: logo + how-to box */}
      <section id="how" className="sp-sec"><div className="sp-wrap sp-two">
        <div>
          <div className="sp-kick">How it works</div>
          <h2>Three steps to a calmer inbox.</h2>
          <ol className="sp-steps">
            <li><b>Create your free account</b><span>Tell us the businesses and topics you care about.</span></li>
            <li><b>Pick your cadence</b><span>Choose daily, weekly, or monthly for each category — you're in control.</span></li>
            <li><b>Get one clean email</b><span>Billing, notifications, and offers — consolidated, decluttered, done.</span></li>
          </ol>
          <a href="#join" className="sp-btn" data-open="join">Get started free →</a>
        </div>
        <div className="sp-demo">
          <div className="sp-demo-top"><Logo size={22} /><span className="sp-demo-badge">Weekly digest</span></div>
          {[["🧾", "Billing & statements", "3 businesses"], ["🔔", "Account notifications", "5 updates"], ["🏷️", "Offers you opted into", "2 deals"], ["🩺", "Health & insurance", "medigap.ai"], ["💡", "Ask anything", "quuik.com answers"]].map(([e, t, s]) => (
            <div key={t} className="sp-demo-row"><span className="sp-demo-ico">{e}</span><span className="sp-demo-t">{t}</span><span className="sp-demo-s">{s}</span></div>
          ))}
          <div className="sp-demo-foot">One email. Everything that matters. Nothing that doesn't.</div>
        </div>
      </div></section>

      {/* WHY / SAVE */}
      <section id="save" className="sp-sec sp-sec-alt"><div className="sp-wrap">
        <div className="sp-head"><div className="sp-kick">Why siimpler</div><h2>Less clutter. More time. Real savings.</h2></div>
        <div className="sp-cards">
          {[["⏳", "Save time", "Stop digging through dozens of sender emails. One consolidated digest, on your schedule."], ["💸", "Save money", "See the offers and bills that matter together — and the network's exclusive member deals."], ["🧹", "Declutter", "Businesses consolidate their communications so your inbox stops overflowing."], ["🛡️", "Trusted network", "Only vetted businesses join. Powered by medigap.ai and the quuik.com answer engine."]].map(([e, t, d]) => (
            <div key={t} className="sp-card"><div className="sp-card-e">{e}</div><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </div></section>

      {/* MONEY-WORD SCROLLER (dynamic from the network cloud → el.ag marketplace) */}
      <section className="sp-scroller-sec"><div className="sp-wrap sp-scroller-head"><div className="sp-kick" style={{ color: "#bfeee8" }}>Explore the network</div><h2 style={{ color: "#fff" }}>Thousands of trusted businesses &amp; offers</h2></div>
        <div className="sp-marquee"><div className="sp-track">
          {scroller.map((e, i) => <a key={i} href={`https://el.ag/${encodeURIComponent(e.keyword)}`} className="sp-chip">{e.title}</a>)}
        </div></div>
        <div className="sp-scroller-head" style={{ marginTop: 14 }}><a href="https://el.ag/m/d=6,t=5,c=all,newest,theme=business/show" className="sp-btn sp-btn-line" style={{ borderColor: "#fff", color: "#fff" }}>See the marketplace →</a></div>
      </section>

      {/* FOR BUSINESSES */}
      <section id="biz" className="sp-sec"><div className="sp-wrap sp-two">
        <div>
          <div className="sp-kick">For businesses</div>
          <h2>Join siimpler. Reach customers who chose to hear from you.</h2>
          <p className="sp-p">Consolidate your customer communications, cut your send costs, and reach an audience that <b>opted in</b> — via one trusted network. Advertise through the el.ag pay-per-click platform: your keyword, your link, shown in premium slots across the network (including the quuik.com answer engine).</p>
          <div className="sp-cta"><a href="#" className="sp-btn" data-open="advertise">Advertise with us →</a><a href="#" className="sp-btn sp-btn-line" data-open="join">Create a business account</a></div>
        </div>
        <div className="sp-biz-box">
          <div className="sp-biz-stat"><b>Pre-funded PPC</b><span>Only pay for real clicks. Set your own bid.</span></div>
          <div className="sp-biz-stat"><b>Premium placement</b><span>Your offer in siimpler digests + quuik "Have you met?" slots.</span></div>
          <div className="sp-biz-stat"><b>One trusted network</b><span>el.ag marketplace · medigap.ai · quuik.com</span></div>
        </div>
      </div></section>

      {/* CTA band */}
      <section id="join" className="sp-band"><div className="sp-wrap">
        <h2>Ready for a siimpler inbox?</h2>
        <p>Join free. Pick your categories and your cadence. We'll do the rest.</p>
        <a href="#" className="sp-btn sp-btn-lg sp-btn-white" data-open="join">🚀 Get free membership</a>
      </div></section>

      {/* FOOTER */}
      <footer className="sp-ftr"><div className="sp-wrap">
        <div className="sp-ftr-grid">
          <div><Logo size={26} /><p className="sp-ftr-p">One inbox for every business you trust. Save time, money, and declutter — powered by medigap.ai and the quuik.com answer engine.</p></div>
          <div><h4>siimpler</h4><a href="#how">How it works</a><a href="#save">Why siimpler</a><a href="#join">Get membership</a></div>
          <div><h4>Business</h4><a href="#" data-open="advertise">Advertise with us</a><a href="#biz">Create business account</a><a href="https://el.ag/m/d=6,t=5,c=all,newest,theme=business/show">The marketplace</a></div>
          <div><h4>Company</h4><a href="#" data-open="investor">Investor relations</a><a href="#" data-open="news">News</a><a href="#" data-open="influencers">Influencers</a></div>
        </div>
        <div className="sp-ftr-bot"><span>© 2026 siimpler · part of the R0cketShip network 🚀</span><span>Powered by medigap.ai · quuik.com</span></div>
      </div></footer>

      {/* MODALS */}
      {[
        ["join", "🚀 Get your free membership", "Join siimpler free — we'll follow up to set up your categories and cadence.", true],
        ["advertise", "Advertise with us", "Reach opted-in customers across the network. Tell us about your business.", false],
        ["investor", "Investor relations", "Interested in the siimpler / R0cketShip network? Let's talk.", false],
        ["news", "News & press", "Press or media enquiry? Drop your details and we'll be in touch.", false],
        ["influencers", "Influencers & partners", "Want to partner with siimpler? Tell us about your audience.", false],
      ].map(([id, title, sub]) => (
        <div key={id as string} className="sp-modal" id={`m-${id}`}>
          <div className="sp-modal-box">
            <button className="sp-x" data-close={id as string} aria-label="Close">×</button>
            <div className="sp-kick">siimpler</div>
            <h3>{title}</h3>
            <p className="sp-modal-sub">{sub as string}</p>
            <form className="sp-form" data-topic={title as string}>
              <div className="sp-grid2">
                <label className="sp-fld"><span>First name *</span><input name="firstName" required /></label>
                <label className="sp-fld"><span>Last name</span><input name="lastName" /></label>
                <label className="sp-fld full"><span>Email *</span><input name="email" type="email" required /></label>
                <label className="sp-fld full"><span>Phone *</span><input name="phone" type="tel" required /></label>
                <label className="sp-fld full"><span>Anything you'd like us to know?</span><input name="message" /></label>
              </div>
              <div className="sp-msg"></div>
              <button type="submit" className="sp-btn sp-btn-lg" style={{ width: "100%", justifyContent: "center" }}>Send →</button>
              <p className="sp-fineprint">A real human replies — usually the same day.</p>
            </form>
          </div>
        </div>
      ))}

      <script dangerouslySetInnerHTML={{ __html: SP_JS }} />
    </div>
  );
}

const SP_CSS = `
.sp{--teal:#0d9488;--teal-d:#0f766e;--ink:#0f2a33;--mut:#5b7079;--acc:#ff6a4d;--bg:#f3f8f8;--line:#dbe8e8;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:#fff;line-height:1.6}
.sp *{box-sizing:border-box}
.sp .sp-wrap{max-width:1140px;margin:0 auto;padding:0 22px}
.sp h1,.sp h2,.sp h3{margin:0;line-height:1.1;letter-spacing:-.02em}
.sp a{color:inherit;text-decoration:none}
.sp-eyebrow,.sp-kick{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--teal)}
.sp-btn{display:inline-flex;align-items:center;gap:.5rem;font-weight:700;font-size:15px;padding:12px 22px;border-radius:100px;border:2px solid var(--teal);background:var(--teal);color:#fff;cursor:pointer;transition:.16s;white-space:nowrap}
.sp-btn:hover{background:var(--teal-d);border-color:var(--teal-d);transform:translateY(-1px)}
.sp-btn-sm{padding:9px 16px;font-size:14px}.sp-btn-lg{padding:15px 28px;font-size:17px}
.sp-btn-line{background:transparent;color:var(--teal)}.sp-btn-line:hover{background:var(--teal);color:#fff}
.sp-btn-white{background:#fff;color:var(--teal);border-color:#fff}.sp-btn-white:hover{background:transparent;color:#fff}
.sp-hdr{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.sp-hdr-in{display:flex;align-items:center;gap:22px;height:66px}
.sp-nav{display:flex;gap:22px;margin-left:10px}.sp-nav a{font-size:14.5px;font-weight:600;color:#3f5a63}.sp-nav a:hover{color:var(--teal)}
.sp-hdr .sp-btn{margin-left:auto}.sp-menu{display:none;margin-left:auto;background:var(--teal);color:#fff;border:0;border-radius:100px;padding:9px 18px;font-weight:700;cursor:pointer}
.sp-hero{background:linear-gradient(170deg,#eafaf7,#fff);padding:76px 0 60px;border-bottom:1px solid var(--line)}
.sp-hero h1{font-size:clamp(36px,6vw,62px);max-width:15ch;margin:14px 0 0}
.sp-lead{font-size:clamp(17px,2.2vw,21px);color:var(--mut);max-width:56ch;margin:18px 0 26px}
.sp-cta{display:flex;gap:14px;flex-wrap:wrap}
.sp-trust{margin-top:20px;font-size:13px;color:var(--mut)}
.sp-sec{padding:72px 0}.sp-sec-alt{background:var(--bg)}
.sp-head{max-width:60ch;margin-bottom:34px}.sp-head h2,.sp-sec h2{font-size:clamp(28px,4vw,42px);margin-top:8px}
.sp-two{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.sp-steps{list-style:none;padding:0;margin:20px 0 26px;display:grid;gap:14px}
.sp-steps li{display:grid;gap:2px;padding-left:34px;position:relative;counter-increment:s}
.sp-steps li::before{content:counter(s);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:var(--teal);color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center}
.sp-steps li b{font-size:16px}.sp-steps li span{color:var(--mut);font-size:14.5px}
.sp-steps{counter-reset:s}
.sp-demo{background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 30px 60px -32px rgba(13,148,136,.35);padding:20px}
.sp-demo-top{display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
.sp-demo-badge{font-size:12px;font-weight:700;color:var(--teal);background:#e6f7f4;padding:5px 12px;border-radius:100px}
.sp-demo-row{display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid #eef4f4}
.sp-demo-ico{font-size:20px}.sp-demo-t{font-weight:600;flex:1}.sp-demo-s{font-size:12.5px;color:var(--mut)}
.sp-demo-foot{padding-top:14px;font-size:13px;color:var(--mut);text-align:center}
.sp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.sp-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px}
.sp-card-e{font-size:30px}.sp-card h3{font-size:19px;margin:12px 0 6px}.sp-card p{color:var(--mut);font-size:14.5px;margin:0}
.sp-p{color:var(--mut);font-size:16px;margin:14px 0 22px}
.sp-biz-box{display:grid;gap:14px}
.sp-biz-stat{background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:20px}
.sp-biz-stat b{display:block;color:var(--ink);font-size:17px}.sp-biz-stat span{color:var(--mut);font-size:14px}
.sp-scroller-sec{background:linear-gradient(120deg,var(--teal),var(--teal-d));padding:56px 0;color:#fff;overflow:hidden}
.sp-scroller-head{text-align:center}.sp-scroller-head h2{font-size:clamp(24px,3.4vw,36px)}
.sp-marquee{overflow:hidden;margin-top:26px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.sp-track{display:flex;gap:12px;width:max-content;animation:sp-scroll 60s linear infinite}
.sp-marquee:hover .sp-marquee:hover .sp-track{animation-play-state:paused}
@keyframes sp-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.sp-chip{flex:0 0 auto;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:100px;padding:10px 18px;color:#fff;font-weight:600;font-size:14.5px;white-space:nowrap}
.sp-chip:hover{background:#fff;color:var(--teal)}
.sp-band{background:var(--ink);color:#fff;text-align:center;padding:68px 0}
.sp-band h2{font-size:clamp(28px,4vw,44px)}.sp-band p{color:#a9c3ca;margin:12px 0 24px}
.sp-ftr{background:#0b2028;color:#8fa9b1;padding:56px 0 28px}
.sp-ftr-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:30px}
.sp-ftr-p{max-width:34ch;margin:14px 0;font-size:14px;color:#7f99a1}
.sp-ftr h4{color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
.sp-ftr-grid a{display:block;padding:5px 0;color:#8fa9b1;font-size:14.5px;cursor:pointer}.sp-ftr-grid a:hover{color:#fff}
.sp-ftr-bot{border-top:1px solid rgba(255,255,255,.12);margin-top:36px;padding-top:20px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:12.5px;color:#5f7c85}
.sp-modal{position:fixed;inset:0;z-index:120;background:rgba(15,42,51,.55);display:none;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(3px)}
.sp-modal.open{display:flex}
.sp-modal-box{background:#fff;border-radius:22px;max-width:520px;width:100%;padding:32px;position:relative;max-height:92vh;overflow:auto;box-shadow:0 40px 80px -30px rgba(15,42,51,.5)}
.sp-x{position:absolute;top:14px;right:16px;background:none;border:0;font-size:28px;cursor:pointer;color:var(--mut)}
.sp-modal-box h3{font-size:25px;margin:4px 0}.sp-modal-sub{color:var(--mut);font-size:14.5px;margin:6px 0 0}
.sp-form{margin-top:16px}.sp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sp-fld{display:flex;flex-direction:column;gap:6px}.sp-fld.full{grid-column:1/-1}
.sp-fld span{font-size:13px;font-weight:600;color:#4a6169}
.sp-fld input{font-family:inherit;font-size:15.5px;padding:12px 13px;border:1.5px solid var(--line);border-radius:11px;background:var(--bg)}
.sp-fld input:focus{outline:none;border-color:var(--teal);background:#fff;box-shadow:0 0 0 4px rgba(13,148,136,.12)}
.sp-msg{margin:12px 0 0;font-weight:600;font-size:14px;display:none}
.sp-msg.ok{display:block;color:#1f7a52}.sp-msg.err{display:block;color:#b3402a}
.sp-form .sp-btn{margin-top:14px}.sp-fineprint{text-align:center;color:var(--mut);font-size:12.5px;margin-top:10px}
@media(max-width:900px){.sp-two{grid-template-columns:1fr;gap:30px}.sp-cards{grid-template-columns:1fr 1fr}.sp-ftr-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.sp-nav{display:none}.sp-hdr .sp-btn{display:none}.sp-menu{display:block}.sp-cards{grid-template-columns:1fr}.sp-grid2{grid-template-columns:1fr}.sp-ftr-grid{grid-template-columns:1fr}}
`;

const SP_JS = `
(function(){
  function open(id){var m=document.getElementById('m-'+id);if(m){m.classList.add('open');document.body.style.overflow='hidden';}}
  function close(m){m.classList.remove('open');document.body.style.overflow='';}
  document.querySelectorAll('[data-open]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();open(b.getAttribute('data-open'));});});
  document.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){close(b.closest('.sp-modal'));});});
  document.querySelectorAll('.sp-modal').forEach(function(m){m.addEventListener('click',function(e){if(e.target===m)close(m);});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.sp-modal.open').forEach(close);});
  document.querySelectorAll('.sp-form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();
    var msg=f.querySelector('.sp-msg');var data=Object.fromEntries(new FormData(f).entries());data.topic=f.getAttribute('data-topic')||'siimpler';
    if(!data.firstName||!data.email||!data.phone){msg.className='sp-msg err';msg.textContent='Please add your name, email and phone.';return;}
    var btn=f.querySelector('button[type=submit]');var o=btn.textContent;btn.disabled=true;btn.textContent='Sending…';
    fetch('/api/siimpler/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json().catch(function(){return{};});})
      .then(function(j){if(j&&j.ok){f.innerHTML='<div style=\\'text-align:center;padding:14px 0\\'><div style=\\'width:64px;height:64px;border-radius:50%;background:#0d9488;color:#fff;display:grid;place-items:center;font-size:30px;margin:0 auto 14px\\'>✓</div><h3>Thank you!</h3><p style=\\'color:#5b7079\\'>We\\'ve got your details — a real human will reply, usually the same day.</p></div>';}
        else{msg.className='sp-msg err';msg.textContent=(j&&j.error)||'Something went wrong — please try again.';btn.disabled=false;btn.textContent=o;}})
      .catch(function(){msg.className='sp-msg err';msg.textContent='Network error — please try again.';btn.disabled=false;btn.textContent=o;});
  });});
})();
`;
