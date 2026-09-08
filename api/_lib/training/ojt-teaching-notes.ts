/**
 * Teaching notes for Track-1 OJT topics — arranged topic-wise for trainers.
 * Titles must match `ojt-topics-catalog` seed titles.
 */

export type OjtTeachingNote = {
  category: string
  topic: string
  objective: string
  keyPoints: string[]
  dos: string[]
  donts: string[]
  askGuards: string[]
  tip?: string
}

function n(
  category: string,
  topic: string,
  objective: string,
  keyPoints: string[],
  dos: string[],
  donts: string[],
  askGuards: string[],
  tip?: string,
): OjtTeachingNote {
  return { category, topic, objective, keyPoints, dos, donts, askGuards, tip }
}

/** Full teaching pack — one note per training topic. */
export const OJT_TEACHING_NOTES: OjtTeachingNote[] = [
  n(
    'Motivation & job',
    'Why security job is important',
    'Help guards feel proud of the security profession and understand their value to client and company.',
    [
      'Security protects life, property, information and reputation.',
      'A good guard is the first face of the client and of Agile.',
      'Small habits (alertness, honesty, politeness) prevent big losses.',
      'Your presence itself is a deterrent to wrongdoers.',
    ],
    ['Stand tall and speak with confidence about the job.', 'Give one real example from site life.'],
    ['Do not say security is “only for those who failed elsewhere”.', 'Do not shame any guard’s education level.'],
    ['Name two things a security guard protects.', 'Why does the client pay for security?'],
    'Start class with appreciation — then teach duty.',
  ),
  n(
    'Motivation & job',
    'Why OJT helps keep your posting',
    'Link On Site Tactical Training (OJT) to job security and better posting.',
    [
      'OJT shows the client that Agile invests in skill.',
      'Trained guards make fewer mistakes → fewer complaints → posting stays.',
      'OJT is not punishment; it is support for your career.',
      'Attendance + attention in OJT is noticed by HOD and client.',
    ],
    ['Explain OJT in simple words: learn on the same site you protect.', 'Connect training to salary / posting stability.'],
    ['Do not threaten “fail OJT = remove”.', 'Do not rush — give 2–3 clear examples.'],
    ['What does OJT stand for in our company?', 'How does training help you keep posting?'],
  ),
  n(
    'Motivation & job',
    'How training helps client & company',
    'Show that training is a service to the client and a brand strength for Agile.',
    [
      'Client gets safer site, better behaviour, fewer incidents.',
      'Company gets fewer escalations and stronger SLA compliance.',
      'Trained team = professional image in audits and visits.',
      'Your learning today becomes tomorrow’s client trust.',
    ],
    ['Use the phrase: “Training is part of our service delivery.”'],
    ['Do not blame client for insisting on training.'],
    ['Name one benefit of training for the client.', 'Name one benefit for Agile.'],
  ),
  n(
    'Motivation & job',
    'Discipline, punctuality & honesty',
    'Set non-negotiable duty values: on time, honest, disciplined.',
    [
      'Punctuality = respect for duty and for the next shift.',
      'Honesty with cash, keys, material and visitor passes.',
      'Discipline: follow post orders even when no supervisor is watching.',
      'One dishonest act can end a career and harm the whole team.',
    ],
    ['Tell a short positive story of an honest guard.', 'Stress reporting mistakes early.'],
    ['Do not joke about “small theft”.', 'Do not accept excuses for sleeping on duty.'],
    ['What will you do if you find money / phone at gate?', 'Why must you come 10–15 minutes early?'],
  ),
  n(
    'Turnout & behaviour',
    'Uniform & turnout',
    'Ensure correct, neat, complete uniform every duty.',
    [
      'Full uniform: shirt, trousers, belt, shoes, cap/beret as per post order.',
      'Ironed clothes, polished shoes, clean name plate / ID.',
      'No mixing civil clothes with uniform.',
      'Turnout is the first impression for every visitor.',
    ],
    ['Do a quick visual check of 2–3 volunteers (with respect).'],
    ['Do not insult anyone’s appearance in front of others.'],
    ['List five parts of correct turnout.', 'Can you wear slippers on gate duty?'],
  ),
  n(
    'Turnout & behaviour',
    'Personal grooming',
    'Teach neat personal appearance suitable for a professional guard.',
    [
      'Hair cut / beard as per company / client rule.',
      'Clean nails, no strong perfume that distracts.',
      'Clean shave or trimmed beard — look alert, not casual.',
      'Grooming shows self-respect and site respect.',
    ],
    ['Keep guidance practical and respectful.'],
    ['Do not mock personal features.'],
    ['Why does grooming matter at a corporate gate?'],
  ),
  n(
    'Turnout & behaviour',
    'Personal hygiene on duty',
    'Link hygiene to health, respect and long duty hours.',
    [
      'Bath, clean clothes, oral hygiene before duty.',
      'Wash hands after washroom / before eating on site.',
      'Keep post area clean — dustbin, no spit stains.',
      'Report fever / contagious illness; do not hide and infect others.',
    ],
    ['Mention monsoon / summer hygiene briefly.'],
    ['Do not embarrass anyone about body odour in public — counsel privately.'],
    ['What will you do if you feel unwell before duty?'],
  ),
  n(
    'Turnout & behaviour',
    'Soft skills — polite & firm',
    'Teach polite language with firm control — never rude, never weak.',
    [
      'Greet: Good morning / Good evening + smile if appropriate.',
      'Use “Sir / Madam” and clear simple English or local language.',
      'Firm means clear rules — not shouting.',
      'If visitor is angry, stay calm; call supervisor if needed.',
    ],
    ['Role-play: polite refusal when pass is missing.'],
    ['Do not teach sarcastic replies.', 'Do not argue loudly at gate.'],
    ['Say one polite sentence to stop an unauthorised entry.'],
  ),
  n(
    'Turnout & behaviour',
    'Mobile / social media rules',
    'Stop phone misuse on duty; protect site information.',
    [
      'Phone only for duty calls as per post order — not for games / reels.',
      'No photos / videos of client premises without written permission.',
      'Do not post site issues on WhatsApp status or social media.',
      'Confidential: visitor lists, CCTV, passwords, layouts.',
    ],
    ['Show how phone distraction causes gate mistakes.'],
    ['Do not collect personal phone numbers of client staff unnecessarily.'],
    ['Can you take a selfie at the client lobby? Why / why not?'],
  ),
  n(
    'Turnout & behaviour',
    'ID card Importance',
    'Make every guard understand why wearing and checking ID cards matters.',
    [
      'Your Agile ID proves you are authorised to be on duty.',
      'Always wear ID on the outer garment, photo visible.',
      'Check visitor / contractor / staff ID as per site rule before entry.',
      'Expired, damaged or borrowed ID = stop and escalate.',
      'ID protects you, the client and the company in audits and incidents.',
    ],
    ['Show correct way to wear ID (clip / lanyard).', 'Practice reading name + validity date aloud.'],
    ['Do not allow “I forgot ID, I am regular” without supervisor approval.', 'Do not keep ID in pocket out of sight.'],
    ['Why must your ID be visible?', 'What if a visitor shows only a photo of ID on phone?'],
    'Spell and say clearly: ID card Importance.',
  ),
  n(
    'Visitors & access',
    'Visitor management',
    'Standard visitor flow: greet → purpose → ID → entry pass → escort / announce → exit.',
    [
      'Never allow free entry without process.',
      'Record name, whom to meet, time in / out, ID type.',
      'Issue visitor pass; collect on exit.',
      'If host not available — wait / call, do not send visitor wandering.',
    ],
    ['Walk through your site’s actual visitor register fields.'],
    ['Do not skip register “because they are known”.'],
    ['What details must be written in visitor register?'],
  ),
  n(
    'Visitors & access',
    'Angry / irritated visitors',
    'De-escalate without losing control of the gate.',
    [
      'Stay calm; lower your voice; listen first.',
      'Acknowledge: “I understand you are in a hurry, Sir.”',
      'Explain the rule briefly; offer help (call host / supervisor).',
      'If threat / violence — do not fight; alert Control / HOD / police as per SOP.',
    ],
    ['Role-play 60 seconds: angry visitor without appointment.'],
    ['Do not match anger with anger.', 'Do not make personal comments.'],
    ['What is your first sentence to an angry visitor?'],
  ),
  n(
    'Visitors & access',
    'Access control (gate / restricted)',
    'Who may enter which zone — and how to enforce it.',
    [
      'Know restricted areas: server room, store, rooftop, production, etc.',
      'Authorisation = card / pass / list / escort — as per post order.',
      'Tailgating is a common failure — one card, one person.',
      'When in doubt, stop politely and call supervisor.',
    ],
    ['Point out restricted zones on a simple site sketch if available.'],
    ['Do not accept “I am contractor, I always go there” without proof.'],
    ['What is tailgating?', 'Name one restricted area at this site.'],
  ),
  n(
    'Visitors & access',
    'VIP movement access control',
    'Safe, discreet, smooth VIP movement without crowd chaos.',
    [
      'Get advance intimation: time, vehicle, entry point, escort.',
      'Keep route clear; control media / curious staff politely.',
      'Coordinate with Control / STF / client protocol team.',
      'No selfies, no gossip about VIP details.',
    ],
    ['Stress confidentiality of VIP schedules.'],
    ['Do not block VIP car for casual chatting.'],
    ['Whom do you call if VIP arrives early?'],
  ),
  n(
    'Visitors & access',
    'Frisking — method & respect',
    'Correct frisking technique with dignity and gender sensitivity.',
    [
      'Explain politely before frisking why it is needed.',
      'Same gender frisking as per policy; use gadgets where available.',
      'Methodical: head to toe, pockets, bags — no rough handling.',
      'If refuse — deny entry / call supervisor; never force violently.',
    ],
    ['Demonstrate air-frisk motions (no inappropriate contact).'],
    ['Do not joke during frisking.', 'Do not skip lady visitor protocol.'],
    ['Who should frisk a lady visitor?', 'What if visitor refuses frisking?'],
  ),
  n(
    'Visitors & access',
    'Bag and material checking',
    'Check bags and materials thoroughly without delaying unreasonably.',
    [
      'Ask to open bag; use tray / scanner if available.',
      'Look for prohibited items as per site list.',
      'Match material inward / outward with gate pass / invoice.',
      'Seal / stamp as per procedure; record in material register.',
    ],
    ['Practice with one sample bag (trainer’s).'],
    ['Do not put hands roughly into personal items.', 'Do not clear material without paperwork.'],
    ['What documents do you check for material out?'],
  ),
  n(
    'Vehicles',
    'Vehicle checking',
    'Systematic vehicle search at gate.',
    [
      'Stop, greet, ask purpose and destination.',
      'Check driver ID, vehicle number, mirrors, boot, under-carriage (mirror) as per SOP.',
      'Match occupants with authorisation.',
      'Log vehicle number and time.',
    ],
    ['Show under-vehicle mirror use if available on site.'],
    ['Do not stand directly in front of moving vehicle.'],
    ['Name four places you check on a four-wheeler.'],
  ),
  n(
    'Vehicles',
    'Vehicle movement & parking',
    'Control traffic flow and correct parking to avoid accidents.',
    [
      'Follow site traffic arrows and speed limit.',
      'Guide drivers with clear hand signals.',
      'No parking in emergency / fire lanes.',
      'Report abandoned or suspicious parked vehicles.',
    ],
    ['Practice 3 hand signals: stop, come, turn.'],
    ['Do not argue in the middle of the driveway.'],
    ['Where must emergency vehicles always pass?'],
  ),
  n(
    'Vehicles',
    'Material movement with vehicles',
    'Link vehicle gate pass to material accountability.',
    [
      'No loaded vehicle out without authorised gate pass.',
      'Verify item count / description vs pass.',
      'Check empty vehicle claim — look inside cabin and cargo.',
      'Coordinate with stores / security supervisor for exceptions.',
    ],
    ['Use a sample gate pass form if site has one.'],
    ['Do not sign blank gate passes.'],
    ['What if driver says “manager told me, no pass needed”?'],
  ),
  n(
    'Post & records (SLA)',
    'HOTO (handing / taking over)',
    'Clean shift change with full information transfer.',
    [
      'Come early; check turnout of outgoing / incoming.',
      'Keys, registers, devices, pending visitors, open issues — all handed over.',
      'Write and sign HOTO remarks; do not only speak.',
      'Walk the post together for odd sounds / open doors.',
    ],
    ['Open the site HOTO register and show a good sample entry.'],
    ['Do not leave post before reliever is ready and briefed.'],
    ['List five items you must hand over.'],
  ),
  n(
    'Post & records (SLA)',
    'Registers & record keeping',
    'Accurate, neat, timely registers — SLA backbone.',
    [
      'Write clearly; date and time in every entry.',
      'No overwriting — cancel with single line and initial.',
      'Fill registers during shift, not at month end.',
      'Registers are legal evidence — treat them seriously.',
    ],
    ['Show common registers used on this site.'],
    ['Do not leave blank pages for “later”.'],
    ['Why are registers important in a client audit?'],
  ),
  n(
    'Post & records (SLA)',
    'Incident reporting',
    'Report early, factual, complete — no hiding.',
    [
      'Who / what / when / where / how — facts only.',
      'Inform supervisor / Control immediately for serious incidents.',
      'Preserve scene if safe; do not disturb evidence.',
      'Written report after oral alert.',
    ],
    ['Give one example: slip & fall vs theft — different urgency.'],
    ['Do not blame others in report without facts.', 'Do not delay “small” incidents.'],
    ['What five questions must an incident report answer?'],
  ),
  n(
    'Post & records (SLA)',
    'Patrolling & observation',
    'Purposeful patrol — see, hear, report.',
    [
      'Follow patrol route and timing as per post order.',
      'Check locks, lights, unusual smell/smoke, open windows.',
      'Vary pace slightly so pattern is not predictable.',
      'Record patrol in register / app; report anomalies at once.',
    ],
    ['Walk one short patrol route if site allows.'],
    ['Do not patrol only near tea point / AC room.'],
    ['Name three things you look for on night patrol.'],
  ),
  n(
    'Post & records (SLA)',
    'Emergency communication',
    'Know whom to call, in what order, with what message.',
    [
      'Keep Control / HOD / client emergency numbers ready.',
      'Message: location + what happened + what you need.',
      'Use radio / phone clearly; repeat critical numbers.',
      'After call, continue duty actions (evacuate / cordon) as trained.',
    ],
    ['Recite Control number: +91 9248707070 (Agile Control).'],
    ['Do not flood WhatsApp groups with panic messages.'],
    ['Whom do you call first for fire on site?'],
  ),
  n(
    'Post & records (SLA)',
    'Security levels (Normal → Alert → High)',
    'Explain escalating security postures and guard actions at each level.',
    [
      'Normal: routine checks as per SOP.',
      'Alert: tighter checks, more patrols, limit casual entry.',
      'High: maximum control, escorts, possible lockdown steps as ordered.',
      'Level is declared by management / client — guards execute, not invent.',
    ],
    ['Write the three levels on a board and actions under each.'],
    ['Do not declare High Alert yourself without authority.'],
    ['What changes at gate when level is Alert?'],
  ),
  n(
    'Fire & bomb',
    'Fire drill & evacuation',
    'Know alarm, exits, assembly point, and your role.',
    [
      'On alarm: stay calm; follow exit route; help visitors.',
      'Do not use lifts if restricted in fire.',
      'Assemble at marked point; head-count if assigned.',
      'Fight fire only if trained and fire is small — else evacuate.',
    ],
    ['Point to nearest exit and assembly point from classroom.'],
    ['Do not re-enter for personal belongings.'],
    ['Where is your assembly point?', 'Can you use lift during fire?'],
  ),
  n(
    'Fire & bomb',
    'Fire extinguisher points',
    'Locate extinguishers and use PASS method for correct type.',
    [
      'Know locations of extinguishers on your floor / gate.',
      'PASS: Pull, Aim, Squeeze, Sweep.',
      'Match type: CO₂ / foam / DCP — wrong type can worsen fire.',
      'Report empty / damaged extinguisher at once.',
    ],
    ['Show extinguisher label colours / types present on site.'],
    ['Do not block extinguisher with cartons.'],
    ['What does PASS stand for?'],
  ),
  n(
    'Fire & bomb',
    'Bomb threat call handling',
    'Stay calm; record; alert; do not spread panic.',
    [
      'Keep caller talking; note exact words, gender, accent, background noise.',
      'Ask: where, when, what type — if caller continues.',
      'Alert supervisor / Control / police as per SOP immediately.',
      'Do not touch suspicious objects; follow evacuation order.',
    ],
    ['Give a printed bomb-threat checklist if available.'],
    ['Do not joke about bombs.', 'Do not post threat on social media.'],
    ['What details will you write during a threat call?'],
  ),
  n(
    'Fire & bomb',
    'Suspicious bag / object',
    'Observe–isolate–inform — never open or kick.',
    [
      'Signs: unattended, unusual wires, smell, placed oddly.',
      'Do not touch, move or open.',
      'Cordon area; move people away; inform Control / police.',
      'Use description: size, colour, location, when first seen.',
    ],
    ['Use a closed demo bag placed aside — do not open.'],
    ['Do not gather crowd to “see”.'],
    ['First three actions when you see a suspicious bag?'],
  ),
  n(
    'First aid',
    'First aid — heat stroke / sunstroke',
    'Recognise heat emergency and cool the person safely.',
    [
      'Signs: hot skin, confusion, headache, vomiting, collapse.',
      'Move to shade; loosen clothing; cool with water / fan.',
      'Sip water if conscious; do not force if unconscious.',
      'Call medical help / Control; stay with the person.',
    ],
    ['Stress summer outdoor posts and water breaks.'],
    ['Do not give alcohol or ice water suddenly in large amount.'],
    ['Name three signs of heat stroke.'],
  ),
  n(
    'First aid',
    'First aid — snake bite',
    'Immobilise and evacuate — no local myths.',
    [
      'Keep victim calm and still; immobilise limb.',
      'Remove tight jewellery / watch near bite.',
      'Get to hospital fast; note snake description if safe.',
      'No cutting, no sucking, no tourniquet myths.',
    ],
    ['Show recovery position briefly if trained.'],
    ['Do not waste time hunting the snake.'],
    ['What should you NOT do after snake bite?'],
  ),
  n(
    'First aid',
    'First aid — dog / animal bite',
    'Wash, protect, report — rabies risk awareness.',
    [
      'Wash wound with soap and running water 10–15 minutes.',
      'Cover with clean cloth; seek medical care for vaccination advice.',
      'Report animal bite in incident register.',
      'Do not ignore “small” bites.',
    ],
    ['Emphasise hospital visit even if bleeding stops.'],
    ['Do not apply mud / chilli / tobacco on wound.'],
    ['First step after a dog bite?'],
  ),
  n(
    'First aid',
    'First aid — bleeding, burns, fainting',
    'Basic response for common on-site injuries.',
    [
      'Bleeding: apply firm pressure with clean cloth; elevate if possible.',
      'Burns: cool with clean running water; do not apply toothpaste / oil.',
      'Fainting: lay down, legs raised if no injury; check breathing; call help.',
      'Wear gloves if available; avoid infection.',
    ],
    ['Keep first-aid box location known to all guards.'],
    ['Do not remove deeply stuck objects from wounds.'],
    ['How do you cool a burn?', 'How do you stop external bleeding?'],
  ),
  n(
    'Travel & special duty',
    'Travel safety with women employees',
    'Protect dignity and safety during women staff travel / escort.',
    [
      'Professional behaviour only — no personal comments.',
      'Follow allotted route and timing; share status with Control if required.',
      'Prefer well-lit routes; avoid unnecessary stops.',
      'If uncomfortable situation arises — stop at safe public place and call Control.',
    ],
    ['Stress company values and respect.'],
    ['Do not share lady employee personal details.', 'Do not sit in rear seat against protocol.'],
    ['Whom do you call if travel route feels unsafe?'],
  ),
  n(
    'Travel & special duty',
    'Protect your traveller',
    'Escort mindset: traveller safety first, ego last.',
    [
      'Know pickup / drop points and alternate routes.',
      'Watch surroundings when boarding / alighting.',
      'Do not disclose traveller schedule to strangers.',
      'Coordinate with driver; one person watches, one assists as needed.',
    ],
    ['Discuss bag / laptop awareness at kerb side.'],
    ['Do not leave traveller alone in dark parking.'],
    ['What do you check before opening the car door?'],
  ),
  n(
    'Travel & special duty',
    'Driver security duties',
    'Driver + security coordination for safe movement.',
    [
      'Vehicle check before move: fuel, tyres, locks, documents.',
      'Doors locked while moving in city traffic as per SOP.',
      'No unauthorised passengers or parcels.',
      'Report mechanical issues early — do not risk trip.',
    ],
    ['Align with Fleet rules if site uses company cars.'],
    ['Do not use mobile while driving.'],
    ['Can you carry an unknown parcel for a stranger?'],
  ),
  n(
    'Travel & special duty',
    'STF / quick response support',
    'How site guards support Special Task / QRT without confusion.',
    [
      'Know your role: guide, cordon, information — not hero stunts.',
      'Clear access for response team; share exact location.',
      'Follow team leader instructions; one channel of command.',
      'After action, write factual support notes.',
    ],
    ['Explain when STF is called (example scenarios).'],
    ['Do not crowd the incident with all guards.'],
    ['What information will you give to arriving STF?'],
  ),
  n(
    'Travel & special duty',
    'Unusual person / vehicle reporting',
    'See something → say something with useful detail.',
    [
      'Unusual: loitering, photography of gates, repeated drive-bys.',
      'Note: time, clothing, vehicle number, direction, behaviour.',
      'Inform supervisor / Control immediately.',
      'Do not confront alone if danger is high — observe and report.',
    ],
    ['Practice writing a 4-line unusual activity report.'],
    ['Do not chase into dark deserted areas alone.'],
    ['What four details make a useful report?'],
  ),
  n(
    'Industry / site',
    'Bank & ATM security',
    'Cash, keys, access and customer safety awareness for bank/ATM posts.',
    [
      'Know opening / closing drill and dual control where applicable.',
      'Watch for shoulder surfing, skimming devices, loitering near ATM.',
      'Never discuss cash movement timings in public.',
      'Alarm / police escalation as per bank SOP.',
    ],
    ['Remind: no social media posts from vault / ATM room.'],
    ['Do not hold customer bags / cards.'],
    ['What will you check around an ATM before night duty?'],
  ),
  n(
    'Industry / site',
    'Pharma industry security',
    'GMP / restricted zones, material integrity, visitor control.',
    [
      'Respect clean areas and gowning rules if applicable.',
      'Strict material and scrap outward control.',
      'No unauthorised photography in process areas.',
      'Report spills / odd smells that may be safety issues.',
    ],
    ['Align teaching with that site’s badge zones.'],
    ['Do not enter production area without authorisation.'],
    ['Why is scrap outward a high risk in pharma?'],
  ),
  n(
    'Industry / site',
    'Automobile industry security',
    'Vehicle yards, parts theft prevention, contractor control.',
    [
      'Gate pass for parts / tools is mandatory.',
      'Watch parking yards and unfinished vehicles.',
      'Contractor tools in/out accounting.',
      'Fire risk: welding / paint shops — know extinguisher points.',
    ],
    ['Mention tyre / battery / catalytic converter theft trends if relevant.'],
    ['Do not allow personal vehicles into restricted yards without pass.'],
    ['What documents for a loaded parts vehicle going out?'],
  ),
  n(
    'Industry / site',
    'IT / office campus security',
    'Access cards, visitors, data / device awareness for IT campuses.',
    [
      'Tailgating at flap barriers is a top risk.',
      'Visitor escort culture; meeting floor discipline.',
      'No piggyback photography of badges / screens.',
      'Lost access card — report immediately for blocking.',
    ],
    ['Role-play: stop polite employee who tailgates.'],
    ['Do not share your access card.'],
    ['What is tailgating in an IT campus?'],
  ),
  n(
    'Industry / site',
    'Hotel security',
    'Guest privacy, lobby vigilance, room / luggage awareness.',
    [
      'Warm hospitality + firm security together.',
      'Watch lobby for unattended bags and unusual loitering.',
      'Do not disclose guest room numbers to strangers.',
      'Coordinate with front office for VIP / incident handling.',
    ],
    ['Stress guest dignity and privacy.'],
    ['Do not enter guest rooms alone against hotel SOP.'],
    ['Someone asks for a guest’s room number — what do you do?'],
  ),
  n(
    'Industry / site',
    'Hospital security',
    'Patient safety, crowd control, emergency access.',
    [
      'Keep emergency pathways clear for ambulance / trolley.',
      'Manage attendants with firm politeness.',
      'Watch for theft of equipment and disputes in wards.',
      'Support Code procedures as per hospital training.',
    ],
    ['Never block ER entrance for parking arguments.'],
    ['Do not share patient information.'],
    ['What is your priority when ambulance arrives?'],
  ),
  n(
    'Industry / site',
    'School / college campus security',
    'Child / student safety, visitor screening, gate discipline.',
    [
      'Know pickup rules and authorised guardians list process.',
      'No unknown adult inside without visitor process.',
      'Bus bay discipline; no rash driving near gate.',
      'Report bullying / stranger danger observations to principal / admin + HOD.',
    ],
    ['Be extra gentle and alert with children.'],
    ['Do not release a child to an unverified person.'],
    ['A stranger says he is uncle — what do you check?'],
  ),
  n(
    'Industry / site',
    'Plant / infrastructure security (cement, fertiliser, etc.)',
    'Heavy industry hazards, perimeter, material and contractor control.',
    [
      'PPE awareness at plant gates (helmet / shoes zones).',
      'Long perimeter — patrol and lighting gaps matter.',
      'Material theft and truck under-loading / over-loading checks.',
      'Contractor and visitor induction rules before entry.',
    ],
    ['Mention weighbridge / gate coordination if site has it.'],
    ['Do not enter process areas without escort and PPE.'],
    ['Name two plant risks a gate guard must watch for.'],
  ),
]

export function teachingNotesGrouped(): { category: string; notes: OjtTeachingNote[] }[] {
  const order: string[] = []
  const map = new Map<string, OjtTeachingNote[]>()
  for (const note of OJT_TEACHING_NOTES) {
    if (!map.has(note.category)) {
      map.set(note.category, [])
      order.push(note.category)
    }
    map.get(note.category)!.push(note)
  }
  return order.map((category) => ({ category, notes: map.get(category)! }))
}

export function findTeachingNote(topic: string): OjtTeachingNote | null {
  const t = String(topic || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (!t) return null
  return (
    OJT_TEACHING_NOTES.find((n) => n.topic.trim().toLowerCase().replace(/\s+/g, ' ') === t) || null
  )
}

/** Safe JSON for embedding in page script. */
export function teachingNotesJsonForPage(): string {
  return JSON.stringify(teachingNotesGrouped()).replace(/</g, '\\u003c')
}
