"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, AlertCircle, Check } from "lucide-react";

const fullNameSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(255),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FullNameInput = z.infer<typeof fullNameSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

interface UserData {
  email: string;
  full_name: string | null;
}

export default function AccountSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fullNameForm = useForm<FullNameInput>({
    resolver: zodResolver(fullNameSchema) as Resolver<FullNameInput>,
    defaultValues: { full_name: "" },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema) as Resolver<PasswordInput>,
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        setUserData(data);
        fullNameForm.reset({ full_name: data.full_name || "" });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load account details");
      })
      .finally(() => setIsLoading(false));
  }, [fullNameForm]);

  async function handleSaveFullName(values: FullNameInput) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: values.full_name }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update full name");
      }

      setUserData((prev) => prev ? { ...prev, full_name: values.full_name } : null);
      toast.success("Full name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update full name");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(values: PasswordInput) {
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: values.current_password,
          new_password: values.new_password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to change password");
      }

      toast.success("Password changed successfully");
      passwordForm.reset();
      setShowPasswordForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-[#8C8C8C]" /></div>;
  }

  if (!userData) {
    return (
      <div className="space-y-8 max-w-xl">
        <PageHeader title="Account settings" description="Manage your personal account." />
        <div className="text-center py-8">
          <p className="text-[#8C8C8C]">Failed to load account details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader title="Account settings" description="Manage your personal account." />

      {/* Email section */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Email address</Label>
          <p className="text-xs text-[#8C8C8C] mt-0.5">Your email address is used to sign in to your account.</p>
        </div>
        <div className="relative">
          <Input
            type="email"
            value={userData.email}
            disabled
            className="bg-[#F7F6F4] text-[#525252] cursor-not-allowed"
          />
          <p className="text-xs text-[#8C8C8C] mt-2">
            To change your email address, please <a href="mailto:hello@knownobjects.io" className="text-[#0e6dea] hover:underline">contact support</a>.
          </p>
        </div>
      </div>

      <div className="border-t border-[#F0F0EE]" />

      {/* Full name section */}
      <form onSubmit={fullNameForm.handleSubmit(handleSaveFullName as Parameters<typeof fullNameForm.handleSubmit>[0])} className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Full name</Label>
          <p className="text-xs text-[#8C8C8C] mt-0.5">Your name as it appears in team invites and shared documents.</p>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Your full name"
            {...fullNameForm.register("full_name")}
          />
          {fullNameForm.formState.errors.full_name && (
            <p className="text-xs text-red-600">{fullNameForm.formState.errors.full_name.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSaving || !fullNameForm.formState.isDirty}>
          {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save name"}
        </Button>
      </form>

      <div className="border-t border-[#F0F0EE]" />

      {/* Password section */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Password</Label>
          <p className="text-xs text-[#8C8C8C] mt-0.5">Change your password to keep your account secure.</p>
        </div>

        {!showPasswordForm ? (
          <Button
            variant="outline"
            onClick={() => setShowPasswordForm(true)}
            className="w-full sm:w-auto"
          >
            <Lock className="h-4 w-4 mr-2" />
            Change password
          </Button>
        ) : (
          <form onSubmit={passwordForm.handleSubmit(handleChangePassword as Parameters<typeof passwordForm.handleSubmit>[0])} className="space-y-3 border border-[#E8E8E6] rounded-xl p-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-sm">Current password</Label>
              <Input
                id="current_password"
                type="password"
                placeholder="Enter your current password"
                {...passwordForm.register("current_password")}
              />
              {passwordForm.formState.errors.current_password && (
                <p className="text-xs text-red-600">{passwordForm.formState.errors.current_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-sm">New password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter a new password (min 8 characters)"
                {...passwordForm.register("new_password")}
              />
              {passwordForm.formState.errors.new_password && (
                <p className="text-xs text-red-600">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-sm">Confirm new password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm your new password"
                {...passwordForm.register("confirm_password")}
              />
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-xs text-red-600">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Changing…</> : "Change password"}
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setShowPasswordForm(false);
                passwordForm.reset();
              }}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
