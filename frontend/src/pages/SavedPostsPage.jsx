// src/pages/SavedPostsPage.jsx
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchSavedPosts } from "../features/posts/postsSlice"
import PostCard from "../components/posts/PostCard"
import MainLayout from "../components/layouts/MainLayout"
import { Bookmark, Grid3X3, List, RefreshCw } from "lucide-react"

// ── Skeleton card ──
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-32 h-3.5 bg-gray-200 rounded" />
          <div className="w-20 h-2.5 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 bg-gray-200 rounded" />
        <div className="w-3/4 h-3 bg-gray-100 rounded" />
      </div>
      <div className="mt-3 w-full h-40 bg-gray-100 rounded-xl" />
    </div>
  )
}

export default function SavedPostsPage() {
  const dispatch = useDispatch()
  const { savedItems = [], loading, error } = useSelector((s) => s.posts)
  const [view, setView]           = useState("list")   // "list" | "grid"
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    dispatch(fetchSavedPosts())
  }, [dispatch])

  const handleRefresh = async () => {
    setRefreshing(true)
    await dispatch(fetchSavedPosts())
    setRefreshing(false)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-md shadow-green-200">
                <Bookmark className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-none">Mes Favoris</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {savedItems.length > 0
                    ? <><span className="text-green-600 font-bold">{savedItems.length}</span> post{savedItems.length > 1 ? 's' : ''} sauvegardé{savedItems.length > 1 ? 's' : ''}</>
                    : 'Aucun favori pour le moment'
                  }
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Toggle vue */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setView("list")}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    view === "list" ? "bg-white shadow text-green-600" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    view === "grid" ? "bg-white shadow text-green-600" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-300 transition"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* ── Erreur ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && savedItems.length === 0 && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ── État vide ── */}
          {!loading && savedItems.length === 0 && !error && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <Bookmark className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-base font-bold text-gray-700">Aucun favori</p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                Sauvegardez des posts en cliquant sur l'icône 🔖 pour les retrouver ici
              </p>
            </div>
          )}

          {/* ── Liste ou grille ── */}
          {savedItems.length > 0 && (
            view === "list" ? (
              // Vue liste
              <div className="space-y-4">
                {savedItems.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              // Vue grille (images uniquement)
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {savedItems.map((post) => (
                  <div key={post.id}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group cursor-pointer shadow-sm"
                  >
                    {post.media ? (
                      <img
                        src={post.media}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 bg-white">
                        <p className="text-xs text-gray-500 text-center line-clamp-4 font-medium">
                          {post.content}
                        </p>
                      </div>
                    )}
                    {/* Overlay au hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </MainLayout>
  )
}
