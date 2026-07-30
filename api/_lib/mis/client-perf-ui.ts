/** Colourful on-screen Client Performance report (Branch + Management portals). */
export const CLIENT_PERF_DASHBOARD_CSS = `
.sec-h{font-size:14px;font-weight:900;color:#c9a84c;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 10px}
.cp-charts{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:10px 0 14px}
.cp-chart-panel{background:linear-gradient(145deg,#0e1730,#16223f);border:1px solid #334155;border-radius:12px;padding:14px;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.25)}
.cp-chart-panel h4{color:#c9a84c;font-size:13px;margin-bottom:10px;font-weight:800}
.cp-chart-panel .chart-legend{color:#94a3b8}
.cp-dep-days{margin-top:10px;padding:12px 14px;background:rgba(30,58,138,.22);border:1px solid #334155;border-radius:10px;text-align:center}
.cp-dep-days h5{color:#fde68a;font-size:14px;font-weight:800;margin-bottom:10px}
.cp-dep-days table{width:100%;font-size:12px;color:#cbd5e1;border-collapse:collapse}
.cp-dep-days td{padding:6px 4px;text-align:center}
.cp-dep-days .n{display:block;font-weight:800;font-size:16px}
.cp-dep-days .san .n{color:#60a5fa}.cp-dep-days .dep .n{color:#4ade80}.cp-dep-days .vac .n{color:#f87171}
.cp-money-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0}
.cp-money{border-radius:12px;padding:14px 10px;text-align:center;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.25)}
.cp-money b{display:block;font-size:20px;font-weight:800;line-height:1.15}
.cp-money span{display:block;font-size:11px;margin-top:6px;opacity:.92}
.cp-money.bl{background:linear-gradient(135deg,#1d4ed8,#3b82f6)}
.cp-money.am{background:linear-gradient(135deg,#b45309,#f59e0b)}
.cp-money.pu{background:linear-gradient(135deg,#7c3aed,#a855f7)}
.mw-yes{margin:14px 0;padding:14px 20px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;box-shadow:0 4px 14px rgba(22,163,74,.35)}
.mw-no{margin:14px 0;padding:14px 20px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#fff;box-shadow:0 4px 14px rgba(239,68,68,.35)}
.mw-pend{margin:14px 0;padding:12px 16px;border-radius:10px;text-align:center;font-weight:700;font-size:13px;background:rgba(30,58,138,.22);color:#94a3b8;border:1px dashed #334155}
.chart-legend{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;font-size:11px;margin-top:8px}
.dot{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:middle}
.branch-fin{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0 12px}
.fin-saved{font-size:11px;color:#4ade80;text-align:center;min-height:16px}
@media(max-width:700px){.cp-charts{grid-template-columns:1fr}.cp-money-grid{grid-template-columns:1fr}}
`

/** Formal white letter — PDF / email / WhatsApp to client only. */
export const CLIENT_PERF_LETTER_CSS = `
.letter{background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;margin-top:14px;max-width:820px}
.letter-head{background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;padding:18px 22px;border-bottom:4px solid #c9a84c;display:flex;gap:14px;align-items:center}
.letter-head img{height:56px;background:#fff;border-radius:8px;padding:4px}
.letter-head b{display:block;font-size:16px;color:#fff}
.letter-head small{display:block;color:#c9a84c;margin-top:4px;font-size:12px}
.letter-body{padding:22px 26px 18px;line-height:1.55;font-size:14px;color:#1e293b}
.letter-body .date-line{text-align:right;margin-bottom:16px;color:#475569}
.letter-body .addr{margin-bottom:14px}
.letter-body .salute{margin:14px 0 10px}
.letter-body .para{margin:0 0 14px}
.letter-body h3{color:#14224f;font-size:14px;margin:18px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.letter-tbl{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0 14px}
.letter-tbl td{padding:7px 10px;border:1px solid #e2e8f0}
.letter-tbl td.k{font-weight:700;width:55%;color:#334155}
.letter-tbl td.v{font-weight:800;color:#0f172a}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0 8px}
.chart-box{border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;background:#f8fafc;box-shadow:0 6px 18px rgba(20,33,79,.08)}
.chart-box h4{font-size:12px;color:#14224f;margin-bottom:8px}
.chart-legend{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;font-size:11px;margin-top:8px;color:#475569}
.dot{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px}
.dep-days{margin-top:10px;padding:12px 14px;background:linear-gradient(135deg,#f8fafc,#eff6ff);border:1px solid #e2e8f0;border-radius:10px;text-align:center}
.dep-days h5{font-size:14px;font-weight:800;color:#14224f;margin-bottom:10px}
.dep-days table{width:100%;font-size:12px;color:#334155;border-collapse:collapse}
.dep-days td{padding:6px 4px;text-align:center}
.dep-days .n{display:block;font-weight:800;font-size:16px}
.dep-days .san .n{color:#1d4ed8}
.dep-days .dep .n{color:#15803d}
.dep-days .vac .n{color:#b91c1c}
.sec-h3{color:#fde68a;font-size:14px;margin:20px 0 10px;padding:8px 12px;background:linear-gradient(135deg,#14224f,#1e3a8a);border-radius:8px;border-left:4px solid #c9a84c}
.mw-yes{margin:14px 0;padding:14px 20px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;box-shadow:0 4px 14px rgba(22,163,74,.35)}
.mw-no{margin:14px 0;padding:14px 20px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;background:linear-gradient(135deg,#b91c1c,#ef4444);color:#fff;box-shadow:0 4px 14px rgba(239,68,68,.35)}
.mw-pend{margin:14px 0;padding:12px 16px;border-radius:10px;text-align:center;font-weight:700;font-size:13px;background:#f1f5f9;color:#64748b;border:1px dashed #cbd5e1}
.bill-kgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 14px}
.bill-kpi{border-radius:12px;padding:14px 10px;text-align:center;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.14)}
.bill-kpi b{display:block;font-size:22px;font-weight:800;line-height:1.1}
.bill-kpi span{display:block;font-size:11px;margin-top:6px;opacity:.92}
.bill-kpi.bl{background:linear-gradient(135deg,#1d4ed8,#3b82f6)}
.bill-kpi.am{background:linear-gradient(135deg,#b45309,#f59e0b)}
.bill-kpi.pu{background:linear-gradient(135deg,#7c3aed,#a855f7)}
.branch-fin{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0 14px}
.branch-fin .m-inp{width:100%}
.letter .m-lbl{color:#334155;font-weight:700}
.letter .m-inp{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
.fin-saved{font-size:11px;color:#4ade80;text-align:center;min-height:16px}
.close-block{margin-top:22px}
.sign{margin-top:22px;line-height:1.45}
.sign b{display:block;color:#14224f}
@media(max-width:700px){.charts{grid-template-columns:1fr}.bill-kgrid{grid-template-columns:1fr}}
@media print{.staff-side,.staff-bar,.noprint{display:none!important}.letter{border:none;border-radius:0;max-width:none}}
`
