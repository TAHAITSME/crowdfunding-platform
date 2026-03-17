import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPosts } from '../../features/posts/postsSlice'
import PostCard from './PostCard'
import CreatePostBox from './CreatePostBox'
import { PostSkeleton } from '../ui/Skeleton'

export default function Feed() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector(s => s.posts)

  useEffect(() => { dispatch(fetchPosts()) }, [dispatch])

  return (
    <div>
      <CreatePostBox />
      {loading
        ? Array(3).fill(0).map((_, i) => <PostSkeleton key={i} />)
        : items.map(post => <PostCard key={post.id} post={post} />)
      }
      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-sm">Aucun post pour l'instant. Sois le premier !</p>
        </div>
      )}
    </div>
  )
}
