'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { Club, ClubTable, FloorPlan } from '@/lib/types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const DEFAULT_FLOOR_PLAN_NAME = 'Main Floor';

type TableShape = 'rect' | 'circle';

interface CanvasDimensions {
  width: number;
  height: number;
  radius: number;
}

const categoryColors: Record<string, { fill: string; stroke: string }> = {
  VIP: { fill: '#7c3aed', stroke: '#8b5cf6' },
  regular: { fill: '#27272a', stroke: '#52525b' },
  booth: { fill: '#0369a1', stroke: '#0ea5e9' },
  bar: { fill: '#15803d', stroke: '#22c55e' },
}

const defaultColors = { fill: '#27272a', stroke: '#52525b' }

function posToPixel(pos: number, dimension: number): number {
  return pos * dimension;
}

function pixelToPos(pixel: number, dimension: number): number {
  return Math.max(0, Math.min(1, pixel / dimension));
}

function shapeForCategory(category: ClubTable['category']): TableShape {
  return category === 'bar' ? 'circle' : 'rect';
}

function defaultDimensions(shape: TableShape): CanvasDimensions {
  if (shape === 'circle') {
    return { width: 76, height: 76, radius: 38 };
  }
  return { width: 110, height: 65, radius: 32 };
}

const FloorplanCanvas = () => {
  const [club, setClub] = useState<Club | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [dims, setDims] = useState<Record<string, CanvasDimensions>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableShape, setNewTableShape] = useState<TableShape>('rect');
  const [newTableLabel, setNewTableLabel] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('6');
  const [newTableMinSpend, setNewTableMinSpend] = useState('8000');
  const [newTableCategory, setNewTableCategory] = useState<ClubTable['category']>('regular');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editMinSpend, setEditMinSpend] = useState('');
  const [editCategory, setEditCategory] = useState<ClubTable['category']>('regular');
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');

  const [floorplanImageFile, setFloorplanImageFile] = useState<File | null>(null);
  const [floorplanImagePreview, setFloorplanImagePreview] = useState<string | null>(null);
  const [isSavingFloorplanImage, setIsSavingFloorplanImage] = useState(false);

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const tableRefs = useRef<Record<string, Konva.Group | null>>({});
  const originalTablesRef = useRef<Record<string, ClubTable>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, { pos_x?: number; pos_y?: number; width?: number; height?: number }>>({});

  const [image] = useImage(floorplanImagePreview ?? floorPlan?.image_url ?? '');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const clubResponse = await fetch('/api/owner/club');
        if (!clubResponse.ok) {
          throw new Error(`Request failed with status ${clubResponse.status}`);
        }
        const { club: ownerClub } = (await clubResponse.json()) as { club: Club | null };
        if (cancelled) return;
        setClub(ownerClub);
        if (!ownerClub) return;

        const floorPlansResponse = await fetch(`/api/clubs/${ownerClub.slug}/floor-plans`);
        if (!floorPlansResponse.ok) {
          throw new Error(`Request failed with status ${floorPlansResponse.status}`);
        }
        const { floorPlan: primaryFloorPlan } = (await floorPlansResponse.json()) as {
          floorPlan: FloorPlan | null;
        };
        if (cancelled) return;
        setFloorPlan(primaryFloorPlan);

        if (primaryFloorPlan) {
          const tablesResponse = await fetch(
            `/api/clubs/${ownerClub.slug}/floor-plans/${primaryFloorPlan.id}/tables`,
          );
          if (!tablesResponse.ok) {
            throw new Error(`Request failed with status ${tablesResponse.status}`);
          }
          const { tables: floorPlanTables } = (await tablesResponse.json()) as { tables: ClubTable[] };
          if (cancelled) return;
          setTables(floorPlanTables);
          const map: Record<string, ClubTable> = {};
          for (const t of floorPlanTables) map[t.id] = t;
          originalTablesRef.current = map;
          setPendingChanges({});
          setDims(() => {
            const map: Record<string, CanvasDimensions> = {};
            for (const t of floorPlanTables) {
              const shape = shapeForCategory(t.category);
              if (t.width && t.height) {
                const w = Math.round(posToPixel(t.width, CANVAS_WIDTH));
                const h = Math.round(posToPixel(t.height, CANVAS_HEIGHT));
                if (shape === 'circle') {
                  const r = Math.round(Math.min(w, h) / 2);
                  map[t.id] = { width: r * 2, height: r * 2, radius: r };
                } else {
                  map[t.id] = { width: w, height: h, radius: defaultDimensions('rect').radius };
                }
              } else {
                map[t.id] = defaultDimensions(shape);
              }
            }
            return map;
          });
        }
      } catch (error) {
        console.error('Failed to load floorplan:', error);
        if (!cancelled) setLoadError('Failed to load your floorplan. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFloorplanImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (floorplanImagePreview) URL.revokeObjectURL(floorplanImagePreview);
    setFloorplanImageFile(file);
    setFloorplanImagePreview(file ? URL.createObjectURL(file) : null);
    event.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (floorplanImagePreview) URL.revokeObjectURL(floorplanImagePreview);
    };
  }, [floorplanImagePreview]);

  const handleSaveFloorplanImage = async () => {
    if (!club || !floorplanImageFile) return;
    setIsSavingFloorplanImage(true);
    try {
      const formData = new FormData();
      formData.append('image', floorplanImageFile);
      if (floorPlan) {
        const response = await fetch(
          `/api/owner/clubs/${club.id}/floor-plans/${floorPlan.id}`,
          { method: 'PATCH', body: formData },
        );
        if (!response.ok) {
          const { message } = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(message ?? `Request failed with status ${response.status}`);
        }
        const { floorPlan: updated } = (await response.json()) as { floorPlan: FloorPlan };
        setFloorPlan(updated);
      } else {
        formData.append('name', DEFAULT_FLOOR_PLAN_NAME);
        const response = await fetch(`/api/owner/clubs/${club.id}/floor-plans`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const { message } = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(message ?? `Request failed with status ${response.status}`);
        }
        const { floorPlan: created } = (await response.json()) as { floorPlan: FloorPlan };
        setFloorPlan(created);
      }
      if (floorplanImagePreview) URL.revokeObjectURL(floorplanImagePreview);
      setFloorplanImageFile(null);
      setFloorplanImagePreview(null);
    } catch (error) {
      console.error('Failed to save floorplan image:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      window.alert(`Failed to save the floorplan image: ${message}`);
    } finally {
      setIsSavingFloorplanImage(false);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const newX = e.target.x();
    const newY = e.target.y();
    const pos_x = pixelToPos(newX, CANVAS_WIDTH);
    const pos_y = pixelToPos(newY, CANVAS_HEIGHT);

    setTables((prev) =>
      prev.map((table) => (table.id === id ? { ...table, pos_x, pos_y } : table)),
    );

    const orig = originalTablesRef.current[id];
    setPendingChanges((prev) => {
      const existing = prev[id] ?? {};
      const next = { ...existing };
      if (orig && pos_x === orig.pos_x) delete next.pos_x;
      else next.pos_x = pos_x;
      if (orig && pos_y === orig.pos_y) delete next.pos_y;
      else next.pos_y = pos_y;
      const updated = { ...prev, [id]: next };
      if (Object.keys(next).length === 0) delete updated[id];
      return updated;
    });
  };

  const handleSelect = (id: string) => {
    const table = tables.find((t) => t.id === id);
    setSelectedId(id);
    setIsEditMode(false);
    if (table) {
      setEditLabel(table.label);
      setEditCapacity(String(table.capacity));
      setEditMinSpend(String(table.minimum_spend ?? ''));
      setEditCategory(table.category);
      setEditIsAvailable(table.is_available);
      const d = dims[id] ?? defaultDimensions(shapeForCategory(table.category));
      const shape = shapeForCategory(table.category);
      setEditWidth(shape === 'circle' ? String(d.radius * 2) : String(d.width));
      setEditHeight(shape === 'circle' ? String(d.radius * 2) : String(d.height));
    }
  };

  const handleTransformEnd = (id: string) => {
    const node = tableRefs.current[id];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const table = tables.find((t) => t.id === id);
    if (!table) return;

    const d = dims[id] ?? defaultDimensions(shapeForCategory(table.category));
    const shape = shapeForCategory(table.category);
    let nextWidth: number;
    let nextHeight: number;
    let nextRadius: number;

    if (shape === 'circle') {
      nextRadius = Math.max(22, Math.round(d.radius * Math.max(scaleX, scaleY)));
      nextWidth = nextRadius * 2;
      nextHeight = nextRadius * 2;
    } else {
      nextWidth = Math.max(60, Math.round(d.width * scaleX));
      nextHeight = Math.max(40, Math.round(d.height * scaleY));
      nextRadius = d.radius;
    }

    setDims((prev) => ({
      ...prev,
      [id]: { width: nextWidth, height: nextHeight, radius: nextRadius },
    }));

    // Update tables state so the side panel reads fresh width/height
    const wFraction = pixelToPos(nextWidth, CANVAS_WIDTH);
    const hFraction = pixelToPos(nextHeight, CANVAS_HEIGHT);
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, width: wFraction, height: hFraction } : t)),
    );

    node.scaleX(1);
    node.scaleY(1);

    // Sync side panel fields (only if not actively editing)
    if (selectedId === id && !isEditMode) {
      setEditWidth(String(nextWidth));
      setEditHeight(String(nextHeight));
    }

    // Track pending dimension changes
    const orig = originalTablesRef.current[id];
    setPendingChanges((prev) => {
      const existing = prev[id] ?? {};
      const next = { ...existing };
      if (orig && wFraction === orig.width) delete next.width;
      else next.width = wFraction;
      if (orig && hFraction === orig.height) delete next.height;
      else next.height = hFraction;
      const updated = { ...prev, [id]: next };
      if (Object.keys(next).length === 0) delete updated[id];
      return updated;
    });
  };

  const selectedTable = tables.find((t) => t.id === selectedId) ?? null;
  const parsedCapacity = Number(newTableCapacity);
  const parsedMinSpend = Number(newTableMinSpend);
  const labelIsValid = newTableLabel.trim().length > 0;
  const capacityIsValid = Number.isFinite(parsedCapacity) && parsedCapacity > 0;
  const minSpendIsValid = Number.isFinite(parsedMinSpend) && parsedMinSpend > 0;
  const canSubmit = labelIsValid && capacityIsValid && minSpendIsValid;

  const editParsedCapacity = Number(editCapacity);
  const editParsedMinSpend = Number(editMinSpend);
  const editLabelIsValid = editLabel.trim().length > 0;
  const editCapacityIsValid = Number.isFinite(editParsedCapacity) && editParsedCapacity > 0;
  const editMinSpendIsValid = Number.isFinite(editParsedMinSpend) && editParsedMinSpend > 0;
  const editParsedWidth = Number(editWidth);
  const editParsedHeight = Number(editHeight);
  const editWidthIsValid = Number.isFinite(editParsedWidth) && editParsedWidth > 0;
  const editHeightIsValid = Number.isFinite(editParsedHeight) && editParsedHeight > 0;
  const canSaveEdits = editLabelIsValid && editCapacityIsValid && editMinSpendIsValid && editWidthIsValid && editHeightIsValid;

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }),
    []
  );

  const handleAddTable = async () => {
    if (!canSubmit || !club || !floorPlan) return;

    const pos_x = pixelToPos(260, CANVAS_WIDTH);
    const pos_y = pixelToPos(220, CANVAS_HEIGHT);

    try {
      const response = await fetch(
        `/api/owner/clubs/${club.id}/floor-plans/${floorPlan.id}/tables`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: newTableLabel.trim(),
            capacity: Math.max(1, Math.round(parsedCapacity)),
            minimum_spend: Math.max(1, Math.round(parsedMinSpend)),
            category: newTableCategory,
            pos_x,
            pos_y,
            is_available: true,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const { table: newTable } = (await response.json()) as { table: ClubTable };

      setTables((prev) => [...prev, newTable]);
      // Compute dims from actual saved values
      const w = Math.round(posToPixel(newTable.width, CANVAS_WIDTH));
      const h = Math.round(posToPixel(newTable.height, CANVAS_HEIGHT));
      const shape = shapeForCategory(newTable.category);
      if (shape === 'circle') {
        const r = Math.round(Math.min(w, h) / 2);
        setDims((prev) => ({ ...prev, [newTable.id]: { width: r * 2, height: r * 2, radius: r } }));
      } else {
        setDims((prev) => ({ ...prev, [newTable.id]: { width: w, height: h, radius: defaultDimensions('rect').radius } }));
      }
      originalTablesRef.current[newTable.id] = newTable;
      setSelectedId(newTable.id);
      setIsAddModalOpen(false);
      setNewTableLabel('');
      setNewTableCapacity('6');
      setNewTableMinSpend('8000');
      setNewTableCategory('regular');
      setNewTableShape('rect');
    } catch (error) {
      console.error('Failed to add table:', error);
      window.alert('Failed to add the table. Please try again.');
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedId || !club || !floorPlan) return;
    try {
      const response = await fetch(
        `/api/owner/clubs/${club.id}/floor-plans/${floorPlan.id}/tables/${selectedId}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      setTables((prev) => prev.filter((t) => t.id !== selectedId));
      setDims((prev) => {
        const next = { ...prev };
        delete next[selectedId];
        return next;
      });
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[selectedId];
        return next;
      });
      delete originalTablesRef.current[selectedId];
      setSelectedId(null);
    } catch (error) {
      console.error('Failed to delete table:', error);
      window.alert('Failed to delete the table. Please try again.');
    }
  };

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  const handleSaveChanges = async () => {
    if (!club || !floorPlan || !hasUnsavedChanges) return;
    try {
      const entries = Object.entries(pendingChanges);
      await Promise.all(
        entries.map(([tableId, changes]) =>
          fetch(`/api/owner/clubs/${club.id}/floor-plans/${floorPlan.id}/tables/${tableId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes),
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to save table ${tableId}`);
            return res.json() as Promise<{ table: ClubTable }>;
          }),
        ),
      );
      // Update originals to match current state
      for (const [tableId] of entries) {
        const current = tables.find((t) => t.id === tableId);
        if (current) originalTablesRef.current[tableId] = current;
      }
      setPendingChanges({});
    } catch (error) {
      console.error('Failed to save changes:', error);
      window.alert('Failed to save changes. Please try again.');
    }
  };

  const handleEditSave = async () => {
    if (!selectedId || !canSaveEdits || !club || !floorPlan) return;

    // Capture local position before state updates (React batches)
    const currentTable = tables.find((t) => t.id === selectedId);
    const localPos = currentTable ? { pos_x: currentTable.pos_x, pos_y: currentTable.pos_y } : null;

    try {
      const response = await fetch(
        `/api/owner/clubs/${club.id}/floor-plans/${floorPlan.id}/tables/${selectedId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: editLabel.trim(),
            capacity: Math.max(1, Math.round(editParsedCapacity)),
            minimum_spend: Math.max(1, Math.round(editParsedMinSpend)),
            category: editCategory,
            is_available: editIsAvailable,
            width: pixelToPos(editParsedWidth, CANVAS_WIDTH),
            height: pixelToPos(editParsedHeight, CANVAS_HEIGHT),
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const { table: updated } = (await response.json()) as { table: ClubTable };

      // Merge API response with current state, preserving local-only position
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== selectedId) return t;
          return localPos
            ? { ...updated, pos_x: localPos.pos_x, pos_y: localPos.pos_y }
            : updated;
        }),
      );

      // Compute dims from the actual saved width/height, not category defaults
      setDims((prev) => {
        const shape = shapeForCategory(updated.category);
        const w = Math.round(posToPixel(updated.width, CANVAS_WIDTH));
        const h = Math.round(posToPixel(updated.height, CANVAS_HEIGHT));
        if (shape === 'circle') {
          const r = Math.round(Math.min(w, h) / 2);
          return { ...prev, [selectedId]: { width: r * 2, height: r * 2, radius: r } };
        }
        return { ...prev, [selectedId]: { width: w, height: h, radius: prev[selectedId]?.radius ?? defaultDimensions('rect').radius } };
      });

      // Update original ref with the merged state (preserved position + saved fields)
      originalTablesRef.current[selectedId] = localPos
        ? { ...updated, pos_x: localPos.pos_x, pos_y: localPos.pos_y }
        : updated;

      // Edit save sends all fields, so clear all pending changes for this table
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[selectedId];
        return next;
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save table:', error);
      window.alert('Failed to save the table. Please try again.');
    }
  };

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const node = selectedId ? tableRefs.current[selectedId] : null;
    if (node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes([]);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, tables]);

  if (isLoading) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-muted-foreground">Loading your floorplan…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-3 p-4 text-center">
        <h3 className="text-xl font-semibold text-foreground">Couldn&apos;t load your floorplan</h3>
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-3 p-4 text-center">
        <h3 className="text-xl font-semibold text-foreground">You haven&apos;t registered a club yet</h3>
        <p className="text-sm text-muted-foreground">
          Set up your club before laying out its floor plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 rounded-xl overflow-hidden">
      <div className="mb-4 flex w-full items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.2em]">
          Club Layout
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button size="sm" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          )}
          {floorPlan && (
            <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(true)}>
              Add Table
            </Button>
          )}
        </div>
      </div>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>
              Choose a shape and define the table details.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-2">
              <span className="text-xs font-medium text-muted-foreground">Shape</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={newTableShape === 'rect' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTableShape('rect')}
                >
                  Rectangle
                </Button>
                <Button
                  variant={newTableShape === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTableShape('circle')}
                >
                  Circle
                </Button>
              </div>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Table label
              </label>
              <Input
                placeholder="VIP 1"
                value={newTableLabel}
                onChange={(e) => setNewTableLabel(e.target.value)}
              />
              {!labelIsValid && (
                <span className="text-xs text-destructive">Label is required.</span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Capacity
              </label>
              <Input
                type="number"
                min={0}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
              />
              {!capacityIsValid && (
                <span className="text-xs text-destructive">
                  Capacity must be greater than 0.
                </span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Minimum spend (PHP)
              </label>
              <Input
                type="number"
                min={0}
                value={newTableMinSpend}
                onChange={(e) => setNewTableMinSpend(e.target.value)}
              />
              {!minSpendIsValid && (
                <span className="text-xs text-destructive">
                  Minimum spend must be greater than 0.
                </span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <div className="flex items-center gap-2">
                {(['VIP', 'regular', 'booth', 'bar'] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant={newTableCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setNewTableCategory(cat);
                      setNewTableShape(shapeForCategory(cat));
                    }}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddTable} disabled={!canSubmit}>
              Add Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex gap-4 items-start">
        {/* Canvas area */}
        <div className="flex flex-col items-center">
          {!floorPlan?.image_url ? (
            <div className="flex h-150 w-200 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <div className="text-base font-semibold text-foreground">Set your floorplan image</div>
              <div className="text-sm text-muted-foreground">
                Upload an image to start placing tables.
              </div>
              <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFloorplanImageFileChange}
                />
                <Button
                  type="button"
                  onClick={handleSaveFloorplanImage}
                  disabled={!floorplanImageFile || isSavingFloorplanImage}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFloorplanImageFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveFloorplanImage}
                  disabled={!floorplanImageFile || isSavingFloorplanImage}
                >
                  Update image
                </Button>
              </div>
              <Stage
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="bg-black border border-zinc-800 cursor-crosshair"
                onMouseDown={(e) => {
                  const stage = e.target.getStage();
                  if (stage && e.target === stage) {
                    setSelectedId(null);
                    setIsEditMode(false);
                  }
                }}
                onTouchStart={(e) => {
                  const stage = e.target.getStage();
                  if (stage && e.target === stage) {
                    setSelectedId(null);
                    setIsEditMode(false);
                  }
                }}
              >
                <Layer listening={false}>
                  {image && (
                    <KonvaImage image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} opacity={0.4} />
                  )}
                </Layer>

                <Layer>
                  {tables.map((table) => {
                    const d = dims[table.id] ?? defaultDimensions(shapeForCategory(table.category));
                    const isSelected = table.id === selectedId;
                    const colors = categoryColors[table.category ?? ''] ?? defaultColors;
                    const shape = shapeForCategory(table.category);
                    const px = posToPixel(table.pos_x, CANVAS_WIDTH);
                    const py = posToPixel(table.pos_y, CANVAS_HEIGHT);

                    return (
                      <Group
                        key={table.id}
                        ref={(node) => { tableRefs.current[table.id] = node; }}
                        x={px}
                        y={py}
                        draggable
                        onClick={() => handleSelect(table.id)}
                        onTap={() => handleSelect(table.id)}
                        onDragEnd={(e) => handleDragEnd(e, table.id)}
                        onTransformEnd={() => handleTransformEnd(table.id)}
                        onMouseEnter={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) container.style.cursor = 'grab';
                        }}
                        onMouseLeave={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) container.style.cursor = 'crosshair';
                        }}
                      >
                        {shape === 'circle' ? (
                          <Circle
                            x={d.radius}
                            y={d.radius}
                            radius={d.radius}
                            fill={isSelected ? '#3b82f6' : colors.fill}
                            stroke={isSelected ? '#60a5fa' : colors.stroke}
                            strokeWidth={2}
                            shadowColor="black"
                            shadowBlur={isSelected ? 12 : 4}
                            shadowOpacity={0.6}
                          />
                        ) : (
                          <Rect
                            width={d.width}
                            height={d.height}
                            fill={isSelected ? '#3b82f6' : colors.fill}
                            stroke={isSelected ? '#60a5fa' : colors.stroke}
                            strokeWidth={2}
                            cornerRadius={6}
                            shadowColor="black"
                            shadowBlur={isSelected ? 12 : 4}
                            shadowOpacity={0.6}
                          />
                        )}
                        <Text
                          text={table.label}
                          fontSize={14}
                          fontFamily="sans-serif"
                          fill="white"
                          fontStyle="bold"
                          width={shape === 'circle' ? d.radius * 2 : d.width}
                          height={shape === 'circle' ? d.radius * 2 : d.height}
                          align="center"
                          verticalAlign="middle"
                        />
                      </Group>
                    );
                  })}
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled={false}
                    keepRatio={selectedTable ? shapeForCategory(selectedTable.category) === 'circle' : false}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 60 || newBox.height < 40) return oldBox;
                      return newBox;
                    }}
                  />
                </Layer>
              </Stage>
            </>
          )}
        </div>

        {/* Table details side panel */}
        {selectedTable && (
          <div className="w-72 shrink-0 rounded-xl border border-zinc-200  p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-black">
                Table Details
              </h3>
              <button
                onClick={() => { setSelectedId(null); setIsEditMode(false); }}
                className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Label */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Label
                </label>
                {isEditMode ? (
                  <>
                    <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                    {!editLabelIsValid && (
                      <span className="text-xs text-destructive">Label is required.</span>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-black">{selectedTable.label}</div>
                )}
              </div>

              {/* Shape */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Shape
                </label>
                <div className="text-sm text-black capitalize">
                  {shapeForCategory(selectedTable.category) === 'circle' ? 'Circle' : 'Rectangle'}
                </div>
              </div>

              {/* Width */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Width (px)
                </label>
                {isEditMode ? (
                  <>
                    <Input
                      type="number"
                      min={1}
                      value={editWidth}
                      onChange={(e) => setEditWidth(e.target.value)}
                    />
                    {!editWidthIsValid && (
                      <span className="text-xs text-destructive">Must be greater than 0.</span>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-black">
                    {Math.round((selectedTable.width ?? 0) * CANVAS_WIDTH)} px
                  </div>
                )}
              </div>

              {/* Height */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Height (px)
                </label>
                {isEditMode ? (
                  <>
                    <Input
                      type="number"
                      min={1}
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                    />
                    {!editHeightIsValid && (
                      <span className="text-xs text-destructive">Must be greater than 0.</span>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-black">
                    {Math.round((selectedTable.height ?? 0) * CANVAS_HEIGHT)} px
                  </div>
                )}
              </div>

              {/* Capacity */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Capacity
                </label>
                {isEditMode ? (
                  <>
                    <Input
                      type="number"
                      min={1}
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                    />
                    {!editCapacityIsValid && (
                      <span className="text-xs text-destructive">Must be greater than 0.</span>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-black">{selectedTable.capacity} pax</div>
                )}
              </div>

              {/* Minimum spend */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Minimum Spend
                </label>
                {isEditMode ? (
                  <>
                    <Input
                      type="number"
                      min={0}
                      value={editMinSpend}
                      onChange={(e) => setEditMinSpend(e.target.value)}
                    />
                    {!editMinSpendIsValid && (
                      <span className="text-xs text-destructive">Must be greater than 0.</span>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-black">
                    {selectedTable.minimum_spend != null
                      ? currencyFormatter.format(selectedTable.minimum_spend)
                      : '—'}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Category
                </label>
                {isEditMode ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['VIP', 'regular', 'booth', 'bar'] as const).map((cat) => (
                      <Button
                        key={cat}
                        variant={editCategory === cat ? 'default' : 'outline'}
                        size="xs"
                        onClick={() => setEditCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-black">{selectedTable.category ?? '—'}</div>
                )}
              </div>

              {/* Available */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Available
                </label>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={editIsAvailable ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => setEditIsAvailable(true)}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={!editIsAvailable ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => setEditIsAvailable(false)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-black">
                    {selectedTable.is_available ? 'Yes' : 'No'}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              {isEditMode ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleEditSave}
                    disabled={!canSaveEdits}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setIsEditMode(true)}
                >
                  Edit Table
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDeleteTable}
              >
                Delete Table
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorplanCanvas;
