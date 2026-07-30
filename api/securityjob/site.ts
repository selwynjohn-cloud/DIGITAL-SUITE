import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  CITY_OPTIONS,
  EDUCATION_OPTIONS,
  EXPERIENCE_OPTIONS,
  LANGUAGE_OPTIONS,
  ROLE_OPTIONS,
  getJobs,
  getSettings,
} from '../_lib/securityjob/store.js'

/** Rotating deep-jewel palette [from, to] for job cards (matches the old look). */
const JOB_PALETTE: [string, string][] = [
  ['#1e2a63', '#28347d'], // deep navy-indigo
  ['#14532d', '#166534'], // deep green
  ['#4c1d95', '#6b21a8'], // deep purple
  ['#7f1d1d', '#9f1239'], // deep maroon
  ['#134e4a', '#115e63'], // deep teal
  ['#7c2d12', '#9a3412'], // deep rust
]

function esc(v: unknown): string {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const STATUS_COLOR: Record<string, string> = {
  Active: '#15803d',
  Upcoming: '#b45309',
  Closed: '#6b7280',
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const [settings, jobs] = await Promise.all([getSettings(), getJobs()])

  const jobCards = jobs
    .filter((j) => j.status !== 'Closed')
    .slice(0, 6)
    .map((j, i) => {
      const [c1, c2] = JOB_PALETTE[i % JOB_PALETTE.length]
      const statusColor = j.status === 'Upcoming' ? '#f59e0b' : j.status === 'Closed' ? '#94a3b8' : '#34d399'
      const benefits = j.benefits
        .map((b) => `<li>${esc(b)}</li>`)
        .join('')
      const dates =
        j.postedDate || j.closingDate
          ? `<div class="jdates">${j.postedDate ? `<span>📅 Posted: ${esc(j.postedDate)}</span>` : ''}${j.closingDate ? `<span>⏳ Closes: ${esc(j.closingDate)}</span>` : ''}</div>`
          : ''
      return `<div class="jcard" style="background:linear-gradient(160deg,${c1},${c2})">
        <span class="jstatus"><span class="jdot" style="background:${statusColor}"></span>${esc(j.status)}</span>
        <h3>${esc(j.title)}</h3>
        <div class="jloc">📍 ${esc(j.locations)}</div>
        <div class="jelig"><span>ELIGIBILITY</span>${esc(j.eligibility)}</div>
        ${j.wages ? `<div class="jwage"><span>TAKE HOME WAGES</span><b>${esc(j.wages)}</b></div>` : ''}
        <ul class="jben">${benefits}</ul>
        ${dates}
        <a href="#register" class="jbtn" style="color:${c1}">Register Now — It's Free</a>
      </div>`
    })
    .join('')

  const cityOpts = ['<option value="">Select your city</option>', ...CITY_OPTIONS.map((c) => `<option>${esc(c.city)}</option>`)].join('')
  const roleOpts = ROLE_OPTIONS.map((r) => `<option>${esc(r)}</option>`).join('')
  const expOpts = EXPERIENCE_OPTIONS.map((r) => `<option>${esc(r)}</option>`).join('')
  const eduOpts = ['<option value="">Select qualification</option>', ...EDUCATION_OPTIONS.map((r) => `<option>${esc(r)}</option>`)].join('')
  const langOpts = LANGUAGE_OPTIONS.map((r) => `<option>${esc(r)}</option>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Security Guard Jobs in India | Agile Security Force — Free Registration</title>
<meta property="og:title" content="Security Guard Jobs in India — Agile Security Force">
<meta property="og:description" content="India's trusted platform for security careers. 100% FREE registration.">
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f7fb;color:#1e293b}
a{color:inherit}.wrap{max-width:960px;margin:0 auto;padding:0 16px}
.freebar{background:#c9a84c;color:#14224f;text-align:center;font-weight:800;font-size:15px;padding:12px 14px;letter-spacing:.2px;line-height:1.4}
.top{background:#14224f;color:#fff;padding:16px 0;border-bottom:4px solid #c9a84c}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:10px}
.nav{display:flex;align-items:center;gap:24px}
.nav a{color:#e2e8f0;text-decoration:none;font-size:17px;font-weight:700}
.nav a:hover{color:#c9a84c}
.navbtn{background:#c9a84c;color:#14224f!important;padding:11px 20px;border-radius:9px;font-weight:800;font-size:16px}
@media(max-width:760px){.nav{display:none}}
.brand{display:flex;align-items:center;gap:14px;font-weight:900;font-size:24px}
.brand img{height:60px}
.brand small{display:block;color:#c9a84c;font-size:14px;font-weight:700}
.hero{background:linear-gradient(90deg,rgba(20,34,79,.93) 0%,rgba(20,34,79,.80) 30%,rgba(20,34,79,.52) 55%,rgba(20,34,79,.30) 78%,rgba(20,34,79,.22) 100%),#14224f url('/securityjob/hero.jpg');background-repeat:no-repeat;background-size:cover;background-position:center 20%;color:#fff;text-align:left;padding:52px 0 58px;min-height:660px;display:flex;align-items:center}
.hero .wrap{width:100%}
.hero-copy{max-width:600px;text-shadow:0 2px 12px rgba(8,14,35,.55)}
@media(max-width:760px){.hero{min-height:500px;background-position:62% 18%;padding:38px 0 44px}}
.pill-top{display:inline-block;background:rgba(201,168,76,.18);color:#f2d9a6;border:1.5px solid rgba(201,168,76,.6);font-size:16px;font-weight:800;padding:9px 20px;border-radius:999px;margin-bottom:16px;line-height:1.35}
@media(max-width:760px){.pill-top{font-size:14px;padding:8px 16px}}
.hero h1{font-size:36px;font-weight:900;line-height:1.15}
.hero h1 .g{color:#c9a84c}
.hero p{margin-top:14px;font-size:17px;color:#eef2fb;max-width:460px}
.stats{display:flex;gap:30px;justify-content:flex-start;flex-wrap:wrap;margin-top:26px}
.stat b{display:block;font-size:30px;color:#c9a84c;font-weight:900}.stat span{font-size:13px;color:#e2e8f0}
.discover{margin-top:20px;font-size:18px;font-weight:600;color:#eef2fb}.discover a{color:#c9a84c;font-weight:800;text-decoration:underline}
.btns{margin-top:22px;display:flex;gap:10px;justify-content:flex-start;flex-wrap:wrap}
.btn{padding:13px 26px;border-radius:10px;font-weight:800;text-decoration:none;font-size:15px}
.btn-gold{background:#c9a84c;color:#14224f}.btn-out{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
section{padding:40px 0}h2{text-align:center;font-size:28px;color:#14224f;margin-bottom:6px;font-weight:900}
.sub{text-align:center;color:#64748b;margin-bottom:22px;font-size:15px}
.grid{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:680px){.grid{grid-template-columns:1fr 1fr}.hero h1{font-size:56px}}
@media(min-width:960px){.grid{grid-template-columns:1fr 1fr 1fr}}
/* colourful "Why join" banner cards */
.whygrid{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:680px){.whygrid{grid-template-columns:1fr 1fr}}
.whycard{border-radius:14px;padding:20px;color:#fff;box-shadow:0 6px 18px rgba(20,34,79,.15)}
.whycard .wc-eye{display:block;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.82);margin-bottom:6px}
.whycard b{font-size:19px;display:block;margin-bottom:6px}
.whycard p{font-size:14px;line-height:1.5;color:rgba(255,255,255,.95)}
.eyebrow{display:inline-block;background:#eef2fb;color:#1d4ed8;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:6px 14px;border-radius:999px}
.acc{width:76px;height:4px;background:linear-gradient(90deg,#c9a84c,#e6c86e);border-radius:3px;margin:12px auto 18px}
.whyhead{text-align:center;margin-bottom:8px}
.whyintro{max-width:720px;margin:0 auto 26px;text-align:center;font-size:18px;line-height:1.7;color:#334155;font-weight:500}
.whyintro b{color:#14224f;font-weight:800}
/* Industry-Leading Benefits panel */
.benefits{background:linear-gradient(160deg,#14224f,#1b2f6b);border-radius:20px;padding:28px 22px;margin-top:28px;box-shadow:0 12px 32px rgba(20,34,79,.22)}
.benefits h3{color:#fff;font-size:22px;font-weight:900;margin-bottom:20px}
.bgrid{display:grid;gap:14px;grid-template-columns:1fr 1fr}
@media(min-width:820px){.bgrid{grid-template-columns:1fr 1fr 1fr 1fr}}
.btile{border-radius:14px;padding:16px;color:#fff;font-weight:700;font-size:14px;line-height:1.35;min-height:104px;display:flex;flex-direction:column;justify-content:flex-start;box-shadow:0 4px 12px rgba(0,0,0,.18)}
.bic{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.22);font-size:17px;margin-bottom:10px}
.btesti{margin:22px auto 0;max-width:820px;color:#e2e8f0;font-style:italic;font-size:15px;line-height:1.7;border-left:4px solid #c9a84c;padding:6px 0 6px 18px;text-align:left}
/* colourful How-It-Works steps */
.steps{display:grid;gap:16px;grid-template-columns:1fr}@media(min-width:680px){.steps{grid-template-columns:1fr 1fr 1fr 1fr}}
.cstep{border-radius:14px;padding:20px 16px;text-align:center;color:#fff;box-shadow:0 6px 18px rgba(20,34,79,.15)}
.cstep .n{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.22);color:#fff;font-weight:900;font-size:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px}
.cstep b{font-size:16px;display:block}
.cstep p{font-size:13px;margin-top:6px;color:rgba(255,255,255,.95)}
.step{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center}
.step .n{width:38px;height:38px;border-radius:50%;background:#14224f;color:#c9a84c;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 8px}
/* Full-colour job cards */
.jcard{border-radius:16px;padding:20px;color:#fff;display:flex;flex-direction:column;box-shadow:0 10px 26px rgba(20,34,79,.22)}
.jstatus{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.22);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;padding:4px 11px;border-radius:999px}
.jdot{width:8px;height:8px;border-radius:50%;display:inline-block}
.jcard h3{margin:12px 0 4px;font-size:22px;font-weight:900;color:#fff}
.jloc{font-size:13px;color:rgba(255,255,255,.9);margin-bottom:14px}
.jelig{font-size:14px;color:#fff;margin-bottom:12px}
.jelig span{display:block;font-size:11px;font-weight:800;letter-spacing:.6px;color:rgba(255,255,255,.78);margin-bottom:2px}
.jwage{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:11px 14px;margin-bottom:14px}
.jwage span{font-size:11px;font-weight:800;letter-spacing:.6px;color:rgba(255,255,255,.72)}
.jwage b{font-size:16px;font-weight:900;color:#ffd76a}
.jben{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:8px}
.jben li{position:relative;padding-left:18px;font-size:13px;color:rgba(255,255,255,.94);line-height:1.4}
.jben li::before{content:"•";position:absolute;left:2px;top:-1px;color:rgba(255,255,255,.7);font-weight:900;font-size:16px}
.jdates{display:flex;flex-wrap:wrap;gap:12px;font-size:11.5px;color:rgba(255,255,255,.82);border-top:1px solid rgba(255,255,255,.24);padding-top:10px;margin-bottom:12px}
.jbtn{margin-top:auto;display:block;text-align:center;background:#fff;font-weight:800;padding:12px;border-radius:10px;text-decoration:none}
/* Administrative & Operations banner */
.adminbar{background:linear-gradient(120deg,#7c3aed 0%,#5b3ec8 40%,#0e7490 100%);border-radius:18px;padding:26px 28px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;box-shadow:0 12px 30px rgba(20,34,79,.22)}
.adminbar .eyebrow2{display:block;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.85);margin-bottom:8px}
.adminbar h2{color:#fff;text-align:left;margin:0 0 6px;font-size:26px}
.adminbar p{color:rgba(255,255,255,.92);font-size:14.5px;margin:0}
.adminbar .btn-gold{white-space:nowrap}
.form{background:#fff;border:3px solid #c9a84c;border-radius:18px;padding:24px;max-width:560px;margin:0 auto;box-shadow:0 10px 30px rgba(20,34,79,.12)}
.form-head{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#14224f,#1b2f6b);color:#fff;border-radius:12px;padding:14px 16px;margin-bottom:18px}
.form-head img{height:48px;flex:none}
.form-head b{display:block;font-size:16px;font-weight:800;line-height:1.2}
.form-head span{display:block;font-size:12.5px;color:#c9a84c;font-weight:800;letter-spacing:.6px;margin-top:2px}
label{display:block;font-size:13px;font-weight:700;color:#334155;margin:12px 0 4px}
input[type=text],input[type=tel],select{width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:9px;font-size:15px}
.photo-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.thumb{width:76px;height:76px;border-radius:10px;object-fit:cover;border:2px solid #cbd5e1;background:#f1f5f9}
.submit{width:100%;margin-top:18px;background:#c9a84c;color:#14224f;border:none;padding:14px;border-radius:10px;font-size:16px;font-weight:800;cursor:pointer}
.foot{background:#14224f;color:#cdd6ea;text-align:center;padding:26px 0;font-size:13px;margin-top:20px}
.foot a{color:#c9a84c;font-weight:700;text-decoration:none}
.ok{background:#e7f0ff;color:#14224f;border-radius:12px;padding:22px;text-align:center;font-weight:700;display:none}
.msg{font-size:13px;font-weight:700;margin-top:10px}
.photo-btns{display:flex;gap:10px;flex-wrap:wrap}
.pbtn{flex:1;min-width:150px;padding:12px 14px;border-radius:10px;border:2px solid #14224f;background:#fff;color:#14224f;font-weight:800;cursor:pointer;font-size:14px}
.pbtn.sel{border-color:#15803d;color:#15803d}
.pbtn small{display:block;font-weight:600;font-size:11px;color:#64748b;margin-top:2px}
.freenote{font-size:15px;font-weight:800;color:#15803d;margin-top:14px;text-align:center;line-height:1.5}
/* Recruitment song */
.songbtns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:22px}
.songbtn{background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.28);color:#fff;border-radius:12px;padding:12px 22px;font-weight:800;font-size:15px;cursor:pointer;text-align:center;line-height:1.2}
.songbtn small{display:block;font-weight:500;font-size:11.5px;color:rgba(255,255,255,.72);margin-top:3px}
.songbtn.active{background:#c9a84c;color:#14224f;border-color:#c9a84c}
.songbtn.active small{color:#14224f}
.songcard{max-width:520px;margin:0 auto;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:22px}
.songtitle{font-size:18px;font-weight:800;margin-bottom:14px;color:#fff}
.songtitle span{color:#c9a84c;font-weight:600}
#cam{position:fixed;inset:0;background:rgba(8,14,35,.92);z-index:99;display:none;flex-direction:column;align-items:center;justify-content:center;padding:16px}
#cam video{width:100%;max-width:360px;border-radius:14px;background:#000;transform:scaleX(-1)}
#cam .camrow{margin-top:16px;display:flex;gap:12px}
#cam button{padding:13px 22px;border-radius:10px;border:none;font-weight:800;font-size:15px;cursor:pointer}
</style></head>
<body>
<div class="freebar">🛡 This recruitment portal is completely FREE to use — No fees at any stage of the recruitment process.</div>
<div class="top"><div class="wrap">
  <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile"><span>Agile Security Force<small>Private Limited</small></span></div>
  <nav class="nav">
    <a href="#openings">Jobs</a>
    <a href="#adminops">Admin / Ops</a>
    <a href="#why">Why Us</a>
    <a href="#contact">Contact</a>
    <a href="#register" class="navbtn">Register Free</a>
  </nav>
</div></div>

<div class="hero"><div class="wrap"><div class="hero-copy">
  <div class="pill-top">🛡 India's First and Only Specialized Job Platform for the Security Sector.</div>
  <h1>Start Your Career in<br><span class="g">Security Services</span></h1>
  <p>Join thousands of security professionals across India. Register today and our team will match you with the best posting near you.</p>
  <div class="btns"><a class="btn btn-gold" href="#register">Register for Free →</a><a class="btn btn-out" href="#openings">View Job Openings</a></div>
  <div class="stats">
    <div class="stat"><b>${esc(settings.guardsPlaced)}</b><span>Guards Placed</span></div>
    <div class="stat"><b>${esc(settings.locations)}</b><span>Locations</span></div>
    <div class="stat"><b>${esc(settings.states)}</b><span>States Covered</span></div>
  </div>
  <div class="discover">Discover our full range of services at <a href="https://www.agilegroup.co.in">www.agilegroup.co.in</a></div>
</div></div></div>

<section id="why"><div class="wrap">
  <div class="whyhead"><span class="eyebrow">Our Promise to You</span></div>
  <h2>Why Join Agile Security?</h2>
  <div class="acc"></div>
  <p class="whyintro">Join a team that sees you as <b>more than a guard</b>. At Agile Security, we stand behind the people who protect others — with <b>respect, training, support,</b> and a <b>future you can be proud of</b>.</p>
  <div class="whygrid">
    <div class="whycard" style="background:linear-gradient(135deg,#1d4ed8,#2563eb)"><span class="wc-eye">Tailor Made</span><b>👕 Our Uniform</b><p>Wearing a tailor-fit uniform that reflects discipline, confidence, and the pride of serving as a trusted protector.</p></div>
    <div class="whycard" style="background:linear-gradient(135deg,#15803d,#16a34a)"><span class="wc-eye">Workforce Development</span><b>📈 We Invest in Guards</b><p>We help you grow from day one through continuous on-the-job and online training — so your job can become a stronger, more secure career.</p></div>
    <div class="whycard" style="background:linear-gradient(135deg,#7c3aed,#9333ea)"><span class="wc-eye">Rashtriya Raksha University Affiliated</span><b>🎓 RRU-Affiliated Academy</b><p>Build confidence with PSARA-approved training and Rashtriya Raksha University certification that adds real value to your professional journey.</p></div>
    <div class="whycard" style="background:linear-gradient(135deg,#0e7490,#0891b2)"><span class="wc-eye">Full Transparency</span><b>📱 In-House Mobile App</b><p>Stay connected and supported on every posting with transparent duty information and an SOS alarm that helps ensure you are never left alone in a difficult moment.</p></div>
  </div>

  <div class="benefits">
    <h3>⭐ Industry-Leading Benefits</h3>
    <div class="bgrid">
      <div class="btile" style="background:linear-gradient(135deg,#1d4ed8,#2563eb)"><span class="bic">📈</span>Competitive wages &amp; performance incentives</div>
      <div class="btile" style="background:linear-gradient(135deg,#be123c,#e11d48)"><span class="bic">❤️</span>Comprehensive health &amp; wellness — ESI &amp; PF</div>
      <div class="btile" style="background:linear-gradient(135deg,#0e7490,#0d9488)"><span class="bic">🕐</span>Flexible scheduling options</div>
      <div class="btile" style="background:linear-gradient(135deg,#b45309,#d97706)"><span class="bic">📊</span>Clear career growth &amp; advancement paths</div>
      <div class="btile" style="background:linear-gradient(135deg,#15803d,#16a34a)"><span class="bic">🛡</span>Safe, supportive working environment</div>
      <div class="btile" style="background:linear-gradient(135deg,#a16207,#ca8a04)"><span class="bic">⭐</span>Employee recognition &amp; reward programs</div>
      <div class="btile" style="background:linear-gradient(135deg,#7c3aed,#9333ea)"><span class="bic">👥</span>Reliable work with respected clients</div>
      <div class="btile" style="background:linear-gradient(135deg,#0369a1,#0284c7)"><span class="bic">🎖</span>Opportunity for Operational Support Incentives</div>
    </div>
    <blockquote class="btesti">"We believe that when our guards are well-compensated, well-trained, and well-supported, they provide the highest level of security service. Join Agile Security and become part of a team that values your dedication, professionalism, and commitment to excellence."</blockquote>
  </div>
</div></section>

<section id="openings"><div class="wrap">
  <h2>Security Job Openings</h2>
  <div class="acc"></div>
  <div class="sub">Active positions across India — apply now, positions fill fast.</div>
  <div class="grid">${jobCards || '<p style="text-align:center;color:#64748b">New openings will appear here soon.</p>'}</div>
</div></section>

<section id="adminops"><div class="wrap">
  <div class="adminbar">
    <div>
      <span class="eyebrow2">Office &amp; Operations — Pan India</span>
      <h2>Administrative &amp; Operations Positions</h2>
      <p>Hiring for HR, Admin, Accounts, Operations &amp; Coordination roles — register directly, no fees ever.</p>
    </div>
    <a class="btn btn-gold" href="#register">Register Now — It's Free</a>
  </div>
</div></section>

<section style="background:#f1f5f9"><div class="wrap">
  <h2>How It Works — 4 Simple Steps</h2>
  <div class="sub">No fees. No hassle. Just register and we take it from there.</div>
  <div class="steps">
    <div class="cstep" style="background:linear-gradient(135deg,#1d4ed8,#2563eb)"><div class="n">1</div><b>Register Free</b><p>Fill the form &amp; add a photo — one minute.</p></div>
    <div class="cstep" style="background:linear-gradient(135deg,#15803d,#16a34a)"><div class="n">2</div><b>We Match You</b><p>We find the best posting near you.</p></div>
    <div class="cstep" style="background:linear-gradient(135deg,#b45309,#d97706)"><div class="n">3</div><b>Interview</b><p>A brief interview near your location.</p></div>
    <div class="cstep" style="background:linear-gradient(135deg,#7c3aed,#9333ea)"><div class="n">4</div><b>Training &amp; Deployment</b><p>Induction, posting &amp; a new career.</p></div>
  </div>
</div></section>

<section id="song" style="background:linear-gradient(160deg,#0f1e46,#14224f)"><div class="wrap" style="text-align:center">
  <h2 style="color:#fff">🎵 Agile Group Recruitment Song</h2>
  <div class="acc"></div>
  <div class="sub" style="color:#cdd6ea">Listen and download our recruitment anthem in your language.</div>
  <div class="songbtns">
    <button class="songbtn active" data-src="/securityjob/song-english.mp3" data-title="The Shield of Honor" data-lang="English" data-file="Agile-Recruitment-Song-English.mp3" onclick="pickSong(this)">English<small>The Shield of Honor</small></button>
    <button class="songbtn" data-src="/securityjob/song-telugu.mp3" data-title="Gauravam – Rakshana" data-lang="Telugu" data-file="Agile-Recruitment-Song-Telugu.mp3" onclick="pickSong(this)">తెలుగు / Telugu<small>Gauravam – Rakshana</small></button>
    <button class="songbtn" data-src="/securityjob/song-hindi.mp3" data-title="Shaurya aur Suraksha" data-lang="Hindi" data-file="Agile-Recruitment-Song-Hindi.mp3" onclick="pickSong(this)">हिंदी / Hindi<small>Shaurya aur Suraksha</small></button>
  </div>
  <div class="songcard">
    <div id="songTitle" class="songtitle">The Shield of Honor <span>· English</span></div>
    <audio id="songAudio" controls preload="none" src="/securityjob/song-english.mp3" style="width:100%"></audio>
    <a id="songDl" class="btn btn-gold" href="/securityjob/song-english.mp3" download="Agile-Recruitment-Song-English.mp3" style="margin-top:16px;display:inline-block">⬇ Download Song</a>
  </div>
</div></section>

<section id="register"><div class="wrap">
  <h2>Register Now — It's Free</h2>
  <div class="sub">Fill in your details and we'll contact you within 12 working hours.</div>
  <div class="form">
    <div class="form-head">
      <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile Security Force">
      <div><b>Agile Security Force Private Limited</b><span>REGISTRATION FORM (EOI)</span></div>
    </div>
    <div id="okBox" class="ok"></div>
    <div id="formInner">
      <label>Full Name *</label><input type="text" id="f_name">
      <label>Your Photo *</label>
      <div class="photo-row" style="margin-bottom:10px"><img id="f_thumb" class="thumb" style="display:none"></div>
      <div class="photo-btns">
        <button type="button" class="pbtn" id="btnUpload" onclick="uploadPhoto()">📁 Upload Photo<small>JPG / PNG from device</small></button>
        <button type="button" class="pbtn" id="btnSelfie" onclick="openCamera()">🤳 Take Instant Selfie<small>Use your camera live</small></button>
      </div>
      <label>Phone Number *</label><input type="tel" id="f_phone" inputmode="numeric">
      <label>Preferred Location (City) *</label><select id="f_location">${cityOpts}</select>
      <label>Experience *</label><select id="f_exp">${expOpts}</select>
      <label>Job Rank / Role Applying For *</label><select id="f_role">${roleOpts}</select>
      <label>Educational Qualification</label><select id="f_edu">${eduOpts}</select>
      <label>Primary Language</label><select id="f_lang">${langOpts}</select>
      <button class="submit" onclick="submitReg()">Register Now — It's Free</button>
      <div id="formMsg" class="msg"></div>
      <p class="freenote">Registration and Recruitment are completely free. No hidden charges for recruitment. No need to pay money for your recruitment.</p>
    </div>
  </div>
</div></section>

<div class="foot" id="contact"><div class="wrap">
  <div>📞 ${esc(settings.whatsapp)} &nbsp;|&nbsp; ✉️ ${esc(settings.email1)}</div>
  <div style="margin-top:10px;font-size:12.5px;color:#aab6d0;line-height:1.6">The website was designed and published by Cursor.AI, San Francisco, United States, for Agile Security Force Private Limited. &copy; 2026 All rights reserved</div>
</div></div>

<div id="cam">
  <video id="camVideo" autoplay playsinline muted></video>
  <div class="camrow">
    <button style="background:#16a34a;color:#fff" onclick="capturePhoto()">📸 Capture</button>
    <button style="background:#e2e8f0;color:#14224f" onclick="closeCamera()">Cancel</button>
  </div>
</div>
<script>
var photoData='';var camStream=null;
function resizeToData(src,cb){var img=new Image();img.onload=function(){var mx=600,w=img.width,h=img.height;if(w>mx||h>mx){if(w>h){h=Math.round(h*mx/w);w=mx;}else{w=Math.round(w*mx/h);h=mx;}}var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',0.82));};img.src=src;}
function setThumb(d){photoData=d;var t=document.getElementById('f_thumb');t.src=d;t.style.display='inline-block';document.getElementById('btnUpload').classList.remove('sel');document.getElementById('btnSelfie').classList.remove('sel');}
function uploadPhoto(){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){resizeToData(e.target.result,function(d){setThumb(d);document.getElementById('btnUpload').classList.add('sel');});};r.readAsDataURL(f);};
  inp.click();
}
function openCamera(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    // Fallback: use the device camera via file input.
    var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.capture='user';
    inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){resizeToData(e.target.result,function(d){setThumb(d);document.getElementById('btnSelfie').classList.add('sel');});};r.readAsDataURL(f);};
    inp.click();return;
  }
  navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false}).then(function(s){
    camStream=s;var v=document.getElementById('camVideo');v.srcObject=s;document.getElementById('cam').style.display='flex';
  }).catch(function(){alert('Could not open the camera. Please allow camera access, or use Upload Photo instead.');});
}
function capturePhoto(){
  var v=document.getElementById('camVideo');var c=document.createElement('canvas');var w=v.videoWidth||480,h=v.videoHeight||640;var mx=600;if(w>mx||h>mx){if(w>h){h=Math.round(h*mx/w);w=mx;}else{w=Math.round(w*mx/h);h=mx;}}c.width=w;c.height=h;var ctx=c.getContext('2d');ctx.translate(w,0);ctx.scale(-1,1);ctx.drawImage(v,0,0,w,h);setThumb(c.toDataURL('image/jpeg',0.82));document.getElementById('btnSelfie').classList.add('sel');closeCamera();
}
function closeCamera(){if(camStream){camStream.getTracks().forEach(function(t){t.stop();});camStream=null;}document.getElementById('cam').style.display='none';}
function pickSong(btn){
  var all=document.querySelectorAll('.songbtn');for(var i=0;i<all.length;i++){all[i].classList.remove('active');}
  btn.classList.add('active');
  var a=document.getElementById('songAudio');a.src=btn.getAttribute('data-src');a.play();
  document.getElementById('songTitle').innerHTML=btn.getAttribute('data-title')+' <span>\\u00b7 '+btn.getAttribute('data-lang')+'</span>';
  var dl=document.getElementById('songDl');dl.href=btn.getAttribute('data-src');dl.setAttribute('download',btn.getAttribute('data-file'));
}
function val(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function submitReg(){
  var m=document.getElementById('formMsg');m.style.color='#991b1b';
  var name=val('f_name'),phone=val('f_phone'),city=val('f_location');
  if(!name){m.textContent='Please enter your name.';return;}
  if(phone.replace(/\\D/g,'').length<10){m.textContent='Please enter a valid 10-digit mobile number.';return;}
  if(!city){m.textContent='Please select your city.';return;}
  if(!photoData){m.textContent='Please add your photo (upload or take a selfie).';return;}
  m.style.color='#166534';m.textContent='Submitting...';
  fetch('/api/securityjob/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,phone:phone,location:city,role:val('f_role'),experience:val('f_exp'),education:val('f_edu'),language:val('f_lang'),photo:photoData})})
    .then(function(r){return r.json();}).then(function(res){
      if(res.ok){var b=document.getElementById('okBox');document.getElementById('formInner').style.display='none';b.style.display='block';
        b.innerHTML='<div style="font-size:44px;line-height:1">✅</div>'+
          '<div style="font-size:20px;font-weight:900;color:#15803d;margin-top:6px">Thank you, '+name+'!</div>'+
          '<div style="font-size:14px;margin-top:6px">Your registration is received successfully.</div>'+
          '<div style="margin:16px auto;max-width:340px;background:#14224f;color:#fff;border-radius:12px;padding:14px">'+
            '<div style="font-size:12px;color:#c9a84c;font-weight:700;letter-spacing:.5px">YOUR REGISTRATION CODE</div>'+
            '<div style="font-size:20px;font-weight:900;letter-spacing:1px;margin-top:4px">'+res.regCode+'</div>'+
            '<div style="font-size:12px;color:#c9a84c;margin-top:8px">Registered on</div>'+
            '<div style="font-size:15px;font-weight:700;margin-top:2px">'+(res.registeredAt||'')+'</div>'+
          '</div>'+
          '<div style="font-weight:500;font-size:13px;color:#334155">Please note down this code. Our team will contact you within 12 working hours.</div>';
        window.scrollTo({top:document.getElementById('register').offsetTop-20,behavior:'smooth'});
      }
      else{m.style.color='#991b1b';m.textContent=res.error||'Could not submit. Please try again.';}
    }).catch(function(){m.style.color='#991b1b';m.textContent='Network error. Please try again.';});
}
</script>
</body></html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(html)
}
