import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchComments, addComment } from '../../features/comments/commentsSlice'
import Avatar from '../ui/Avatar'
import { Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function CommentSection({ postId }) {
  const dispatch = useDispatch()
  const { user }     = useSelector(s => s.auth)
  const comments     = useSelector(s => s.comments.byPost[postId] || [])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { dispatch(fetchComments(postId)) }, [postId, dispatch])

  const handleSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)
    await dispatch(addComment({ postId, content: text }))
    setText('')
    setLoading(false)
  }

  return (
    <div className="border-t border-gray-100 mt-2 pt-3">
      {/* Liste des commentaires */}
      <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            Aucun commentaire — sois le premier ! 💬
          </p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-2">
            <Avatar name={c.author_username || 'U'} size="sm" />
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-semibold text-gray-800">{c.author_username}</p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr })}
                </p>
              </div>
              <p className="text-xs text-gray-600">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center">
        <Avatar name={user?.username || 'U'} size="sm" />
        <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Écrire un commentaire..."
            className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder-gray-400"
          />
          <button onClick={handleSubmit} disabled={loading || !text.trim()}
            className="text-green-500 hover:text-green-600 disabled:opacity-40 transition">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
