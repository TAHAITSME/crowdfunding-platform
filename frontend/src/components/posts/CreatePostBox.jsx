import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../../features/posts/postsSlice";
import Avatar from "../ui/Avatar";
import {
  Image, Smile, X, MapPin, Paperclip,
  VideoIcon, ChevronDown, Loader2
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const MOODS = [
  { emoji: "😊", label: "Heureux" },
  { emoji: "😎", label: "Cool" },
  { emoji: "🎓", label: "En cours" },
  { emoji: "💪", label: "Motivé" },
  { emoji: "😴", label: "Fatigué" },
  { emoji: "🎉", label: "En fête" },
  { emoji: "😤", label: "Stressé" },
  { emoji: "🤔", label: "Pensif" },
];

const LOCATIONS = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Autre"
];

export default function CreatePostBox() {
  const dispatch = useDispatch();
  const { user }          = useSelector((s) => s.auth);
  const { data: profile } = useSelector((s) => s.profile);

  const [content, setContent]       = useState("");
  const [preview, setPreview]       = useState(null);
  const [file, setFile]             = useState(null);
  const [loading, setLoading]       = useState(false);

  // Panels
  const [showEmoji, setShowEmoji]   = useState(false);
  const [showMood, setShowMood]     = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  // Extra data
  const [mood, setMood]             = useState(null);
  const [location, setLocation]     = useState(null);
  const [docFile, setDocFile]       = useState(null);

  const imageRef = useRef();
  const docRef   = useRef();
  const emojiRef = useRef();      // ✅ pour fermer en cliquant dehors

  // ✅ Ferme le picker si on clique en dehors
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDoc = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setDocFile(f);
  };

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file && !docFile) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("content", content);
    if (file)     fd.append("media", file);
    if (docFile)  fd.append("document", docFile);
    if (mood)     fd.append("mood", `${mood.emoji} ${mood.label}`);
    if (location) fd.append("location", location);
    await dispatch(createPost(fd));
    setContent(""); setFile(null); setPreview(null);
    setDocFile(null); setMood(null); setLocation(null);
    setLoading(false);
  };

  const avatarSrc = profile?.avatar || user?.profile?.avatar || null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-visible">

      {/* ── Header ── */}
      <div className="flex gap-3 p-4">
        <Avatar name={user?.username || "U"} src={avatarSrc} size="md" />
        <div className="flex-1">
          {/* Badges mood + location */}
          {(mood || location) && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {mood && (
                <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                  {mood.emoji} {mood.label}
                  <button onClick={() => setMood(null)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                  📍 {location}
                  <button onClick={() => setLocation(null)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf sur le campus ? 🎓"
            className="w-full resize-none text-sm text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent"
          />

          {/* Preview image */}
          {preview && (
            <div className="relative mt-2 inline-block">
              <img src={preview} alt="" className="max-h-48 rounded-xl object-cover border border-gray-100" />
              <button
                onClick={() => { setPreview(null); setFile(null); }}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Preview document */}
          {docFile && (
            <div className="flex items-center gap-2 mt-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600 truncate max-w-xs">{docFile.name}</span>
              <button onClick={() => setDocFile(null)} className="ml-auto text-gray-400 hover:text-red-500 transition">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Toolbar ── */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-gray-100 gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap relative">

          {/* 📷 Photo */}
          <ToolBtn icon={<Image className="w-4 h-4" />} label="Photo"
            color="green" onClick={() => imageRef.current.click()} />

          {/* 🎥 Vidéo */}
          <ToolBtn icon={<VideoIcon className="w-4 h-4" />} label="Vidéo"
            color="purple" onClick={() => {
              imageRef.current.accept = "video/*";
              imageRef.current.click();
              imageRef.current.accept = "image/*";
            }} />

          {/* 📎 Fichier */}
          <ToolBtn icon={<Paperclip className="w-4 h-4" />} label="Fichier"
            color="orange" onClick={() => docRef.current.click()} />

          {/* 📍 Localisation */}
          <div className="relative">
            <ToolBtn icon={<MapPin className="w-4 h-4" />} label="Lieu"
              color="blue" onClick={() => { setShowLocation((v) => !v); setShowMood(false); setShowEmoji(false); }} />
            {showLocation && (
              <div className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-44">
                {LOCATIONS.map((loc) => (
                  <button key={loc}
                    onClick={() => { setLocation(loc); setShowLocation(false); }}
                    className="w-full text-left text-sm px-3 py-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                  >
                    📍 {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 😊 Humeur */}
          <div className="relative">
            <ToolBtn icon={<Smile className="w-4 h-4" />} label="Humeur"
              color="yellow" onClick={() => { setShowMood((v) => !v); setShowEmoji(false); setShowLocation(false); }} />
            {showMood && (
              <div className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2 grid grid-cols-4 gap-1 w-52">
                {MOODS.map((m) => (
                  <button key={m.label}
                    onClick={() => { setMood(m); setShowMood(false); }}
                    className="flex flex-col items-center text-xs p-2 hover:bg-yellow-50 rounded-lg transition"
                    title={m.label}
                  >
                    <span className="text-lg">{m.emoji}</span>
                    <span className="text-gray-500">{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 🙂 Emoji Picker — ✅ position corrigée */}
          <div className="relative" ref={emojiRef}>
            <ToolBtn icon={<ChevronDown className="w-4 h-4" />} label="Emoji"
              color="pink" onClick={() => { setShowEmoji((v) => !v); setShowMood(false); setShowLocation(false); }} />
            {showEmoji && (
              <div className="absolute bottom-full mb-2 left-0 z-[9999]">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  height={380}
                  width={300}
                  searchPlaceholder="Chercher un emoji..."
                />
              </div>
            )}
          </div>

          {/* Inputs cachés */}
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <input ref={docRef}   type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" className="hidden" onChange={handleDoc} />
        </div>

        {/* Bouton Publier */}
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !file && !docFile)}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-1.5 rounded-xl transition flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Publication...</> : "Publier"}
        </button>
      </div>
    </div>
  );
}

// ── Composant bouton toolbar ──
function ToolBtn({ icon, label, color, onClick }) {
  const colors = {
    green:  "hover:text-green-600 hover:bg-green-50",
    purple: "hover:text-purple-600 hover:bg-purple-50",
    orange: "hover:text-orange-500 hover:bg-orange-50",
    blue:   "hover:text-blue-600 hover:bg-blue-50",
    yellow: "hover:text-yellow-500 hover:bg-yellow-50",
    pink:   "hover:text-pink-500 hover:bg-pink-50",
  };
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 text-xs text-gray-500 ${colors[color]} px-3 py-1.5 rounded-lg transition`}
    >
      {icon} {label}
    </button>
  );
}
