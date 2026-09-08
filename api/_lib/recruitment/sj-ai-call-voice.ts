/**
 * Spoken scripts + Twilio voice for SecurityJob AI calls.
 * Uses the Primary Language from the registration form.
 */

export type SjAiVoice = {
  key: string
  gatherLang: string
  sayVoice: string
  sayLang: string
  first: (name: string) => string
  again: (name: string) => string
  thanksLater: string
  teamWillCall: string
  thanksDate: (spokenDate: string) => string
}

function n(name: string) {
  return (name || 'friend').split(' ')[0] || 'friend'
}

const PACKS: Record<string, SjAiVoice> = {
  english: {
    key: 'English',
    gatherLang: 'en-IN',
    sayVoice: 'Polly.Aditi',
    sayLang: 'en-IN',
    first: (name) =>
      `Namaste ${n(name)}. This is Agile Security Force. You registered on Security Job. Are you looking for a security job now? Please say the date you can come to our Recruitment Centre. You can say tomorrow, this week, or a date. Or press 1 for this week, 2 for next week, 3 if not now.`,
    again: () =>
      `Sorry, I did not get the date. Please say tomorrow, this week, or the date. Or press 1 for this week, 2 for next week, 3 if not now.`,
    thanksLater: 'Thank you. We will call you again later. Goodbye.',
    teamWillCall: 'Thank you. Our recruitment team will call you. Goodbye.',
    thanksDate: (d) =>
      `Thank you. We have noted ${d}. Please come to the Recruitment Centre on that date. We will also send you a WhatsApp message. Goodbye.`,
  },
  hindi: {
    key: 'Hindi',
    gatherLang: 'hi-IN',
    sayVoice: 'Polly.Aditi',
    sayLang: 'hi-IN',
    first: (name) =>
      `Namaste ${n(name)}. Yeh Agile Security Force hai. Aapne Security Job par registration kiya hai. Kya aap abhi security job chahte hain? Kripya woh tarikh bolen jab aap Recruitment Centre aa sakte hain. Kal, is hafte, ya tarikh bolen. Ya 1 dabayen is hafte, 2 agle hafte, 3 abhi nahi.`,
    again: () =>
      `Maaf kijiye, tarikh nahi mili. Kripya kal, is hafte, ya tarikh bolen. Ya 1 dabayen, 2 dabayen, 3 abhi nahi.`,
    thanksLater: 'Dhanyavaad. Hum aapko baad mein phone karenge. Namaste.',
    teamWillCall: 'Dhanyavaad. Hamari bharti team aapko phone karegi. Namaste.',
    thanksDate: (d) =>
      `Dhanyavaad. Aapki tarikh ${d} darj ho gayi hai. Kripya us din Recruitment Centre aayen. Hum WhatsApp bhi bhejenge. Namaste.`,
  },
  telugu: {
    key: 'Telugu',
    gatherLang: 'te-IN',
    sayVoice: 'Google.te-IN-Standard-A',
    sayLang: 'te-IN',
    first: (name) =>
      `Namaste ${n(name)}. Idi Agile Security Force. Meeru Security Job lo register ayyaru. Meeru ippudu security udyogam kavala? Recruitment Centre ki eppudu raggalaro tedee cheppandi. Repu, ee vaaram, leda tedee cheppandi. Leda 1 nokkandi ee vaaram, 2 vacche vaaram, 3 ippudu kadu.`,
    again: () =>
      `Kshaminchandi, tedee raaledu. Repu, ee vaaram leda tedee cheppandi. Leda 1, 2 leda 3 nokkandi.`,
    thanksLater: 'Dhanyavadalu. Memu malli phone chestamu. Namaste.',
    teamWillCall: 'Dhanyavadalu. Maa recruitment team meeku phone chestundi. Namaste.',
    thanksDate: (d) =>
      `Dhanyavadalu. Mee tedee ${d} register ayindi. Aa roju Recruitment Centre ki randi. WhatsApp kuda pampustamu. Namaste.`,
  },
  tamil: {
    key: 'Tamil',
    gatherLang: 'ta-IN',
    sayVoice: 'Google.ta-IN-Standard-A',
    sayLang: 'ta-IN',
    first: (name) =>
      `Vanakkam ${n(name)}. Ithu Agile Security Force. Neenga Security Job la register pannirukeenga. Ippo security velai venuma? Recruitment Centre ku eppo varalam nu sollunga. Naalai, intha vaaram, allathu date sollunga. Allathu 1 press pannunga intha vaaram, 2 adutha vaaram, 3 ippo illa.`,
    again: () =>
      `Mannikkavum, date kidaikkala. Naalai, intha vaaram allathu date sollunga. Allathu 1, 2 allathu 3 press pannunga.`,
    thanksLater: 'Nandri. Naanga pinbu call pannuvom. Vanakkam.',
    teamWillCall: 'Nandri. Enga recruitment team ungalai call pannum. Vanakkam.',
    thanksDate: (d) =>
      `Nandri. Ungal date ${d} register aayiduchu. Andha naal Recruitment Centre ku vaanga. WhatsApp um anupuvom. Vanakkam.`,
  },
  kannada: {
    key: 'Kannada',
    gatherLang: 'kn-IN',
    sayVoice: 'Google.kn-IN-Standard-A',
    sayLang: 'kn-IN',
    first: (name) =>
      `Namaskara ${n(name)}. Idu Agile Security Force. Neevu Security Job nalli register maadiddeeri. Eega security kelasa beka? Recruitment Centre ge yavaga barabahudu anta heli. Nale, ee vara, athava date heli. Athava 1 ottiri ee vara, 2 mundina vara, 3 eega beda.`,
    again: () =>
      `Kshamisi, date sigalilla. Nale, ee vara athava date heli. Athava 1, 2 athava 3 ottiri.`,
    thanksLater: 'Dhanyavada. Naavu nantara call madutteve. Namaskara.',
    teamWillCall: 'Dhanyavada. Namma recruitment team nimage call maduttade. Namaskara.',
    thanksDate: (d) =>
      `Dhanyavada. Nimma date ${d} register aagide. Aa dina Recruitment Centre ge banni. WhatsApp kooda kaluhisutteve. Namaskara.`,
  },
  malayalam: {
    key: 'Malayalam',
    gatherLang: 'ml-IN',
    sayVoice: 'Google.ml-IN-Standard-A',
    sayLang: 'ml-IN',
    first: (name) =>
      `Namaskaram ${n(name)}. Ithu Agile Security Force aanu. Ningal Security Job il register cheythu. Ippo security joli venamo? Recruitment Centre il eppol varam ennu parayu. Naale, ee aazhcha, allengil date parayu. Allengil 1 amarthu ee aazhcha, 2 adutha aazhcha, 3 ippol venda.`,
    again: () =>
      `Kshamikkanam, date kittiilla. Naale, ee aazhcha allengil date parayu. Allengil 1, 2 allengil 3 amarthu.`,
    thanksLater: 'Nanni. Njangal pinne vilikkum. Namaskaram.',
    teamWillCall: 'Nanni. Njangalude recruitment team ningale vilikkum. Namaskaram.',
    thanksDate: (d) =>
      `Nanni. Ningalude date ${d} register aayi. Aa divasam Recruitment Centre il varu. WhatsApp um ayakkum. Namaskaram.`,
  },
  bengali: {
    key: 'Bengali',
    gatherLang: 'bn-IN',
    sayVoice: 'Google.bn-IN-Standard-A',
    sayLang: 'bn-IN',
    first: (name) =>
      `Nomoskar ${n(name)}. Eta Agile Security Force. Apni Security Job e registration korechen. Apni ki ekhon security kaj chan? Recruitment Centre e kobe aste parben bolun. Kal, ei saptah, ba tarikh bolun. Athoba 1 chapun ei saptah, 2 porer saptah, 3 ekhon noy.`,
    again: () =>
      `Dukkhito, tarikh paini. Kal, ei saptah ba tarikh bolun. Athoba 1, 2 ba 3 chapun.`,
    thanksLater: 'Dhonnobad. Amra pore phone korbo. Nomoskar.',
    teamWillCall: 'Dhonnobad. Amader recruitment team apnake phone korbe. Nomoskar.',
    thanksDate: (d) =>
      `Dhonnobad. Apnar tarikh ${d} register hoyeche. Sedin Recruitment Centre e asun. WhatsApp o pathabo. Nomoskar.`,
  },
  assamese: {
    key: 'Assamese',
    gatherLang: 'bn-IN',
    sayVoice: 'Google.bn-IN-Standard-A',
    sayLang: 'bn-IN',
    first: (name) =>
      `Nomoskar ${n(name)}. Eitu Agile Security Force. Apuni Security Job ot register korise. Etiya security kam lage neki? Recruitment Centre loi ketiya ahibo pare kouk. Kali, ei xoptah, ba tarikh kouk. Ba 1 tipok ei xoptah, 2 oha xoptah, 3 etiya nohoy.`,
    again: () =>
      `Khoma korib, tarikh pua nugal. Kali, ei xoptah ba tarikh kouk. Ba 1, 2 ba 3 tipok.`,
    thanksLater: 'Dhonnobad. Ami pasot phone korim. Nomoskar.',
    teamWillCall: 'Dhonnobad. Amar recruitment team apunak phone koribo. Nomoskar.',
    thanksDate: (d) =>
      `Dhonnobad. Apunar tarikh ${d} register hol. Seidina Recruitment Centre loi ahok. WhatsApp o pathim. Nomoskar.`,
  },
  marathi: {
    key: 'Marathi',
    gatherLang: 'mr-IN',
    sayVoice: 'Google.mr-IN-Standard-A',
    sayLang: 'mr-IN',
    first: (name) =>
      `Namaskar ${n(name)}. Hi Agile Security Force aahe. Tumhi Security Job var registration keli aahe. Tumhala aata security nokri haviy ka? Recruitment Centre kadhi yeu shakta te sanga. Udya, ya aathavdyat, kinva tarikh sanga. Kinva 1 daba ya aathavdyat, 2 pudhchya aathavdyat, 3 aatta nahi.`,
    again: () =>
      `Maaf kara, tarikh milali nahi. Udya, ya aathavdyat kinva tarikh sanga. Kinva 1, 2 kinva 3 daba.`,
    thanksLater: 'Dhanyavad. Aamhi nantar phone karu. Namaskar.',
    teamWillCall: 'Dhanyavad. Aamchi recruitment team tumhala phone karel. Namaskar.',
    thanksDate: (d) =>
      `Dhanyavad. Tumchi tarikh ${d} register zali aahe. Tya divashi Recruitment Centre la ya. WhatsApp pan pathvu. Namaskar.`,
  },
}

export function resolveSjAiVoice(language: string): SjAiVoice {
  const raw = String(language || '')
    .trim()
    .toLowerCase()
  if (/hindi|हिंद|हिन्दी/.test(raw)) return PACKS.hindi
  if (/telugu|తెలుగు/.test(raw)) return PACKS.telugu
  if (/tamil|தமிழ்/.test(raw)) return PACKS.tamil
  if (/kannada|ಕನ್ನಡ/.test(raw)) return PACKS.kannada
  if (/malayalam|മലയാളം/.test(raw)) return PACKS.malayalam
  if (/bengali|bangla|বাংলা/.test(raw)) return PACKS.bengali
  if (/assam|অসমীয়া/.test(raw)) return PACKS.assamese
  if (/marathi|मराठी/.test(raw)) return PACKS.marathi
  return PACKS.english
}

export function spokenJoinHint(text: string): 'tomorrow' | 'dayafter' | 'thisweek' | 'nextweek' | 'notnow' | '' {
  const t = String(text || '').toLowerCase()
  if (!t) return ''
  if (
    /not now|not interested|cannot join|can'?t join|abhi nahi|abhi nahin|nahi chahiye|ippudu kadu|vendaam|ippo illa|eega beda|ippol venda|ekhon noy|etiya nohoy|aatta nahi/.test(
      t,
    ) &&
    !/tomorrow|kal|repu|reppu|naalai|nale|naale|kali|udya/.test(t)
  ) {
    return 'notnow'
  }
  if (/tomorrow|kal\b|repu|reppu|naalai|nale|naale|kali|udya/.test(t)) return 'tomorrow'
  if (/day after|parso|parson/.test(t)) return 'dayafter'
  if (/next week|agle|vacche|adutha|mundina|parer|oha xoptah|pudhch/.test(t)) return 'nextweek'
  if (/this week|is hafte|ee vaaram|intha vaaram|ee vara|ee aazhcha|ei saptah|ei xoptah|ya aathavd/.test(t)) {
    return 'thisweek'
  }
  return ''
}
