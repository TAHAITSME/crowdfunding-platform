import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, MoreVertical, Phone, Video, Smile, Paperclip } from 'lucide-react'
import api from '../../services/api'

// ─── Helpers ────────────────────────────────────────────────
function getOtherParticipant(conv, currentUserId) {
  return conv.participants?.find(p => p.id !== currentUserId) || {}
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatMsgTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })
}

function groupMessagesByDate(messages) {
  const groups = {}
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
  })
  return groups
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-indigo-500', 'bg-sky-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
]

function Avatar({ name = '', size = 'sm' }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  const sz = size === 'xs' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center 
                     text-white font-semibold shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

// ─── Bubble ──────────────────────────────────────────────────
function MessageBubble({ msg, isMine, showAvatar, senderName }) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (only for received) */}
      {!isMine ? (
        showAvatar
          ? <Avatar name={senderName} size="xs" />
          : <div className="w-7 shrink-0" />
      ) : null}

      <div className={`max-w-[70%] group relative`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
          ${isMine
            ? 'bg-indigo-500 text-white rounded-br-md'
            : 'bg-white text-slate-700 rounded-bl-md border border-slate-100'}`}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 
                         transition-opacity ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-slate-400">
            {formatMsgTime(msg.created_at)}
          </span>
          {isMine && msg.is_read && (
            <span className="text-[10px] text-indigo-400">✓✓</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export default function ChatWindow({ conv, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const other = getOtherParticipant(conv, currentUserId)
  const otherName = `${other.first_name || ''} ${other.last_name || ''}`.trim()

  // Load messages
  useEffect(() => {
    setLoading(true)
    setMessages([])
    api.get(`/messaging/conversations/${conv.id}/messages/`)
      .then(r => setMessages(r.data))
      .finally(() => setLoading(false))
    inputRef.current?.focus()
  }, [conv.id])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    // Optimistic UI
    const optimistic = {
      id: Date.now(),
      content,
      sender: currentUserId,
      created_at: new Date().toISOString(),
      is_optimistic: true,
    }
    setMessages(prev => [...prev, optimistic])
    try {
      const r = await api.post(`/messaging/conversations/${conv.id}/messages/`, { content })
      setMessages(prev => prev.map(m => m.id === optimistic.id ? r.data : m))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(content) // restore
    } finally {
      setSending(false)
    }
  }, [text, sending, conv.id, currentUserId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const grouped = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 
                      border-b border-slate-100 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                             text-white font-semibold text-sm
                             ${AVATAR_COLORS[otherName.charCodeAt(0) % AVATAR_COLORS.length]}`}>
              {getInitials(otherName)}
            </div>
            {other.is_online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 
                               border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{otherName || 'Utilisateur'}</h2>
            <p className="text-xs text-emerald-500">
              {other.is_online ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[Phone, Video, MoreVertical].map((Icon, i) => (
            <button key={i}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center 
                         justify-center text-slate-500 transition">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 
                      bg-linear-to-b from-slate-50/50 to-white">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex items-end gap-2 animate-pulse 
                                      ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                <div className={`h-10 rounded-2xl bg-slate-200 
                                 ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
              </div>
            ))}
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium px-2 
                                  bg-white border border-slate-100 rounded-full py-0.5">
                  {date}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="space-y-1.5">
                {msgs.map((msg, idx) => {
                  const isMine = msg.sender === currentUserId || msg.sender?.id === currentUserId
                  const prevMsg = msgs[idx - 1]
                  const prevIsMine = prevMsg
                    ? (prevMsg.sender === currentUserId || prevMsg.sender?.id === currentUserId)
                    : null
                  const showAvatar = !isMine && prevIsMine !== false

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={isMine}
                      showAvatar={showAvatar}
                      senderName={otherName}
                    />
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-4 border-t border-slate-100 bg-white shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 rounded-2xl 
                        border border-slate-200 px-3 py-2 
                        focus-within:border-indigo-300 focus-within:bg-white 
                        focus-within:ring-2 focus-within:ring-indigo-100 transition">
          <button className="text-slate-400 hover:text-slate-600 transition p-1 mb-0.5">
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message…"
            className="flex-1 bg-transparent text-sm text-slate-700 
                       placeholder-slate-400 resize-none outline-none 
                       max-h-32 py-1 leading-relaxed"
          />

          <button className="text-slate-400 hover:text-slate-600 transition p-1 mb-0.5">
            <Smile className="w-4 h-4" />
          </button>

          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-9 h-9 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 
                       disabled:cursor-not-allowed rounded-xl flex items-center 
                       justify-center text-white transition active:scale-95 
                       shadow-md shadow-indigo-200 mb-0.5 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  )
}
