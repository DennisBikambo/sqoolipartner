// app/settings/section.tsx

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { Card, CardContent } from "../components/ui/card";
import ThemeButton from "../components/common/ThemeButton";
import { getInitials } from "../utils/formatters";
import { isConvexUser } from "../types/auth.types";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

type Channel = {
  _id: Id<"channels">;
  partnerId: Id<"partners">;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  deactivation_reason?: string;
};

type Subchannel = {
  _id: Id<"subchannels">;
  channel_id: Id<"channels">;
  partner_id: Id<"partners">;
  name: string;
  prefix_code?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  deactivation_reason?: string;
};

type RoleWithPermissions = {
  _id: Id<"roles">;
  name: string;
  display_name: string;
  description: string;
  permission_ids: Id<"permissions">[];
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  deactivation_reason?: string;
  permissions: Array<{
    _id: Id<"permissions">;
    key: string;
    name: string;
    category: string;
    level: string;
    is_default: boolean;
  } | null>;
};

// ── Icons ──────────────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const RestoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Overlay ────────────────────────────────────────────────────────────────────

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-14 sm:top-16 lg:left-[110px] left-0 right-0 bottom-0 flex items-center justify-center z-50 bg-black/35">
      {children}
    </div>
  );
}

// ── AddRoleModal ───────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ["users", "campaigns", "wallet", "dashboard", "settings", "programs", "all_access"];
const CATEGORY_LABELS: Record<string, string> = {
  users: "Users", campaigns: "Campaigns", wallet: "Wallet",
  dashboard: "Dashboard", settings: "Settings", programs: "Programs", all_access: "All Access",
};

function AddRoleModal({
  onClose,
  editRole,
}: {
  onClose: () => void;
  editRole?: RoleWithPermissions;
}) {
  const allPermissions = useQuery(api.permission.getAllPermissions);
  const createRole = useMutation(api.role.createRole);
  const updateRole = useMutation(api.role.updateRole);

  const [name, setName] = useState(editRole?.display_name ?? "");
  const [description, setDescription] = useState(editRole?.description ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<Id<"permissions">>>(
    new Set(editRole?.permission_ids ?? [])
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isSystemRole = !!editRole?.is_system_role;

  // Group permissions by category
  const grouped = (allPermissions ?? []).reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof allPermissions & object>);

  const sortedCats = CATEGORY_ORDER.filter((c) => grouped[c]);

  const toggleCategory = (cat: string) => {
    const catPerms = grouped[cat] ?? [];
    const allSel = catPerms.every((p) => selectedIds.has(p._id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => allSel ? next.delete(p._id) : next.add(p._id));
      return next;
    });
  };

  const togglePerm = (id: Id<"permissions">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Role name is required"); return; }
    if (selectedIds.size === 0 && !isSystemRole) { toast.error("Select at least one permission"); return; }
    setIsLoading(true);
    try {
      if (editRole) {
        await updateRole({
          role_id: editRole._id,
          display_name: name.trim(),
          description: description.trim(),
          ...(isSystemRole ? {} : { permission_ids: Array.from(selectedIds) }),
        });
        toast.success("Role updated");
      } else {
        await createRole({
          name: name.trim().toLowerCase().replace(/\s+/g, "_"),
          display_name: name.trim(),
          description: description.trim(),
          permission_ids: Array.from(selectedIds),
        });
        toast.success("Role created");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = selectedIds.size;
  const totalCount = (allPermissions ?? []).length;

  const selectAll = () => {
    if (isSystemRole) return;
    setSelectedIds(new Set((allPermissions ?? []).map((p) => p._id)));
  };
  const clearAll = () => {
    if (isSystemRole) return;
    setSelectedIds(new Set());
  };

  return (
    <Overlay>
      <div className="bg-card rounded-2xl w-[calc(100%-24px)] max-h-[calc(100%-24px)] flex flex-col overflow-hidden shadow-2xl">
        {/* ── Sticky Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="m-0 text-base font-bold text-foreground">
                {editRole ? "Edit Role" : "Add Role"}
              </h2>
              <p className="mt-[3px] mb-0 text-xs text-muted-foreground">
                {editRole ? "Update role name, description and permissions." : "Create a new role and configure its permissions."}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-[2px] leading-[0] transition-colors">
              <CloseIcon />
            </button>
          </div>

          {/* Name + Description row */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-[5px] uppercase tracking-[0.04em]">
                Role Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales Manager"
                className="w-full box-border border border-border rounded-lg py-2 px-3 text-[13px] text-foreground bg-background outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-[5px] uppercase tracking-[0.04em]">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional — what this role does"
                className="w-full box-border border border-border rounded-lg py-2 px-3 text-[13px] text-foreground bg-background outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* ── Permissions Section ── */}
        <div className="px-6 flex-1 flex flex-col min-h-0">
          {/* Permissions header */}
          <div className="flex items-center justify-between py-[14px] pb-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Permissions</span>
              {!isSystemRole && (
                <span className={`text-[10px] font-semibold py-[1px] px-[7px] rounded-full ${selectedCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {selectedCount} / {totalCount}
                </span>
              )}
            </div>
            {!isSystemRole && (
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] text-primary bg-transparent border-none cursor-pointer p-0 font-medium">
                  Select all
                </button>
                <span className="text-border text-[11px]">·</span>
                <button onClick={clearAll} className="text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer p-0 font-medium">
                  Clear
                </button>
              </div>
            )}
          </div>

          {isSystemRole && (
            <div className="text-xs text-muted-foreground mb-[10px] py-2 px-3 bg-muted rounded-lg flex items-center gap-[6px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>
              </svg>
              System role — permissions are locked and cannot be changed.
            </div>
          )}

          {/* Scrollable permission list */}
          <div className="flex-1 overflow-y-auto pb-2">
            <div className="flex flex-col gap-1">
              {sortedCats.map((cat) => {
                const perms = grouped[cat] ?? [];
                const selCount = perms.filter((p) => selectedIds.has(p._id)).length;
                const allSel = selCount === perms.length;
                const someSel = selCount > 0 && !allSel;
                const isExpanded = expanded[cat];

                return (
                  <div key={cat} className={`border rounded-lg overflow-hidden ${isExpanded ? "border-primary" : "border-border"}`}>
                    {/* Category row */}
                    <div
                      className={`flex items-center justify-between py-[9px] px-3 cursor-pointer ${isExpanded ? "bg-primary/5" : "bg-card"}`}
                      onClick={() => setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                    >
                      <div className="flex items-center gap-[10px]">
                        <input
                          type="checkbox"
                          checked={allSel}
                          ref={(el) => { if (el) el.indeterminate = someSel; }}
                          disabled={isSystemRole}
                          onChange={(e) => { e.stopPropagation(); !isSystemRole && toggleCategory(cat); }}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-[14px] h-[14px] shrink-0 ${isSystemRole ? "cursor-not-allowed" : "cursor-pointer"}`}
                          style={{ accentColor: "var(--primary)" }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {CATEGORY_LABELS[cat] ?? cat}
                        </span>
                        <span className={`text-[10px] font-medium ${selCount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {selCount}/{perms.length}
                        </span>
                      </div>
                      <span className="text-muted-foreground leading-[0]">
                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </span>
                    </div>

                    {/* Children */}
                    {isExpanded && (
                      <div className="border-t border-border bg-background">
                        {perms.map((p, idx) => (
                          <div
                            key={p._id}
                            className={`flex items-center gap-[10px] py-2 pr-3 pl-9 ${idx < perms.length - 1 ? "border-b border-border" : ""} ${isSystemRole ? "cursor-default" : "cursor-pointer"}`}
                            onClick={() => !isSystemRole && togglePerm(p._id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(p._id)}
                              disabled={isSystemRole}
                              onChange={() => !isSystemRole && togglePerm(p._id)}
                              onClick={(e) => e.stopPropagation()}
                              className={`w-[13px] h-[13px] shrink-0 ${isSystemRole ? "cursor-not-allowed" : "cursor-pointer"}`}
                              style={{ accentColor: "var(--primary)" }}
                            />
                            <div className="flex-1">
                              <span className="text-xs text-foreground">{p.name}</span>
                              {p.key && (
                                <span className="text-[10px] text-muted-foreground ml-[6px]">{p.key}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="py-[14px] px-6 border-t border-border shrink-0 flex justify-end gap-2 bg-card">
          <button
            onClick={onClose}
            className="bg-transparent border border-border rounded-[7px] py-2 px-[18px] text-xs font-medium text-foreground cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`bg-primary text-primary-foreground border-none rounded-[7px] py-2 px-[22px] text-xs font-semibold min-w-[110px] ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            {isLoading ? "Saving..." : editRole ? "Save Changes" : "Add Role"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── DeactivateModal ────────────────────────────────────────────────────────────

function DeactivateModal({ onClose, onConfirm, isLoading }: { onClose: () => void; onConfirm: (reason: string) => void; isLoading: boolean }) {
  const [reason, setReason] = useState("");
  const handleConfirm = () => {
    if (!reason.trim()) { toast.error("Please provide a reason for deactivation"); return; }
    onConfirm(reason.trim());
  };
  return (
    <Overlay>
      <div className="bg-card rounded-xl w-[420px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="m-0 text-[15px] font-bold text-foreground">Deactivate Role</h2>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0">
            <CloseIcon />
          </button>
        </div>
        <p className="text-xs text-muted-foreground m-0 mb-2">
          Are you sure you want to deactivate this role?
        </p>
        <div className="rounded-md py-2 px-[10px] mb-3 bg-destructive/8">
          <p className="text-[11px] text-destructive m-0 leading-snug">
            This role can no longer be assigned to new users. Existing users keep their current permissions.
          </p>
        </div>
        <label className="text-[11px] text-foreground font-medium block mb-[6px]">
          Reason for deactivation *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Role no longer needed..."
          className="w-full box-border border border-border rounded-lg bg-muted p-[10px] text-xs resize-none h-[80px] outline-none text-foreground"
        />
        <div className="flex justify-end mt-[14px]">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`bg-destructive text-destructive-foreground border-none rounded-full py-2 px-[18px] text-xs font-semibold ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            {isLoading ? "Deactivating..." : "Deactivate Role"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── ActivateModal ──────────────────────────────────────────────────────────────

function ActivateModal({ onClose, onConfirm, isLoading }: { onClose: () => void; onConfirm: () => void; isLoading: boolean }) {
  return (
    <Overlay>
      <div className="bg-card rounded-xl w-[380px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-[10px]">
          <h2 className="m-0 text-[15px] font-bold text-foreground">Activate Role</h2>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0">
            <CloseIcon />
          </button>
        </div>
        <p className="text-xs text-muted-foreground m-0 mb-5">
          Are you sure you want to activate this role?
        </p>
        <div className="flex justify-end">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`bg-primary text-primary-foreground border-none rounded-full py-2 px-[18px] text-xs font-semibold ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            {isLoading ? "Activating..." : "Activate Role"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── RolesPanel ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function RolesPanel() {
  const [rolesTab, setRolesTab] = useState<"active" | "inactive">("active");
  const [rolePage, setRolePage] = useState(1);
  const [modal, setModal] = useState<null | "add" | "deactivate" | "activate">(null);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const activeRoles = useQuery(api.role.getRoles, { is_active: true }) as RoleWithPermissions[] | undefined;
  const inactiveRoles = useQuery(api.role.getRoles, { is_active: false }) as RoleWithPermissions[] | undefined;
  const deactivateRole = useMutation(api.role.deactivateRole);
  const activateRole = useMutation(api.role.activateRole);

  const roles = rolesTab === "active" ? (activeRoles ?? []) : (inactiveRoles ?? []);
  const roleTotalPages = Math.max(1, Math.ceil(roles.length / PAGE_SIZE));
  const paginatedRoles = roles.slice((rolePage - 1) * PAGE_SIZE, rolePage * PAGE_SIZE);

  const handleDeactivate = async (reason: string) => {
    if (!selectedRole) return;
    setActionLoading(true);
    try {
      await deactivateRole({ role_id: selectedRole._id, reason });
      toast.success("Role deactivated");
      setModal(null);
      setSelectedRole(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to deactivate role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedRole) return;
    setActionLoading(true);
    try {
      await activateRole({ role_id: selectedRole._id });
      toast.success("Role activated");
      setModal(null);
      setSelectedRole(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to activate role");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      {/* White card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        {/* Top row: tabs + Add Role */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-5 border-b border-border">
            {(["active", "inactive"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setRolesTab(t); setRolePage(1); }}
                className={`bg-transparent border-none cursor-pointer text-xs font-semibold pb-2 capitalize -mb-px border-b-2 ${rolesTab === t ? "text-primary border-primary" : "text-muted-foreground border-transparent"}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setSelectedRole(null); setModal("add"); }}
            className="bg-primary text-primary-foreground flex items-center gap-[5px] border-none rounded-md py-[7px] px-3 text-[11px] font-semibold cursor-pointer"
          >
            <PlusIcon />
            Add Role
          </button>
        </div>

        {/* Rows */}
        <div>
          {roles.length === 0 ? (
            <div className="py-[40px] px-8 text-center">
              <div className="text-[28px] mb-2">🔑</div>
              <p className="m-0 mb-1 text-[13px] font-semibold text-foreground">
                {rolesTab === "active" ? "No roles yet" : "No inactive roles"}
              </p>
              <p className="m-0 mb-4 text-xs text-muted-foreground">
                {rolesTab === "active" ? "Create your first role to control what users can access." : "Deactivated roles will appear here."}
              </p>
              {rolesTab === "active" && (
                <button
                  onClick={() => { setSelectedRole(null); setModal("add"); }}
                  className="bg-primary text-primary-foreground border-none rounded-md py-[7px] px-[14px] text-xs font-semibold cursor-pointer"
                >
                  Add your first role
                </button>
              )}
            </div>
          ) : (
            paginatedRoles.map((role) => (
              <div
                key={role._id}
                className="flex items-center py-[10px] px-4 border-b border-border"
              >
                {/* Date Created */}
                <div className="flex-[0_0_180px]">
                  <div className="text-[10px] text-muted-foreground">Date Created</div>
                  <div className="text-[11px] text-foreground font-medium mt-[2px]">
                    {formatDate(role.created_at)}
                  </div>
                </div>

                {/* Role Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[6px] flex-wrap">
                    <span className="text-xs text-foreground font-semibold">
                      {role.display_name}
                    </span>
                    {role.is_system_role && (
                      <span className="text-[9px] font-semibold py-[1px] px-[7px] rounded-full bg-muted text-muted-foreground">System</span>
                    )}
                    <span className="text-[9px] font-semibold py-[1px] px-[7px] rounded-full text-primary bg-primary/10">
                      {role.permission_ids.length} perms
                    </span>
                  </div>
                  {role.description && (
                    <div className="text-[10px] text-muted-foreground mt-[2px] truncate">
                      {role.description}
                    </div>
                  )}
                  {rolesTab === "inactive" && role.deactivation_reason && (
                    <div className="text-[10px] text-destructive mt-[2px]">
                      Reason: {role.deactivation_reason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-[10px]">
                  <button
                    onClick={() => { setSelectedRole(role); setModal("add"); }}
                    className="text-primary bg-transparent border-none cursor-pointer p-1 leading-[0]"
                  >
                    <PencilIcon />
                  </button>

                  {rolesTab === "active" && !role.is_system_role && (
                    <button
                      onClick={() => { setSelectedRole(role); setModal("deactivate"); }}
                      className="text-destructive bg-transparent border-none cursor-pointer p-1 leading-[0]"
                    >
                      <TrashIcon />
                    </button>
                  )}

                  {rolesTab === "inactive" && (
                    <button
                      onClick={() => { setSelectedRole(role); setModal("activate"); }}
                      className="text-primary bg-transparent border-none cursor-pointer p-1 leading-[0]"
                    >
                      <RestoreIcon />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {roles.length > 0 && (
          <div className="flex items-center justify-between mt-[14px] px-1">
            <span className="text-[11px] text-muted-foreground">
              Page <strong>{rolePage}</strong> of {roleTotalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setRolePage((p) => Math.max(1, p - 1))}
                disabled={rolePage === 1}
                className={`bg-card border border-border rounded-md py-[5px] px-3 text-[11px] text-foreground font-medium ${rolePage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >Previous</button>
              <button
                onClick={() => setRolePage((p) => Math.min(roleTotalPages, p + 1))}
                disabled={rolePage === roleTotalPages}
                className={`bg-card border border-border rounded-md py-[5px] px-3 text-[11px] text-foreground font-medium ${rolePage === roleTotalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "add" && (
        <AddRoleModal
          onClose={() => { setModal(null); setSelectedRole(null); }}
          editRole={selectedRole ?? undefined}
        />
      )}
      {modal === "deactivate" && (
        <DeactivateModal
          onClose={() => { setModal(null); setSelectedRole(null); }}
          onConfirm={handleDeactivate}
          isLoading={actionLoading}
        />
      )}
      {modal === "activate" && (
        <ActivateModal
          onClose={() => { setModal(null); setSelectedRole(null); }}
          onConfirm={handleActivate}
          isLoading={actionLoading}
        />
      )}
    </>
  );
}

// ── Role Labels ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", partner_admin: "Partner Admin",
  accountant: "Accountant", campaign_manager: "Campaign Manager",
  viewer: "Viewer", super_agent: "Super Agent",
  master_agent: "Master Agent", merchant_admin: "Merchant Admin",
};

// ── Social Media Icons ─────────────────────────────────────────────────────────

const XSocialIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.635 5.903-5.635zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramSocialIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#fdf497"/>
        <stop offset="45%" stopColor="#fd5949"/>
        <stop offset="60%" stopColor="#d6249f"/>
        <stop offset="90%" stopColor="#285AEB"/>
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-g)"/>
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
  </svg>
);

const FacebookSocialIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="#1877f2">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const LinkedInSocialIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="#0077b5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// ── EditContactModal ───────────────────────────────────────────────────────────

function EditContactModal({ onClose, initialPhone, initialEmail, userId }: {
  onClose: () => void;
  initialPhone: string;
  initialEmail: string;
  userId: Id<"users">;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const updateUser = useMutation(api.user.updateUser);

  const handleSave = async () => {
    if (!email.trim()) { toast.error("Email address is required"); return; }
    setIsLoading(true);
    try {
      await updateUser({ user_id: userId, phone: phone || undefined, email: email.trim() });
      toast.success("Contact details updated");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Overlay>
      <div className="bg-card rounded-2xl w-full max-w-[520px] p-7 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="m-0 text-base font-bold text-foreground">Edit Contact Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Update your phone number and email address</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0 leading-[0]"><CloseIcon /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[11px] text-foreground font-medium block mb-[5px]">Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full box-border border border-border rounded-lg bg-muted py-[9px] px-4 text-[13px] text-foreground outline-none" placeholder="+254712345678" />
          </div>
          <div>
            <label className="text-[11px] text-foreground font-medium block mb-[5px]">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full box-border border border-border rounded-lg bg-muted py-[9px] px-4 text-[13px] text-foreground outline-none" placeholder="you@example.com" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={isLoading} className={`bg-primary text-primary-foreground border-none rounded-full py-2 px-5 text-xs font-semibold ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── EditSocialModal ────────────────────────────────────────────────────────────

function EditSocialModal({ onClose, initial, partnerId }: {
  onClose: () => void;
  initial: { twitter?: string; instagram?: string; facebook?: string; linkedin?: string };
  partnerId: Id<"partners">;
}) {
  const [twitter, setTwitter] = useState(initial.twitter ?? "");
  const [instagram, setInstagram] = useState(initial.instagram ?? "");
  const [facebook, setFacebook] = useState(initial.facebook ?? "");
  const [linkedin, setLinkedin] = useState(initial.linkedin ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const updatePartnerProfile = useMutation(api.partner.updatePartnerProfile);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePartnerProfile({
        partner_id: partnerId,
        social_media: {
          twitter: twitter || undefined,
          instagram: instagram || undefined,
          facebook: facebook || undefined,
          linkedin: linkedin || undefined,
        },
      });
      toast.success("Social media updated");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { label: "Twitter / X", value: twitter, onChange: setTwitter, icon: <XSocialIcon />, iconBg: "#000" },
    { label: "Instagram", value: instagram, onChange: setInstagram, icon: <InstagramSocialIcon />, iconBg: "transparent" },
    { label: "Facebook", value: facebook, onChange: setFacebook, icon: <FacebookSocialIcon />, iconBg: "#fff" },
    { label: "LinkedIn", value: linkedin, onChange: setLinkedin, icon: <LinkedInSocialIcon />, iconBg: "#e0f0ff" },
  ];

  return (
    <Overlay>
      <div className="bg-card rounded-2xl w-full max-w-[560px] p-7 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="m-0 text-base font-bold text-foreground">Edit Social Media</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Connect your social media profiles</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0 leading-[0]"><CloseIcon /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="text-[11px] text-foreground font-medium block mb-[5px]">{f.label}</label>
              <div className="flex items-center border border-border rounded-lg bg-muted overflow-hidden pr-3 pl-[6px]">
                <div
                  className={`w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 my-[5px] mr-[6px] overflow-hidden ${f.iconBg === "transparent" ? "" : "border border-border"}`}
                  style={{ background: f.iconBg }}
                >
                  {f.icon}
                </div>
                <input value={f.value} onChange={(e) => f.onChange(e.target.value)} className="flex-1 border-none bg-transparent outline-none text-xs text-foreground py-2" placeholder="handle or URL" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={handleSave} disabled={isLoading} className={`bg-primary text-primary-foreground border-none rounded-full py-2 px-5 text-xs font-semibold ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Channel Icons ─────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Channel Form Modal (Add/Edit channel or sub-channel) ──────────────────────

function ChannelFormModal({
  onClose,
  title,
  subtitle,
  btnLabel,
  isSubchannel = false,
  initial,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  btnLabel: string;
  isSubchannel?: boolean;
  initial?: { name?: string; code?: string; description?: string };
  onSubmit: (data: { name: string; code: string; description: string }) => Promise<void>;
  isLoading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    await onSubmit({ name: name.trim(), code: code.trim(), description: description.trim() });
  };

  return (
    <Overlay>
      <div className="bg-card rounded-2xl w-[calc(100%-24px)] pt-7 px-7 pb-6 shadow-2xl">
        <div className="flex justify-between items-start mb-[18px]">
          <div>
            <h2 className="m-0 text-base font-bold text-foreground">{title}</h2>
            {subtitle && <p className="mt-[3px] mb-0 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0 leading-[0]">
            <CloseIcon />
          </button>
        </div>

        {/* Name */}
        <div className="mb-[14px]">
          <label className="text-xs text-foreground font-medium block mb-[5px]">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full box-border border border-border rounded-full py-[9px] px-4 text-[13px] text-foreground bg-muted outline-none" placeholder="e.g. Social Media" />
        </div>

        {/* Prefix Code */}
        <div className="mb-1">
          <label className="text-xs text-foreground font-medium block mb-[5px]">
            {isSubchannel ? "Sub-Channel Prefix Code (optional)" : "Channel Prefix Code (optional)"}
          </label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full box-border border border-border rounded-full py-[9px] px-4 text-[13px] text-foreground bg-muted outline-none" placeholder="e.g. SOC" />
        </div>
        <p className="mt-1 mb-[14px] text-[11px] text-destructive">
          To be used in campaigns belonging to this {isSubchannel ? "sub-channel" : "channel"}
        </p>

        {/* Description */}
        <div className="mb-5">
          <label className="text-xs text-foreground font-medium block mb-[5px]">
            {isSubchannel ? "About Sub-Channel" : "About Channel"}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description..."
            className="w-full box-border border border-border rounded-[10px] py-[10px] px-[14px] text-xs text-foreground outline-none resize-none h-[90px] bg-primary/5"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`bg-primary text-primary-foreground border-none rounded-full py-[9px] px-[22px] text-xs font-semibold ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            {isLoading ? "Saving..." : btnLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── DeactivateChannelModal ────────────────────────────────────────────────────

function DeactivateChannelModal({ onClose, onConfirm, isLoading, label = "Channel" }: {
  onClose: () => void; onConfirm: (reason: string) => void; isLoading: boolean; label?: string;
}) {
  const [reason, setReason] = useState("");
  const handleConfirm = () => {
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    onConfirm(reason.trim());
  };
  return (
    <Overlay>
      <div className="bg-card rounded-2xl w-[440px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="m-0 text-[15px] font-bold text-foreground">Deactivate {label}</h2>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0 leading-[0]"><CloseIcon /></button>
        </div>
        <p className="text-xs text-muted-foreground m-0 mb-[10px]">Are you sure you want to deactivate this {label.toLowerCase()}?</p>
        <label className="text-[11px] text-foreground font-medium block mb-[6px]">Reason for deactivation *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. No longer in use..."
          className="w-full box-border border border-border rounded-lg bg-muted p-[10px] text-xs resize-none h-[80px] outline-none text-foreground"
        />
        <div className="flex justify-end mt-[14px]">
          <button onClick={handleConfirm} disabled={isLoading} className={`bg-destructive text-destructive-foreground border-none rounded-full py-2 px-[18px] text-xs font-semibold ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
            {isLoading ? "Deactivating..." : `Deactivate ${label}`}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── ActivateChannelModal ──────────────────────────────────────────────────────

function ActivateChannelModal({ onClose, onConfirm, isLoading, label = "Channel" }: {
  onClose: () => void; onConfirm: () => void; isLoading: boolean; label?: string;
}) {
  return (
    <Overlay>
      <div className="bg-card rounded-2xl w-[380px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-[10px]">
          <h2 className="m-0 text-[15px] font-bold text-foreground">Activate {label}</h2>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0 leading-[0]"><CloseIcon /></button>
        </div>
        <p className="text-xs text-muted-foreground m-0 mb-5">Are you sure you want to activate this {label.toLowerCase()}?</p>
        <div className="flex justify-end">
          <button onClick={onConfirm} disabled={isLoading} className={`bg-primary text-primary-foreground border-none rounded-full py-2 px-[18px] text-xs font-semibold ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
            {isLoading ? "Activating..." : `Activate ${label}`}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── ChannelDetailModal ────────────────────────────────────────────────────────

function ChannelDetailModal({ channel, partnerId, onClose, onEditChannel, onDeactivateChannel }: {
  channel: Channel;
  partnerId: Id<"partners">;
  onClose: () => void;
  onEditChannel: (ch: Channel) => void;
  onDeactivateChannel: (ch: Channel) => void;
}) {
  const [subTab, setSubTab] = useState<"active" | "inactive">("active");
  const [subModal, setSubModal] = useState<null | "add" | "edit" | "deactivate" | "activate">(null);
  const [selectedSub, setSelectedSub] = useState<Subchannel | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const allSubs = useQuery(api.channel.getSubchannelsByChannel, { channel_id: channel._id }) as Subchannel[] | undefined;
  const createSubchannel = useMutation(api.channel.createSubchannel);
  const updateSubchannel = useMutation(api.channel.updateSubchannel);
  const deactivateSub = useMutation(api.channel.deactivateSubchannel);
  const activateSub = useMutation(api.channel.activateSubchannel);

  const subs = (allSubs ?? []).filter((s) => s.is_active === (subTab === "active"));

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  const handleCreateSub = async (data: { name: string; code: string; description: string }) => {
    setSubLoading(true);
    try {
      await createSubchannel({ channel_id: channel._id, partner_id: partnerId, name: data.name, prefix_code: data.code || undefined, description: data.description || undefined });
      toast.success("Sub-channel created");
      setSubModal(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSubLoading(false); }
  };

  const handleUpdateSub = async (data: { name: string; code: string; description: string }) => {
    if (!selectedSub) return;
    setSubLoading(true);
    try {
      await updateSubchannel({ id: selectedSub._id, name: data.name, prefix_code: data.code || undefined, description: data.description || undefined });
      toast.success("Sub-channel updated");
      setSubModal(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSubLoading(false); }
  };

  const handleDeactivateSub = async (reason: string) => {
    if (!selectedSub) return;
    setSubLoading(true);
    try {
      await deactivateSub({ id: selectedSub._id, reason });
      toast.success("Sub-channel deactivated");
      setSubModal(null);
      setSelectedSub(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSubLoading(false); }
  };

  const handleActivateSub = async () => {
    if (!selectedSub) return;
    setSubLoading(true);
    try {
      await activateSub({ id: selectedSub._id });
      toast.success("Sub-channel activated");
      setSubModal(null);
      setSelectedSub(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSubLoading(false); }
  };

  return (
    <Overlay>
      <div className="bg-card rounded-2xl w-[calc(100%-24px)] h-[calc(100%-24px)] flex flex-col overflow-hidden shadow-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between py-[14px] px-5 border-b border-border">
          <div className="flex items-center gap-[6px]">
            <span className="text-[11px] text-muted-foreground cursor-pointer" onClick={onClose}>Channels</span>
            <span className="text-muted-foreground"><ChevronRightIcon /></span>
            <span className="text-[11px] text-foreground font-medium">{channel.name}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground bg-transparent border-none cursor-pointer p-0 leading-[0]"><CloseIcon /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — channel info */}
          <div className="w-[210px] shrink-0 p-4 border-r border-border overflow-y-auto">
            {/* Placeholder image */}
            <div className="w-full h-[70px] rounded-lg mb-[14px] bg-chart-3" />

            <p className="m-0 mb-[2px] text-xs font-bold text-foreground">{channel.name}</p>
            <p className="m-0 mb-3 text-[10px] text-muted-foreground leading-snug">{channel.description}</p>

            {channel.code && (
              <div className="mb-2">
                <p className="m-0 mb-[2px] text-[10px] text-muted-foreground">Prefix Code</p>
                <p className="m-0 text-[11px] text-foreground font-medium">{channel.code}</p>
              </div>
            )}
            <div className="mb-2">
              <p className="m-0 mb-[2px] text-[10px] text-muted-foreground">Date Created</p>
              <p className="m-0 text-[11px] text-foreground font-medium">{formatDate(channel.created_at)}</p>
            </div>
            {channel.created_by && (
              <div className="mb-2">
                <p className="m-0 mb-[2px] text-[10px] text-muted-foreground">Created By</p>
                <p className="m-0 text-[11px] text-foreground font-medium">{channel.created_by}</p>
              </div>
            )}
            <div className="mb-2">
              <p className="m-0 mb-1 text-[10px] text-muted-foreground">Status</p>
              <span
                className={`text-[10px] font-semibold py-[2px] px-[10px] rounded-full ${channel.is_active ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}
              >{channel.is_active ? "Active" : "Inactive"}</span>
            </div>

            {!channel.is_active && channel.deactivation_reason && (
              <div className="mb-2">
                <p className="m-0 mb-[2px] text-[10px] text-muted-foreground">Deactivation Reason</p>
                <p className="m-0 text-[10px] text-destructive leading-snug">{channel.deactivation_reason}</p>
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button onClick={() => onEditChannel(channel)} className="text-primary bg-transparent border-none cursor-pointer p-1 leading-[0]">
                <PencilIcon />
              </button>
              {channel.is_active && (
                <button onClick={() => onDeactivateChannel(channel)} className="text-destructive bg-transparent border-none cursor-pointer p-1 leading-[0]">
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {/* Right panel — sub-channels */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="m-0 text-[13px] font-bold text-foreground">Sub-channels</h3>
              <button
                onClick={() => { setSelectedSub(null); setSubModal("add"); }}
                className="bg-primary text-primary-foreground flex items-center gap-[5px] border-none rounded-md py-[6px] px-[10px] text-[11px] font-semibold cursor-pointer"
              >
                <PlusIcon />
                Add Sub-channel
              </button>
            </div>

            {/* Sub-channel tabs */}
            <div className="flex gap-4 border-b border-border mb-[10px]">
              {(["active", "inactive"] as const).map((t) => (
                <button key={t} onClick={() => setSubTab(t)} className={`bg-transparent border-none cursor-pointer text-[11px] font-semibold pb-[7px] capitalize -mb-px border-b-2 ${subTab === t ? "text-primary border-primary" : "text-muted-foreground border-transparent"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Sub-channel rows */}
            {subs.length === 0 ? (
              <div className="py-[30px] px-4 text-center">
                <p className="m-0 mb-1 text-xs font-semibold text-foreground">
                  {subTab === "active" ? "No sub-channels yet" : "No inactive sub-channels"}
                </p>
                <p className="m-0 mb-3 text-[11px] text-muted-foreground">
                  {subTab === "active" ? "Add sub-channels to organize this channel further." : "Deactivated sub-channels appear here."}
                </p>
                {subTab === "active" && (
                  <button
                    onClick={() => { setSelectedSub(null); setSubModal("add"); }}
                    className="bg-primary text-primary-foreground border-none rounded-md py-[6px] px-3 text-[11px] font-semibold cursor-pointer"
                  >
                    Add sub-channel
                  </button>
                )}
              </div>
            ) : (
              subs.map((sc) => (
                <div key={sc._id} className="flex items-center py-2 border-b border-border">
                  <div className="flex-[0_0_140px]">
                    <div className="text-[9px] text-muted-foreground">Date Created</div>
                    <div className="text-[11px] text-foreground font-medium">{formatDate(sc.created_at)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[5px]">
                      <span className="text-[11px] text-foreground font-semibold">{sc.name}</span>
                      {sc.prefix_code && (
                        <span className="text-[9px] font-semibold py-[1px] px-[6px] rounded-full text-primary bg-primary/10">
                          {sc.prefix_code}
                        </span>
                      )}
                    </div>
                    {subTab === "inactive" && sc.deactivation_reason && (
                      <div className="text-[9px] text-destructive mt-[1px]">
                        Reason: {sc.deactivation_reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedSub(sc); setSubModal("edit"); }} className="text-primary bg-transparent border-none cursor-pointer p-[3px] leading-[0]">
                      <PencilIcon />
                    </button>
                    {subTab === "active" ? (
                      <button onClick={() => { setSelectedSub(sc); setSubModal("deactivate"); }} className="text-destructive bg-transparent border-none cursor-pointer p-[3px] leading-[0]">
                        <TrashIcon />
                      </button>
                    ) : (
                      <button onClick={() => { setSelectedSub(sc); setSubModal("activate"); }} className="text-primary bg-transparent border-none cursor-pointer p-[3px] leading-[0]">
                        <RestoreIcon />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-muted-foreground">Page <strong>1</strong> of {Math.max(1, Math.ceil(subs.length / 10))}</span>
              <div className="flex gap-[6px]">
                {["Previous", "Next"].map((l) => (
                  <button key={l} className="bg-card border border-border rounded-md py-1 px-[10px] text-[10px] text-foreground cursor-pointer">{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-channel modals — rendered inside ChannelDetailModal */}
        {subModal === "add" && (
          <ChannelFormModal
            onClose={() => setSubModal(null)}
            title="Add Sub-channel" subtitle="Create and manage sub-channel" btnLabel="Add Sub-channel"
            isSubchannel onSubmit={handleCreateSub} isLoading={subLoading}
          />
        )}
        {subModal === "edit" && selectedSub && (
          <ChannelFormModal
            onClose={() => { setSubModal(null); setSelectedSub(null); }}
            title="Edit Sub-channel" btnLabel="Save Changes"
            isSubchannel
            initial={{ name: selectedSub.name, code: selectedSub.prefix_code, description: selectedSub.description }}
            onSubmit={handleUpdateSub} isLoading={subLoading}
          />
        )}
        {subModal === "deactivate" && (
          <DeactivateChannelModal label="Sub-channel" onClose={() => { setSubModal(null); setSelectedSub(null); }} onConfirm={handleDeactivateSub} isLoading={subLoading} />
        )}
        {subModal === "activate" && (
          <ActivateChannelModal label="Sub-channel" onClose={() => { setSubModal(null); setSelectedSub(null); }} onConfirm={handleActivateSub} isLoading={subLoading} />
        )}
      </div>
    </Overlay>
  );
}

// ── ChannelsPanel ─────────────────────────────────────────────────────────────

function ChannelsPanel({ partnerId, createdBy }: { partnerId: Id<"partners">; createdBy?: string }) {
  const [channelsTab, setChannelsTab] = useState<"active" | "inactive">("active");
  const [channelPage, setChannelPage] = useState(1);
  const [modal, setModal] = useState<null | "add" | "edit" | "deactivate" | "activate" | "detail">(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const allChannels = useQuery(api.channel.getChannelsByPartner, { partnerId }) as Channel[] | undefined;
  const createChannel = useMutation(api.channel.createChannel);
  const updateChannel = useMutation(api.channel.updateChannel);
  const deactivateChannel = useMutation(api.channel.deactivateChannel);
  const activateChannel = useMutation(api.channel.activateChannel);

  const channels = (allChannels ?? []).filter((c) => c.is_active === (channelsTab === "active"));
  const channelTotalPages = Math.max(1, Math.ceil(channels.length / PAGE_SIZE));
  const paginatedChannels = channels.slice((channelPage - 1) * PAGE_SIZE, channelPage * PAGE_SIZE);

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  const handleCreate = async (data: { name: string; code: string; description: string }) => {
    setActionLoading(true);
    try {
      await createChannel({ partnerId, name: data.name, code: data.code, description: data.description, created_by: createdBy });
      toast.success("Channel created");
      setModal(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed to create channel"); }
    finally { setActionLoading(false); }
  };

  const handleUpdate = async (data: { name: string; code: string; description: string }) => {
    if (!selectedChannel) return;
    setActionLoading(true);
    try {
      await updateChannel({ id: selectedChannel._id, name: data.name, code: data.code, description: data.description });
      toast.success("Channel updated");
      setModal(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed to update channel"); }
    finally { setActionLoading(false); }
  };

  const handleDeactivate = async (reason: string) => {
    if (!selectedChannel) return;
    setActionLoading(true);
    try {
      await deactivateChannel({ id: selectedChannel._id, reason });
      toast.success("Channel deactivated");
      setModal(null); setSelectedChannel(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleActivate = async () => {
    if (!selectedChannel) return;
    setActionLoading(true);
    try {
      await activateChannel({ id: selectedChannel._id });
      toast.success("Channel activated");
      setModal(null); setSelectedChannel(null);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-5">
            {(["active", "inactive"] as const).map((t) => (
              <button key={t} onClick={() => { setChannelsTab(t); setChannelPage(1); }} className={`bg-transparent border-none cursor-pointer text-xs font-semibold pb-2 capitalize -mb-px border-b-2 ${channelsTab === t ? "text-primary border-primary" : "text-muted-foreground border-transparent"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setSelectedChannel(null); setModal("add"); }}
            className="bg-primary text-primary-foreground flex items-center gap-[5px] border-none rounded-md py-[7px] px-3 text-[11px] font-semibold cursor-pointer"
          >
            <PlusIcon />
            Add Channel
          </button>
        </div>

        {/* Rows */}
        {channels.length === 0 ? (
          <div className="py-[40px] px-8 text-center">
            <div className="text-[28px] mb-2">📡</div>
            <p className="m-0 mb-1 text-[13px] font-semibold text-foreground">
              {channelsTab === "active" ? "No channels yet" : "No inactive channels"}
            </p>
            <p className="m-0 mb-4 text-xs text-muted-foreground">
              {channelsTab === "active" ? "Add your first channel to organize your campaigns." : "Deactivated channels will appear here."}
            </p>
            {channelsTab === "active" && (
              <button
                onClick={() => { setSelectedChannel(null); setModal("add"); }}
                className="bg-primary text-primary-foreground border-none rounded-md py-[7px] px-[14px] text-xs font-semibold cursor-pointer"
              >
                Add your first channel
              </button>
            )}
          </div>
        ) : (
          paginatedChannels.map((ch) => (
            <div key={ch._id} className="flex items-center py-[10px] px-4 border-b border-border">
              <div className="flex-[0_0_200px]">
                <div className="text-[10px] text-muted-foreground">Date Created</div>
                <div className="text-[11px] text-foreground font-medium mt-[2px]">{formatDate(ch.created_at)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[6px] flex-wrap">
                  <span className="text-xs text-foreground font-semibold">{ch.name}</span>
                  {ch.code && (
                    <span className="text-[9px] font-semibold py-[1px] px-[7px] rounded-full text-primary bg-primary/10">
                      {ch.code}
                    </span>
                  )}
                </div>
                {ch.description && (
                  <div className="text-[10px] text-muted-foreground mt-[2px] truncate">
                    {ch.description}
                  </div>
                )}
                {channelsTab === "inactive" && ch.deactivation_reason && (
                  <div className="text-[10px] text-destructive mt-[2px]">
                    Reason: {ch.deactivation_reason}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-[10px]">
                {channelsTab === "active" ? (
                  <button onClick={() => { setSelectedChannel(ch); setModal("detail"); }} className="text-primary bg-transparent border-none cursor-pointer p-1 leading-[0]">
                    <EyeIcon />
                  </button>
                ) : (
                  <button onClick={() => { setSelectedChannel(ch); setModal("edit"); }} className="text-primary bg-transparent border-none cursor-pointer p-1 leading-[0]">
                    <PencilIcon />
                  </button>
                )}
                <button
                  onClick={() => { setSelectedChannel(ch); setModal(channelsTab === "active" ? "deactivate" : "activate"); }}
                  className={channelsTab === "active" ? "text-destructive bg-transparent border-none cursor-pointer p-1 leading-[0]" : "text-primary bg-transparent border-none cursor-pointer p-1 leading-[0]"}
                >
                  {channelsTab === "active" ? <TrashIcon /> : <RestoreIcon />}
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {channels.length > 0 && (
          <div className="flex items-center justify-between mt-[14px] px-1">
            <span className="text-[11px] text-muted-foreground">Page <strong>{channelPage}</strong> of {channelTotalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setChannelPage((p) => Math.max(1, p - 1))}
                disabled={channelPage === 1}
                className={`bg-card border border-border rounded-md py-[5px] px-3 text-[11px] text-foreground font-medium ${channelPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >Previous</button>
              <button
                onClick={() => setChannelPage((p) => Math.min(channelTotalPages, p + 1))}
                disabled={channelPage === channelTotalPages}
                className={`bg-card border border-border rounded-md py-[5px] px-3 text-[11px] text-foreground font-medium ${channelPage === channelTotalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "add" && (
        <ChannelFormModal onClose={() => setModal(null)} title="Add Channel" subtitle="Create and manage channel" btnLabel="Add Channel" onSubmit={handleCreate} isLoading={actionLoading} />
      )}
      {modal === "edit" && selectedChannel && (
        <ChannelFormModal
          onClose={() => { setModal(null); setSelectedChannel(null); }}
          title="Edit Channel" btnLabel="Save Changes"
          initial={{ name: selectedChannel.name, code: selectedChannel.code, description: selectedChannel.description }}
          onSubmit={handleUpdate} isLoading={actionLoading}
        />
      )}
      {modal === "deactivate" && (
        <DeactivateChannelModal onClose={() => { setModal(null); setSelectedChannel(null); }} onConfirm={handleDeactivate} isLoading={actionLoading} />
      )}
      {modal === "activate" && (
        <ActivateChannelModal onClose={() => { setModal(null); setSelectedChannel(null); }} onConfirm={handleActivate} isLoading={actionLoading} />
      )}
      {modal === "detail" && selectedChannel && (
        <ChannelDetailModal
          channel={selectedChannel}
          partnerId={partnerId}
          onClose={() => { setModal(null); setSelectedChannel(null); }}
          onEditChannel={(ch) => { setSelectedChannel(ch); setModal("edit"); }}
          onDeactivateChannel={(ch) => { setSelectedChannel(ch); setModal("deactivate"); }}
        />
      )}
    </>
  );
}

// ── Main SettingsSection ───────────────────────────────────────────────────────

export default function SettingsSection() {
  const { user, partner, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "roles" | "channels">("profile");
  const [profileModal, setProfileModal] = useState<null | "contact" | "social">(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Not authenticated. Please sign in.</p>
      </div>
    );
  }

  const displayName = isConvexUser(user) ? user.name : (partner?.name ?? "");
  const displayEmail = isConvexUser(user) ? user.email : (partner?.email ?? "");
  const displayPhone = isConvexUser(user) ? (user.phone ?? "") : (partner?.phone ?? "");
  const userRole = isConvexUser(user) ? user.role : "partner_admin";
  const userId = isConvexUser(user) ? user._id : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <ThemeButton theme={theme} setTheme={setTheme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border border-muted">
            <CardContent className="p-4 space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "roles"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Roles & Permissions
              </button>
              <button
                onClick={() => setActiveTab("channels")}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "channels"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Channels
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <>
              <div className="flex gap-4">
                {/* Left card */}
                <div className="w-[190px] shrink-0 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  {/* Gradient banner */}
                  <div className="h-[80px] relative" style={{ background: "linear-gradient(135deg,#c084fc 0%,#a78bfa 40%,#fbcfe8 100%)" }}>
                    <div className="absolute -bottom-5 left-[14px]">
                      <div className="relative w-[44px] h-[44px]">
                        <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center overflow-hidden bg-primary border-[2.5px] border-card">
                          <span className="text-sm font-bold text-primary-foreground">{getInitials(displayName)}</span>
                        </div>
                        <div className="absolute bottom-px right-px w-[10px] h-[10px] rounded-full" style={{ background: "#22c55e", border: "2px solid var(--card)" }} />
                      </div>
                    </div>
                  </div>
                  {/* User info */}
                  <div className="pt-7 px-[14px] pb-[14px]">
                    <p className="m-0 mb-[6px] text-[13px] font-bold text-foreground">{displayName}</p>
                    <div className="mb-3">
                      <span className="text-[9px] font-semibold py-[2px] px-2 rounded-full text-primary bg-primary/15">
                        {ROLE_LABELS[userRole] ?? userRole}
                      </span>
                    </div>
                    <p className="m-0 mb-[3px] text-[9px] text-muted-foreground font-medium">Contact Information</p>
                    <p className="m-0 mb-[2px] text-[11px] text-foreground">{displayPhone || "—"}</p>
                    <p className="m-0 text-[11px] text-foreground">{displayEmail || "—"}</p>
                  </div>
                </div>

                {/* Right column */}
                <div className="flex-1 flex flex-col gap-3">

                  {/* Profile Pic card */}
                  <div className="bg-card rounded-xl py-[14px] px-4 border border-border shadow-sm">
                    <p className="m-0 mb-[10px] text-xs font-semibold text-foreground">Profile Pic</p>
                    <div className="flex items-center gap-[14px]">
                      <div className="w-[60px] h-[70px] rounded-lg shrink-0 flex items-center justify-center bg-muted">
                        <span className="text-[18px] font-bold text-muted-foreground">{getInitials(displayName)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-[5px] mb-1 opacity-50">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span className="text-xs font-medium text-foreground">Change Profile Pic</span>
                        </div>
                        <p className="m-0 mb-[1px] text-[10px] text-muted-foreground">At least 800×800px recommended</p>
                        <p className="m-0 text-[10px] text-muted-foreground">Format JPG or PNG</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details card */}
                  <div className="bg-card rounded-xl py-[14px] px-4 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="m-0 text-xs font-semibold text-foreground">Contact Details</p>
                      {userId && (
                        <button onClick={() => setProfileModal("contact")} className="text-primary bg-transparent border-none cursor-pointer text-[11px] font-medium p-0">Edit</button>
                      )}
                    </div>
                    <p className="m-0 mb-[2px] text-xs text-foreground">{displayPhone || "—"}</p>
                    <p className="m-0 text-xs text-foreground">{displayEmail || "—"}</p>
                  </div>

                  {/* Social Media card */}
                  <div className="bg-card rounded-xl py-[14px] px-4 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-[10px]">
                      <p className="m-0 text-xs font-semibold text-foreground">Social Media</p>
                      {partner?._id && (
                        <button onClick={() => setProfileModal("social")} className="text-primary bg-transparent border-none cursor-pointer text-[11px] font-medium p-0">Edit</button>
                      )}
                    </div>
                    <div className="flex flex-col gap-[7px]">
                      {([
                        { platform: "twitter", icon: <XSocialIcon />, bg: "#000", handle: partner?.social_media?.twitter },
                        { platform: "linkedin", icon: <LinkedInSocialIcon />, bg: "#e0f0ff", handle: partner?.social_media?.linkedin },
                        { platform: "instagram", icon: <InstagramSocialIcon />, bg: "transparent", handle: partner?.social_media?.instagram },
                        { platform: "facebook", icon: <FacebookSocialIcon />, bg: "transparent", handle: partner?.social_media?.facebook },
                      ]).map((s) => (
                        <div key={s.platform} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: s.bg }}>
                            {s.icon}
                          </div>
                          <span className={`text-[11px] ${s.handle ? "text-foreground" : "text-muted-foreground"}`}>{s.handle || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Sub-modals */}
              {profileModal === "contact" && userId && (
                <EditContactModal
                  onClose={() => setProfileModal(null)}
                  initialPhone={displayPhone}
                  initialEmail={displayEmail}
                  userId={userId}
                />
              )}
              {profileModal === "social" && partner?._id && (
                <EditSocialModal
                  onClose={() => setProfileModal(null)}
                  initial={partner.social_media ?? {}}
                  partnerId={partner._id}
                />
              )}
            </>
          )}

          {activeTab === "roles" && (
            <div>
              <h2 className="text-sm font-bold text-foreground m-0 mb-4">
                Roles & Permissions
              </h2>
              <RolesPanel />
            </div>
          )}

          {activeTab === "channels" && partner?._id && (
            <div>
              <h2 className="text-sm font-bold text-foreground m-0 mb-4">
                Channels
              </h2>
              <ChannelsPanel
                partnerId={partner._id}
                createdBy={isConvexUser(user) ? user.name : partner.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
