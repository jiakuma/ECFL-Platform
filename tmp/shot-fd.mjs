import { spawn } from 'node:child_process'
import fs from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9371
const OUT = 'C:/Users/wwt29/WorkBuddy/2026-08-24-22-53-34/.tmp-shots'
fs.mkdirSync(OUT, { recursive: true })

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1440,1900',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Users/wwt29/WorkBuddy/2026-08-24-22-53-34/.tmp-profile-fd',
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
const errs = []
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errs.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
  }
  if (m.method === 'Runtime.exceptionThrown') {
    errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
  }
}
const send = (method, params = {}) => {
  const mid = ++id
  ws.send(JSON.stringify({ id: mid, method, params }))
  return new Promise((res) => pending.set(mid, res))
}
const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'))
}

await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url: 'http://localhost:5173/' })
await sleep(2500)
await evalJs(`localStorage.setItem('ecflp_org','肿瘤医院'); localStorage.setItem('ecflp_token','debug-token'); localStorage.setItem('ecflp_role','orgAdmin'); localStorage.setItem('ecflp_side','app'); 'ok'`)
await send('Page.navigate', { url: 'http://localhost:5173/#/federated/FT-2026-002' })
await sleep(600)
await send('Page.reload', {})
await sleep(5000)

console.log('HAS_HEAD:', await evalJs(`!!document.querySelector('.fd-head')`))
console.log('METRICS:', await evalJs(`document.querySelectorAll('.metric').length`))
console.log('TABS:', await evalJs(`[...document.querySelectorAll('.fd-tab')].map(e=>e.textContent.trim()).join('|')`))
console.log('SPEC_CELLS:', await evalJs(`document.querySelectorAll('.spec__cell').length`))
console.log('SCROLL_W:', await evalJs(`document.documentElement.scrollWidth`))
await evalJs(`window.scrollTo(0,0)`)
await sleep(900)
await shot('fd-detail')

await evalJs(`[...document.querySelectorAll('.fd-tab')].find(e=>e.textContent.includes('审批反馈'))?.click()`)
await sleep(1200)
await evalJs(`window.scrollTo(0,0)`)
await sleep(300)
await shot('fd-approval')

await evalJs(`[...document.querySelectorAll('.fd-tab')].find(e=>e.textContent.includes('训练管理'))?.click()`)
await sleep(1200)
await evalJs(`window.scrollTo(0,0)`)
await sleep(300)
await shot('fd-train')
console.log('ERRORS:', errs.slice(0, 8))
ws.close()
chrome.kill()
