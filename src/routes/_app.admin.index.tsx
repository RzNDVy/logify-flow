import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useUsers, useUpdateUser, useDeleteUser, useCreateUser, useUpdateUserPassword } from "@/hooks/useUsers";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, KeyRound, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role, User } from "@/types/domain";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({
    meta: [
      { title: "Users — WAMS Admin" },
      { name: "description", content: "Manage WAMS users." },
      { property: "og:title", content: "Users — WAMS Admin" },
      { property: "og:description", content: "Manage WAMS users." },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users = [] } = useUsers({ search: search || undefined });
  const update = useUpdateUser();
  const del = useDeleteUser();
  const create = useCreateUser();
  const updatePassword = useUpdateUserPassword();
  const [open, setOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New user
            </Button>
          </DialogTrigger>
          <NewUserDialog onDone={() => setOpen(false)} onCreate={create.mutateAsync} />
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.jobTitle} {u.department && `· ${u.department}`}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === "active" ? "default" : "outline"}>
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          update.mutate({
                            id: u.id,
                            patch: { status: u.status === "active" ? "inactive" : "active" },
                          })
                        }
                      >
                        Set {u.status === "active" ? "inactive" : "active"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          update.mutate({
                            id: u.id,
                            patch: { role: u.role === "admin" ? "user" : "admin" },
                          })
                        }
                      >
                        Make {u.role === "admin" ? "user" : "admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPasswordUser(u)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Change password
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => del.mutate(u.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {passwordUser && (
        <EditPasswordDialog
          user={passwordUser}
          onDone={() => setPasswordUser(null)}
          onUpdate={async (password) => {
            await updatePassword.mutateAsync({ userId: passwordUser.id, password });
          }}
        />
      )}
    </div>
  );
}

function NewUserDialog({
  onDone,
  onCreate,
}: {
  onDone: () => void;
  onCreate: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New user</DialogTitle>
      </DialogHeader>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await onCreate({ name, email, password, role });
          onDone();
        }}
      >
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Temporary password</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full">
          Create user
        </Button>
      </form>
    </DialogContent>
  );
}

function EditPasswordDialog({
  user,
  onDone,
  onUpdate,
}: {
  user: User;
  onDone: () => void;
  onUpdate: (password: string) => Promise<unknown>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setSubmitting(true);
      await onUpdate(password);
      onDone();
    } catch {
      // Toast notification is already handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onDone(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change user password</DialogTitle>
          <DialogDescription>
            Ubah password untuk <span className="font-medium text-foreground">{user.name}</span> ({user.email}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm font-medium text-destructive">{error}</div>}
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password baru"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
