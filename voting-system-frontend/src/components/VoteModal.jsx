import React, { useEffect, useState } from 'react';
import { getCandidates, postVote } from '../services/api';
import { useTranslation } from 'react-i18next';

export default function VoteModal({ open, onClose, onVoted }) {
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getCandidates()
      .then((res) => setCandidates(res.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Failed to load candidates'))
      .finally(() => setLoading(false));
  }, [open]);

  const handleVote = async (id) => {
    setLoading(true);
    try {
      await postVote(id);
      onVoted();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Voting failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-bold mb-4">{t('candidates.title')}</h3>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <ul className="space-y-3">
            {candidates.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-sm text-secondary">{c.party}</div>
                </div>
                <button onClick={() => handleVote(c.id)} className="px-3 py-1 bg-primary text-white rounded">{t('common.save') /* using 'save' as 'Vote' fallback */}</button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded border">{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
}
