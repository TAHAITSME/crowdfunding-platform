import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPosts } from '../../features/posts/postsSlice'
import PostCard from './PostCard'
import CreatePostBox from './CreatePostBox'
import { PostSkeleton } from '../ui/Skeleton'

export default function Feed() {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector((s) => s.posts)
  const [hashtagFilter, setHashtagFilter] = useState('')
  const posts = Array.isArray(items) ? items : []
  const visiblePosts = useMemo(() => {
    if (!hashtagFilter) return posts
    return posts.filter((post) => {
      const target = post.original_post_data || post
      return `${post.content || ''} ${target.content || ''}`.toLowerCase().includes(hashtagFilter)
    })
  }, [hashtagFilter, posts])

  useEffect(() => {
    dispatch(fetchPosts())
  }, [dispatch])

  useEffect(() => {
    const handleFilter = (event) => setHashtagFilter(event.detail || '')
    window.addEventListener('posts:filter-hashtag', handleFilter)
    return () => window.removeEventListener('posts:filter-hashtag', handleFilter)
  }, [])

  return (
    <div className="w-full max-w-[760px] min-w-0">
      <CreatePostBox />

      {hashtagFilter && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <span className="text-sm font-bold text-emerald-800">Filtre actif : {hashtagFilter}</span>
          <button
            type="button"
            onClick={() => setHashtagFilter('')}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
          >
            Effacer
          </button>
        </div>
      )}

      {error && !loading && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Impossible de charger le fil pour le moment.
        </div>
      )}

      {loading
        ? Array(3).fill(0).map((_, i) => <PostSkeleton key={i} />)
        : visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}

      {!loading && visiblePosts.length === 0 && (
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center text-slate-500 shadow-sm">
          <p className="text-lg font-black text-slate-900">
            {hashtagFilter ? 'Aucune publication pour ce hashtag' : 'Aucune publication'}
          </p>
          <p className="mt-2 text-sm leading-6">
            {hashtagFilter ? 'Essayez un autre hashtag ou effacez le filtre.' : 'Le fil est vide pour le moment. Les prochaines publications apparaitront ici.'}
          </p>
        </div>
      )}
    </div>
  )
}
