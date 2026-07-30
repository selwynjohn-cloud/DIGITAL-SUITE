/** Colourful Manus-style theme for branch / staff MIS pages (HOD daily report, guard docs). */
export const MIS_STAFF_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220 0%,#14224f 45%,#1e3a6e 100%);color:#e2e8f0;font-size:16px;min-height:100vh}
.top{background:linear-gradient(135deg,#14224f,#1d4ed8);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px;border-bottom:4px solid #c9a84c;flex-wrap:wrap;justify-content:space-between;box-shadow:0 4px 20px rgba(0,0,0,.35)}
.top img{height:44px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))}
.top h1{font-size:19px;line-height:1.3}.top small{display:block;color:#fde68a;font-size:12px;font-weight:800;margin-top:2px}
.wrap{max-width:1180px;margin:0 auto;padding:16px}
.card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:16px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.card h2,.card h3{color:#fff}
label{display:block;font-size:13px;font-weight:700;color:#94a3b8;margin:10px 0 4px}
input,select,textarea{width:100%;padding:11px 12px;border:1px solid #475569;border-radius:9px;font-size:16px;background:#0b1220;color:#f1f5f9}
input:focus,select:focus{outline:2px solid #c9a84c;border-color:#c9a84c}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
@media(max-width:640px){.row2,.row3{grid-template-columns:1fr}}
.btn{padding:12px 20px;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-size:15px;text-decoration:none;display:inline-block;transition:transform .12s,box-shadow .12s}
.btn:active{transform:scale(.98)}
.g{background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;box-shadow:0 4px 14px rgba(59,130,246,.4)}
.green{background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;box-shadow:0 4px 14px rgba(34,197,94,.35)}
.gold{background:linear-gradient(135deg,#b45309,#f59e0b);color:#14224f;box-shadow:0 4px 14px rgba(245,158,11,.35)}
.grey{background:#334155;color:#e2e8f0}
.red{background:linear-gradient(135deg,#b91c1c,#ef4444);color:#fff}
.amber{background:linear-gradient(135deg,#c2410c,#f97316);color:#fff}
#login{max-width:420px;margin:40px auto}.hidden{display:none!important}
.msg{padding:11px 14px;border-radius:9px;font-size:15px;font-weight:600;margin:10px 0;display:none}
.hint{font-size:13px;color:#94a3b8;margin:4px 0 12px;line-height:1.5}
.totbar{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0}
.totbar>div{flex:1;min-width:100px;background:linear-gradient(135deg,#1e3a6e,#2563eb);border:1px solid #3b82f6;border-radius:12px;padding:14px;text-align:center;box-shadow:0 6px 16px rgba(37,99,235,.25)}
.totbar>div:nth-child(2){background:linear-gradient(135deg,#7c2d12,#ea580c);border-color:#f97316}
.totbar>div:nth-child(3){background:linear-gradient(135deg,#713f12,#d97706);border-color:#fbbf24}
.totbar>div:nth-child(4){background:linear-gradient(135deg,#14532d,#16a34a);border-color:#22c55e}
.totbar>div:nth-child(5){background:linear-gradient(135deg,#7f1d1d,#dc2626);border-color:#ef4444}
.totbar b{color:#fff;font-size:22px;display:block;font-weight:900}
.totbar span{font-size:11px;font-weight:600;color:rgba(255,255,255,.85)}
.clmgmt{margin:16px 0;padding:16px;background:rgba(15,23,42,.6);border:1px solid #475569;border-radius:12px}
.clmgmt h3{font-size:17px;color:#fde68a;margin-bottom:6px}
.btn-sm{padding:7px 14px;font-size:13px;border-radius:8px}
.tblwrap{overflow-x:auto;border:2px solid #475569;border-radius:10px}
.tblwrap-deploy{overflow:auto;max-height:min(72vh,600px);border:2px solid #c9a84c;border-radius:10px;-webkit-overflow-scrolling:touch;box-shadow:0 0 0 1px rgba(201,168,76,.3)}
#deployTbl{border-collapse:separate;border-spacing:0;width:100%;font-size:13px;min-width:1200px}
#deployTbl th,#deployTbl td{border:1px solid #475569;padding:7px 8px;text-align:center;white-space:nowrap;color:#e2e8f0}
#deployTbl thead th{background:#14224f;color:#fde68a;font-size:11px;border-color:#64748b}
#deployTbl thead tr:first-child th{position:sticky;top:0;z-index:2}
#deployTbl thead tr:nth-child(2) th{position:sticky;top:36px;z-index:2}
#deployTbl .freeze-h{position:sticky;z-index:5}
#deployTbl thead .freeze-num{left:0;min-width:42px;width:42px}
#deployTbl thead .freeze-client{left:42px;min-width:150px;width:150px}
#deployTbl thead .freeze-loc{left:192px;min-width:150px;width:150px}
#deployTbl thead .freeze-staff{left:342px;min-width:130px;width:130px;box-shadow:3px 0 6px rgba(0,0,0,.35)}
#deployTbl tbody .freeze-num{position:sticky;left:0;z-index:3;min-width:42px;width:42px;background:#111a30;font-weight:800;color:#fde68a}
#deployTbl tbody .freeze-client{position:sticky;left:42px;z-index:3;min-width:150px;width:150px;background:#111a30}
#deployTbl tbody .freeze-loc{position:sticky;left:192px;z-index:3;min-width:150px;width:150px;background:#111a30}
#deployTbl tbody .freeze-staff{position:sticky;left:342px;z-index:3;min-width:130px;width:130px;background:#111a30;box-shadow:3px 0 6px rgba(0,0,0,.25)}
#deployTbl tbody tr:nth-child(even) .freeze-num,#deployTbl tbody tr:nth-child(even) .freeze-client,#deployTbl tbody tr:nth-child(even) .freeze-loc,#deployTbl tbody tr:nth-child(even) .freeze-staff{background:#0e1730}
#deployTbl thead .freeze-num,#deployTbl thead .freeze-client,#deployTbl thead .freeze-loc,#deployTbl thead .freeze-staff{background:#14224f}
table{border-collapse:collapse;width:100%;font-size:13px;min-width:900px}
th,td{border:1px solid #475569;padding:7px 8px;text-align:center;white-space:nowrap;color:#e2e8f0}
thead th{background:#14224f;color:#fde68a;font-size:11px;position:sticky;top:0;border-color:#64748b}
.grp-a{background:rgba(59,130,246,.15)}.grp-g{background:rgba(234,179,8,.12)}.grp-b{background:rgba(34,197,94,.12)}.grp-c{background:rgba(239,68,68,.12)}
td.txt{text-align:left;white-space:normal;min-width:120px;font-size:12px}
td input{width:56px;padding:6px;border:1px solid #64748b;border-radius:6px;text-align:center;font-size:13px;background:#0b1220;color:#fff}
td .san{background:#1e293b;border:1px solid #64748b;font-weight:800;color:#fde68a}
td .vac{font-weight:800;color:#f87171}
.sumgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
@media(max-width:640px){.sumgrid{grid-template-columns:1fr}}
.inactive-row{opacity:0.45}
.badge-hv{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;background:rgba(245,158,11,.25);color:#fbbf24;border:1px solid #f59e0b}
.modal{position:fixed;inset:0;background:rgba(11,18,32,.75);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal .inner{background:linear-gradient(180deg,#1e293b,#111a30);border:1px solid #c9a84c;border-radius:14px;padding:22px;max-width:520px;width:100%;max-height:90vh;overflow:auto;color:#e2e8f0}
.modal h3{color:#fde68a;margin-bottom:12px}
.modal label{color:#cbd5e1}
.chk-row{display:flex;align-items:center;gap:10px;margin:12px 0}
.chk-row input{width:auto}
`
