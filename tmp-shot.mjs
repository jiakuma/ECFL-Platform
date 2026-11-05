import { spawn } from 'node:child_process'
import fs from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9381
const BASE = 'http://localhost:5212'
const OUT = 'C:/Users/wwt29/WorkBuddy/2026-08-24-22-53-34/.tmp-shots'
fs.mkdirSync(OUT, { recursive: true })

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1672,941',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Users/wwt29/WorkBuddy/2026-08-24-22-53-34/.tmp-profile9',
  'about:blank',
])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl = ''
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    const p = list.find((t) => t.type === 'page')
    if (p?.webSocketDebuggerUrl) { wsUrl = p.webSocketDebuggerUrl; break }
  } catch {}
  await sleep(300)
}
const ws = new WebSocket(wsUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
}
const send = (method, params = {}) => {
  const mid = ++id
  ws.send(JSON.stringify({ id: mid, method, params }))
  return new Promise((res) => pending.set(mid, res))
}
const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1672, height: 941, deviceScaleFactor: 1, mobile: false })

await send('Page.navigate', { url: `${BASE}/#/dataset/cohort` })
await sleep(3500)
await evalJs(`localStorage.setItem('ecflp_side','app'); localStorage.setItem('ecflp_role','org_admin'); 1`)
await send('Page.reload', { ignoreCache: true })
await sleep(4500)

const probe = `(() => {
  const g = (s) => { const e = document.querySelector(s); if(!e) return null; const c = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { bg: c.backgroundColor, radius: c.borderRadius, shadow: c.boxShadow.slice(0,40), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
  return {
    side: g('.sidebar'), top: g('.topbar'), main: g('.main'), panel: g('.cq__panel'),
    table: g('.cq__table'), th: g('.el-table th.el-table__cell'),
    tab: g('.cq__tab.is-on'), search: g('.cq__search .el-input__wrapper'),
  }
})()`

const r = await send('Page.captureScreenshot', { format: 'png' })
fs.writeFileSync(`${OUT}/base.png`, Buffer.from(r.data, 'base64'))
console.log(JSON.stringify(await evalJs(probe)))

chrome.kill()
process.exit(0)
