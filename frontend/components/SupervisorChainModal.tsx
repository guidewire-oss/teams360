'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import {
  getSupervisorChain,
  updateSupervisorChain,
  listUsers,
  listHierarchyLevels,
  type SupervisorLink,
  type AdminUser,
  type HierarchyLevel,
} from '@/lib/api/admin';

interface SupervisorChainModalProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
  onSaved: () => void;
}

interface SupervisorRow {
  levelId: string;
  userId: string;
}

export default function SupervisorChainModal({
  teamId,
  teamName,
  onClose,
  onSaved,
}: SupervisorChainModalProps) {
  const [rows, setRows] = useState<SupervisorRow[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [levels, setLevels] = useState<HierarchyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [teamId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chainRes, usersRes, levelsData] = await Promise.all([
        getSupervisorChain(teamId),
        listUsers(),
        listHierarchyLevels(),
      ]);

      setUsers(usersRes.users);
      setLevels(levelsData);

      if (chainRes.supervisors.length > 0) {
        setRows(
          chainRes.supervisors.map((s: SupervisorLink) => ({
            levelId: s.levelId,
            userId: s.userId,
          }))
        );
      } else {
        setRows([{ levelId: '', userId: '' }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter to supervisor-eligible levels: exclude survey-takers (team members/leads)
  // and system admin (position 0). This avoids hardcoding level IDs.
  const getSupervisorLevels = () => {
    return levels
      .filter((l) => !l.permissions.canTakeSurvey && l.position > 0)
      .sort((a, b) => a.position - b.position);
  };

  const getUsersForLevel = (levelId: string) => {
    if (!levelId) return [];
    return users.filter((u) => u.hierarchyLevel === levelId);
  };

  const handleAddRow = () => {
    setRows([...rows, { levelId: '', userId: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof SupervisorRow, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    // Reset userId when level changes
    if (field === 'levelId') {
      updated[index].userId = '';
    }
    setRows(updated);
  };

  const handleSave = async () => {
    setError(null);

    // Filter out empty rows
    const validRows = rows.filter((r) => r.userId && r.levelId);

    // Check for duplicate levels
    const levelIds = validRows.map((r) => r.levelId);
    const uniqueLevels = new Set(levelIds);
    if (uniqueLevels.size !== levelIds.length) {
      setError('Each hierarchy level can only appear once in the chain');
      return;
    }

    setSaving(true);
    try {
      await updateSupervisorChain(teamId, {
        supervisors: validRows.map((r) => ({
          userId: r.userId,
          levelId: r.levelId,
        })),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const supervisorLevels = getSupervisorLevels();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        data-testid="supervisor-chain-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Hierarchy
            </h2>
            <p className="text-sm text-gray-500 mt-1">{teamName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-supervisor-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <p className="text-sm text-gray-600 mb-4">
                Define the management hierarchy above this team. Position 1 is closest to the team (e.g., Manager), higher positions are further up (Director, VP).
              </p>

              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3"
                    data-testid="supervisor-row"
                  >
                    <span className="text-sm text-gray-500 w-6 text-right">
                      {index + 1}.
                    </span>
                    <select
                      value={row.levelId}
                      onChange={(e) => handleRowChange(index, 'levelId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      data-testid="supervisor-level-select"
                    >
                      <option value="">Select level...</option>
                      {supervisorLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={row.userId}
                      onChange={(e) => handleRowChange(index, 'userId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      data-testid="supervisor-user-select"
                      disabled={!row.levelId}
                    >
                      <option value="">Select user...</option>
                      {getUsersForLevel(row.levelId).map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.username})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      data-testid="remove-supervisor-btn"
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddRow}
                className="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                data-testid="add-supervisor-btn"
              >
                <Plus className="w-4 h-4" />
                Add Supervisor
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="save-supervisor-chain-btn"
            disabled={loading || saving}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
