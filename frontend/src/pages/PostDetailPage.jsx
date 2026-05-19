import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileWarning, Loader2 } from "lucide-react";

import MainLayout from "../components/layouts/MainLayout";
import PostCard from "../components/posts/PostCard";
import api from "../services/api";

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setMissing(false);

    api.get(`/posts/${id}/`)
      .then((response) => {
        if (!active) return;
        setPost(response.data);
      })
      .catch((error) => {
        if (!active) return;
        setPost(null);
        setMissing(error?.response?.status === 404);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au fil
        </Link>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : missing || !post ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <FileWarning className="h-8 w-8" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Cette publication n&apos;est plus disponible.</h1>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Le post a peut-etre ete supprime, masque ou n&apos;est plus accessible.
            </p>
          </div>
        ) : (
          <PostCard post={post} />
        )}
      </div>
    </MainLayout>
  );
}
