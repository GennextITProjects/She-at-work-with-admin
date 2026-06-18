// app/dashboard/admin/site-settings/AdminSiteSettings.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Edit,
  Plus,
  RefreshCw,
  Search,
  X,
  XCircle,
  Settings,
  Trash2,
  Check,
  Globe,
  Tag,
  Hash,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SettingItem = {
  id: string;
  key: string;
  value: string;
  label: string;
  group: string;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const GROUPS = [
  { label: "Hero Stats", value: "hero-stats" },
  { label: "Categories", value: "categories" },
  { label: "General", value: "general" },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminSiteSettings() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<SettingItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [group, setGroup] = useState(searchParams.get("group") || "");
  const [search, setSearch] = useState("");
  const [debSearch, setDebSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    label: "",
    group: "general",
    isActive: true,
  });

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Debounce search
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      setDebSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [group]);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(false);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: "20" });
      if (group) sp.set("group", group);
      if (debSearch) sp.set("search", debSearch);
      const res = await fetch(`/api/admin/site-settings?${sp}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.data ?? []);
      setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, group, debSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create setting");
      }
      showToast("Setting created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to create setting", "error");
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingItem.id, ...formData }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update setting");
      }
      showToast("Setting updated successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to update setting", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this setting?")) return;
    try {
      const res = await fetch(`/api/admin/site-settings?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      showToast("Setting deleted successfully");
      fetchData();
    } catch {
      showToast("Failed to delete setting", "error");
    }
  };

  const handleEdit = (item: SettingItem) => {
    setEditingItem(item);
    setFormData({
      key: item.key,
      value: item.value,
      label: item.label,
      group: item.group,
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      key: "",
      value: "",
      label: "",
      group: "general",
      isActive: true,
    });
  };

  const toggleActive = async (item: SettingItem) => {
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      });
      if (!res.ok) throw new Error();
      showToast(`Setting ${item.isActive ? "deactivated" : "activated"}`);
      fetchData();
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const getGroupIcon = (group: string) => {
    switch (group) {
      case "hero-stats":
        return <Hash className="h-3.5 w-3.5" />;
      case "categories":
        return <Tag className="h-3.5 w-3.5" />;
      default:
        return <Settings className="h-3.5 w-3.5" />;
    }
  };

  const getGroupLabel = (group: string) => {
    const found = GROUPS.find((g) => g.value === group);
    return found ? found.label : group;
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-600 text-white shadow-lg text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage all site configuration and static values
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" /> Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Setting" : "Create New Setting"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update the values for this setting"
                  : "Add a new configuration value to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  placeholder="e.g., stat_articles"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  disabled={!!editingItem}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Articles Count"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Value</Label>
                <Textarea
                  id="value"
                  placeholder="e.g., 975 or k+"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group">Group</Label>
                <Select
                  value={formData.group}
                  onValueChange={(value) =>
                    setFormData({ ...formData, group: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUPS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="text-sm font-normal">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingItem ? handleUpdate : handleCreate}>
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + refresh */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by key, label or value…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchData}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Group tabs */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => setGroup("")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            !group
              ? "bg-primary text-white border-primary"
              : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
          )}
        >
          All
        </button>
        {GROUPS.map((g) => (
          <button
            key={g.value}
            onClick={() => setGroup(g.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
              group === g.value
                ? "bg-primary text-white border-primary"
                : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            {getGroupIcon(g.value)}
            {g.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {pagination.total} setting{pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-52">
          <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3">
          <XCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load settings</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3">
          <Settings className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No settings found</p>
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add your first setting
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Key
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Label
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Value
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Group
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/20",
                    !item.isActive && "opacity-50"
                  )}
                >
                  {/* Key */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {item.key}
                      </code>
                    </div>
                  </td>

                  {/* Label */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm">{item.label}</span>
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{item.value}</span>
                  </td>

                  {/* Group */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline" className="gap-1">
                      {getGroupIcon(item.group)}
                      {getGroupLabel(item.group)}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge
                      variant={item.isActive ? "default" : "secondary"}
                      className={cn(
                        "gap-1",
                        item.isActive
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      )}
                    >
                      {item.isActive ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleActive(item)}
                        title={item.isActive ? "Deactivate" : "Activate"}
                      >
                        {item.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}