import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart, MessageCircle, Share2, Bookmark,
  MoreHorizontal, Flag, Link2, Trash2, UserMinus, Copy, Check,
  ExternalLink
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleLike, toggleSavePost, deletePost } from "../../features/posts/postsSlice";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import CommentSection from "../comments/CommentSection";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────
   GLOBAL STYLES  (inject once via a <style> tag
   or paste into your global CSS file)
───────────────────────────────────────────── */
const CARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --c-bg:        #ffffff;
    --c-surface:   #f7f8fa;
    --c-border:    rgba(0,0,0,.06);
    --c-text:      #0d0f12;
    --c-muted:     #8a929e;
    --c-accent:    #16a34a;
    --c-accent-lt: #dcfce7;
    --c-red:       #ef4444;
    --c-red-lt:    #fef2f2;
    --c-gold:      #f59e0b;
    --c-gold-lt:   #fffbeb;
    --radius-card: 20px;
    --radius-btn:  12px;
    --shadow-card: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.06);
    --shadow-menu: 0 8px 30px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06);
    --font-main:   'Sora', sans-serif;
    --font-mono:   'JetBrains Mono', monospace;
    --transition:  .18s cubic-bezier(.4,0,.2,1);
  }

  /* ── Card ── */
  .pc-card {
    font-family: var(--font-main);
    background: var(--c-bg);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    border: 1px solid var(--c-border);
    margin-bottom: 16px;
    overflow: hidden;
    transition: box-shadow var(--transition), transform var(--transition);
  }
  .pc-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,.06), 0 8px 32px rgba(0,0,0,.10);
    transform: translateY(-1px);
  }

  /* ── Header ── */
  .pc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 12px;
  }
  .pc-author-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }

  /* ── Avatar ── */
  .pc-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .pc-avatar {
    width: 42px; height: 42px;
    border-radius: 14px;
    overflow: hidden;
    background: var(--c-accent-lt);
    display: flex; align-items: center; justify-content: center;
    border: 2px solid transparent;
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  .pc-author-link:hover .pc-avatar {
    border-color: var(--c-accent);
    box-shadow: 0 0 0 3px rgba(22,163,74,.12);
  }
  .pc-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pc-avatar-init {
    font-size: 15px; font-weight: 700;
    color: var(--c-accent); letter-spacing: -.5px;
  }
  .pc-online {
    position: absolute; bottom: -2px; right: -2px;
    width: 11px; height: 11px;
    background: #22c55e;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px rgba(34,197,94,.25);
  }

  /* ── Author info ── */
  .pc-author-name {
    font-size: 14px; font-weight: 600;
    color: var(--c-text); line-height: 1.3;
    transition: color var(--transition);
  }
  .pc-author-link:hover .pc-author-name { color: var(--c-accent); }
  .pc-badge {
    display: inline-flex; align-items: center;
    font-size: 9px; font-weight: 700; letter-spacing: .4px;
    text-transform: uppercase;
    background: var(--c-accent-lt);
    color: var(--c-accent);
    padding: 2px 7px;
    border-radius: 20px;
    margin-left: 6px;
  }
  .pc-author-meta {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--c-muted);
    line-height: 1.4; margin-top: 1px;
  }

  /* ── Menu ── */
  .pc-menu-wrap { position: relative; }
  .pc-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px;
    border-radius: 10px;
    border: none; background: transparent; cursor: pointer;
    color: var(--c-muted);
    transition: background var(--transition), color var(--transition);
  }
  .pc-icon-btn:hover { background: var(--c-surface); color: var(--c-text); }

  .pc-dropdown {
    position: absolute; right: 0; top: calc(100% + 6px);
    width: 200px;
    background: var(--c-bg);
    border-radius: 16px;
    box-shadow: var(--shadow-menu);
    border: 1px solid var(--c-border);
    z-index: 100; overflow: hidden;
    padding: 6px;
    animation: pc-pop .14s cubic-bezier(.34,1.56,.64,1);
  }
  .pc-dropdown-bottom {
    bottom: calc(100% + 8px); top: auto;
  }
  @keyframes pc-pop {
    from { opacity: 0; transform: scale(.94) translateY(-4px); }
    to   { opacity: 1; transform: scale(1)  translateY(0); }
  }

  .pc-menu-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 10px 12px;
    border-radius: 10px; border: none; background: transparent;
    font-family: var(--font-main); font-size: 13px; font-weight: 500;
    color: var(--c-text); cursor: pointer; text-decoration: none;
    transition: background var(--transition);
  }
  .pc-menu-item:hover { background: var(--c-surface); }
  .pc-menu-item--danger { color: var(--c-red); }
  .pc-menu-item--danger:hover { background: var(--c-red-lt); }
  .pc-menu-item svg { flex-shrink: 0; }

  .pc-divider {
    height: 1px; background: var(--c-border);
    margin: 4px 0;
  }

  /* ── Content ── */
  .pc-content {
    padding: 0 18px 14px;
    font-size: 14px; line-height: 1.7;
    color: var(--c-text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ── Media ── */
  .pc-media {
    width: 100%; display: block;
    object-fit: cover; max-height: 400px;
    background: var(--c-surface);
  }

  /* ── Actions ── */
  .pc-actions {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    border-top: 1px solid var(--c-border);
  }
  .pc-actions-left { display: flex; align-items: center; gap: 2px; }

  .pc-action-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px;
    border-radius: var(--radius-btn);
    border: none; background: transparent; cursor: pointer;
    font-family: var(--font-main); font-size: 13px; font-weight: 600;
    color: var(--c-muted);
    transition: all var(--transition);
  }
  .pc-action-btn:hover { background: var(--c-surface); color: var(--c-text); }
  .pc-action-btn--liked {
    color: var(--c-red); background: var(--c-red-lt);
  }
  .pc-action-btn--liked:hover { background: #fecaca; }
  .pc-action-btn--comment-active {
    color: var(--c-accent); background: var(--c-accent-lt);
  }
  .pc-action-btn svg { transition: transform var(--transition); }
  .pc-action-btn:hover svg { transform: scale(1.12); }
  .pc-action-btn--liked svg { transform: scale(1.05); }

  /* Like bounce */
  @keyframes pc-heartbeat {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.3); }
    60%  { transform: scale(.95); }
    100% { transform: scale(1); }
  }
  .pc-action-btn--liked svg { animation: pc-heartbeat .35s ease; }

  /* Save btn */
  .pc-save-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px;
    border-radius: 10px; border: none; background: transparent;
    cursor: pointer;
    color: var(--c-muted);
    transition: all var(--transition);
  }
  .pc-save-btn:hover { background: var(--c-surface); color: var(--c-text); }
  .pc-save-btn--saved { color: var(--c-gold); background: var(--c-gold-lt); }
  .pc-save-btn--saved:hover { background: #fde68a; }

  /* ── Comments wrapper ── */
  .pc-comments { border-top: 1px solid var(--c-border); }
`;

/* inject styles once */
if (typeof document !== "undefined" && !document.getElementById("pc-styles")) {
  const tag = document.createElement("style");
  tag.id = "pc-styles";
  tag.textContent = CARD_STYLES;
  document.head.appendChild(tag);
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [shareOpen, setShareOpen]       = useState(false);
  const [copied, setCopied]             = useState(false);

  const menuRef  = useRef(null);
  const shareRef = useRef(null);

  const isOwner = user?.id === post.author?.id;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true, locale: fr,
  });

  const mediaUrl = post.media
    ? post.media.startsWith("http") ? post.media : `http://localhost:8000${post.media}`
    : null;

  const postUrl = `${window.location.origin}/posts/${post.id}`;

  const avatarSrc = post.author?.avatar
    ? post.author.avatar.startsWith("http")
      ? post.author.avatar
      : `http://localhost:8000${post.author.avatar}`
    : null;

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current  && !menuRef.current.contains(e.target))  setMenuOpen(false);
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* handlers */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
    setShareOpen(false);
  };

  const handleDelete = () => {
    if (confirm("Supprimer ce post ?")) {
      dispatch(deletePost(post.id));
      toast.success("Post supprimé");
    }
    setMenuOpen(false);
  };

  const handleReport = () => {
    toast.success("Post signalé, merci !");
    setMenuOpen(false);
  };

  /* ── RENDER ── */
  return (
    <div className="pc-card">

      {/* ── HEADER ── */}
      <div className="pc-header">
        <Link to={`/profile/${post.author?.id}`} className="pc-author-link">
          {/* Avatar */}
          <div className="pc-avatar-wrap">
            <div className="pc-avatar">
              {avatarSrc
                ? <img src={avatarSrc} alt={post.author?.username} />
                : <span className="pc-avatar-init">
                    {post.author?.username?.[0]?.toUpperCase()}
                  </span>
              }
            </div>
            <span className="pc-online" />
          </div>

          {/* Name / meta */}
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="pc-author-name">
                {post.author?.full_name || post.author?.username}
              </span>
              {post.author?.role === "association" && (
                <span className="pc-badge">Association</span>
              )}
            </div>
            <div className="pc-author-meta">
              @{post.author?.username} · {timeAgo}
            </div>
          </div>
        </Link>

        {/* ── 3-dot menu ── */}
        <div ref={menuRef} className="pc-menu-wrap">
          <button className="pc-icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div className="pc-dropdown">
              {isOwner ? (
                <button className="pc-menu-item pc-menu-item--danger" onClick={handleDelete}>
                  <Trash2 size={14} /> Supprimer le post
                </button>
              ) : (
                <>
                  <button className="pc-menu-item" onClick={handleReport}>
                    <Flag size={14} style={{ color: "#f97316" }} /> Signaler
                  </button>
                  <button className="pc-menu-item" onClick={() => setMenuOpen(false)}>
                    <UserMinus size={14} style={{ color: "#94a3b8" }} /> Ne plus suivre
                  </button>
                  <div className="pc-divider" />
                  <button className="pc-menu-item" onClick={handleCopyLink}>
                    <Link2 size={14} style={{ color: "#94a3b8" }} /> Copier le lien
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      {post.content && (
        <p className="pc-content">{post.content}</p>
      )}

      {/* ── MEDIA ── */}
      {mediaUrl && (
        <img
          src={mediaUrl}
          alt="Post media"
          className="pc-media"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}

      {/* ── ACTIONS ── */}
      <div className="pc-actions">
        <div className="pc-actions-left">

          {/* Like */}
          <button
            className={`pc-action-btn ${post.is_liked ? "pc-action-btn--liked" : ""}`}
            onClick={() => dispatch(toggleLike(post.id))}
          >
            <Heart size={15} style={post.is_liked ? { fill: "currentColor" } : {}} />
            {post.likes_count || 0}
          </button>

          {/* Comments */}
          <button
            className={`pc-action-btn ${showComments ? "pc-action-btn--comment-active" : ""}`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={15} />
            {post.comments_count || 0}
          </button>

          {/* Share */}
          <div ref={shareRef} style={{ position: "relative" }}>
            <button
              className="pc-action-btn"
              onClick={() => setShareOpen(!shareOpen)}
            >
              <Share2 size={15} />
              Partager
            </button>

            {shareOpen && (
              <div className="pc-dropdown pc-dropdown-bottom">
                <button className="pc-menu-item" onClick={handleCopyLink}>
                  {copied
                    ? <Check size={14} style={{ color: "var(--c-accent)" }} />
                    : <Copy size={14} style={{ color: "#94a3b8" }} />
                  }
                  {copied ? "Lien copié !" : "Copier le lien"}
                </button>
                <div className="pc-divider" />
                <a
                  className="pc-menu-item"
                  href={`https://wa.me/?text=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noreferrer"
                  onClick={() => setShareOpen(false)}
                >
                  <span style={{ fontSize: 14 }}>💬</span> WhatsApp
                </a>
                <a
                  className="pc-menu-item"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noreferrer"
                  onClick={() => setShareOpen(false)}
                >
                  <span style={{ fontSize: 14 }}>📘</span> Facebook
                </a>
                <a
                  className="pc-menu-item"
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noreferrer"
                  onClick={() => setShareOpen(false)}
                >
                  <span style={{ fontSize: 14 }}>🐦</span> Twitter / X
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <button
          className={`pc-save-btn ${post.is_saved ? "pc-save-btn--saved" : ""}`}
          onClick={() => dispatch(toggleSavePost(post.id))}
        >
          <Bookmark size={16} style={post.is_saved ? { fill: "currentColor" } : {}} />
        </button>
      </div>

      {/* ── COMMENTS ── */}
      {showComments && (
        <div className="pc-comments">
          <CommentSection postId={post.id} />
        </div>
      )}
    </div>
  );
}