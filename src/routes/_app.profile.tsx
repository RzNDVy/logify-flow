import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — WAMS" },
      { name: "description", content: "Manage your WAMS profile." },
      { property: "og:title", content: "Profile — WAMS" },
      { property: "og:description", content: "Manage your WAMS profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [busy, setBusy] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ name, jobTitle, department });
      toast.success("Profile updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Profile"
        description="Update your personal information."
        actions={
          <Button asChild variant="outline">
            <Link to="/change-password">Change password</Link>
          </Button>
        }
      />
      <Card className="p-6">
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job">Job title</Label>
              <Input id="job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept">Department</Label>
              <Input id="dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
