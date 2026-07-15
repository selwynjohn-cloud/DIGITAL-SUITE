import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuperAdminEmail } from '../_lib/auth.js'
import {
  crmNid,
  crmNum,
  crmStorageOk,
  getActivities,
  getClientFollowUps,
  getContracts,
  getCrmDocs,
  getLostArchives,
  getLeads,
  getLeadsNormalized,
  normalizeCrmLead,
  getTendersNormalized,
  normalizeCrmTender,
  saveActivities,
  saveClientFollowUps,
  saveContracts,
  saveCrmDocs,
  saveLostArchives,
  saveLeads,
  saveTenders,
  getSecuritySurveysNormalized,
  normalizeCrmSurvey,
  saveSecuritySurveys,
  type CrmActivity,
  type CrmClientFollowUp,
  type CrmContract,
  type CrmDoc,
  type CrmLead,
  type CrmSecuritySurvey,
  type CrmTender,
  type CrmLostArchive,
  type CrmAuth,
} from '../_lib/crm/store.js'
import { generateSurveyAiReport } from '../_lib/crm/survey-ai.js'
import { generateLeadAiResearch } from '../_lib/crm/lead-ai.js'
import { generateLostOpportunityRca } from '../_lib/crm/rca-ai.js'
import { compareTenderDocuments, extractTenderNotice, prepareTenderWorkingText, tenderRecordToText } from '../_lib/crm/tender-ai.js'
import { textFromTenderFile } from '../_lib/crm/tender-docs.js'
import { pinMailFrom, pinMailReplyTo, sendSuiteEmail } from '../_lib/suite-mail.js'
import { buildClientSurveyReportHtml } from '../_lib/crm/survey-report.js'
import { CONTRACT_START_STEPS, SURVEY_PARTS } from '../_lib/crm/survey-template.js'
import { getFormats, saveFormats, getBranches, getUsers, type MisFormat } from '../_lib/mis/store.js'

/** Map MIS branch name → CRM branch label used on leads. */
const MIS_BRANCH_TO_CRM: Record<string, string> = {
  Gujarat: 'Surat',
  'Hyd Zone A': 'Hyderabad - A',
  'Hyd Zone B': 'Hyderabad - B',
  Karnataka: 'Bangalore',
  Kerala: 'Kochi',
  'Madhya Pradesh': 'Bhopal',
  Maharashtra: 'Mumbai',
  Nellore: 'Nellore & Tada',
  Puducherry: 'Chennai & Pondicherry',
  'Tamil Nadu': 'Chennai & Pondicherry',
  Tirupati: 'Tirupati & Tadipatri',
  Vijayawada: 'Vijayawada',
  Visakhapatnam: 'Visakhapatnam',
  Kakinada: 'Kakinada',
  'Hi-Tech City': 'Hi-Tech Branch',
  'Hi-Tech Branch': 'Hi-Tech Branch',
  SURAT: 'Surat',
}

async function misBranchIdToCrm(branchId: string): Promise<string | null> {
  if (!branchId) return null
  const branches = await getBranches(true)
  const b = branches.find((x) => x.id === branchId)
  if (!b) return null
  return MIS_BRANCH_TO_CRM[b.name] ?? b.name
}

const CRM_DIRECTOR_ROLES = new Set([
  'Director',
  'Admin',
  'CGM',
  'Vice President (VP)',
  'AVP',
  'General Manager (GM)',
])
const CRM_COORDINATOR_ROLES = new Set(['Regional Manager (RM)', 'Sales Executive'])
const CRM_BRANCH_ROLES = new Set(['Branch Manager', 'Operations Manager', 'Area Manager', 'Field Officer'])

async function crmRoleFromOtp(session: {
  email: string
  role: 'staff' | 'management'
  branchId?: string
}): Promise<CrmAuth> {
  const email = session.email.trim().toLowerCase()

  if (session.role === 'staff' && session.branchId) {
    const branch = await misBranchIdToCrm(session.branchId)
    if (branch) return { role: 'branch', branch }
  }

  const users = await getUsers()
  const u = users.find((x) => x.email?.trim().toLowerCase() === email && x.active !== false)
  if (u) {
    if (CRM_DIRECTOR_ROLES.has(u.role)) return { role: 'admin', branch: null }
    if (CRM_COORDINATOR_ROLES.has(u.role) || u.role.toLowerCase().includes('coordinator')) {
      return { role: 'coordinator', branch: null }
    }
    if (CRM_BRANCH_ROLES.has(u.role)) {
      const branch = await misBranchIdToCrm(u.branchId)
      return { role: 'branch', branch }
    }
    if (u.role === 'Accounts' || u.role === 'HR' || u.role === 'Training Team') {
      return { role: 'staff', branch: null }
    }
  }
  if (session.role === 'management' && isSuperAdminEmail(email)) {
    return { role: 'admin', branch: null }
  }
  if (session.role === 'management') return { role: 'admin', branch: null }
  return { role: 'staff', branch: null }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'status') return res.status(200).json({ ok: true, storage: crmStorageOk() })

  const otpSession = await verifyAppSession(String(body.sessionToken ?? ''), 'crm')
  if (!otpSession) return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })
  const { role, branch } = await crmRoleFromOtp(otpSession)
  const stripIntel = (l: CrmLead) => ({
    ...l,
    existingRate: '',
    presentAgency: '',
    changeReason: '',
    swot: '',
    moreSites: '',
    irritants: '',
    aiResearch: '',
    webAddress: '',
  })

  if (action === 'login' || action === 'load') {
    const [leads, tenders, activities, contracts, docs, followUps, surveys, lostArchives] = await Promise.all([
      getLeadsNormalized(), getTendersNormalized(), getActivities(), getContracts(), getCrmDocs(), getClientFollowUps(), getSecuritySurveysNormalized(), getLostArchives(),
    ])
    const surveyTemplate = { parts: SURVEY_PARTS, contractStart: CONTRACT_START_STEPS }
    if (role === 'admin') {
      return res.status(200).json({ ok: true, role, branch, leads, tenders, activities, contracts, docs, followUps, surveys, lostArchives, surveyTemplate })
    }
    if (role === 'coordinator') {
      return res.status(200).json({
        ok: true, role, branch,
        leads: leads.map(stripIntel), tenders, activities, contracts: [], docs: [], followUps, surveys, lostArchives, surveyTemplate,
      })
    }
    // Non-admin: no tenders/contracts/docs, intel stripped.
    let vis = leads
    if (role === 'branch') vis = leads.filter((l) => l.branch === branch)
    let fu = followUps
    if (role === 'branch') fu = followUps.filter((f) => f.branch === branch)
    let ar = lostArchives
    if (role === 'branch') ar = lostArchives.filter((x) => x.branch === branch)
    let sv = surveys
    if (role === 'branch') sv = surveys.filter((s) => {
      const lead = vis.find((l) => l.id === s.leadId)
      return lead || !s.leadId
    })
    let act = activities
    if (role === 'branch') {
      const leadIds = new Set(vis.map((l) => l.id))
      act = activities.filter((a) => {
        if (a.leadId && leadIds.has(a.leadId)) return true
        if (!a.leadId && vis.some((l) => l.company && a.company && l.company.trim().toLowerCase() === a.company.trim().toLowerCase())) return true
        return false
      })
    }
    return res.status(200).json({
      ok: true, role, branch,
      leads: vis.map(stripIntel), tenders: [], activities: act, contracts: [], docs: [], followUps: fu, surveys: sv, lostArchives: ar, surveyTemplate,
    })
  }

  if ((action === 'saveDocs' || action === 'saveFollowUps' || action === 'saveLostArchives') && role !== 'admin' && role !== 'coordinator') {
    return res.status(403).json({ error: 'Only Director/Admin or Coordinator can edit the Data Repository.' })
  }
  if (action === 'saveDocs' && role !== 'admin') {
    return res.status(403).json({ error: 'Only Director/Admin can edit secure documents.' })
  }

  // Only Director/Admin may save tenders and contracts (sensitive).
  if ((action === 'saveTenders' || action === 'saveContracts') && role !== 'admin') {
    return res.status(403).json({ error: 'Only Director/Admin can edit this.' })
  }

  if (!crmStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
  const s = (v: unknown, n = 200) => String(v ?? '').slice(0, n)

  if (action === 'readTenderText') {
    if (role !== 'admin' && role !== 'coordinator') {
      return res.status(403).json({ error: 'Only Director/Admin or Tender Cell can use tender notice reader.' })
    }
    try {
      let text = String(body.text ?? '').slice(0, 50000)
      let readMethod = 'paste'
      const fileB64 = String(body.fileBase64 ?? '').trim()
      if (fileB64) {
        const parsed = await textFromTenderFile({
          base64: fileB64,
          fileName: s(body.fileName, 200),
          mimeType: s(body.mimeType, 120),
        })
        text = parsed.text.slice(0, 50000)
        readMethod = parsed.method
      }
      if (text.trim().length < 40) {
        return res.status(400).json({
          error: 'Could not get enough text. Upload PDF, Word (.docx), or a clear photo (JPG/PNG), or paste more text.',
        })
      }
      const prep = await prepareTenderWorkingText(text)
      const displayText = prep.text || text
      return res.status(200).json({
        ok: true,
        readMethod,
        sourceChars: displayText.length,
        sourceText: displayText.slice(0, 50000),
        originalText: prep.wasTranslated ? text.slice(0, 50000) : undefined,
        wasTranslated: prep.wasTranslated,
        wasBilingual: prep.wasBilingual,
        originalLang: prep.originalLang,
        translationFailed: prep.translationFailed,
      })
    } catch (err) {
      console.error('readTenderText', err)
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Could not read this file.',
      })
    }
  }

  if (action === 'extractTenderNotice') {
    if (role !== 'admin' && role !== 'coordinator') {
      return res.status(403).json({ error: 'Only Director/Admin or Tender Cell can use tender notice reader.' })
    }
    try {
      let text = String(body.text ?? '').slice(0, 50000)
      let readMethod = 'paste'
      const fileB64 = String(body.fileBase64 ?? '').trim()
      if (fileB64) {
        const parsed = await textFromTenderFile({
          base64: fileB64,
          fileName: s(body.fileName, 200),
          mimeType: s(body.mimeType, 120),
        })
        text = parsed.text.slice(0, 50000)
        readMethod = parsed.method
      }
      if (text.trim().length < 40) {
        return res.status(400).json({
          error: 'Could not get enough text. Upload PDF, Word (.docx), or a clear photo (JPG/PNG), or paste more text.',
        })
      }
      const result = await extractTenderNotice(text)
      const displayText = result.displayText || text
      return res.status(200).json({
        ok: true,
        ...result,
        readMethod,
        sourceChars: displayText.length,
        sourceText: displayText.slice(0, 50000),
        originalText: result.wasTranslated ? text.slice(0, 5000) : undefined,
      })
    } catch (err) {
      console.error('extractTenderNotice', err)
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Could not read this file.',
      })
    }
  }

  if (action === 'compareTenderDocs') {
    if (role !== 'admin' && role !== 'coordinator') {
      return res.status(403).json({ error: 'Only Director/Admin or Tender Cell can compare tender documents.' })
    }
    try {
      let oldText = String(body.oldText ?? '').slice(0, 25000)
      const oldFileB64 = String(body.oldFileBase64 ?? '').trim()
      if (oldFileB64) {
        const parsed = await textFromTenderFile({
          base64: oldFileB64,
          fileName: s(body.oldFileName, 200),
          mimeType: s(body.oldMimeType, 120),
        })
        oldText = parsed.text.slice(0, 25000)
      }
      const oldTenderId = s(body.oldTenderId, 40)
      if (!oldFileB64 && oldTenderId) {
        const tenders = await getTendersNormalized()
        const ot = tenders.find((x) => x.id === oldTenderId)
        if (ot) oldText = tenderRecordToText(ot, 'Previous tender (CRM archive)')
      }

      let newText = String(body.newText ?? '').slice(0, 25000)
      const newFileB64 = String(body.newFileBase64 ?? '').trim()
      if (newFileB64) {
        const parsed = await textFromTenderFile({
          base64: newFileB64,
          fileName: s(body.newFileName, 200),
          mimeType: s(body.newMimeType, 120),
        })
        newText = parsed.text.slice(0, 25000)
      }

      const newTenderId = s(body.newTenderId, 40)
      let labelB = 'New tender notice'
      if (newTenderId) {
        const tenders = await getTendersNormalized()
        const nt = tenders.find((x) => x.id === newTenderId)
        if (nt) labelB = nt.tenderName || nt.clientDept || labelB
      }

      if (oldText.trim().length < 30) {
        return res.status(400).json({ error: 'Old document missing — select archive, upload file, or paste text.' })
      }
      if (newText.trim().length < 30) {
        return res.status(400).json({ error: 'New document missing — upload file or paste new tender text.' })
      }

      const result = await compareTenderDocuments(oldText, newText, 'Previous tender / agreement', labelB)
      const [prepOld, prepNew] = await Promise.all([
        prepareTenderWorkingText(oldText),
        prepareTenderWorkingText(newText),
      ])
      return res.status(200).json({
        ok: true,
        ...result,
        oldSourceText: prepOld.text.slice(0, 15000),
        newSourceText: prepNew.text.slice(0, 15000),
      })
    } catch (err) {
      console.error('compareTenderDocs', err)
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Could not compare documents.',
      })
    }
  }

  if (action === 'generateSurveyAi') {
    const survey = (body.survey ?? {}) as Record<string, unknown>
    const scores = (survey.scores ?? {}) as Record<string, number>
    const scoreNotes = (survey.scoreNotes ?? {}) as Record<string, string>
    const siteInputs = survey.siteInputs as Record<string, string> | undefined
    const report = await generateSurveyAiReport({
      company: s(survey.company),
      locationName: s(survey.locationName),
      address: s(survey.address, 400),
      natureOfBusiness: s(survey.natureOfBusiness, 300),
      surveyDate: s(survey.surveyDate, 20),
      surveyedBy: s(survey.surveyedBy, 120),
      scores,
      scoreNotes,
      siteInputs: siteInputs
        ? {
            clientBrief: s(siteInputs.clientBrief, 2000),
            scopeOfWork: s(siteInputs.scopeOfWork, 2000),
            existingSecurity: s(siteInputs.existingSecurity, 2000),
            proposedShifts: s(siteInputs.proposedShifts, 1000),
            sanctionedStrength: s(siteInputs.sanctionedStrength, 500),
            criticalAssets: s(siteInputs.criticalAssets, 1500),
            accessPoints: s(siteInputs.accessPoints, 1500),
            vulnerableAreas: s(siteInputs.vulnerableAreas, 1500),
            clientExpectations: s(siteInputs.clientExpectations, 2000),
          }
        : undefined,
      siteObservations: s(survey.siteObservations, 2000),
      deploymentPlan: s(survey.deploymentPlan, 4000),
    })
    return res.status(200).json({ ok: true, ...report })
  }

  if (action === 'surveyClientReport') {
    const surveyId = s(body.surveyId, 40)
    const surveys = await getSecuritySurveysNormalized()
    const sv = surveys.find((x) => x.id === surveyId)
    if (!sv) return res.status(404).json({ error: 'Survey not found' })
    return res.status(200).json({ ok: true, html: buildClientSurveyReportHtml(sv) })
  }

  if (action === 'analyzeLostOpportunity') {
    if (role !== 'admin' && role !== 'coordinator') {
      return res.status(403).json({ error: 'Only Director/Admin or Tender Cell can run Root Cause Analysis.' })
    }
    const kind = body.kind === 'tender' ? 'tender' : 'sales'
    let data: Record<string, unknown> = {}
    const archiveId = s(body.archiveId, 40)
    if (archiveId) {
      const archives = await getLostArchives()
      const ar = archives.find((x) => x.id === archiveId)
      if (!ar) return res.status(404).json({ error: 'Lost record not found.' })
      try {
        data = JSON.parse(ar.detailJson || '{}') as Record<string, unknown>
      } catch {
        data = {}
      }
      data.competitorSummary = ar.competitorSummary
      data.ourQuote = data.ourQuote || ar.ourQuote
      data.ourPosition = data.ourPosition || ar.ourPosition
      data.company = data.company || ar.client
      data.clientDept = data.clientDept || ar.client
    } else if (body.payload && typeof body.payload === 'object') {
      data = body.payload as Record<string, unknown>
    } else {
      return res.status(400).json({ error: 'Archive id or payload required.' })
    }
    try {
      const result = await generateLostOpportunityRca(kind, data)
      return res.status(200).json({ ok: true, ...result })
    } catch (err) {
      console.error('analyzeLostOpportunity', err)
      return res.status(400).json({ error: err instanceof Error ? err.message : 'RCA failed.' })
    }
  }

  if (action === 'researchLead') {
    if (role !== 'admin') return res.status(403).json({ error: 'Only Director/Admin can run AI sales research.' })
    const company = s(body.company, 200)
    if (!company) return res.status(400).json({ error: 'Company name required.' })
    const result = await generateLeadAiResearch({
      company,
      webAddress: s(body.webAddress, 300),
      location: s(body.location, 500),
      city: s(body.city, 80),
      state: s(body.state, 80),
      sector: s(body.sector, 80),
    })
    return res.status(200).json({ ok: true, ...result })
  }

  if (action === 'deleteLead') {
    if (role !== 'admin') return res.status(403).json({ error: 'Only Director/Admin can delete leads.' })
    const leadId = s(body.leadId, 40)
    if (!leadId) return res.status(400).json({ error: 'Lead id required.' })
    const leads = await getLeadsNormalized()
    const next = leads.filter((l) => l.id !== leadId)
    if (next.length === leads.length) return res.status(404).json({ error: 'Lead not found.' })
    await saveLeads(next)
    return res.status(200).json({ ok: true, deleted: leadId })
  }

  if (action === 'saveSurveys') {
    const arr = Array.isArray(body.surveys) ? body.surveys : []
    const list: CrmSecuritySurvey[] = arr.slice(0, 2000).map((x: any) =>
      normalizeCrmSurvey({
        id: String(x.id || crmNid('sv')),
        leadId: s(x.leadId, 40),
        company: s(x.company),
        locationName: s(x.locationName),
        address: s(x.address, 400),
        factoryManager: s(x.factoryManager, 120),
        contactPhone: s(x.contactPhone, 20),
        contactEmail: s(x.contactEmail, 120),
        natureOfBusiness: s(x.natureOfBusiness, 300),
        surveyDate: s(x.surveyDate, 20),
        surveyedBy: s(x.surveyedBy, 120),
        confidentialAccess: s(x.confidentialAccess, 200),
        siteInputs: x.siteInputs && typeof x.siteInputs === 'object' ? x.siteInputs : {},
        siteObservations: s(x.siteObservations, 2000),
        interviews: Array.isArray(x.interviews) ? x.interviews : [],
        photos: Array.isArray(x.photos) ? x.photos : [],
        deploymentPlan: s(x.deploymentPlan, 4000),
        scores: x.scores && typeof x.scores === 'object' ? x.scores : {},
        scoreNotes: x.scoreNotes && typeof x.scoreNotes === 'object' ? x.scoreNotes : {},
        executiveSummary: s(x.executiveSummary, 8000),
        riskAnalysis: s(x.riskAnalysis, 8000),
        manningSuggestion: s(x.manningSuggestion, 4000),
        uniformRequirements: s(x.uniformRequirements, 4000),
        equipmentSuggestions: s(x.equipmentSuggestions, 4000),
        securityRecommendations: s(x.securityRecommendations, 4000),
        recommendations: s(x.recommendations, 4000),
        siteRequirements: s(x.siteRequirements, 2000),
        contractStart: x.contractStart && typeof x.contractStart === 'object' ? x.contractStart : {},
        status: x.status === 'Completed' ? 'Completed' : 'Draft',
        active: x.active !== false,
        createdAt: s(x.createdAt, 40) || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    )
    await saveSecuritySurveys(list)
    // Mark linked leads as survey done when survey completed
    const completedLeadIds = new Set(list.filter((sv) => sv.status === 'Completed' && sv.leadId).map((sv) => sv.leadId))
    if (completedLeadIds.size) {
      const leads = await getLeads()
      let changed = false
      for (const l of leads) {
        if (completedLeadIds.has(l.id) && !l.surveyDone) {
          l.surveyDone = true
          if (l.stage === 'New' || l.stage === 'Contacted') l.stage = 'Site Survey'
          changed = true
        }
      }
      if (changed) await saveLeads(leads)
    }
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveLeads') {
    const arr = Array.isArray(body.leads) ? body.leads : []
    // Non-admin cannot see/edit sensitive intel — preserve it from stored leads.
    const prev = role !== 'admin' ? await getLeads() : []
    const prevById: Record<string, CrmLead> = {}
    for (const p of prev) prevById[p.id] = p
    const list: CrmLead[] = arr.slice(0, 5000).map((l: any) => {
      const keep = role !== 'admin' ? prevById[String(l.id)] : undefined
      if (keep) {
        l.existingRate = keep.existingRate; l.presentAgency = keep.presentAgency; l.changeReason = keep.changeReason
        l.swot = keep.swot; l.moreSites = keep.moreSites; l.irritants = keep.irritants
        l.aiResearch = keep.aiResearch; l.webAddress = keep.webAddress
        l.otherSiteCities = keep.otherSiteCities; l.competitors = keep.competitors
      }
      if (role === 'branch') {
        l.branch = branch
        l.recordedBy = l.recordedBy || otpSession.email
      }
      const cities = Array.isArray(l.otherSiteCities) ? l.otherSiteCities : []
      return normalizeCrmLead({
        id: String(l.id || crmNid('ld')),
        leadKind: l.leadKind === 'Tender' ? 'Tender' : 'Sales',
        active: l.active !== false,
        company: s(l.company),
        branch: s(l.branch, 80),
        location: s(l.location, 500),
        state: s(l.state, 80),
        deploymentDate: s(l.deploymentDate, 20),
        contactName: s(l.contactName),
        designation: s(l.designation, 80),
        phone: s(l.phone, 20),
        email: s(l.email, 120),
        city: s(l.city, 80),
        sector: s(l.sector, 80),
        source: s(l.source, 60),
        requirement: s(l.requirement, 300),
        manpower: s(l.manpower, 60),
        estValue: crmNum(l.estValue),
        assignedTo: s(l.assignedTo, 80),
        stage: s(l.stage, 40) || 'New/RFQ',
        nextFollowUp: s(l.nextFollowUp, 20),
        surveyDone: l.surveyDone === true,
        lossReason: s(l.lossReason, 200),
        remarks: s(l.remarks, 500),
        existingRate: s(l.existingRate, 120),
        presentAgency: s(l.presentAgency, 120),
        changeReason: s(l.changeReason, 500),
        swot: s(l.swot, 800),
        moreSites: cities.join(', ').slice(0, 400),
        irritants: s(l.irritants, 500),
        competitors: Array.isArray(l.competitors) ? l.competitors : [],
        recordedBy: s(l.recordedBy || otpSession.email, 120),
        webAddress: s(l.webAddress, 300),
        otherSiteCities: cities,
        aiResearch: s(l.aiResearch, 6000),
        createdAt: s(l.createdAt, 40) || new Date().toISOString(),
      })
    })
    // Branch users only submit their own branch's leads — keep every other branch's leads untouched.
    const finalList = role === 'branch' ? list.concat(prev.filter((p) => p.branch !== branch)) : list
    await saveLeads(finalList)
    return res.status(200).json({ ok: true, count: finalList.length })
  }

  if (action === 'saveTenders') {
    const arr = Array.isArray(body.tenders) ? body.tenders : []
    const list: CrmTender[] = arr.slice(0, 5000).map((t: any) =>
      normalizeCrmTender({
        id: String(t.id || crmNid('tn')),
        recordKind: t.recordKind === 'Historical' ? 'Historical' : 'Live',
        active: t.active !== false,
        tenderNo: s(t.tenderNo, 80),
        tenderName: s(t.tenderName),
        clientDept: s(t.clientDept),
        location: s(t.location, 120),
        state: s(t.state, 80),
        branch: s(t.branch, 80),
        portal: s(t.portal, 120),
        typeOfServices: s(t.typeOfServices, 200),
        contractPeriod: s(t.contractPeriod, 120),
        minTurnover3yr: s(t.minTurnover3yr, 80),
        experienceYears: s(t.experienceYears, 40),
        estimatedBidValue: s(t.estimatedBidValue, 60),
        evaluationMethod: s(t.evaluationMethod, 120),
        requiredManpower: s(t.requiredManpower, 80),
        publishedDate: s(t.publishedDate, 20),
        prebidMeetingDate: s(t.prebidMeetingDate, 40),
        prebidMeetingVenue: s(t.prebidMeetingVenue, 200),
        emdPreparationDate: s(t.emdPreparationDate, 20),
        submissionDate: s(t.submissionDate, 20),
        bidEndDateTime: s(t.bidEndDateTime, 40),
        bidValidityFromEnd: s(t.bidValidityFromEnd, 80),
        emd: s(t.emd, 40),
        epbgPercent: s(t.epbgPercent, 20),
        tenderFee: s(t.tenderFee, 40),
        scoreMatrix: s(t.scoreMatrix, 200),
        serviceCharge: s(t.serviceCharge, 80),
        l1TieBreak: s(t.l1TieBreak, 200),
        msePreference: s(t.msePreference, 120),
        ourQuote: s(t.ourQuote, 60),
        ourPosition: s(t.ourPosition, 30),
        winningQuote: s(t.winningQuote, 60),
        contractAwardedRate: s(t.contractAwardedRate, 60),
        contractAwardedDate: s(t.contractAwardedDate, 20),
        awardedTo: s(t.awardedTo, 120),
        allotmentDetails: s(t.allotmentDetails, 500),
        bidders: Array.isArray(t.bidders)
          ? t.bidders.slice(0, 8).map((b: any) => ({ rank: s(b.rank, 8), name: s(b.name, 120), quote: s(b.quote, 60) }))
          : undefined,
        competitors: Array.isArray(t.competitors) ? t.competitors.slice(0, 20).map((c: any) => ({ name: s(c.name, 120), quote: s(c.quote, 60) })) : [],
        loiDate: s(t.loiDate, 20),
        nextProbableDate: s(t.nextProbableDate, 20),
        status: s(t.status, 40) || 'Identified / Under Review',
        remarks: s(t.remarks, 500),
        tenderExtract:
          t.tenderExtract && typeof t.tenderExtract === 'object'
            ? {
                summary: s(t.tenderExtract.summary, 800),
                portal: s(t.tenderExtract.portal, 120),
                submissionMode: s(t.tenderExtract.submissionMode, 40),
                bidType: s(t.tenderExtract.bidType, 80),
                emdMode: s(t.tenderExtract.emdMode, 200),
                openingDate: s(t.tenderExtract.openingDate, 20),
                eligibility: s(t.tenderExtract.eligibility, 2000),
                documentsRequired: s(t.tenderExtract.documentsRequired, 2000),
                importantDates: s(t.tenderExtract.importantDates, 2000),
                extractedAt: s(t.tenderExtract.extractedAt, 40),
              }
            : undefined,
        createdAt: s(t.createdAt, 40) || new Date().toISOString(),
      }),
    )
    await saveTenders(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveActivities') {
    const arr = Array.isArray(body.activities) ? body.activities : []
    const list: CrmActivity[] = arr.slice(0, 10000).map((a: any) => ({
      id: String(a.id || crmNid('ac')),
      leadId: s(a.leadId, 40),
      tenderId: s(a.tenderId, 40),
      company: s(a.company),
      type: s(a.type, 40) || 'Follow-up',
      date: s(a.date, 20),
      location: s(a.location, 500),
      notes: s(a.notes, 400),
      done: a.done === true,
      active: a.active !== false,
      createdAt: s(a.createdAt, 40) || new Date().toISOString(),
    }))
    await saveActivities(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveContracts') {
    const arr = Array.isArray(body.contracts) ? body.contracts : []
    const list: CrmContract[] = arr.slice(0, 5000).map((c: any) => ({
      id: String(c.id || crmNid('ct')),
      client: s(c.client), state: s(c.state, 80),
      masterAgreementDate: s(c.masterAgreementDate, 20), renewalDate: s(c.renewalDate, 20),
      existingRate: s(c.existingRate, 80), revisedRate: s(c.revisedRate, 80),
      mwNotificationDate: s(c.mwNotificationDate, 20), piStatus: s(c.piStatus, 20) || 'Pending',
      piAchievedDate: s(c.piAchievedDate, 20), nextPiDate: s(c.nextPiDate, 20),
      remarks: s(c.remarks, 400), active: c.active !== false,
      createdAt: s(c.createdAt, 40) || new Date().toISOString(),
    }))
    await saveContracts(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveDocs') {
    const arr = Array.isArray(body.docs) ? body.docs : []
    const list: CrmDoc[] = arr.slice(0, 5000).map((d: any) => ({
      id: String(d.id || crmNid('dc')),
      title: s(d.title, 200),
      category: s(d.category, 60),
      link: s(d.link, 600),
      notes: s(d.notes, 500),
      addedBy: s(d.addedBy, 80),
      date: s(d.date, 20),
      active: d.active !== false,
    }))
    await saveCrmDocs(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveFollowUps') {
    const arr = Array.isArray(body.followUps) ? body.followUps : []
    const list: CrmClientFollowUp[] = arr.slice(0, 5000).map((f: any) => ({
      id: String(f.id || crmNid('fu')),
      client: s(f.client),
      branch: s(f.branch, 80),
      location: s(f.location, 120),
      contractRenewalDate: s(f.contractRenewalDate, 20),
      contractFollowUp: s(f.contractFollowUp, 20),
      uniformStatus: s(f.uniformStatus, 30) || 'Pending',
      uniformIssued: s(f.uniformIssued, 200),
      uniformFollowUp: s(f.uniformFollowUp, 20),
      equipmentStatus: s(f.equipmentStatus, 30) || 'Pending',
      equipmentIssued: s(f.equipmentIssued, 200),
      equipmentFollowUp: s(f.equipmentFollowUp, 20),
      notes: s(f.notes, 400),
      active: f.active !== false,
      createdAt: s(f.createdAt, 40) || new Date().toISOString(),
    }))
    await saveClientFollowUps(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveLostArchives') {
    const arr = Array.isArray(body.lostArchives) ? body.lostArchives : []
    const list: CrmLostArchive[] = arr.slice(0, 5000).map((x: any) => ({
      id: String(x.id || crmNid('ar')),
      kind: x.kind === 'tender' ? 'tender' : 'sales',
      branch: s(x.branch, 80),
      client: s(x.client),
      title: s(x.title, 200),
      ourQuote: s(x.ourQuote, 60),
      ourPosition: s(x.ourPosition, 40),
      competitorSummary: s(x.competitorSummary, 600),
      detailJson: s(x.detailJson, 12000),
      closedDate: s(x.closedDate, 20),
      rcaAnalysis: String(x.rcaAnalysis ?? '').slice(0, 12000),
      rcaAnalyzedAt: s(x.rcaAnalyzedAt, 40),
      active: x.active !== false,
      createdAt: s(x.createdAt, 40) || new Date().toISOString(),
    }))
    await saveLostArchives(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'loadFormats') {
    if (role !== 'admin') return res.status(403).json({ error: 'Only Director/Admin can view formats.' })
    const formats = await getFormats()
    return res.status(200).json({ ok: true, formats })
  }

  if (action === 'saveFormats') {
    if (role !== 'admin') return res.status(403).json({ error: 'Only Director/Admin can edit formats.' })
    const arr = Array.isArray(body.formats) ? body.formats : []
    const list: MisFormat[] = arr.slice(0, 500).map((f: any) => ({
      id: String(f.id || crmNid('fmt')),
      title: s(f.title, 160),
      category: s(f.category, 40) || 'Other',
      body: String(f.body ?? '').slice(0, 20000),
      active: f.active !== false,
    }))
    await saveFormats(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  const parseEmails = (v: unknown) => String(v ?? '').split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
  const sendCrmEmail = async (to: string[], cc: string[], subject: string, text: string) => {
    if (!to.length) return { ok: false as const, status: 400, error: 'Please enter at least one valid TO email.' }
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) return { ok: false as const, status: 503, error: 'Email service not configured.' }
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const from = pinMailFrom()
      const result = await sendSuiteEmail(resend, {
        from,
        replyTo: pinMailReplyTo(),
        to,
        cc,
        subject,
        text,
        html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`,
      })
      if ((result as { error?: { message?: string } }).error) {
        return { ok: false as const, status: 502, error: (result as { error?: { message?: string } }).error?.message || 'Send failed' }
      }
      return { ok: true as const }
    } catch (e) {
      return { ok: false as const, status: 502, error: e instanceof Error ? e.message : 'Send failed' }
    }
  }

  if (action === 'sendCrmMail') {
    if (!['admin', 'coordinator', 'staff', 'branch'].includes(role)) {
      return res.status(403).json({ error: 'Not allowed to send mail.' })
    }
    const sent = await sendCrmEmail(
      parseEmails(body.to),
      parseEmails(body.cc),
      s(body.subject, 200) || 'Agile Security Force',
      String(body.body ?? ''),
    )
    if (!sent.ok) return res.status(sent.status).json({ error: sent.error })
    return res.status(200).json({ ok: true })
  }

  if (action === 'sendFormatMail') {
    if (role !== 'admin') return res.status(403).json({ error: 'Only Director/Admin can send mail.' })
    const sent = await sendCrmEmail(
      parseEmails(body.to),
      parseEmails(body.cc),
      s(body.subject, 200) || 'Agile Security Force',
      String(body.body ?? ''),
    )
    if (!sent.ok) return res.status(sent.status).json({ error: sent.error })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
