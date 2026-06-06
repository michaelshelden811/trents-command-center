'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;500;700&display=swap');`

const C = {
  bg: '#020408',
  bg2: '#060d12',
  bg3: '#0a1520',
  bg4: '#0d1e2e',
  cyan: '#00f5ff',
  green: '#39ff14',
  pink: '#ff2d78',
  yellow: '#d4f576',
  purple: '#b060ff',
  orange: '#ffaa00',
  tb: '#a0d8e8',
  tm: '#5a8a9a',
  td: '#2a4a5a',
  borderCyan: 'rgba(0,245,255,0.18)',
  borderGreen: 'rgba(57,255,20,0.18)',
}

const mono = "'Share Tech Mono', monospace"
const orb = "'Orbitron', monospace"

const PROJECTS = [
  { id: 'peerbill', name: 'PeerBill', url: process.env.NEXT_PUBLIC_PEERBILL_HEALTH || '', color: C.green, tasks: ['Ledger→DB', 'Stripe', 'Signup'], tagTypes: ['prog', 'idle', 'idle'], deploy: '2h ago', activity: '14m ago', activityLabel: 'Last note' },
  { id: 'grantwatch', name: 'GrantWatch', url: process.env.NEXT_PUBLIC_GRANTWATCH_HEALTH || '', color: C.cyan, tasks: ['Scraper setup', 'AI parser'], tagTypes: ['prog', 'idle'], deploy: '1d ago', activity: '6h ago', activityLabel: 'Last scrape' },
  { id: 'pps', name: 'PPS', url: process.env.NEXT_PUBLIC_PPS_HEALTH || '', color: C.cyan, tasks: ['Cron fix', 'Auth'], tagTypes: ['blocked', 'idle'], deploy: '5d ago', activity: '5d ago', activityLabel: 'Last run' },
  { id: 'bspboard', name: 'BSP Board', url: process.env.NEXT_PUBLIC_BSPBOARD_HEALTH || '', color: C.cyan, tasks: ['Incidents UI', 'Reports'], tagTypes: ['idle', 'idle'], deploy: '3d ago', activity: 'Yesterday', activityLabel: 'Last activity' },
  { id: 'trent', name: 'Trent', url: '', color: C.purple, tasks: ['Key rotation', 'PM2 startup'], tagTypes: ['idle', 'idle'], deploy: 'VPS', activity: '09:00', activityLabel: 'Last ping' },
]

const INIT_TASKS = [
  { id: '1', project: 'PEERBILL', title: 'Wire ledger to database', status: 'in_progress', progress: 60 },
  { id: '2', project: 'PPS', title: 'Fix Gabby cron job', status: 'blocked', progress: 10 },
  { id: '3', project: 'PEERBILL', title: 'Stripe billing', status: 'pending', progress: 0 },
  { id: '4', project: 'GRANTWATCH', title: 'GrantWatch AI parser', status: 'pending', progress: 0 },
  { id: '5', project: 'PEERBILL', title: 'RLS re-enabled', status: 'done', progress: 100 },
]

const INIT_RECS = [
  { id: '1', project: 'PEERBILL', text: 'Wire Stripe — pricing defined, no billing. Next revenue unlock.', level: 'green' },
  { id: '2', project: 'PPS', text: 'PPS cron missed last run. Investigate before next job fires.', level: 'yellow' },
  { id: '3', project: 'GRANTWATCH', text: 'GrantWatch AI routes have no rate limiting. Spend risk.', level: 'cyan' },
]

const INIT_ACTIVITY = [
  { project: 'PEERBILL', event: 'Note generated', level: 'green', time: '10:28' },
  { project: 'GRANTWATCH', event: 'Scrape completed', level: 'cyan', time: '09:14' },
  { project: 'TRENT', event: 'Bot pinged — online', level: 'purple', time: '09:00' },
  { project: 'PEERBILL', event: 'Deploy — clean', level: 'green', time: '08:42' },
  { project: 'PPS', event: 'Cron missed run', level: 'pink', time: '08:00' },
]

function Sparkline({ data, color, width = 100, height = 24 }: { data: number[], color: string, width?: number, height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const mn = Math.min(...data), mx = Math.max(...data)
    const range = mx - mn || 1
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.shadowColor = color
    ctx.shadowBlur = 4
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - mn) / range) * (height - 4) - 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [data, color, width, height])
  return <canvas ref={ref} width={width} height={height} style={{ width: '100%', opacity: 0.7, marginTop: 4 }} />
}

function Dial({ project, health, selected, onClick }: { project: typeof PROJECTS[0], health: string, selected: boolean, onClick: () => void }) {
  const pct = health === 'ok' ? (project.id === 'pps' ? 40 : project.id === 'trent' ? 90 : project.id === 'grantwatch' ? 65 : project.id === 'bspboard' ? 58 : 82) : 15
  const color = health === 'ok' ? project.color : C.orange
  const SIZE = 100, R = 38, CX = 50, CY = 50
  const START = -220, SWEEP = 260
  const toXY = (a: number) => {
    const rad = (a - 90) * Math.PI / 180
    return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)]
  }
  const arc = (s: number, e: number) => {
    const [sx, sy] = toXY(s), [ex, ey] = toXY(e)
    const large = e - s > 180 ? 1 : 0
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`
  }
  const endAngle = START + SWEEP * pct / 100
  const tagColors: Record<string, { color: string, border: string }> = {
    prog: { color: C.yellow, border: 'rgba(212,245,118,0.4)' },
    idle: { color: C.td, border: C.borderCyan },
    blocked: { color: C.pink, border: 'rgba(255,45,120,0.4)' },
    done: { color: 'rgba(57,255,20,0.65)', border: 'rgba(57,255,20,0.3)' },
  }

  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 4px', border: `1px solid ${selected ? color : C.borderCyan}`, background: selected ? `${C.bg3}` : 'transparent', transition: 'all 0.2s' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <path d={arc(START, START + SWEEP)} fill="none" stroke="rgba(0,245,255,0.08)" strokeWidth={4} strokeLinecap="round" />
        <path d={arc(START, endAngle)} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        {[0, 25, 50, 75, 100].map(t => {
          const a = START + SWEEP * t / 100
          const [x1, y1] = toXY(a - 5 * 0.1), [x2, y2] = toXY(a)
          return <line key={t} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke="rgba(0,245,255,0.2)" strokeWidth={1} />
        })}
        <text x={CX} y={CY - 4} textAnchor="middle" fontFamily={orb} fontSize={14} fontWeight={700} fill={color}>{pct}%</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontFamily={mono} fontSize={7} fill="rgba(0,245,255,0.35)" letterSpacing={1}>HEALTH</text>
      </svg>
      <div style={{ fontFamily: orb, fontSize: 9, color: '#e0f4ff', letterSpacing: '0.06em', textAlign: 'center' }}>{project.name}</div>
      <div style={{ fontSize: 8, color: health === 'ok' ? C.green : C.orange, letterSpacing: '0.06em' }}>{health === 'ok' ? 'ONLINE' : health === 'vps' ? 'VPS' : 'CHECKING...'}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
        {project.tasks.map((t, i) => {
          const tc = tagColors[project.tagTypes[i]] || tagColors.idle
          return <span key={t} style={{ fontSize: 8, padding: '1px 5px', border: `1px solid ${tc.border}`, color: tc.color, letterSpacing: '0.03em' }}>{t}</span>
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [health, setHealth] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState('peerbill')
  const [tasks, setTasks] = useState(INIT_TASKS)
  const [voiceText, setVoiceText] = useState('')
  const [listening, setListening] = useState(false)
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState('')
  const [time, setTime] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = FONTS
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key || url.includes('YOUR_PROJECT')) {
      router.replace('/login')
      return
    }
    const supabase = createClient(url, key)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) router.replace('/login')
        else setAuthed(true)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  useEffect(() => {
    if (!authed) return
    fetch('/api/ping').then(r => r.json()).then(setHealth).catch(() => {})
  }, [authed])

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('audio', blob, 'voice.webm')
        const r = await fetch('/api/voice', { method: 'POST', body: fd })
        const { text } = await r.json()
        setVoiceText(text || '')
      }
      mr.start()
      mediaRef.current = mr
      setListening(true)
    } catch {}
  }

  const stopVoice = () => {
    mediaRef.current?.stop()
    mediaRef.current = null
    setListening(false)
  }

  const sendToGabriel = async () => {
    if (!voiceText.trim()) return
    setSending(true)
    setResponse('')
    const r = await fetch('/api/gabriel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: voiceText, project: selected }),
    })
    const { reply } = await r.json()
    setResponse(reply || '')
    setSending(false)
    setVoiceText('')
  }

  const selectedProject = PROJECTS.find(p => p.id === selected)!
  const onlineCount = Object.values(health).filter(v => v === 'ok').length
  const alertCount = Object.values(health).filter(v => v !== 'ok' && v !== '').length
  const openTasks = tasks.filter(t => t.status !== 'done').length

  const statusColor: Record<string, string> = { pending: C.cyan, in_progress: C.yellow, blocked: C.pink, done: C.td }
  const statusLabel: Record<string, string> = { pending: 'PENDING', in_progress: 'IN PROGRESS', blocked: 'BLOCKED', done: 'DONE' }
  const actColor: Record<string, string> = { green: C.green, cyan: C.cyan, purple: C.purple, pink: C.pink, yellow: C.orange }

  if (!authed) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, color: C.tm, fontSize: 12, letterSpacing: '0.1em' }}>
      AUTHENTICATING...
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: mono, color: C.tb, fontSize: 11 }}>

      {/* TOPBAR */}
      <div style={{ background: C.bg2, borderBottom: `1px solid ${C.borderCyan}`, padding: '9px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }} />
        <div style={{ fontFamily: orb, fontSize: 12, fontWeight: 700, color: C.cyan, letterSpacing: '0.15em', textShadow: `0 0 10px rgba(0,245,255,0.6)` }}>
          TRENT<span style={{ color: C.green, textShadow: `0 0 10px rgba(57,255,20,0.6)` }}> //</span> COMMAND CENTER
        </div>
        <div style={{ fontSize: 9, color: C.td, letterSpacing: '0.1em' }}>
          SYS:ONLINE · GABRIEL:ACTIVE · {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} · {time}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 9, color: C.td }}>UPTIME <span style={{ color: C.green }}>99.8%</span></span>
          <span style={{ fontSize: 9, color: C.td }}>ALERTS <span style={{ color: alertCount > 0 ? C.pink : C.green }}>{alertCount}</span></span>
          <button
            onMouseDown={startVoice}
            onMouseUp={stopVoice}
            onTouchStart={startVoice}
            onTouchEnd={stopVoice}
            style={{ background: 'transparent', border: `1px solid ${C.pink}`, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: listening ? `0 0 12px ${C.pink}` : `0 0 6px rgba(255,45,120,0.3)`, transition: 'box-shadow 0.2s' }}
            title="Hold to speak"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.pink} strokeWidth={2} strokeLinecap="round">
              <rect x={9} y={2} width={6} height={12} rx={3} />
              <path d="M5 10a7 7 0 0014 0" />
              <line x1={12} y1={19} x2={12} y2={22} />
              <line x1={9} y1={22} x2={15} y2={22} />
            </svg>
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', minHeight: 'calc(100vh - 47px)' }}>

        {/* MAIN */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12, borderRight: `1px solid ${C.borderCyan}` }}>

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Projects online', val: `${onlineCount}/5`, color: C.cyan, data: [4,4,5,4,5,4,5,5,4,onlineCount] },
              { label: 'Open tasks', val: openTasks, color: C.yellow, data: [5,6,7,8,9,8,9,8,8,openTasks] },
              { label: 'Active alerts', val: alertCount, color: alertCount > 0 ? C.pink : C.green, data: [0,0,1,0,0,0,0,1,0,alertCount] },
              { label: 'Last deploy', val: '2h', color: C.purple, data: [6,4,3,5,2,3,4,2,3,2] },
            ].map(s => (
              <div key={s.label} style={{ background: C.bg3, border: `1px solid ${C.borderCyan}`, padding: '8px 10px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.cyan}, transparent)` }} />
                <div style={{ fontSize: 8, color: C.td, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontFamily: orb, fontSize: 22, fontWeight: 700, color: s.color, textShadow: `0 0 10px ${s.color}80` }}>{s.val}</div>
                <Sparkline data={s.data as number[]} color={s.color} />
              </div>
            ))}
          </div>

          {/* PROJECT DIALS */}
          <div>
            <div style={{ fontFamily: orb, fontSize: 8, color: C.cyan, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              PROJECT NODES
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.borderCyan}, transparent)` }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {PROJECTS.map(p => (
                <Dial key={p.id} project={p} health={health[p.id] || (p.id === 'trent' ? 'ok' : '')} selected={selected === p.id} onClick={() => setSelected(p.id)} />
              ))}
            </div>
          </div>

          {/* SELECTED PROJECT DETAIL */}
          <div style={{ background: C.bg3, border: `1px solid ${C.borderCyan}`, padding: '10px 12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${selectedProject.color}, transparent)` }} />
            <div style={{ fontFamily: orb, fontSize: 8, color: C.cyan, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              SELECTED NODE · {selectedProject.name}
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.borderCyan}, transparent)` }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { k: 'Health', v: health[selectedProject.id] === 'ok' ? '200 OK' : selectedProject.id === 'trent' ? 'ONLINE' : 'CHECKING', vc: health[selectedProject.id] === 'ok' || selectedProject.id === 'trent' ? C.green : C.td },
                { k: 'Last deploy', v: selectedProject.deploy, vc: C.tb },
                { k: selectedProject.activityLabel, v: selectedProject.activity, vc: C.tb },
                { k: 'Open tasks', v: tasks.filter(t => t.project === selectedProject.id.toUpperCase() && t.status !== 'done').length.toString(), vc: C.tb },
              ].map(item => (
                <div key={item.k} style={{ background: C.bg4, padding: '6px 8px' }}>
                  <div style={{ fontSize: 8, color: C.td, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{item.k}</div>
                  <div style={{ fontSize: 11, color: item.vc }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TASK TABLE */}
          <div style={{ background: C.bg3, border: `1px solid ${C.borderCyan}`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.cyan}, transparent)` }} />
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.borderCyan}`, fontFamily: orb, fontSize: 8, color: C.cyan, letterSpacing: '0.2em', textTransform: 'uppercase' }}>AGENT TASK QUEUE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  {['ID', 'Task', 'Project', 'Status', 'Progress', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 8, color: C.td, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid rgba(0,245,255,0.06)`, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < tasks.length - 1 ? `1px solid rgba(0,245,255,0.04)` : 'none' }}>
                    <td style={{ padding: '6px 12px', color: C.td }}>T-00{t.id}</td>
                    <td style={{ padding: '6px 12px', color: t.status === 'done' ? C.td : C.tb, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</td>
                    <td style={{ padding: '6px 12px', color: C.tm }}>{t.project}</td>
                    <td style={{ padding: '6px 12px' }}>
                      <span style={{ fontSize: 8, padding: '2px 6px', border: `1px solid ${statusColor[t.status]}40`, color: statusColor[t.status], letterSpacing: '0.06em' }}>{statusLabel[t.status]}</span>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ height: 4, width: 80, background: 'rgba(0,245,255,0.06)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${t.progress}%`, background: statusColor[t.status], boxShadow: `0 0 4px ${statusColor[t.status]}` }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      {t.status !== 'done' && (
                        <button
                          onClick={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: 'done', progress: 100 } : x))}
                          style={{ fontSize: 8, padding: '2px 6px', border: `1px solid ${C.borderCyan}`, background: 'transparent', color: C.td, cursor: 'pointer', letterSpacing: '0.06em', fontFamily: mono }}
                        >CLOSE</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GABRIEL RESPONSE */}
          {response && (
            <div style={{ background: C.bg3, border: `1px solid ${C.borderGreen}`, padding: '10px 12px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
              <div style={{ fontSize: 8, color: C.green, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>⬡ GABRIEL</div>
              <div style={{ fontSize: 11, color: C.tb, lineHeight: 1.6 }}>{response}</div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, background: C.bg2 }}>

          {/* VOICE PANEL */}
          <div style={{ background: C.bg3, border: `1px solid rgba(255,45,120,0.3)`, padding: 12, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.pink}, transparent)` }} />
            <div style={{ fontSize: 8, color: C.pink, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7, textShadow: `0 0 8px rgba(255,45,120,0.5)` }}>
              ⬡ VOICE INPUT · {listening ? 'LISTENING' : 'STANDBY'}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(255,45,120,0.2)`, padding: '7px 9px', fontFamily: mono, fontSize: 10, color: voiceText ? C.yellow : C.td, minHeight: 44, marginBottom: 7, lineHeight: 1.6 }}>
              {voiceText || (listening ? 'Listening...' : 'Hold mic to speak or type below')}
            </div>
            <textarea
              value={voiceText}
              onChange={e => setVoiceText(e.target.value)}
              placeholder="Or type here..."
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.borderCyan}`, padding: '6px 8px', fontFamily: mono, fontSize: 10, color: C.tb, marginBottom: 7, resize: 'none', minHeight: 40, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => setVoiceText('')} style={{ flex: 1, padding: 5, border: `1px solid ${C.borderCyan}`, background: 'transparent', fontFamily: mono, fontSize: 9, color: C.tm, cursor: 'pointer', letterSpacing: '0.08em' }}>CLEAR</button>
              <button onClick={sendToGabriel} disabled={sending || !voiceText.trim()} style={{ flex: 2, padding: 5, border: `1px solid rgba(57,255,20,0.5)`, background: 'transparent', fontFamily: mono, fontSize: 9, color: C.green, cursor: 'pointer', letterSpacing: '0.08em', boxShadow: '0 0 6px rgba(57,255,20,0.15)' }}>
                {sending ? 'SENDING...' : 'SEND ↗'}
              </button>
            </div>
          </div>

          {/* RECOMMENDATIONS */}
          <div style={{ background: C.bg3, border: `1px solid ${C.borderGreen}`, padding: 12, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
            <div style={{ fontFamily: orb, fontSize: 8, color: C.green, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
              AGENT INTEL <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.borderGreen}, transparent)` }} />
            </div>
            {INIT_RECS.map(r => (
              <div key={r.id} style={{ padding: '6px 0', borderBottom: `1px solid rgba(57,255,20,0.05)`, display: 'flex', gap: 7 }}>
                <div style={{ width: 2, flexShrink: 0, marginTop: 3, background: actColor[r.level] || C.cyan, boxShadow: `0 0 3px ${actColor[r.level] || C.cyan}` }} />
                <div>
                  <div style={{ fontSize: 9, color: C.tm, lineHeight: 1.5 }}>{r.text}</div>
                  <div style={{ fontSize: 8, color: C.td, marginTop: 2, letterSpacing: '0.05em' }}>{r.project}</div>
                </div>
              </div>
            ))}
          </div>

          {/* QUICK LAUNCH */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontFamily: orb, fontSize: 8, color: C.cyan, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              QUICK LAUNCH <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.borderCyan}, transparent)` }} />
            </div>
            {[
              { label: 'Start session', sub: `${selectedProject.name}`, icon: '⚡' },
              { label: 'Ping all', sub: 'health routes', icon: '◎' },
              { label: 'Security audit', sub: 'all projects', icon: '⬡' },
              { label: 'New project', sub: 'scaffold', icon: '+' },
            ].map(b => (
              <button key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: 'transparent', border: `1px solid ${C.borderCyan}`, cursor: 'pointer', textAlign: 'left', fontFamily: mono, transition: 'border-color 0.15s', width: '100%' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.45)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderCyan)}
                onClick={() => b.label === 'Ping all' ? fetch('/api/ping').then(r => r.json()).then(setHealth) : null}
              >
                <span style={{ color: C.cyan, fontSize: 12, flexShrink: 0 }}>{b.icon}</span>
                <div style={{ fontSize: 9, color: C.tm }}><span style={{ color: C.tb }}>{b.label}</span> — {b.sub}</div>
              </button>
            ))}
          </div>

          {/* ACTIVITY FEED */}
          <div style={{ background: C.bg3, border: `1px solid ${C.borderCyan}`, padding: 12, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.cyan}, transparent)` }} />
            <div style={{ fontFamily: orb, fontSize: 8, color: C.cyan, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              ACTIVITY <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.borderCyan}, transparent)` }} />
            </div>
            {INIT_ACTIVITY.map((a, i) => (
              <div key={i} style={{ padding: '5px 0', borderBottom: i < INIT_ACTIVITY.length - 1 ? `1px solid rgba(0,245,255,0.05)` : 'none', fontSize: 9, display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ color: C.td, flexShrink: 0 }}>{a.time}</span>
                <span style={{ color: actColor[a.level] || C.cyan, flexShrink: 0 }}>●</span>
                <span style={{ color: C.td }}>{a.project}</span>
                <span style={{ color: C.tm }}>{a.event}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
