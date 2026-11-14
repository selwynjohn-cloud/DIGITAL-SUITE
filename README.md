# DIGITAL-SUITE

AGILE DIGITAL APPLICATIONS SUITE

## Apps

| App | Path | Status |
|-----|------|--------|
| **News Bulletin** | [`news-bulletin/`](./news-bulletin/) | Live — Pulse auto-publish 6 AM / 2 PM / 10 PM IST |

### Activate News Bulletin

Production: see [`news-bulletin/LIVE.md`](./news-bulletin/LIVE.md).

Backup (Fast2SMS / Apps Script): see [`news-bulletin/ACTIVATE.md`](./news-bulletin/ACTIVATE.md).

**One-line (backup):** paste `news-bulletin/Code.gs` into Google Apps Script, set `FAST2SMS_API_KEY` + `BULLETIN_TO=9441009091`, run `activateNewsBulletin`.
