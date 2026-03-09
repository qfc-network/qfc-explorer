'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, authFetch } from '@/lib/auth-context';
import { useTranslation } from '@/components/LocaleProvider';
import type { ContractComment, ApiContractComments, ApiContractRating } from '@/lib/api-types';

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <svg
            className={`${sizeClass} ${
              star <= (hover || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-600 fill-slate-600'
            } transition-colors`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function displayName(comment: ContractComment): string {
  if (comment.display_name) return comment.display_name;
  const email = comment.email;
  const atIdx = email.indexOf('@');
  if (atIdx > 0) return email.slice(0, Math.min(atIdx, 8)) + '...';
  return 'User';
}

export default function ContractComments({ address }: { address: string }) {
  const { user, token } = useAuth();
  const { t } = useTranslation();

  const [comments, setComments] = useState<ContractComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);

  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const fetchComments = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/comments/${address}?page=${p}&limit=${limit}`
      );
      const data: ApiContractComments = await res.json();
      if (data.ok) {
        if (p === 1) {
          setComments(data.data.comments);
        } else {
          setComments((prev) => [...prev, ...data.data.comments]);
        }
        setTotal(data.data.total);
      }
    } catch {}
    setLoading(false);
  }, [address]);

  const fetchRating = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(
        `${getApiUrl()}/comments/${address}/rating`,
        { headers }
      );
      const data: ApiContractRating = await res.json();
      if (data.ok) {
        setAvgRating(data.data.average);
        setRatingCount(data.data.count);
        setUserRating(data.data.userRating);
      }
    } catch {}
  }, [address, token]);

  useEffect(() => {
    fetchComments(1);
    fetchRating();
  }, [fetchComments, fetchRating]);

  const handleSubmitComment = async () => {
    if (!token || !newComment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(token, `/comments/${address}`, {
        method: 'POST',
        body: JSON.stringify({ body: newComment.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setNewComment('');
        // Refresh from page 1
        setPage(1);
        await fetchComments(1);
      }
    } catch {
      setError('Failed to post comment.');
    }
    setSubmitting(false);
  };

  const handleUpdateComment = async (id: string) => {
    if (!token || !editBody.trim()) return;
    setError(null);
    try {
      const res = await authFetch(token, `/comments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: editBody.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setEditingId(null);
        setEditBody('');
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, body: editBody.trim(), updated_at: new Date().toISOString() } : c))
        );
      }
    } catch {
      setError('Failed to update comment.');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!token) return;
    setError(null);
    try {
      const res = await authFetch(token, `/comments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch {}
  };

  const handleFlagComment = async (id: string) => {
    if (!token) return;
    try {
      await authFetch(token, `/comments/${id}/flag`, { method: 'POST' });
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_flagged: true } : c))
      );
    } catch {}
  };

  const handleRate = async (rating: number) => {
    if (!token) return;
    try {
      const res = await authFetch(token, `/comments/${address}/rating`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserRating(rating);
        setAvgRating(data.data.average);
        setRatingCount(data.data.count);
      }
    } catch {}
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchComments(next);
  };

  const hasMore = comments.length < total;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t('comments.title')}
        </h2>
        {ratingCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avgRating ?? 0)} readonly size="sm" />
            <span className="text-sm text-slate-400">
              {avgRating?.toFixed(1)} ({ratingCount})
            </span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-5 space-y-5">
        {/* User's own rating */}
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{t('comments.yourRating')}:</span>
            <StarRating value={userRating ?? 0} onChange={handleRate} />
          </div>
        ) : null}

        {/* Add comment form */}
        {user ? (
          <div className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('comments.addPlaceholder')}
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {newComment.length}/2000
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-medium text-slate-900 dark:text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? t('comments.submitting') : t('comments.submit')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            {t('comments.signInPrompt')}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Comments list */}
        {loading && comments.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500">{t('comments.noComments')}</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-lg border p-3 ${
                  comment.is_flagged
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-slate-300 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {displayName(comment)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {timeAgo(comment.created_at)}
                    </span>
                    {comment.updated_at !== comment.created_at && (
                      <span className="text-xs text-slate-600">({t('comments.edited')})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {user && user.userId === comment.user_id ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditBody(comment.body);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5"
                        >
                          {t('comments.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-500/70 hover:text-red-400 px-1.5 py-0.5"
                        >
                          {t('comments.delete')}
                        </button>
                      </>
                    ) : user ? (
                      <button
                        onClick={() => handleFlagComment(comment.id)}
                        disabled={comment.is_flagged}
                        className="text-xs text-slate-500 hover:text-amber-400 px-1.5 py-0.5 disabled:opacity-30"
                        title={t('comments.flag')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500/50 focus:outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editBody.trim()}
                        className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-medium text-slate-900 dark:text-white hover:bg-cyan-500 disabled:opacity-50"
                      >
                        {t('comments.save')}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditBody(''); }}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {t('comments.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {comment.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50 transition-colors"
          >
            {loading ? t('common.loading') : t('comments.loadMore')}
          </button>
        )}
      </div>
    </section>
  );
}

/** Resolve API URL for client-side fetches */
function getApiUrl(): string {
  const publicApi = process.env.NEXT_PUBLIC_API_URL;
  if (publicApi) return publicApi.replace(/\/$/, '');
  return '';
}
