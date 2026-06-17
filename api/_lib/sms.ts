/** Send OTP via Fast2SMS (India). Set FAST2SMS_API_KEY on Vercel. */
export async function sendPinSms(mobile10: string, pin: string, appTitle: string) {
  const apiKey = process.env.FAST2SMS_API_KEY
  const message = `Agile Command Centre: Your login OTP for ${appTitle} is ${pin}. Valid 10 minutes. Do not share.`

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FAST2SMS_API_KEY is not configured for SMS OTP')
    }
    console.log(`[DEV] SMS OTP for +91${mobile10}: ${pin}`)
    return { devMode: true }
  }

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: mobile10,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SMS failed: ${text.slice(0, 120)}`)
  }

  return { devMode: false }
}
