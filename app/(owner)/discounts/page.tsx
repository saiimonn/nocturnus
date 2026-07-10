"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { discountCodes as initialCodes } from "@/lib/mock-data-owner";
import type { DiscountCode } from "@/lib/types";

const PAGE_SIZE = 8;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<DiscountCode["discount_type"]>(
    "percentage",
  );
  const [newValue, setNewValue] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newUsageLimit, setNewUsageLimit] = useState("");
  const [newMinOrder, setNewMinOrder] = useState("");

  const [editCode, setEditCode] = useState("");
  const [editType, setEditType] = useState<DiscountCode["discount_type"]>(
    "percentage",
  );
  const [editValue, setEditValue] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editUsageLimit, setEditUsageLimit] = useState("");
  const [editMinOrder, setEditMinOrder] = useState("");

  const totalPages = Math.max(1, Math.ceil(codes.length / PAGE_SIZE));
  const paginatedCodes = codes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetAddForm = () => {
    setNewCode("");
    setNewType("percentage");
    setNewValue("");
    setNewStartDate("");
    setNewEndDate("");
    setNewUsageLimit("");
    setNewMinOrder("");
  };

  const resetEditForm = () => {
    setEditCode("");
    setEditType("percentage");
    setEditValue("");
    setEditStartDate("");
    setEditEndDate("");
    setEditUsageLimit("");
    setEditMinOrder("");
  };

  const handleAddCode = () => {
    if (
      !newCode.trim() ||
      !newValue.trim() ||
      !newStartDate.trim() ||
      !newEndDate.trim() ||
      !newUsageLimit.trim() ||
      !newMinOrder.trim()
    )
      return;

    const nextCode: DiscountCode = {
      id: crypto.randomUUID(),
      club_id: initialCodes[0]?.club_id ?? "",
      code: newCode.trim().toUpperCase(),
      discount_type: newType,
      discount_value: Number(newValue),
      start_date: new Date(`${newStartDate}T00:00:00`).toISOString(),
      end_date: new Date(`${newEndDate}T23:59:59`).toISOString(),
      usage_limit: Number(newUsageLimit),
      times_used: 0,
      is_active: true,
      min_order_value: Number(newMinOrder),
    };

    setCodes((prev) => [nextCode, ...prev]);
    setIsAddOpen(false);
    resetAddForm();
  };

  const handleOpenEdit = (id: string) => {
    const code = codes.find((c) => c.id === id);
    if (!code) return;
    setEditId(id);
    setEditCode(code.code);
    setEditType(code.discount_type);
    setEditValue(String(code.discount_value));
    setEditStartDate(code.start_date.slice(0, 10));
    setEditEndDate(code.end_date.slice(0, 10));
    setEditUsageLimit(String(code.usage_limit));
    setEditMinOrder(String(code.min_order_value));
    setIsEditOpen(true);
  };

  const handleEditSave = () => {
    if (editId === null) return;
    if (
      !editCode.trim() ||
      !editValue.trim() ||
      !editStartDate.trim() ||
      !editEndDate.trim() ||
      !editUsageLimit.trim() ||
      !editMinOrder.trim()
    )
      return;

    setCodes((prev) =>
      prev.map((code) =>
        code.id === editId
          ? {
              ...code,
              code: editCode.trim().toUpperCase(),
              discount_type: editType,
              discount_value: Number(editValue),
              start_date: new Date(`${editStartDate}T00:00:00`).toISOString(),
              end_date: new Date(`${editEndDate}T23:59:59`).toISOString(),
              usage_limit: Number(editUsageLimit),
              min_order_value: Number(editMinOrder),
            }
          : code,
      ),
    );

    setIsEditOpen(false);
    setEditId(null);
    resetEditForm();
  };

  const handleToggleActive = (id: string) => {
    setCodes((prev) =>
      prev.map((code) =>
        code.id === id ? { ...code, is_active: !code.is_active } : code,
      ),
    );
  };

  const handleDeleteCode = (id: string) => {
    if (!window.confirm("Delete this discount code? This action cannot be undone.")) {
      return;
    }
    setCodes((prev) => prev.filter((c) => c.id !== id));
    const newTotal = Math.max(1, Math.ceil((codes.length - 1) / PAGE_SIZE));
    if (page > newTotal) setPage(newTotal);
  };

  const canSubmitNew =
    newCode.trim().length > 0 &&
    newValue.trim().length > 0 &&
    newStartDate.trim().length > 0 &&
    newEndDate.trim().length > 0 &&
    newUsageLimit.trim().length > 0 &&
    newMinOrder.trim().length > 0;

  const canSubmitEdit =
    editCode.trim().length > 0 &&
    editValue.trim().length > 0 &&
    editStartDate.trim().length > 0 &&
    editEndDate.trim().length > 0 &&
    editUsageLimit.trim().length > 0 &&
    editMinOrder.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Discount Codes
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage promotional codes for your club.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="px-4">
          <Plus />
          Add Code
        </Button>
      </div>

      {codes.length === 0 ? (
        <div className="flex min-h-90 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <h3 className="text-xl font-semibold text-foreground">
            No discount codes
          </h3>
          <p className="text-sm text-muted-foreground">
            Create your first promo code to attract more bookings.
          </p>
          <Button
            variant="outline"
            className="px-4"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus />
            Add Code
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-background shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. Spend</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCodes.map((code) => {
                  const usagePercent =
                    code.usage_limit > 0
                      ? Math.round((code.times_used / code.usage_limit) * 100)
                      : 0;
                  return (
                    <TableRow key={code.id}>
                      <TableCell>
                        <span className="font-mono font-semibold text-foreground">
                          {code.code}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {code.discount_type === "percentage"
                          ? `${code.discount_value}%`
                          : formatCurrency(code.discount_value)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(code.min_order_value)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(code.start_date)} –{" "}
                        {formatDate(code.end_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {code.times_used}/{code.usage_limit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            code.is_active
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {code.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggleActive(code.id)}
                            title={
                              code.is_active ? "Deactivate" : "Activate"
                            }
                          >
                            {code.is_active ? (
                              <ToggleRight className="size-4" />
                            ) : (
                              <ToggleLeft className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEdit(code.id)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteCode(code.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Discount Code</DialogTitle>
            <DialogDescription>
              Create a new promotional code for table bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Code
              </label>
              <Input
                placeholder="SUMMER20"
                value={newCode}
                onChange={(event) => setNewCode(event.target.value)}
              />
              {!newCode.trim() && (
                <span className="text-xs text-destructive">
                  Code is required.
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Type
                </label>
                <select
                  className="rounded-md border border-input bg-transparent px-2.5 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={newType}
                  onChange={(event) =>
                    setNewType(
                      event.target.value as DiscountCode["discount_type"],
                    )
                  }
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (₱)</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Value
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder={newType === "percentage" ? "15" : "2000"}
                  value={newValue}
                  onChange={(event) => setNewValue(event.target.value)}
                />
                {!newValue.trim() && (
                  <span className="text-xs text-destructive">
                    Required.
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={newStartDate}
                  onChange={(event) => setNewStartDate(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  End Date
                </label>
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(event) => setNewEndDate(event.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Usage Limit
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={newUsageLimit}
                  onChange={(event) => setNewUsageLimit(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Min. Spend (₱)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={newMinOrder}
                  onChange={(event) => setNewMinOrder(event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddCode}
              disabled={!canSubmitNew}
            >
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Discount Code</DialogTitle>
            <DialogDescription>Update code details.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Code
              </label>
              <Input
                placeholder="SUMMER20"
                value={editCode}
                onChange={(event) => setEditCode(event.target.value)}
              />
              {!editCode.trim() && (
                <span className="text-xs text-destructive">
                  Code is required.
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Type
                </label>
                <select
                  className="rounded-md border border-input bg-transparent px-2.5 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={editType}
                  onChange={(event) =>
                    setEditType(
                      event.target.value as DiscountCode["discount_type"],
                    )
                  }
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (₱)</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Value
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder={editType === "percentage" ? "15" : "2000"}
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(event) => setEditStartDate(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  End Date
                </label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(event) => setEditEndDate(event.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Usage Limit
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={editUsageLimit}
                  onChange={(event) => setEditUsageLimit(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Min. Spend (₱)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={editMinOrder}
                  onChange={(event) => setEditMinOrder(event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditSave}
              disabled={!canSubmitEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
