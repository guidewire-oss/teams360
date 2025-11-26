'use client';

import { useState, useEffect } from 'react';
import { HierarchyLevel, OrganizationConfig } from '@/lib/types';
import { getOrgConfig, saveOrgConfig, addHierarchyLevel, updateHierarchyLevel, deleteHierarchyLevel } from '@/lib/org-config';
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, Shield, Eye, Users, FileText, Download, Settings } from 'lucide-react';

export default function HierarchyConfig() {
  const [config, setConfig] = useState<OrganizationConfig>(getOrgConfig());
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLevel, setNewLevel] = useState<Partial<HierarchyLevel>>({
    name: '',
    color: '#6366F1',
    permissions: {
      canViewAllTeams: false,
      canEditTeams: false,
      canManageUsers: false,
      canConfigureSystem: false,
      canViewReports: false,
      canExportData: false
    }
  });

  useEffect(() => {
    setConfig(getOrgConfig());
  }, []);

  const handleAddLevel = () => {
    if (!newLevel.name) return;

    const level: HierarchyLevel = {
      id: `level-${Date.now()}`,
      name: newLevel.name,
      level: config.hierarchyLevels.length + 1,
      color: newLevel.color || '#6366F1',
      permissions: newLevel.permissions || {
        canViewAllTeams: false,
        canEditTeams: false,
        canManageUsers: false,
        canConfigureSystem: false,
        canViewReports: false,
        canExportData: false
      }
    };

    addHierarchyLevel(level);
    setConfig(getOrgConfig());
    setShowAddForm(false);
    setNewLevel({
      name: '',
      color: '#6366F1',
      permissions: {
        canViewAllTeams: false,
        canEditTeams: false,
        canManageUsers: false,
        canConfigureSystem: false,
        canViewReports: false,
        canExportData: false
      }
    });
  };

  const handleUpdateLevel = (levelId: string, updates: Partial<HierarchyLevel>) => {
    updateHierarchyLevel(levelId, updates);
    setConfig(getOrgConfig());
    setEditingLevel(null);
  };

  const handleDeleteLevel = (levelId: string) => {
    if (confirm('Are you sure you want to delete this level? This action cannot be undone.')) {
      if (deleteHierarchyLevel(levelId)) {
        setConfig(getOrgConfig());
      } else {
        alert('Cannot delete the team member level or levels with assigned users.');
      }
    }
  };

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    const newLevels = [...config.hierarchyLevels];
    if (direction === 'up' && index > 0) {
      [newLevels[index], newLevels[index - 1]] = [newLevels[index - 1], newLevels[index]];
    } else if (direction === 'down' && index < newLevels.length - 1) {
      [newLevels[index], newLevels[index + 1]] = [newLevels[index + 1], newLevels[index]];
    }
    
    // Update level numbers
    newLevels.forEach((level, i) => {
      level.level = i + 1;
    });
    
    saveOrgConfig({ ...config, hierarchyLevels: newLevels });
    setConfig(getOrgConfig());
  };

  const PermissionIcon = ({ permission, label }: { permission: keyof HierarchyLevel['permissions'], label: string }) => {
    const icons = {
      canViewAllTeams: Eye,
      canEditTeams: Users,
      canManageUsers: Users,
      canConfigureSystem: Settings,
      canViewReports: FileText,
      canExportData: Download
    };
    const Icon = icons[permission] || Shield;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hierarchy Configuration</h2>
          <p className="text-gray-500 mt-1">Define organizational levels and permissions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Level
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Hierarchy Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
              <input
                type="text"
                value={newLevel.name}
                onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Senior Director"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newLevel.color}
                  onChange={(e) => setNewLevel({ ...newLevel, color: e.target.value })}
                  className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={newLevel.color}
                  onChange={(e) => setNewLevel({ ...newLevel, color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries({
                canViewAllTeams: 'View All Teams',
                canEditTeams: 'Edit Teams',
                canManageUsers: 'Manage Users',
                canConfigureSystem: 'Configure System',
                canViewReports: 'View Reports',
                canExportData: 'Export Data'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newLevel.permissions?.[key as keyof HierarchyLevel['permissions']] || false}
                    onChange={(e) => setNewLevel({
                      ...newLevel,
                      permissions: {
                        ...newLevel.permissions!,
                        [key]: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAddLevel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              Save Level
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewLevel({
                  name: '',
                  color: '#6366F1',
                  permissions: {
                    canViewAllTeams: false,
                    canEditTeams: false,
                    canManageUsers: false,
                    canConfigureSystem: false,
                    canViewReports: false,
                    canExportData: false
                  }
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4" data-testid="hierarchy-list">
        {config.hierarchyLevels.map((level, index) => (
          <div key={level.id} className="bg-white p-6 rounded-xl shadow-sm border" data-testid="hierarchy-level-row">
            {editingLevel === level.id ? (
              <div className="space-y-4" data-testid="edit-level-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                    <input
                      type="text"
                      defaultValue={level.name}
                      onChange={(e) => level.name = e.target.value}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        defaultValue={level.color}
                        onChange={(e) => level.color = e.target.value}
                        className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        defaultValue={level.color}
                        onChange={(e) => level.color = e.target.value}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries({
                      canViewAllTeams: 'View All Teams',
                      canEditTeams: 'Edit Teams',
                      canManageUsers: 'Manage Users',
                      canConfigureSystem: 'Configure System',
                      canViewReports: 'View Reports',
                      canExportData: 'Export Data'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={level.permissions[key as keyof HierarchyLevel['permissions']]}
                          onChange={(e) => {
                            level.permissions[key as keyof HierarchyLevel['permissions']] = e.target.checked;
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleUpdateLevel(level.id, level)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingLevel(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: level.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Level {level.level}: {level.name}
                    </h3>
                    {level.id === config.teamMemberLevelId && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Team Member Level
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {Object.entries(level.permissions).filter(([_, enabled]) => enabled).map(([key]) => {
                      const labels = {
                        canViewAllTeams: 'View All Teams',
                        canEditTeams: 'Edit Teams',
                        canManageUsers: 'Manage Users',
                        canConfigureSystem: 'Configure System',
                        canViewReports: 'View Reports',
                        canExportData: 'Export Data'
                      };
                      return (
                        <PermissionIcon
                          key={key}
                          permission={key as keyof HierarchyLevel['permissions']}
                          label={labels[key as keyof typeof labels]}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    data-testid="move-up"
                    onClick={() => moveLevel(index, 'up')}
                    disabled={index === 0}
                    aria-label="Move level up"
                    className={`p-2 rounded-lg transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronUp className="w-5 h-5" data-lucide="arrow-up" />
                  </button>
                  <button
                    data-testid="move-down"
                    onClick={() => moveLevel(index, 'down')}
                    disabled={index === config.hierarchyLevels.length - 1}
                    aria-label="Move level down"
                    className={`p-2 rounded-lg transition-colors ${
                      index === config.hierarchyLevels.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" data-lucide="arrow-down" />
                  </button>
                  <button
                    data-testid="edit-level"
                    onClick={() => setEditingLevel(level.id)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLevel(level.id)}
                    disabled={level.id === config.teamMemberLevelId}
                    className={`p-2 rounded-lg transition-colors ${
                      level.id === config.teamMemberLevelId
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}