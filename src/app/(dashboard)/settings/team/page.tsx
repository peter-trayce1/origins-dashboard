"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Mail } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: string;
  accepted_at: string | null;
  users: { email: string; full_name: string | null } | null;
  invite_email?: string;
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    if (res.ok) {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed to send invite");
    }
    setIsInviting(false);
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this team member? They will lose access immediately.")) return;
    const res = await fetch(`/api/team/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Team member removed");
    } else {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader title="Team" description="Manage who has access to your brand's passports." />

      {/* Invite */}
      <div className="border border-[#E8E8E6] rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-black">Invite a team member</p>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Email address</Label>
            <Input
              type="email"
              placeholder="colleague@brand.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <select
              className="h-9 border border-[#E8E8E6] rounded-lg px-3 text-sm bg-white"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
            {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
            Invite
          </Button>
        </div>
      </div>

      {/* Members list */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-black">Members</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#8C8C8C]" /></div>
        ) : members.length === 0 ? (
          <p className="text-sm text-[#8C8C8C] py-4">No team members yet.</p>
        ) : (
          <div className="border border-[#E8E8E6] rounded-xl divide-y divide-[#E8E8E6]">
            {members.map((m) => {
              const user = m.users as { email: string; full_name: string | null } | null;
              const email = user?.email ?? m.invite_email ?? "—";
              const name = user?.full_name;
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[#F4F4F3] flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[#525252]">
                        {email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      {name && <p className="text-sm font-medium text-black truncate">{name}</p>}
                      <p className="text-xs text-[#8C8C8C] truncate">{email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!m.accepted_at && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                    <span className="text-xs bg-[#F4F4F3] text-[#525252] px-2 py-0.5 rounded-full capitalize">{m.role}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8C8C8C] hover:text-red-600" onClick={() => removeMember(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-[#8C8C8C]">
        <strong>Admin</strong> — full access including settings and invites. <strong>Editor</strong> — can create and edit passports. <strong>Viewer</strong> — read-only access.
      </div>
    </div>
  );
}
