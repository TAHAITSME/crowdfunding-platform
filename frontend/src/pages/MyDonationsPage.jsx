// src/pages/MyDonationsPage.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDonationHistory } from '../features/donations/donationSlice'
import { Link } from 'react-router-dom'

export default function MyDonationsPage() {
  const dispatch = useDispatch()
  const { history, loading, error } = useSelector(s => s.donations)

  useEffect(() => {
    dispatch(fetchDonationHistory())
  }, [dispatch])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-20 p-4 text-gray-600">
        Chargement de vos dons...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-20 p-4 text-red-500">
        Erreur : {JSON.stringify(error)}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-20 p-4 text-gray-600">
        Vous n'avez pas encore effectué de don.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto mt-20 p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Mes dons</h1>
      <ul className="space-y-3">
        {history.map(d => (
          <li
            key={d.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-3"
          >
            <div className="flex justify-between text-sm">
              <div>
                <p className="font-semibold text-gray-900">
                  <Link
                    to={`/campaigns/${d.campaign}`}
                    className="text-green-700 hover:underline"
                  >
                    {d.campaign_title}
                  </Link>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(d.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-700">
                  {Number(d.amount).toLocaleString()} MAD
                </p>
                <p className="text-xs text-gray-500">
                  Net reversé : {Number(d.net_amount).toLocaleString()} MAD
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
