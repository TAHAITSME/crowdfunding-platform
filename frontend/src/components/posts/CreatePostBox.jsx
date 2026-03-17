// src/components/posts/CreatePostBox.jsx
import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../../features/posts/postsSlice";
import Avatar from "../ui/Avatar";
import { Image, Smile, X } from "lucide-react";

export default function CreatePostBox() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("content", content);
    if (file) fd.append("media", file); // ✅ corrigé
    await dispatch(createPost(fd));
    setContent("");
    setFile(null);
    setPreview(null);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <div className="flex gap-3">
        <Avatar name={user?.username || "U"} size="md" />
        <div className="flex-1">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf sur le campus ? 🎓"
            className="w-full resize-none text-sm text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent"
          />
          {preview && (
            <div className="relative mt-2 inline-block">
              <img
                src={preview}
                alt=""
                className="max-h-48 rounded-xl object-cover"
              />
              <button
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition"
          >
            <Image className="w-4 h-4" /> Photo
          </button>
          <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition">
            <Smile className="w-4 h-4" /> Humeur
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !file)}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-1.5 rounded-xl transition"
        >
          {loading ? "..." : "Publier"}
        </button>
      </div>
    </div>
  );
}
