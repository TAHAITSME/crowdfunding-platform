// src/pages/SavedPostsPage.jsx
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchSavedPosts } from "../features/posts/postsSlice"
import PostCard from "../components/posts/PostCard"
import MainLayout from "../components/layouts/MainLayout"
import { Bookmark, Grid3X3, List, RefreshCw } from "lucide-react"

const SHIMMER = `
  @keyframes shimmer {
    0%   { background-position: -600px 0 }
    100% { background-position:  600px 0 }
  }
  .sk {
    background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
`

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 rounded-full sk shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-32 h-3.5 sk rounded-full" />
          <div className="w-20 h-2.5  sk rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 sk rounded-full" />
        <div className="w-3/4  h-3 sk rounded-full" />
      </div>
      <div className="mt-3 w-full h-40 sk rounded-xl" />
    </div>
  )
}

export default function SavedPostsPage() {
  const dispatch = useDispatch()
  const { savedItems = [], loading, error } = useSelector((s) => s.posts)
  const [view,       setView]       = useState("list")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { dispatch(fetchSavedPosts()) }, [dispatch])

  const handleRefresh = async () => {
    setRefreshing(true)
    await dispatch(fetchSavedPosts())
    setRefreshing(false)
  }

  return (
    // ✅ fullWidth → désactive max-w-2xl dans MainLayout
    <MainLayout fullWidth>
      <style dangerouslySetInnerHTML={{ __html: SHIMMER }} />

      <div className="w-full min-h-full bg-slate-50 px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
              <Bookmark className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                Mes Favoris
              </h1>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {savedItems.length > 0 ? (
                  <>
                    <span className="text-emerald-600 font-bold">{savedItems.length}</span>
                    {' '}post{savedItems.length > 1 ? 's' : ''} sauvegardé{savedItems.length > 1 ? 's' : ''}
                  </>
                ) : 'Aucun favori pour le moment'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setView("list")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  view === "list"
                    ? "bg-white shadow text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  view === "grid"
                    ? "bg-white shadow text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-2xl px-4 py-3 mb-5 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* ── Skeletons ── */}
        {loading && savedItems.length === 0 && (
          view === "list" ? (
            <div className="space-y-3">
              {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((i) => (
                <div key={i} className="aspect-square rounded-2xl sk" />
              ))}
            </div>
          )
        )}

        {/* ── État vide ── */}
        {!loading && savedItems.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-24 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
              <Bookmark className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[14px] font-bold text-slate-700">Aucun favori</p>
            <p className="text-[12px] text-slate-400 text-center max-w-xs leading-relaxed">
              Sauvegardez des posts en cliquant sur l'icône 🔖 pour les retrouver ici
            </p>
          </div>
        )}

        {/* ── Vue liste ── */}
        {savedItems.length > 0 && view === "list" && (
          <div className="space-y-3">
            {savedItems.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* ── Vue grille ── */}
        {savedItems.length > 0 && view === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {savedItems.map((post) => (
              <div
                key={post.id}
                className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
              >
                {post.media ? (
                  <img
                    src={post.media} alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 bg-white">
                    <p className="text-[11px] text-slate-500 text-center line-clamp-4 font-medium leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-white fill-white drop-shadow" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </MainLayout>
  )
}