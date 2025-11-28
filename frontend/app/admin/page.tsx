"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/lib/auth";
// Removed HEALTH_DIMENSIONS - now using DimensionConfig component with database
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listHierarchyLevels,
  listAdminTeams,
  createTeam,
  updateTeam as updateAdminTeam,
  deleteTeam,
  clearAdminCache,
  AdminUser,
  HierarchyLevel,
  AdminTeam,
} from "@/lib/api/admin";
import {
  Settings,
  Users,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Shield,
  Save,
  X,
  Building2,
  AlertCircle,
} from "lucide-react";
import HierarchyConfig from "@/components/HierarchyConfig";
import DimensionConfig from "@/components/DimensionConfig";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "hierarchy" | "teams" | "users" | "settings"
  >("hierarchy");

  // Teams tab state
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AdminTeam | null>(null);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    teamLeadId: "",
    cadence: "monthly",
  });
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [availableTeamLeads, setAvailableTeamLeads] = useState<AdminUser[]>([]);
  const [teamLeadsLoading, setTeamLeadsLoading] = useState(false);

  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [hierarchyLevels, setHierarchyLevels] = useState<HierarchyLevel[]>([]);
  const [adminTeams, setAdminTeams] = useState<AdminTeam[]>([]);
  const [userFormData, setUserFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    hierarchyLevel: "",
    reportsTo: "",
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    } else if (!currentUser.isAdmin) {
      router.push("/survey");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  // Fetch teams and team leads when activeTab changes to 'teams'
  useEffect(() => {
    if (activeTab === "teams") {
      fetchAdminTeams();
      fetchTeamLeads();
    }
  }, [activeTab]);

  // Fetch users, hierarchy levels, and teams when activeTab changes to 'users'
  useEffect(() => {
    if (activeTab === "users") {
      loadUsersData();
    }
  }, [activeTab]);

  const loadUsersData = async () => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const [usersData, levelsData, teamsData] = await Promise.all([
        listUsers(),
        listHierarchyLevels(),
        listAdminTeams(),
      ]);

      setUsers(usersData.users);
      setHierarchyLevels(levelsData);
      setAdminTeams(teamsData.teams);
    } catch (err: any) {
      console.error("Failed to load users data:", err);
      setUsersError(err.message || "Failed to load users. Please try again.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Teams tab functions
  const fetchAdminTeams = async () => {
    setTeamsLoading(true);
    setTeamsError(null);
    try {
      const response = await listAdminTeams();
      setTeams(response.teams);
    } catch (err: any) {
      console.error("Failed to load teams:", err);
      setTeamsError(err.message || "Failed to load teams");
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTeamLeads = async () => {
    setTeamLeadsLoading(true);
    try {
      const response = await listUsers();
      // Filter to managers, team leads, and directors for team lead dropdown
      const eligibleUsers = response.users.filter((u) =>
        ["level-3", "level-4", "level-2"].includes(u.hierarchyLevel),
      );
      setAvailableTeamLeads(eligibleUsers);
    } catch (err) {
      console.error("Failed to load team leads:", err);
    } finally {
      setTeamLeadsLoading(false);
    }
  };

  const handleShowCreateTeamForm = () => {
    setTeamFormData({ name: "", teamLeadId: "", cadence: "monthly" });
    setTeamFormError(null);
    setShowNewTeamForm(true);
    setEditingTeam(null);
  };

  const handleShowEditTeamForm = (team: AdminTeam) => {
    setTeamFormData({
      name: team.name,
      teamLeadId: team.teamLeadId || "",
      cadence: team.cadence,
    });
    setTeamFormError(null);
    setEditingTeam(team);
    setShowNewTeamForm(false);
  };

  const handleCancelTeamForm = () => {
    setShowNewTeamForm(false);
    setEditingTeam(null);
    setTeamFormData({ name: "", teamLeadId: "", cadence: "monthly" });
    setTeamFormError(null);
  };

  const handleCreateTeam = async () => {
    if (!teamFormData.name.trim()) {
      setTeamFormError("Team name is required");
      return;
    }

    setTeamFormLoading(true);
    setTeamFormError(null);
    try {
      await createTeam({
        name: teamFormData.name.trim(),
        teamLeadId: teamFormData.teamLeadId || null,
        cadence: teamFormData.cadence,
      });

      // Clear cache and refresh teams list
      clearAdminCache();
      await fetchAdminTeams();

      // Close form
      handleCancelTeamForm();
    } catch (err: any) {
      console.error("Failed to create team:", err);
      setTeamFormError(err.message || "Failed to create team");
    } finally {
      setTeamFormLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;

    if (!teamFormData.name.trim()) {
      setTeamFormError("Team name is required");
      return;
    }

    setTeamFormLoading(true);
    setTeamFormError(null);
    try {
      await updateAdminTeam(editingTeam.id, {
        name: teamFormData.name.trim(),
        teamLeadId: teamFormData.teamLeadId || null,
        cadence: teamFormData.cadence,
      });

      // Clear cache and refresh teams list
      clearAdminCache();
      await fetchAdminTeams();

      // Close form
      handleCancelTeamForm();
    } catch (err: any) {
      console.error("Failed to update team:", err);
      setTeamFormError(err.message || "Failed to update team");
    } finally {
      setTeamFormLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this team? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingTeamId(teamId);
    try {
      await deleteTeam(teamId);

      // Clear cache and refresh teams list
      clearAdminCache();
      await fetchAdminTeams();
    } catch (err: any) {
      console.error("Failed to delete team:", err);
      alert(err.message || "Failed to delete team");
    } finally {
      setDeletingTeamId(null);
    }
  };

  // Helper function to get role badge color
  const getRoleBadgeColor = (hierarchyLevel: string): string => {
    const level = hierarchyLevels.find((l) => l.id === hierarchyLevel);
    if (!level) return "bg-gray-100 text-gray-700";

    const name = level.name.toLowerCase();
    if (name.includes("vp")) return "bg-purple-100 text-purple-700";
    if (name.includes("director")) return "bg-blue-100 text-blue-700";
    if (name.includes("manager")) return "bg-green-100 text-green-700";
    if (name.includes("lead")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  // Get user's teams
  const getUserTeams = (userId: string): string => {
    const userTeams = adminTeams.filter((team) =>
      users.find((u) => u.id === userId)?.teamIds.includes(team.id),
    );

    if (userTeams.length === 0) return "-";
    if (userTeams.length === 1) return userTeams[0].name;
    return `${userTeams.length} teams`;
  };

  // Reset user form
  const resetUserForm = () => {
    setUserFormData({
      fullName: "",
      username: "",
      email: "",
      password: "",
      hierarchyLevel: "",
      reportsTo: "",
    });
    setUserFormError(null);
    setShowNewUserForm(false);
    setEditingUser(null);
  };

  // Handle add user button click
  const handleAddUser = () => {
    resetUserForm();
    setShowNewUserForm(true);
  };

  // Handle edit user button click
  const handleEditUser = (userToEdit: AdminUser) => {
    setUserFormData({
      fullName: userToEdit.fullName,
      username: userToEdit.username,
      email: userToEdit.email,
      password: "",
      hierarchyLevel: userToEdit.hierarchyLevel,
      reportsTo: userToEdit.reportsTo || "",
    });
    setUserFormError(null);
    setEditingUser(userToEdit);
    setShowNewUserForm(false);
  };

  // Handle user form submit
  const handleSaveUser = async () => {
    setUserFormError(null);
    setUserFormSubmitting(true);

    try {
      // Validation
      if (!userFormData.fullName.trim()) {
        throw new Error("Full name is required");
      }
      if (!userFormData.username.trim()) {
        throw new Error("Username is required");
      }
      if (!userFormData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!editingUser && !userFormData.password.trim()) {
        throw new Error("Password is required for new users");
      }
      if (!userFormData.hierarchyLevel) {
        throw new Error("Role is required");
      }

      if (editingUser) {
        // Update existing user
        const updateData: any = {
          fullName: userFormData.fullName,
          username: userFormData.username,
          email: userFormData.email,
          hierarchyLevel: userFormData.hierarchyLevel,
          reportsTo: userFormData.reportsTo || null,
        };

        // Only include password if it was changed
        if (userFormData.password.trim()) {
          updateData.password = userFormData.password;
        }

        await updateUser(editingUser.id, updateData);
      } else {
        // Create new user
        await createUser({
          id: userFormData.username, // Use username as ID
          fullName: userFormData.fullName,
          username: userFormData.username,
          email: userFormData.email,
          password: userFormData.password,
          hierarchyLevel: userFormData.hierarchyLevel,
          reportsTo: userFormData.reportsTo || null,
        });
      }

      // Clear cache and reload users
      clearAdminCache();
      await loadUsersData();
      resetUserForm();
    } catch (err: any) {
      console.error("Failed to save user:", err);
      setUserFormError(err.message || "Failed to save user. Please try again.");
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    // Prevent deleting self or admin user
    if (userId === user?.id) {
      alert("You cannot delete your own account");
      return;
    }

    const userToDelete = users.find((u) => u.id === userId);
    if (userToDelete?.username === "admin") {
      alert("Cannot delete the admin user");
      return;
    }

    setDeleteConfirmUserId(userId);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUserId) return;

    try {
      await deleteUser(deleteConfirmUserId);
      clearAdminCache();
      await loadUsersData();
      setDeleteConfirmUserId(null);
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      alert(err.message || "Failed to delete user. Please try again.");
    }
  };

  // Get potential supervisors (users at higher hierarchy levels)
  const getPotentialSupervisors = (): AdminUser[] => {
    if (!userFormData.hierarchyLevel) return [];

    const selectedLevel = hierarchyLevels.find(
      (l) => l.id === userFormData.hierarchyLevel,
    );
    if (!selectedLevel) return [];

    return users.filter((u) => {
      const userLevel = hierarchyLevels.find((l) => l.id === u.hierarchyLevel);
      if (!userLevel) return false;
      // Only show users at higher positions (lower position number)
      return userLevel.position < selectedLevel.position;
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-gray-500">System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Administrator</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8 border-b">
          <button
            data-testid="hierarchy-tab"
            onClick={() => setActiveTab("hierarchy")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "hierarchy"
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Hierarchy
            </div>
          </button>
          <button
            data-testid="teams-tab"
            onClick={() => setActiveTab("teams")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "teams"
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Teams
            </div>
          </button>
          <button
            data-testid="users-tab"
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "users"
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users
            </div>
          </button>
          <button
            data-testid="settings-tab"
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "settings"
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </div>
          </button>
        </div>

        {activeTab === "hierarchy" && <HierarchyConfig />}

        {activeTab === "teams" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Teams
              </h2>
              <button
                data-testid="add-team-btn"
                onClick={handleShowCreateTeamForm}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Team
              </button>
            </div>

            {/* Error message */}
            {teamsError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">
                    Error loading teams
                  </p>
                  <p className="text-sm text-red-700">{teamsError}</p>
                </div>
              </div>
            )}

            {/* Create team form */}
            {showNewTeamForm && (
              <div
                className="bg-white p-6 rounded-xl shadow-sm border mb-6"
                data-testid="create-team-form"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  New Team
                </h3>

                {teamFormError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{teamFormError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="team-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Team Name *
                    </label>
                    <input
                      type="text"
                      id="team-name"
                      data-testid="team-name-input"
                      value={teamFormData.name}
                      onChange={(e) =>
                        setTeamFormData({
                          ...teamFormData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter team name"
                      disabled={teamFormLoading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="team-lead"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Team Lead
                    </label>
                    <select
                      id="team-lead"
                      data-testid="team-lead-select"
                      value={teamFormData.teamLeadId}
                      onChange={(e) =>
                        setTeamFormData({
                          ...teamFormData,
                          teamLeadId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={teamFormLoading || teamLeadsLoading}
                    >
                      <option value="">No team lead</option>
                      {availableTeamLeads.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cadence"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Cadence *
                    </label>
                    <select
                      id="cadence"
                      data-testid="team-cadence-select"
                      value={teamFormData.cadence}
                      onChange={(e) =>
                        setTeamFormData({
                          ...teamFormData,
                          cadence: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={teamFormLoading}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    data-testid="save-team-btn"
                    onClick={handleCreateTeam}
                    disabled={teamFormLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {teamFormLoading ? "Creating..." : "Create Team"}
                  </button>
                  <button
                    onClick={handleCancelTeamForm}
                    disabled={teamFormLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Edit team form */}
            {editingTeam && (
              <div
                className="bg-white p-6 rounded-xl shadow-sm border mb-6"
                data-testid="edit-team-form"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Edit Team
                </h3>

                {teamFormError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{teamFormError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="edit-team-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Team Name *
                    </label>
                    <input
                      type="text"
                      id="edit-team-name"
                      data-testid="team-name-input"
                      value={teamFormData.name}
                      onChange={(e) =>
                        setTeamFormData({
                          ...teamFormData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter team name"
                      disabled={teamFormLoading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-team-lead"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Team Lead
                    </label>
                    <select
                      id="edit-team-lead"
                      data-testid="team-lead-select"
                      value={teamFormData.teamLeadId}
                      onChange={(e) =>
                        setTeamFormData({
                          ...teamFormData,
                          teamLeadId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={teamFormLoading || teamLeadsLoading}
                    >
                      <option value="">No team lead</option>
                      {availableTeamLeads.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-cadence"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Cadence *
                    </label>
                    <select
                      id="edit-cadence"
                      data-testid="team-cadence-select"
                      value={teamFormData.cadence}
                      onChange={(e) =>
                        setTeamFormData({
                          ...teamFormData,
                          cadence: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={teamFormLoading}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    data-testid="save-team-btn"
                    onClick={handleUpdateTeam}
                    disabled={teamFormLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {teamFormLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancelTeamForm}
                    disabled={teamFormLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {teamsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No teams found. Add your first team to get started.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full" data-testid="teams-list">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cadence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teams.map((team) => (
                      <tr key={team.id} data-testid="team-row">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {team.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {team.cadence}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            {team.memberCount}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {team.teamLeadName || "Not assigned"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              data-testid="edit-team-btn"
                              onClick={() => handleShowEditTeamForm(team)}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={deletingTeamId === team.id}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              data-testid="delete-team-btn"
                              onClick={() => handleDeleteTeam(team.id)}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              disabled={deletingTeamId === team.id}
                            >
                              {deletingTeamId === team.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Users
              </h2>
              <button
                data-testid="add-user-btn"
                onClick={handleAddUser}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>

            {usersError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {usersError}
              </div>
            )}

            {showNewUserForm && (
              <div
                className="bg-white p-6 rounded-xl shadow-sm border mb-6"
                data-testid="create-user-form"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  New User
                </h3>

                {userFormError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {userFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      data-testid="user-fullname-input"
                      value={userFormData.fullName}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      data-testid="user-username-input"
                      value={userFormData.username}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      data-testid="user-email-input"
                      value={userFormData.email}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      data-testid="user-password-input"
                      value={userFormData.password}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      data-testid="user-role-select"
                      value={userFormData.hierarchyLevel}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          hierarchyLevel: e.target.value,
                          reportsTo: "",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select Role</option>
                      {hierarchyLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reports To
                    </label>
                    <select
                      data-testid="user-reportsto-select"
                      value={userFormData.reportsTo}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          reportsTo: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={!userFormData.hierarchyLevel}
                    >
                      <option value="">None</option>
                      {getPotentialSupervisors().map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.fullName} (
                          {
                            hierarchyLevels.find(
                              (l) => l.id === supervisor.hierarchyLevel,
                            )?.name
                          }
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    data-testid="save-user-btn"
                    onClick={handleSaveUser}
                    disabled={userFormSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {userFormSubmitting ? "Saving..." : "Save User"}
                  </button>
                  <button
                    onClick={resetUserForm}
                    disabled={userFormSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {editingUser && (
              <div
                className="bg-white p-6 rounded-xl shadow-sm border mb-6"
                data-testid="create-user-form"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Edit User
                </h3>

                {userFormError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {userFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      data-testid="user-fullname-input"
                      value={userFormData.fullName}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      data-testid="user-username-input"
                      value={userFormData.username}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      data-testid="user-email-input"
                      value={userFormData.email}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      data-testid="user-password-input"
                      value={userFormData.password}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      data-testid="user-role-select"
                      value={userFormData.hierarchyLevel}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          hierarchyLevel: e.target.value,
                          reportsTo: "",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select Role</option>
                      {hierarchyLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reports To
                    </label>
                    <select
                      data-testid="user-reportsto-select"
                      value={userFormData.reportsTo}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          reportsTo: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={!userFormData.hierarchyLevel}
                    >
                      <option value="">None</option>
                      {getPotentialSupervisors().map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.fullName} (
                          {
                            hierarchyLevels.find(
                              (l) => l.id === supervisor.hierarchyLevel,
                            )?.name
                          }
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    data-testid="save-user-btn"
                    onClick={handleSaveUser}
                    disabled={userFormSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {userFormSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={resetUserForm}
                    disabled={userFormSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found. Add your first user to get started.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teams
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id} data-testid="user-row">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {userItem.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {userItem.username}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {userItem.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-sm ${getRoleBadgeColor(userItem.hierarchyLevel)}`}
                            data-testid="role-badge"
                          >
                            {hierarchyLevels.find(
                              (l) => l.id === userItem.hierarchyLevel,
                            )?.name || userItem.hierarchyLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {getUserTeams(userItem.id)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              data-testid="edit-user-btn"
                              onClick={() => handleEditUser(userItem)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              data-testid="delete-user-btn"
                              onClick={() => handleDeleteUser(userItem.id)}
                              disabled={
                                userItem.id === user?.id ||
                                userItem.username === "admin"
                              }
                              className={`${
                                userItem.id === user?.id ||
                                userItem.username === "admin"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-900"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmUserId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Confirm Delete
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete user{" "}
                    <strong>
                      {
                        users.find((u) => u.id === deleteConfirmUserId)
                          ?.fullName
                      }
                    </strong>
                    ? This action cannot be undone.
                  </p>
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={() => setDeleteConfirmUserId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteUser}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                System Settings
              </h2>

              <div className="space-y-6">
                <div data-testid="dimensions-settings">
                  <DimensionConfig />
                </div>

                <div data-testid="notifications-settings">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded"
                      defaultChecked
                    />
                    <span>Send email reminders for upcoming health checks</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded"
                      defaultChecked
                    />
                    <span>Notify managers when team health declines</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Send weekly summary reports</span>
                  </label>
                </div>
              </div>

              <div data-testid="retention-settings">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Data Retention Policy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keep health check data for
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>6 months</option>
                      <option defaultValue="selected">1 year</option>
                      <option>2 years</option>
                      <option>Forever</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export format
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                      <option>CSV</option>
                      <option>JSON</option>
                      <option>Excel</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Save Settings
                </button>
                <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Cancel
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
