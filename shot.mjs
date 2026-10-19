import { spawn } from 'node:child_process'
import fs from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9361
const OUT = 'C:/Users/wwt29/WorkBuddy/2026-08-24-22-53-34/.tmp-shots'
fs.mkdirSync(OUT, { recursive: true })

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1680,1000',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Users/wwt29/WorkBuddy/2026-08-24-22-53-34/.tmp-profile',
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
await send('Page.navigate', { url: 'http://localhost:5200/#/dataset/cohort' })
await sleep(5000)
await evalJs(`(async () => {
  if (document.querySelector('.app--admin')) {
    [...document.querySelectorAll('.el-button')].find(e => e.textContent.includes('返回应用端'))?.click()
    await new Promise(r => setTimeout(r, 1800))
  }
})()`)
await send('Page.navigate', { url: 'http://localhost:5200/#/dataset/cohort' })
await sleep(4500)

console.log('行数:', await evalJs(`document.querySelectorAll('.cq__table tbody tr').length`))
const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
fs.writeFileSync(`${OUT}/list-final.png`, Buffer.from(r.data, 'base64'))

// 查看抽屉
await evalJs(`document.querySelectorAll('.cq__table tbody tr')[1].querySelectorAll('.el-button')[0].click()`)
await sleep(2000)
const r2 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
fs.writeFileSync(`${OUT}/view-final.png`, Buffer.from(r2.data, 'base64'))

ws.close()
chrome.kill()
