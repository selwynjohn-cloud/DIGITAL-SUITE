/**
 * Site Security Assessment (SSA) — shared labels and opening-page intro.
 * Director 18 Aug 2026: rename from Special Survey everywhere users see it.
 */

export const SSA_MENU_LABEL = 'Site Security Assessment (SSA)'
export const SSA_SHORT = 'SSA'
export const SSA_FULL = 'Site Security Assessment (SSA)'

/** After the page header — The "What" and "Where". */
export function ssaWhatWhereIntroHtml(): string {
  return `
<div class="m-card ssa-intro" style="border-color:#c9a84c">
  <h3 style="color:#fde68a;margin:0 0 10px">1. Site Security Assessment (SSA) — The "What" and "Where"</h3>
  <p style="color:#cbd5e1;line-height:1.65;margin:0 0 12px">An SSA is a broad, investigative evaluation of a specific location. Its main goal is to identify existing security gaps, vulnerabilities, and potential threats to that particular site.</p>
  <ul style="margin:0;padding-left:18px;color:#e2e8f0;line-height:1.7;font-size:14px">
    <li><b style="color:#fde68a">Focus:</b> Threats, vulnerabilities, and physical/operational risks unique to the location (e.g., weak perimeter fencing, poor lighting, blind spots in CCTV coverage, local crime rates).</li>
    <li><b style="color:#fde68a">Objective:</b> To answer the question: "What are our security weaknesses here, and what could go wrong?"</li>
    <li><b style="color:#fde68a">Output:</b> A baseline understanding of risk that helps management decide what security measures need to be implemented.</li>
    <li><b style="color:#fde68a">Analogy (comparison):</b> Like a doctor conducting a general health checkup and diagnosing lifestyle risks for a patient.</li>
  </ul>
</div>`
}
