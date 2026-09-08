import { NATIVE_PACK } from './fa-advisory-native.js'
import { FA_LANGS, copies, type Lang } from './fa-i18n.js'

export type { Lang }
export { FA_LANGS }

export type AdvItem = { title: string; body: string; example?: string }

export type AdvCopy = {
  name: string
  native: string
  choose: string
  chooseHelp: string
  company: string
  department: string
  seriesClient: string
  seriesName: string
  issueDate: string
  audience: string
  mobileBar: string
  title: string
  subtitle: string
  intro: string
  infographic: string
  infographicShare: string
  infographicDownload: string
  infographicClose: string
  prohibited: string
  consequences: string
  itemsP: AdvItem[]
  itemsC: AdvItem[]
  details: string
  detailsHelp: string
  fullName: string
  employeeId: string
  agileBranch: string
  hdfcSite: string
  mobile: string
  pledge: string
  accept: string
  locNeed: string
  submit: string
  thanks: string
  recorded: string
  alreadyDone: string
  ackNo: string
  date: string
  gps: string
  waTitle: string
  waBody: string
  quiz: string
  quizHelp: string
  yes: string
  no: string
  correct: string
  retry: string
  questions: Array<{ title: string; correct: 'yes' | 'no' }>
  exampleWord: string
  listenPts: string
  pointWord: string
}

export const EN_ADV: AdvCopy = {
  name: 'English',
  native: 'English',
  choose: 'Choose your language',
  chooseHelp: 'The advisory and your acknowledgement will appear in this language.',
  company: 'Agile Security Force Private Limited',
  department: 'Integrated Digital Operations Command Centre',
  seriesClient: 'HDFC — Strategic Client',
  seriesName: 'Compliance Advisory Series',
  issueDate: 'Issue date',
  audience: 'For Facility Attendants posted at HDFC Bank',
  mobileBar: 'Mobile — +91 9248707070',
  title: 'Integrity at Work',
  subtitle: 'HDFC Bank Compliance Advisory for Facility Attendants',
  intro:
    'All Facility Attendants working at HDFC Bank must uphold the highest standards of honesty, integrity, and professional conduct. This advisory sets out mandatory conduct requirements and reinforces a zero-tolerance policy toward fraud and unauthorized transactions, helping safeguard the Bank’s operations and maintain trust.',
  infographic: 'Open Infographic',
  infographicShare: 'Share',
  infographicDownload: 'Download',
  infographicClose: 'Close',
  prohibited: 'PROHIBITED ACTIVITIES',
  consequences: 'CONSEQUENCES OF NON-COMPLIANCE',
  itemsP: [
    {
      title: 'No fraudulent / mule-account transactions',
      body: 'A Facility Attendant must never receive, hold, or pass money through a personal bank account for another person. That turns the account into a mule account. It is a fraudulent transaction and a crime — even if someone calls it a favour, overtime, or an emergency. You are not permitted to “just help once”.',
      example:
        'A stranger, a colleague, or a staff member asks you to take money in your account and send it on by UPI or cash, and may offer you a small cut. That is mule-account fraud. Say No. Tell your OM / HOD the same day.',
    },
    {
      title: 'No banking work for bank staff',
      body: 'You are posted at HDFC Bank for facility support and safety — not for banking operations. You must not handle cash, enter an OTP, use a phone app, sign a slip, swipe a card, or complete any transaction for bank staff. Even a small help is unauthorized staff support and can be treated as fraud.',
      example:
        'An officer is busy and asks you to finish a cash deposit, type an OTP, or complete a transfer on their system. That is bank work. Say “I cannot do bank work.” Tell your OM / HOD at once.',
    },
    {
      title: 'No money laundering',
      body: 'Money laundering means hiding or moving money so the bank and the law cannot see where it came from. You must not carry cash, gold, or papers, split deposits, or break bank rules to cover this up. Taking part — even once — can cancel the agency contract and may lead to police action.',
      example:
        'Someone asks you to carry a packet of cash, make many small deposits, or move money so it does not show on bank records. That is money laundering. Refuse and report it at once to your OM / HOD.',
    },
  ],
  itemsC: [
    {
      title: 'Immediate Contract Termination',
      body: 'Non-compliance leads to the immediate cancellation of the agency’s contract with the bank.',
    },
    {
      title: 'Blacklisting and Penalties',
      body: 'Involvement in fraud results in agency blacklisting and severe financial penalties.',
    },
    {
      title: 'Legal and Regulatory Action',
      body: 'Violations will be escalated to regulatory authorities and may result in legal prosecution.',
    },
  ],
  details: 'Your acknowledgement details',
  detailsHelp: 'This name will appear on the list we submit to HDFC Bank.',
  fullName: 'Facility Attendant name',
  employeeId: 'Employee ID',
  agileBranch: 'Agile Branch Name',
  hdfcSite: 'HDFC Branch / SOL',
  mobile: 'Mobile Number',
  pledge:
    'I have completed the Integrity at Work training of HDFC Bank Compliance Advisory for Facility Attendants. I undertake that I will not do fraudulent transactions, I will not do banking work for staff, I will not take part in money laundering, and I will report any such request at once to my OM / HOD.',
  accept: 'I have completed the training and I give this undertaking',
  locNeed: 'Turn on location so we can record where you acknowledged this.',
  submit: 'Submit acknowledgement',
  thanks: 'Thank you',
  recorded: 'Acknowledgement recorded',
  alreadyDone: 'You have already acknowledged this advisory. This is your record.',
  ackNo: 'Acknowledgement no.',
  date: 'Date & time',
  gps: 'GPS',
  waTitle: 'HDFC Bank Compliance Advisory — Facility Attendants',
  waBody:
    'Please open this link, choose your language, read the three points, answer 3 questions, and give your undertaking.',
  quiz: '3 questions on the three points',
  quizHelp: 'Answer all 3 correctly. Then give your undertaking.',
  yes: 'YES',
  no: 'NO',
  correct: 'Correct',
  retry: 'Please try again',
  questions: [
    { title: 'Can a Facility Attendant receive money in their own account and pass it on for another person?', correct: 'no' },
    { title: 'Can a Facility Attendant do banking work for bank staff?', correct: 'no' },
    { title: 'May a Facility Attendant help move or hide money to avoid bank rules?', correct: 'no' },
  ],
  exampleWord: 'Example.',
  listenPts: 'Listen to the 3 points',
  pointWord: 'Point',
}

export const ADV_QUIZ_CORRECT: Array<'yes' | 'no'> = ['no', 'no', 'no']

/** Server check — all 3 must match. Language does not change the key. */
export function advQuizAnswersOk(raw: unknown): Array<'yes' | 'no'> | null {
  const arr = Array.isArray(raw) ? raw.map((x) => String(x || '').trim().toLowerCase()) : []
  if (arr.length !== 3) return null
  if (!arr.every((x) => x === 'yes' || x === 'no')) return null
  if (!ADV_QUIZ_CORRECT.every((want, i) => arr[i] === want)) return null
  return arr as Array<'yes' | 'no'>
}

type AdvBody = Pick<
  AdvCopy,
  | 'title'
  | 'subtitle'
  | 'intro'
  | 'infographic'
  | 'infographicShare'
  | 'infographicDownload'
  | 'infographicClose'
  | 'prohibited'
  | 'consequences'
  | 'itemsP'
  | 'itemsC'
  | 'details'
  | 'detailsHelp'
  | 'pledge'
  | 'accept'
  | 'recorded'
  | 'alreadyDone'
  | 'ackNo'
  | 'waTitle'
  | 'waBody'
  | 'quiz'
  | 'quizHelp'
  | 'questions'
  | 'exampleWord'
  | 'listenPts'
  | 'pointWord'
> & {
  chooseHelp?: string
  mobileBar?: string
  seriesClient?: string
  seriesName?: string
  issueDate?: string
  audience?: string
}

type SeriesChrome = Pick<AdvCopy, 'seriesClient' | 'seriesName' | 'issueDate' | 'audience'>

const SERIES: Record<Lang, SeriesChrome> = {
  en: {
    seriesClient: 'HDFC — Strategic Client',
    seriesName: 'Compliance Advisory Series',
    issueDate: 'Issue date',
    audience: 'For Facility Attendants posted at HDFC Bank',
  },
  hi: {
    seriesClient: 'HDFC बैंक — रणनीतिक ग्राहक',
    seriesName: 'अनुपालन सलाह श्रृंखला',
    issueDate: 'जारी दिनांक',
    audience: 'HDFC बैंक में तैनात सुविधा परिचारकों के लिए',
  },
  te: {
    seriesClient: 'HDFC బ్యాంక్ — వ్యూహాత్మక క్లయింట్',
    seriesName: 'కంప్లయన్స్ అడ్వైజరీ సిరీస్',
    issueDate: 'జారీ తేదీ',
    audience: 'HDFC బ్యాంక్‌లో పనిచేసే ఫెసిలిటీ అటెండెంట్ల కోసం',
  },
  ta: {
    seriesClient: 'HDFC வங்கி — மூலోபாய வாடிக்கையாளர்',
    seriesName: 'இணக்க ஆலோசனைத் தொடர்',
    issueDate: 'வெளியீட்டுத் தேதி',
    audience: 'HDFC வங்கியில் பணியில் உள்ள வசதி உதவியாளர்களுக்கு',
  },
  kn: {
    seriesClient: 'HDFC ಬ್ಯಾಂಕ್ — ತಂತ್ರಾತ್ಮಕ ಗ್ರಾಹಕ',
    seriesName: 'ಅನುಸರಣೆ ಸಲಹೆ ಸರಣಿ',
    issueDate: 'ಬಿಡುಗಡೆ ದಿನಾಂಕ',
    audience: 'HDFC ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಸೌಲಭ್ಯ ಸಹಾಯಕರಿಗಾಗಿ',
  },
  ml: {
    seriesClient: 'HDFC ബാങ്ക് — തന്ത്രപ്രധാന ക്ലയന്റ്',
    seriesName: 'കംപ്ലയൻസ് അഡ്‌വൈസറി പരമ്പര',
    issueDate: 'ഇഷ്യൂ തീയതി',
    audience: 'HDFC ബാങ്കിൽ ജോലി ചെയ്യുന്ന ഫെസിലിറ്റി അറ്റൻഡന്റുകൾക്ക്',
  },
  mr: {
    seriesClient: 'HDFC बँक — धोरणात्मक ग्राहक',
    seriesName: 'अनुपालन सल्ला मालिका',
    issueDate: 'निर्गम दिनांक',
    audience: 'HDFC बँकेत तैनात सुविधा परिचारकांसाठी',
  },
  as: {
    seriesClient: 'HDFC বেংক — কৌশলগত গ্ৰাহক',
    seriesName: 'অনুপালন পৰামৰ্শ শৃংখলা',
    issueDate: 'প্ৰকাশৰ তাৰিখ',
    audience: 'HDFC বেংকত নিয়োজিত সুবিধা পৰিচাৰকসকলৰ বাবে',
  },
  gu: {
    seriesClient: 'HDFC બેંક — વ્યૂહાત્મક ગ્રાહક',
    seriesName: 'અનુપાલન સલાહ શ્રેણી',
    issueDate: 'અંક તારીખ',
    audience: 'HDFC બેંકમાં તૈનાત સુવિધા પરિચારકો માટે',
  },
  bn: {
    seriesClient: 'HDFC ব্যাংক — কৌশলগত ক্লায়েন্ট',
    seriesName: 'কমপ্লায়েন্স অ্যাডভাইজরি সিরিজ',
    issueDate: 'ইস্যু তারিখ',
    audience: 'HDFC ব্যাংকে নিয়োজিত ফ্যাসিলিটি অ্যাটেনডেন্টদের জন্য',
  },
  pa: {
    seriesClient: 'HDFC ਬੈਂਕ — ਰਣਨੀਤਕ ਗਾਹਕ',
    seriesName: 'ਅਨੁਪਾਲਨ ਸਲਾਹ ਲੜੀ',
    issueDate: 'ਜਾਰੀ ਮਿਤੀ',
    audience: 'HDFC ਬੈਂਕ ਵਿੱਚ ਤੈਨਾਤ ਸਹੂਲਤ ਅਟੈਂਡੈਂਟਾਂ ਲਈ',
  },
  or: {
    seriesClient: 'HDFC ବ୍ୟାଙ୍କ — ରଣନୈତିକ ଗ୍ରାହକ',
    seriesName: 'ଅନୁପାଳନ ପରାମର୍ଶ ଶୃଙ୍ଖଳା',
    issueDate: 'ପ୍ରକାଶ ତାରିଖ',
    audience: 'HDFC ବ୍ୟାଙ୍କରେ ନିୟୋଜିତ ସୁବିଧା ପରିଚାରକଙ୍କ ପାଇଁ',
  },
}

export function faAdvIssueStamp(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(now)
  let dd = ''
  let mo = ''
  let yy = ''
  for (const p of parts) {
    if (p.type === 'day') dd = p.value
    if (p.type === 'month') mo = p.value.replace('.', '').replace('Sept', 'Sep')
    if (p.type === 'year') yy = p.value
  }
  return `${dd} ${mo} ${yy}`.replace(/\s+/g, ' ').trim()
}

/** Form labels from the FA phone page; poster + quiz are fully written here. */
function langAdv(lang: Lang, body: AdvBody): AdvCopy {
  const fa = copies[lang]
  const series = SERIES[lang] || SERIES.en
  return {
    ...EN_ADV,
    ...series,
    ...body,
    name: fa.name,
    native: fa.native,
    choose: fa.choose,
    chooseHelp: body.chooseHelp || fa.chooseHelp,
    mobileBar: body.mobileBar || EN_ADV.mobileBar,
    fullName: fa.fullName,
    employeeId: fa.employeeId,
    agileBranch: fa.agileBranch || fa.branch || EN_ADV.agileBranch,
    hdfcSite: fa.hdfcSite || EN_ADV.hdfcSite,
    mobile: fa.mobile,
    locNeed: fa.locNeed || EN_ADV.locNeed,
    thanks: fa.thanks,
    date: fa.date,
    gps: fa.gps,
    accept: body.accept || fa.accept,
    submit: fa.submit,
    yes: fa.yes,
    no: fa.no,
    correct: fa.correct,
    retry: fa.retry,
  }
}

const HI_ADV = langAdv('hi', {
  chooseHelp: 'यह सलाह, तीन बिंदु, 3 प्रश्न और आपका वचन इसी भाषा में दिखेगा।',
  mobileBar: 'मोबाइल — +91 9248707070',
  title: 'कार्य में ईमानदारी',
  subtitle: 'एचडीएफसी बैंक — सुविधा परिचारकों के लिए अनुपालन सलाह',
  intro:
    'एचडीएफसी बैंक में काम करने वाले सभी सुविधा परिचारकों को ईमानदारी, सत्यनिष्ठा और पेशेवर आचरण के उच्चतम मानकों का पालन करना होगा। यह सलाह अनिवार्य आचरण बताती है और धोखाधड़ी तथा अनधिकृत लेनदेन पर शून्य सहनशीलता दोहराती है, ताकि बैंक के काम और विश्वास की रक्षा हो।',
  infographic: 'इन्फोग्राफिक खोलें',
  infographicShare: 'साझा करें',
  infographicDownload: 'डाउनलोड',
  infographicClose: 'बंद करें',
  prohibited: 'निषिद्ध गतिविधियाँ',
  consequences: 'न मानने पर परिणाम',
  itemsP: [
    {
      title: 'धोखाधड़ी / म्यूल खाता लेनदेन नहीं',
      body: 'सुविधा परिचारक किसी अन्य व्यक्ति के लिए अपने निजी खाते में पैसा न लें, न रखें, न आगे भेजें। ऐसा करने पर खाता म्यूल बन जाता है। यह धोखाधड़ी और अपराध है — चाहे कोई इसे मदद, ओवरटाइम या इमरजेंसी कहे। “केवल एक बार मदद” की अनुमति नहीं है।',
      example: 'अजनबी, साथी या स्टाफ आपसे कहे कि पैसे आपके खाते में लें और UPI या नकद से आगे भेज दें, और थोड़ा हिस्सा देने की बात करे। यह म्यूल-खाता धोखाधड़ी है। मना करें। उसी दिन OM / HOD को बताएँ।',
    },
    {
      title: 'स्टाफ के लिए बैंक काम नहीं',
      body: 'आप HDFC बैंक में सुविधा और सुरक्षा के लिए तैनात हैं — बैंक का काम करने के लिए नहीं। स्टाफ की ओर से नकद, OTP, ऐप, पर्ची, कार्ड या कोई भी लेनदेन न करें। छोटी मदद भी अनधिकृत है और धोखाधड़ी मानी जा सकती है।',
      example: 'अधिकारी व्यस्त है और आपसे नकद जमा, OTP टाइप करने या ट्रांसफर पूरा करने को कहता है। यह बैंक का काम है। कहें “मैं बैंक का काम नहीं कर सकता/सकती।” तुरंत OM / HOD को बताएँ।',
    },
    {
      title: 'मनी लॉन्ड्रिंग नहीं',
      body: 'मनी लॉन्ड्रिंग का अर्थ है पैसा छिपाना या इधर-उधर करना ताकि बैंक और कानून उसका स्रोत न देख सकें। इसके लिए नकद, सोना या कागज़ न उठाएँ, जमा न तोड़ें, नियम न तोड़ें। एक बार शामिल होने पर ठेका रद्द हो सकता है और पुलिस कार्रवाई हो सकती है।',
      example: 'कोई आपसे नकद का पैकेट उठाने, कई छोटी जमा कराने, या पैसे ऐसे हटाने को कहे कि बैंक रिकॉर्ड में न दिखे। यह मनी लॉन्ड्रिंग है। मना करें और तुरंत OM / HOD को बताएँ।',
    },
  ],
  itemsC: [
    { title: 'तुरंत ठेका समाप्ति', body: 'न मानने पर एजेंसी का बैंक के साथ ठेका तुरंत रद्द हो सकता है।' },
    { title: 'ब्लैकलिस्ट और जुर्माना', body: 'धोखाधड़ी में शामिल होने पर एजेंसी ब्लैकलिस्ट और भारी जुर्माना लगेगा।' },
    { title: 'कानूनी कार्रवाई', body: 'उल्लंघन नियामक अधिकारियों तक जाएगा और मुकदमा हो सकता है।' },
  ],
  details: 'आपकी स्वीकृति का विवरण',
  detailsHelp: 'यह नाम एचडीएफसी बैंक को भेजी जाने वाली सूची में जाएगा।',
  pledge:
    'मैंने कार्य में ईमानदारी (Integrity at Work) — एचडीएफसी बैंक सुविधा परिचारक अनुपालन सलाह — का प्रशिक्षण पूरा किया है। मैं वचन देती/देता हूँ कि धोखाधड़ी वाले लेनदेन नहीं करूँगा/करूँगी, स्टाफ के लिए बैंक काम नहीं करूँगा/करूँगी, मनी लॉन्ड्रिंग में भाग नहीं लूँगा/लूँगी, और ऐसी कोई माँग तुरंत OM / HOD को बताऊँगा/बताऊँगी।',
  accept: 'मैंने प्रशिक्षण पूरा किया है और यह वचन देती/देता हूँ',
  recorded: 'स्वीकृति दर्ज हो गई',
  alreadyDone: 'आप पहले ही स्वीकार कर चुके हैं। यह आपका रिकॉर्ड है।',
  ackNo: 'स्वीकृति संख्या',
  waTitle: 'एचडीएफसी बैंक अनुपालन सलाह — सुविधा परिचारक',
  waBody: 'यह लिंक खोलें, भाषा चुनें, तीन बिंदु पढ़ें, 3 प्रश्न हल करें, और वचन दें।',
  quiz: 'तीन बिंदुओं पर 3 प्रश्न',
  quizHelp: 'सभी 3 सही उत्तर दें। फिर वचन पर सही का निशान लगाएँ।',
  questions: [
    { title: 'क्या सुविधा परिचारक अपने खाते में किसी और का पैसा लेकर आगे भेज सकता है?', correct: 'no' },
    { title: 'क्या सुविधा परिचारक बैंक स्टाफ के लिए बैंकिंग काम कर सकता है?', correct: 'no' },
    { title: 'क्या सुविधा परिचारक बैंक नियम बचाने के लिए पैसा छिपाने या हटाने में मदद कर सकता है?', correct: 'no' },
  ],
  exampleWord: 'उदाहरण.',
  listenPts: 'तीन बिंदु सुनें',
  pointWord: 'बिंदु',
})


type HeadCopy = Pick<AdvCopy, 'title' | 'subtitle' | 'intro' | 'infographic'>

const HEAD: Partial<Record<Lang, HeadCopy>> = {
  te: {
    title: 'పనిలో నిజాయితీ',
    subtitle: 'HDFC బ్యాంక్ — ఫెసిలిటీ అటెండెంట్ల కోసం కంప్లయన్స్ అడ్వైజరీ',
    intro: 'HDFC బ్యాంక్లో పనిచేసే ప్రతి ఫెసిలిటీ అటెండెంట్ నిజాయితీ, నిజనిష్ఠ, వృత్తి ప్రవర్తనలో అత్యున్నత ప్రమాణాలు పాటించాలి. ఈ సలహా తప్పనిసరి ప్రవర్తనను నిర్దేశిస్తుంది. మోసం మరియు అనధికార లావాదేవీలపై జీరో టాలరెన్స్ ఉంది, దీని బ్యాంక్ పని మరియు నమ్మకం కాపాడబడతాయి.',
    infographic: 'ఇన్ఫోగ్రాఫిక్ తెరవండి',
  },
  ta: {
    title: 'பணியில் நேர்மை',
    subtitle: 'HDFC வங்கி — வசதி உதவியாளர்களுக்கான இணக்க ஆலோசனை',
    intro: 'HDFC வங்கியில் பணியாற்றும் அனைத்து வசதி உதவியாளர்களும் நட்பு, நிடை, தொசில் நடத்தையில் உயர்ந்த தரத்தை பின்பட்ட வேண்டும். இந்த ஆலோசனை கட்டாயமான நடத்தையை கூறுகிறது. மோசத்திற்கும் அதிகார பயிவீடுகளுக்கும் பூஜ்ஜிய போக்கு இல்லை, இதனால் வங்கியின் இயக்கம் மற்றும் நம்பிக்கையும் காக்கப்படுகின்றன.',
    infographic: 'இன்ஃபோகிராஃபிக் திறக்க',
  },
  kn: {
    title: 'ಕೆಲಸದಲ್ಲಿ ಪ್ರಾಮಾಣಿಕತೆ',
    subtitle: 'HDFC ಬ್ಯಾಂಕ್ — ಸೌಲಭ್ಯ ಸಹಾಯಕರಿಗಾಗಿ ಅನುಸರಣೆ ಸಲಹೆ',
    intro: 'HDFC ಬ್ಯಾಂಕ್ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುವ ಎಲ್ಲ ಸೌಲಭ್ಯ ಸಹಾಯಕರು ಪ್ರಾಮಾಣಿಕತೆ, ನಿಷ್ಠೆ ಮತ್ತು ವೃತ್ತಿಪರ ನಡತೆಯ ಉನ್ನತ ಮಾನದಂಡಗಳನ್ನು ಪಾಲಿಸಬೇಕಾಗು. ಈ ಸಲಹೆ ಕಡ್ಡಾಯ ನಡತೆಯನ್ನು ಹೇಳುವುದು. ವಂಚನೆ ಮತ್ತು ಅನಧಿಕಃತ ವ್ಯವಹಾರಗಳ ಮೇಲೆ ಶೂನ್ಯ ಸಹಿಷ್ಣುವೆ ಇದೆ, ಇದರಿಂದ ಬ್ಯಾಂಕ್ ಕೆಲಸ ಮತ್ತು ನಮ್ಬಿಕೆಯನ್ನು ರಕ್ಷಿಸುತ್ತದೆ.',
    infographic: 'ಇನ್ಫೋಗ್ರಾಫಿಕ್ ತೆರೆಯಿರಿ',
  },
  ml: {
    title: 'ജോലിയിലെ സത്യനിഷ്ഠ',
    subtitle: 'HDFC ബാങ്ക് — ഫെസിലിറ്റി അറ്ററ്റന്റുമാരായി കംപ്ലയൻസ് അഡ്വൈസറി',
    intro: 'HDFC ബാങ്കില് ജോലി ചെയ്യുന്ന എല്ലാ ഫെസിലിറ്റി അറ്ററ്റന്റുമാരും സത്യനിഷ്ഠ, നിൺമല, തൊഴില്പട പവര്ത്തനത്തിന്റെ എറ്റവും മാനദണ്ഡങ്ങൾ പാലിക്കണം. ഈ ഉപദേശം നിർബന്ധമായ പവര്ത്തനം നിർദേശിക്കുന്നു. തട്ടിപ്പും അനധികൃത ഇടപാടുകൾക്കെതിരെ ജീറോ ടോളറൻസ് ഉണ്ട്, അതുവാല് ബാങ്കിന്റെ പ്രവര്ത്തനവും വിശ്വാസവും സംരക്ഷിക്കുന്നു.',
    infographic: 'ഇൻഫോഗ്രാഫിക് തുറക്കുക',
  },
  mr: {
    title: 'कार्यात प्रामाणिकता',
    subtitle: 'HDFC बँक — सुविधा परिचारकांसाठी अनुपालन सल्ला',
    intro: 'HDFC बँकेत काम करणाऱ्या सर्व सुविधा परिचारकांनी प्रामाणिकता, प्रामाण आणि व्यावसायीक आचरणाचे उच्चतम मानक पाळावे लागतील. ही सल्ला अनिवार्य आचरण सांगते आणि गुनहे, अनधिकृत व्यवहारांवर शून्य सहनशीलता दुरावते; त्यामुळे बँकेचे काम आणि विश्वास रक्षला जातो.',
    infographic: 'इन्फोग्राफिक उघडा',
  },
  as: {
    title: 'কামত সত্যনিষ্ঠা',
    subtitle: 'HDFC বেংক — সুবিধা পৰিচাৰকসকলৰ বাবে অনুপালন পৰামৰ্শ',
    intro: 'HDFC বেংকত কাম কৰা সকলো সুবিধা পৰিচাৰকে সত্যনিষ্ঠা, সত্যতা আৰু বৃত্তিগত আচৰণৰ সৰ্বোচ্চ মান পালন কৰিব লাগিব. এই পৰামৰ্শে বাধ্যতামূলক আচৰণ কয় আৰু প্ৰবঞ্চনা তথা অনধিকৃত লেনদেনত শূন্য সহিষ্ণুতা দুবারায፤ যাতে বেংকৰ কাম আৰু বিশ্বাস ৰক্ষা কৰা যায়.',
    infographic: "ইনফ'গ্ৰাফিক খোলক",
  },
  gu: {
    title: 'કામમાં પ્રામાણિકતા',
    subtitle: 'HDFC બેંક — સુવિધા પરિચારકો માટે અનુપાલન સલાહ',
    intro: 'HDFC બેંકમાં કામ કરતા સર્વ સુવિધા પરિચારકોએ પ્રામાણિકતા, સત્યનિષ્ઠા અને વ્યવસાયિક આચરણના ઉચ્ચતમ માનકો પાળન કરવું. આ સલાહ ફરજીયાત આચરણ જણાવે અને છેતરાદી તથા અનધિકૃત લેનદેન પર શૂન્ય સહિષ્ણુતા દોહરાવે છે, જેથી બેંકનું કામ અને વિશ્વાસ રક્ષાય.',
    infographic: 'ઇન્ફોગ્રાફિક ખોલો',
  },
  bn: {
    title: 'কাজে সত্যনিষ্ঠা',
    subtitle: 'HDFC ব্যাংক — ফ্যাসিলিটি অ্যাটেনডেন্টদের জন্য কমপ্লায়েন্স অ্যাডভাইজরি',
    intro: 'HDFC ব্যাংকে কাজরত সকল ফ্যাসিলিটি অ্যাটেনডেন্টকে সত্যনিষ্ঠা, সত্যতা ও পেশাদার আচরণের সর্বোচ্চ মান রক্ষা করতে হবে፤ এই পরামর্শ বাধ্যতামূলক আচরণ বলে এবং প্রবঞ্চনা ও অনধিকৃত লেনদেনে শূন্য সহিষ্ণুতা জোর দেয፤ যাতে ব্যাংকের কাজ ও আস্থা রক্ষা পায।',
    infographic: 'ইনফোগ্রাফিক খুলুন',
  },
  pa: {
    title: 'ਕੰਮ ਵਿੱਚ ਇਮਾਨਦਾਰੀ',
    subtitle: 'HDFC ਬੈਂਕ — ਸਹੂਲਤ ਅਟੈਂਡੈਂਟਾਂ ਲਈ ਅਨੁਪਾਲਨ ਸਲਾਹ',
    intro: 'HDFC ਬੈਂਕ ਵਿੱਚ ਕੰਮ ਕਰਨ ਵਾਲੇ ਸਾਰੇ ਸਹੂਲਤ ਅਟੈਂਡੈਂਟਾਂ ਨੂੰ ਇਮਾਨਦਾਰੀ, ਈਮਾਨਦਾਰੀ ਅਤੇ ਪੇਸ਼ੇਵਰ ਆਚਰਨ ਦੇ ਉੱਚੇ ਮਾਪਦੰਡ ਨਿਭਾਉਣੇ ਹਨ। ਇਹ ਸਲਾਹ ਲਾਜ਼ਮੀ ਆਚਰਨ ਦੱਸਦੀ ਹੈ ਅਤੇ ਧੋਖਾਧੜੀ ਅਤੇ ਅਣਾਧਿਕਾਰਤ ਲੈਣ-ਦੇਣ ਉੱਤੇ ਜ਼ੀਰੋ ਬਰਦਾਸ਼ਤ ਦੁਹਰਾਉਂਦੀ ਹੈ, ਤਾਂ ਜੋ ਬੈਂਕ ਦਾ ਕੰਮ ਅਤੇ ਭਰੋਸਾ ਰੱਖਿਆ ਜਾ ਸਕੇ।',
    infographic: 'ਇਨਫੋਗ੍ਰਾਫਿਕ ਖੋਲ੍ਹੋ',
  },
  or: {
    title: 'କାର୍ଯରେ ସତ୍ୟନିଷ୍ଠା',
    subtitle: 'HDFC ବ୍ୟାଙ୍କ — ସୁବିଧା ପରିଚାରକଙ୍କ ପାଇଁ ଅନୁପାଳନ ପରାମର୍ଶ',
    intro: 'HDFC ବ୍ୟାଙ୍କରେ କାର୍ଯ କରୁଥିବା ସମସ୍ତ ସୁବିଧା ପରିଚାରକଙ୍କୁ ସତ୍ୟନିଷ୍ଠା, ସତ୍ୟତା ଓ ପେଶାଦାର ଆଚରଣର ସର୍ବୋଚ୍ଚ ମାନ ରକ୍ଷା କରିବାକୁ ହେବ। ଏହି ପରାମର୍ଶ ବାଧ୍ୟତାମୂଳକ ଆଚରଣ ଦର୍ଶାଇ ଓ ପ୍ରବଞ୍ଚନା ଓ ଅନଧିକୃତ ଲେଣଦେନ ଉପରେ ଶୂନ୍ୟ ସହିଷ୍ଣୁତା ଦୃଢ଼ାଇ, ୟାହା ବ୍ୟାଙ୍କର କାର୍ୟ ଓ ବିଶ୍ୱାସ ରକ୍ଷା ପାଇବ।',
    infographic: 'ଇନଫୋଗ୍ରାଫିକ୍ ଖୋଲନ୍ତୁ',
  },
}

/** Full poster + 3 questions from the already-translated FA training book. */
function nativeIfOwn(value: string | undefined, enValue: string | undefined, fallback: string): string {
  const v = String(value || '').trim()
  const en = String(enValue || '').trim()
  if (v && v !== en) return v
  return fallback
}

function langAdvFromTraining(lang: Lang): AdvCopy {
  const fa = copies[lang]
  const en = copies.en
  const native = NATIVE_PACK[lang]
  const r0 = fa.rules[0] || en.rules[0]
  const r1 = fa.rules[1] || en.rules[1]
  const r2 = fa.rules[2] || en.rules[2]
  const q0 = fa.questions[0] || en.questions[0]
  const q1 = fa.questions[1] || en.questions[1]
  const punish = nativeIfOwn(fa.punishBanner, en.punishBanner, r2.title)
  const victim = nativeIfOwn(fa.victimLine, en.victimLine, '')
  const heading = nativeIfOwn(fa.doRight, en.doRight, fa.before)
  const introBits = [fa.subtitle, victim, fa.legal].filter((x) => String(x || '').trim())
  const itemsP = native?.items?.length
    ? native.items
    : [
        { title: r1.title, body: r1.body, example: r1.example || '' },
        { title: r0.title, body: r0.body, example: r0.example || '' },
        { title: r2.title, body: r2.body, example: r2.example || '' },
      ]
  return langAdv(lang, {
    chooseHelp: fa.chooseHelp,
    mobileBar: `${fa.mobile} — +91 9248707070`,
    title: HEAD[lang]?.title || `${fa.title} ${fa.acknowledgement}`.trim(),
    subtitle: HEAD[lang]?.subtitle || '',
    intro: HEAD[lang]?.intro || introBits.join(' '),
    infographic: HEAD[lang]?.infographic || EN_ADV.infographic,
    prohibited: heading,
    consequences: punish,
    itemsP,
    itemsC: [
      { title: r2.title, body: r2.body },
      { title: punish, body: nativeIfOwn(r2.doInstead, en.rules[2]?.doInstead, fa.legal) },
      { title: fa.formal, body: fa.legal },
    ],
    details: fa.formal,
    detailsHelp: fa.detailsHelp,
    pledge: native?.pledge || fa.watched,
    accept: native?.accept || fa.accept,
    recorded: fa.recorded,
    alreadyDone: nativeIfOwn(fa.alreadyDone, en.alreadyDone, fa.recorded),
    ackNo: nativeIfOwn(fa.certCode, en.certCode, fa.acknowledgement),
    waTitle: `${fa.title} ${fa.acknowledgement}`.trim(),
    waBody: native?.waBody || fa.chooseHelp,
    quiz: native?.quiz || EN_ADV.quiz,
    quizHelp: native?.quizHelp || fa.gated,
    exampleWord: native?.exampleWord || fa.exampleWord || '',
    listenPts: native?.listenPts || '',
    pointWord: native?.pointWord || '',
    questions: [
      { title: q1.title, correct: 'no' },
      { title: q0.title, correct: 'no' },
      { title: native?.q3 || q1.title, correct: 'no' },
    ],
  })
}

export const ADV_COPIES: Record<Lang, AdvCopy> = {
  en: EN_ADV,
  hi: HI_ADV,
  te: langAdvFromTraining('te'),
  ta: langAdvFromTraining('ta'),
  kn: langAdvFromTraining('kn'),
  ml: langAdvFromTraining('ml'),
  mr: langAdvFromTraining('mr'),
  as: langAdvFromTraining('as'),
  gu: langAdvFromTraining('gu'),
  bn: langAdvFromTraining('bn'),
  pa: langAdvFromTraining('pa'),
  or: langAdvFromTraining('or'),
}

export const FA_ADVISORY_PATH = '/training/fa-advisory'
export const FA_ADVISORY_URL = 'https://www.agilegroup-digital.co.in/training/fa-advisory'
export const FA_HDFC_REPORT_PATH = '/training/fa-hdfc-report'
export const FA_HDFC_REPORT_URL = 'https://www.agilegroup-digital.co.in/training/fa-hdfc-report'
export const FA_ADVISORY_HELPLINE = '+91 9248707070'
export const FA_ADVISORY_INFOGRAPHIC_PATH = '/fa-integrity-infographic.jpg'
export const FA_ADVISORY_INFOGRAPHIC_URL = 'https://www.agilegroup-digital.co.in/fa-integrity-infographic.jpg'
export const FA_ADVISORY_INFOGRAPHIC_FILE = 'Integrity-at-Work-HDFC-FA-Infographic.jpg'

export function isAdvLang(v: unknown): v is Lang {
  return FA_LANGS.includes(String(v || '') as Lang)
}

export function advCopy(lang: string): AdvCopy {
  const code = isAdvLang(lang) ? lang : 'en'
  const row = ADV_COPIES[code] || EN_ADV
  return {
    ...EN_ADV,
    ...row,
    itemsP: (row.itemsP || EN_ADV.itemsP).map((it, i) => ({
      title: it.title || EN_ADV.itemsP[i]?.title || '',
      body: it.body || EN_ADV.itemsP[i]?.body || '',
      example: it.example || '',
    })),
    itemsC: (row.itemsC || EN_ADV.itemsC).map((it, i) => ({
      title: it.title || EN_ADV.itemsC[i]?.title || '',
      body: it.body || EN_ADV.itemsC[i]?.body || '',
    })),
    questions: (row.questions || EN_ADV.questions).map((q, i) => ({
      title: q.title || EN_ADV.questions[i]?.title || '',
      correct: q.correct || EN_ADV.questions[i]?.correct || ADV_QUIZ_CORRECT[i] || 'no',
    })),
  }
}

export function advLangOptions(): Array<{ code: Lang; name: string; native: string }> {
  return FA_LANGS.map((code) => ({
    code,
    name: copies[code].name,
    native: copies[code].native,
  }))
}
