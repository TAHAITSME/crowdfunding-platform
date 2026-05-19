// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from 'react'
import { deleteAdminUser, getAdminUsers, suspendAdminUser } from '../../api/admin'
import { Search, UserX, Trash2, ShieldCheck, AlertCircle, Users } from 'lucide-react'
import { Spinner, PageHeader, AdminTable, AdminCard, Badge, ActionBtn } from './AdminDashboard'

// Modal de confirmation
function ConfirmModal({ open, onClose, onConfirm, title, message, danger = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          <AlertCircle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 font-medium mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-sm font-bold text-white transition active:scale-95 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [confirm, setConfirm] = useState(null) // { type: 'suspend'|'delete', userId, username }

  useEffect(() => {
    getAdminUsers()
      .then(r => setUsers(r.data.filter(u => u.role !== 'association')))
      .finally(() => setLoading(false))
  }, [])

  const handleSuspend = async (id) => {
    try {
      const res = await suspendAdminUser(id)
      setUsers(u => u.map(x => x.id === id ? res.data : x))
    } catch { /* toast géré par interceptor */ }
    setConfirm(null)
  }

  const handleDelete = async (id) => {
    try {
      await deleteAdminUser(id)
      setUsers(u => u.filter(x => x.id !== id))
    } catch { /* toast géré par interceptor */ }
    setConfirm(null)
  }

  const filtered = users.filter(
    u =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />

  return (
    <>
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        danger={confirm?.type === 'delete'}
        title={confirm?.type === 'delete' ? 'Supprimer le compte' : 'Suspendre le compte'}
        message={
          confirm?.type === 'delete'
            ? `Supprimer définitivement le compte de "${confirm?.username}" ? Cette action est irréversible.`
            : `${confirm?.username} ne pourra plus se connecter. Vous pouvez réactiver à tout moment.`
        }
        onConfirm={() =>
          confirm?.type === 'delete'
            ? handleDelete(confirm.userId)
            : handleSuspend(confirm.userId)
        }
      />

      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} compte${users.length > 1 ? 's' : ''} enregistré${users.length > 1 ? 's' : ''}`}
      />

      {/* Barre de recherche + compteur */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
          />
        </div>
        {search && (
          <span className="text-xs font-bold text-slate-500">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <AdminTable
        headers={['Utilisateur', 'Email', 'Rôle', 'Statut', 'Date inscription', 'Actions']}
        empty={
          filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-200" />
              <p className="text-sm font-semibold">Aucun utilisateur trouvé</p>
            </div>
          )
        }
      >
        {filtered.map(u => {
          const isAdmin = u.is_staff || u.is_superuser
          const isSuspended = u.is_active === false

          return (
            <tr key={u.id} className={`transition-colors ${isSuspended ? 'opacity-60' : 'hover:bg-slate-50/60'}`}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    isAdmin
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'
                  }`}>
                    {u.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{u.username}</p>
                    {u.full_name && <p className="text-[11px] text-slate-400 font-medium">{u.full_name}</p>}
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-500 font-medium">{u.email}</td>
              <td className="px-5 py-4">
                {isAdmin
                  ? <Badge color="purple"><ShieldCheck className="w-3 h-3 mr-1 inline" />Admin</Badge>
                  : <Badge color="gray">Utilisateur</Badge>
                }
              </td>
              <td className="px-5 py-4">
                {isSuspended
                  ? <Badge color="red">Suspendu</Badge>
                  : <Badge color="green">Actif</Badge>
                }
              </td>
              <td className="px-5 py-4 text-sm text-slate-400 font-medium tabular-nums">
                {u.date_joined && !isNaN(new Date(u.date_joined))
                  ? new Date(u.date_joined).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })
                  : <span className="text-slate-300 italic">Non renseignée</span>
                }
              </td>
              <td className="px-5 py-4">
                {!isAdmin && (
                  <div className="flex items-center gap-2">
                    <ActionBtn
                      color="amber"
                      onClick={() => setConfirm({ type: 'suspend', userId: u.id, username: u.username })}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      {isSuspended ? 'Réactiver' : 'Suspendre'}
                    </ActionBtn>
                    <ActionBtn
                      color="red"
                      onClick={() => setConfirm({ type: 'delete', userId: u.id, username: u.username })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </ActionBtn>
                  </div>
                )}
              </td>
            </tr>
          )
        })}
      </AdminTable>
    </>
  )
}
