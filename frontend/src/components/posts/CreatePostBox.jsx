import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  FileText,
  Image,
  Loader2,
  MapPin,
  Navigation,
  Paperclip,
  Search,
  Smile,
  VideoIcon,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { createPost } from "../../features/posts/postsSlice";
import Avatar from "../ui/Avatar";

const DEFAULT_LOCATION = {
  name: "Casablanca, Maroc",
  lat: 33.5731,
  lng: -7.5898,
};

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HASHTAG_PATTERN = /#[\p{L}\p{N}_-]+/gu;

function buildImagePreview(file) {
  const uuid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${uuid}`,
    file,
    url: URL.createObjectURL(file),
  };
}

function extractHashtags(value) {
  return Array.from(new Set((value.match(HASHTAG_PATTERN) || []).map((tag) => tag.toLowerCase())));
}

function HighlightedText({ value }) {
  const parts = value.split(HASHTAG_PATTERN);
  const tags = value.match(HASHTAG_PATTERN) || [];

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {tags[index] ? (
            <span className="rounded-md bg-emerald-50 px-0.5 font-extrabold text-emerald-600 shadow-[inset_0_-0.45em_0_rgba(16,185,129,0.13)]">
              {tags[index]}
            </span>
          ) : null}
        </span>
      ))}
    </>
  );
}

export default function CreatePostBox() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { data: profile } = useSelector((state) => state.profile);

  const [content, setContent] = useState("");
  const [singleMediaFile, setSingleMediaFile] = useState(null);
  const [singlePreview, setSinglePreview] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [pickerConfig, setPickerConfig] = useState({ accept: "image/*", multiple: false, mode: "single" });
  const [loading, setLoading] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const mediaRef = useRef(null);
  const emojiRef = useRef(null);
  const locationRef = useRef(null);
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const singlePreviewRef = useRef(null);
  const imagePreviewsRef = useRef([]);

  useEffect(() => {
    singlePreviewRef.current = singlePreview;
  }, [singlePreview]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      if (singlePreviewRef.current) URL.revokeObjectURL(singlePreviewRef.current);
      imagePreviewsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) setShowEmoji(false);
      if (locationRef.current && !locationRef.current.contains(event.target)) setShowLocation(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openMediaPicker = (config) => {
    setPickerConfig(config);
    window.setTimeout(() => mediaRef.current?.click(), 0);
  };

  const clearSingleMedia = () => {
    if (singlePreview) URL.revokeObjectURL(singlePreview);
    setSingleMediaFile(null);
    setSinglePreview(null);
  };

  const clearImages = () => {
    imagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    setImagePreviews([]);
  };

  const addImagesFromFiles = (files) => {
    const nextImages = [];

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name || "Image"} n'est pas un format image accepte.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name || "Image"} depasse la taille maximale.`);
        continue;
      }
      nextImages.push(buildImagePreview(file));
    }

    if (!nextImages.length) return;

    clearSingleMedia();
    setImagePreviews((current) => {
      const merged = [...current, ...nextImages].slice(0, MAX_IMAGES);
      if (current.length + nextImages.length > MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images par publication.`);
      }
      return merged;
    });
  };

  const handleMedia = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (pickerConfig.mode === "images") {
      addImagesFromFiles(files);
    } else {
      const file = files[0];
      clearImages();
      clearSingleMedia();
      setSingleMediaFile(file);
      setSinglePreview(URL.createObjectURL(file));
    }

    event.target.value = "";
  };

  const handlePaste = (event) => {
    const files = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (!files.length) return;
    event.preventDefault();
    addImagesFromFiles(files);
    toast.success("Image collee dans la publication");
  };

  const syncHighlightScroll = (event) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
  };

  const removeImage = (id) => {
    const target = imagePreviews.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setImagePreviews((current) => current.filter((item) => item.id !== id));
  };

  const searchLocation = async () => {
    const query = locationQuery.trim();
    if (query.length < 2) return;

    setLocationLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setLocationResults(
        data.map((item) => ({
          name: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
        }))
      );
    } catch {
      setLocationResults([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation(DEFAULT_LOCATION);
      setShowLocation(false);
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          name: "Position actuelle",
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setShowLocation(false);
        setLocationLoading(false);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setShowLocation(false);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !singleMediaFile && imagePreviews.length === 0 && !location) return;

    setLoading(true);
    const hashtags = extractHashtags(content);
    const formData = new FormData();
    formData.append("content", content);
    if (singleMediaFile) formData.append("media", singleMediaFile);
    imagePreviews.forEach((item) => formData.append("media_files", item.file));
    if (location) {
      formData.append("location_name", location.name);
      formData.append("location_lat", String(location.lat));
      formData.append("location_lng", String(location.lng));
    }

    try {
      const createdPost = await dispatch(createPost(formData)).unwrap();
      if (createdPost?.id && hashtags.length) {
        const stored = JSON.parse(localStorage.getItem("ydifydek_post_hashtags") || "{}");
        localStorage.setItem("ydifydek_post_hashtags", JSON.stringify({
          ...stored,
          [createdPost.id]: hashtags,
        }));
      }
      setContent("");
      clearSingleMedia();
      clearImages();
      setLocation(null);
      setLocationQuery("");
      setLocationResults([]);
      setShowEmoji(false);
      setShowLocation(false);
      toast.success("Publication creee");
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = profile?.avatar || user?.profile?.avatar || null;
  const canPublish = content.trim() || singleMediaFile || imagePreviews.length > 0 || location;
  const hashtags = extractHashtags(content);

  return (
    <div className="mb-5 overflow-visible rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex gap-3">
        <Avatar name={user?.username || "U"} src={avatarSrc} size="md" />

        <div className="min-w-0 flex-1">
          {location && (
            <div className="mb-3 inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location.name}</span>
              <button type="button" onClick={() => setLocation(null)} className="shrink-0 text-blue-500 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="relative">
            <div
              ref={highlightRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 min-h-16 overflow-hidden whitespace-pre-wrap break-words rounded-[24px] px-5 py-4 text-[15px] leading-7 text-gray-700"
            >
              {content ? <HighlightedText value={content} /> : null}
            </div>
            <textarea
              ref={textareaRef}
              rows={content || singlePreview || imagePreviews.length > 0 || location ? 4 : 2}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onPaste={handlePaste}
              onScroll={syncHighlightScroll}
              placeholder="Partagez une actualite, une idee ou une action de solidarite..."
              className="relative min-h-16 w-full resize-none rounded-[24px] bg-gray-50 px-5 py-4 text-[15px] leading-7 text-transparent caret-emerald-700 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              spellCheck="true"
            />
          </div>

          {hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {imagePreviews.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  <img src={item.url} alt="Apercu" className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {singlePreview && singleMediaFile?.type.startsWith("image/") && (
            <div className="relative mt-4 inline-block max-w-full">
              <img src={singlePreview} alt="Apercu" className="max-h-64 rounded-2xl border border-gray-100 object-cover" />
              <RemovePreview onClick={clearSingleMedia} />
            </div>
          )}

          {singlePreview && singleMediaFile?.type.startsWith("video/") && (
            <div className="relative mt-4 max-w-2xl">
              <video src={singlePreview} controls className="max-h-80 w-full rounded-2xl border border-gray-100 bg-black" />
              <RemovePreview onClick={clearSingleMedia} />
            </div>
          )}

          {singleMediaFile && !singleMediaFile.type.startsWith("image/") && !singleMediaFile.type.startsWith("video/") && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="max-w-xs truncate text-xs font-medium text-gray-600">{singleMediaFile.name}</span>
              <button type="button" onClick={clearSingleMedia} className="ml-auto text-gray-400 transition hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {location && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100">
              <iframe
                title="Carte du lieu"
                className="h-44 w-full"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01}%2C${location.lat - 0.01}%2C${location.lng + 0.01}%2C${location.lat + 0.01}&layer=mapnik&marker=${location.lat}%2C${location.lng}`}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="relative flex flex-wrap gap-1">
          <ToolBtn icon={<Image className="h-4 w-4" />} label="Photos" color="green" onClick={() => openMediaPicker({
            accept: ".jpg,.jpeg,.png,.webp",
            multiple: true,
            mode: "images",
          })} />
          <ToolBtn icon={<VideoIcon className="h-4 w-4" />} label="Video" color="purple" onClick={() => openMediaPicker({
            accept: "video/*",
            multiple: false,
            mode: "single",
          })} />
          <ToolBtn icon={<Paperclip className="h-4 w-4" />} label="Fichier" color="orange" onClick={() => openMediaPicker({
            accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt",
            multiple: false,
            mode: "single",
          })} />

          <div className="relative" ref={locationRef}>
            <ToolBtn
              icon={<MapPin className="h-4 w-4" />}
              label="Lieu"
              color="blue"
              onClick={() => {
                setShowLocation((value) => !value);
                setShowEmoji(false);
              }}
            />

            {showLocation && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") searchLocation();
                      }}
                      placeholder="Chercher un lieu reel..."
                      className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                  <button type="button" onClick={searchLocation} className="rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700">
                    OK
                  </button>
                </div>

                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <Navigation className="h-4 w-4" />
                  Utiliser ma position actuelle
                </button>

                <div className="mt-2 max-h-52 overflow-y-auto">
                  {locationLoading && <p className="px-3 py-2 text-sm text-gray-400">Recherche...</p>}
                  {!locationLoading && locationResults.map((item) => (
                    <button
                      key={`${item.lat}-${item.lng}-${item.name}`}
                      type="button"
                      onClick={() => {
                        setLocation(item);
                        setShowLocation(false);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="line-clamp-2">{item.name}</span>
                    </button>
                  ))}
                  {!locationLoading && !locationResults.length && (
                    <p className="px-3 py-2 text-xs text-gray-400">Tapez un lieu puis cliquez OK.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={emojiRef}>
            <ToolBtn
              icon={<Smile className="h-4 w-4" />}
              label="Emoji"
              color="pink"
              onClick={() => {
                setShowEmoji((value) => !value);
                setShowLocation(false);
              }}
            />
            {showEmoji && (
              <div className="absolute bottom-full left-0 z-[9999] mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  height={380}
                  width={300}
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Chercher un emoji..."
                />
              </div>
            )}
          </div>

          <input
            ref={mediaRef}
            type="file"
            accept={pickerConfig.accept}
            multiple={pickerConfig.multiple}
            className="hidden"
            onChange={handleMedia}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !canPublish}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publication...</> : "Publier"}
        </button>
      </div>
    </div>
  );
}

function RemovePreview({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
    >
      <X className="h-3 w-3" />
    </button>
  );
}

function ToolBtn({ icon, label, color, onClick }) {
  const colors = {
    green: "hover:bg-green-50 hover:text-green-600",
    purple: "hover:bg-violet-50 hover:text-violet-600",
    orange: "hover:bg-orange-50 hover:text-orange-500",
    blue: "hover:bg-blue-50 hover:text-blue-600",
    pink: "hover:bg-pink-50 hover:text-pink-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 transition ${colors[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
