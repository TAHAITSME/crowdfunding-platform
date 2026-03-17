import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from './notificationsSlice';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  if (loading) return <p className="p-4 text-white">Chargement...</p>;

  if (error) {
    const message =
      typeof error === 'string'
        ? error
        : error.detail || JSON.stringify(error);
    return (
      <p className="p-4 text-red-500">
        Erreur: {message}
      </p>
    );
  }

  if (!items || items.length === 0) {
    return <p className="p-4 text-white">Aucune notification pour le moment.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 mt-20 text-white">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className="border border-gray-700 rounded-xl p-3 bg-gray-900"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">{n.title}</span>
              <span className="text-xs text-gray-400">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
            {n.message && (
              <p className="text-sm text-gray-200 mt-1">{n.message}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;
