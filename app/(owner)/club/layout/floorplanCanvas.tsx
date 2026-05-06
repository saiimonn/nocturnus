'use client';

import React, { useEffect, useRef, useState } from 'react';
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

type TableShape = 'rect' | 'circle';

interface Table {
  id: string;
  name: string;
  pax: number;
  price: number;
  x: number;
  y: number;
  shape: TableShape;
  width: number;
  height: number;
  radius: number;
}

const initialTables: Table[] = [
  { id: 't1', name: 'VIP 1', pax: 10, price: 15000, x: 200, y: 150, shape: 'rect', width: 120, height: 70, radius: 36 },
  { id: 't2', name: 'VIP 2', pax: 8, price: 12000, x: 350, y: 150, shape: 'rect', width: 110, height: 65, radius: 34 },
  { id: 't3', name: 'Standard 1', pax: 5, price: 5000, x: 200, y: 300, shape: 'rect', width: 100, height: 60, radius: 32 },
  { id: 't4', name: 'Standard 2', pax: 6, price: 6000, x: 340, y: 300, shape: 'rect', width: 105, height: 60, radius: 32 },
  { id: 't5', name: 'Booth 1', pax: 4, price: 4500, x: 520, y: 200, shape: 'rect', width: 95, height: 55, radius: 28 },
  { id: 't6', name: 'Booth 2', pax: 4, price: 4500, x: 520, y: 320, shape: 'rect', width: 95, height: 55, radius: 28 },
  { id: 't7', name: 'Round 1', pax: 6, price: 7000, x: 120, y: 420, shape: 'circle', width: 76, height: 76, radius: 38 },
  { id: 't8', name: 'Round 2', pax: 8, price: 8500, x: 260, y: 430, shape: 'circle', width: 84, height: 84, radius: 42 },
  { id: 't9', name: 'VIP 3', pax: 12, price: 18000, x: 420, y: 420, shape: 'rect', width: 130, height: 75, radius: 38 },
  { id: 't10', name: 'Back Bar', pax: 3, price: 3000, x: 640, y: 140, shape: 'rect', width: 90, height: 50, radius: 24 },
];

const FloorplanCanvas = () => {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nextTableIndex, setNextTableIndex] = useState(4);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableShape, setNewTableShape] = useState<TableShape>('rect');
  const [newTableName, setNewTableName] = useState('');
  const [newTablePax, setNewTablePax] = useState('6');
  const [newTablePrice, setNewTablePrice] = useState('8000');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTableName, setEditTableName] = useState('');
  const [editTablePax, setEditTablePax] = useState('');
  const [editTablePrice, setEditTablePrice] = useState('');
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const tableRefs = useRef<Record<string, Konva.Group | null>>({});
  
  const [floorplanUrl, setFloorplanUrl] = useState<string | null>(null);
  const [floorplanObjectUrl, setFloorplanObjectUrl] = useState<string | null>(null);
  const [image] = useImage(floorplanUrl ?? '');

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    // Get the new X and Y coordinates after the user stops dragging
    const newX = e.target.x();
    const newY = e.target.y();
    
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id ? { ...table, x: newX, y: newY } : table
      )
    );
  };

  const handleSelect = (id: string) => {
    const table = tables.find((item) => item.id === id);
    setSelectedId(id);
    if (table) {
      setEditTableName(table.name);
      setEditTablePax(String(table.pax));
      setEditTablePrice(String(table.price));
    }
  };

  const handleTransformEnd = (id: string) => {
    const node = tableRefs.current[id];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id !== id) return table;

        if (table.shape === 'circle') {
          const nextRadius = Math.max(22, Math.round(table.radius * Math.max(scaleX, scaleY)));
          return { ...table, radius: nextRadius, width: nextRadius * 2, height: nextRadius * 2 };
        }

        const nextWidth = Math.max(60, Math.round(table.width * scaleX));
        const nextHeight = Math.max(40, Math.round(table.height * scaleY));

        return { ...table, width: nextWidth, height: nextHeight };
      })
    );

    node.scaleX(1);
    node.scaleY(1);
  };

  const selectedTable = tables.find((table) => table.id === selectedId) || null;
  const parsedPax = Number(newTablePax);
  const parsedPrice = Number(newTablePrice);
  const nameIsValid = newTableName.trim().length > 0;
  const paxIsValid = Number.isFinite(parsedPax) && parsedPax > 0;
  const priceIsValid = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const canSubmit = nameIsValid && paxIsValid && priceIsValid;

  const editParsedPax = Number(editTablePax);
  const editParsedPrice = Number(editTablePrice);
  const editNameIsValid = editTableName.trim().length > 0;
  const editPaxIsValid = Number.isFinite(editParsedPax) && editParsedPax > 0;
  const editPriceIsValid = Number.isFinite(editParsedPrice) && editParsedPrice > 0;
  const canSaveEdits = editNameIsValid && editPaxIsValid && editPriceIsValid;

  const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  });

  const handleAddTable = () => {
    if (!canSubmit) return;
    const id = `t${Date.now()}`;
    const fallbackName = newTableShape === 'circle' ? 'Round' : 'Table';
    const radius = newTableShape === 'circle' ? 38 : 32;
    const width = newTableShape === 'circle' ? radius * 2 : 110;
    const height = newTableShape === 'circle' ? radius * 2 : 65;

    setTables((prevTables) => [
      ...prevTables,
      {
        id,
        name: newTableName.trim() || `${fallbackName} ${nextTableIndex}`,
        pax: Math.max(1, Math.round(parsedPax)),
        price: Math.max(1, Math.round(parsedPrice)),
        x: 260,
        y: 220,
        shape: newTableShape,
        width,
        height,
        radius,
      },
    ]);

    setNextTableIndex((value) => value + 1);
    setSelectedId(id);
    setIsAddModalOpen(false);
    setNewTableName('');
    setNewTablePax('6');
    setNewTablePrice('8000');
  };

  const handleDeleteTable = () => {
    if (!selectedId) return;
    if (!window.confirm('Delete this table? This action cannot be undone.')) return;
    setTables((prevTables) => prevTables.filter((table) => table.id !== selectedId));
    setSelectedId(null);
    setIsDetailsOpen(false);
  };

  const handleEditSave = () => {
    if (!selectedId || !canSaveEdits) return;
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === selectedId
          ? {
              ...table,
              name: editTableName.trim(),
              pax: Math.max(1, Math.round(editParsedPax)),
              price: Math.max(1, Math.round(editParsedPrice)),
            }
          : table
      )
    );
    setIsEditMode(false);
  };

  const handleFloorplanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setFloorplanUrl(objectUrl);
    setFloorplanObjectUrl(objectUrl);
  };

  useEffect(() => {
    return () => {
      if (floorplanObjectUrl) {
        URL.revokeObjectURL(floorplanObjectUrl);
      }
    };
  }, [floorplanObjectUrl]);

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

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl overflow-hidden">
      <div className="mb-4 flex w-full max-w-200 items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.2em]">
          Club Layout
        </div>
        {selectedTable && (
          <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(true)}>
            View Details
          </Button>
        )}
        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          Add Table
        </Button>
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
                Table name
              </label>
              <Input
                placeholder="VIP 1"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
              />
              {!nameIsValid && (
                <span className="text-xs text-destructive">Name is required.</span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Pax
              </label>
              <Input
                type="number"
                min={0}
                value={newTablePax}
                onChange={(e) => setNewTablePax(e.target.value)}
              />
              {!paxIsValid && (
                <span className="text-xs text-destructive">
                  Pax must be greater than 0.
                </span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Reservation price
              </label>
              <Input
                type="number"
                min={0}
                value={newTablePrice}
                onChange={(e) => setNewTablePrice(e.target.value)}
              />
              {!priceIsValid && (
                <span className="text-xs text-destructive">
                  Price must be greater than 0.
                </span>
              )}
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
      {!floorplanUrl ? (
        <div className="flex h-[600px] w-[800px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-black/40">
          <div className="text-base font-semibold">Upload your floorplan</div>
          <div className="text-sm text-white/60">
            Add an image to start placing tables.
          </div>
          <label className="inline-flex cursor-pointer">
            <span className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/80">
              Upload Image
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFloorplanUpload}
            />
          </label>
        </div>
      ) : (
        <Stage
          width={800}
          height={600}
          className="bg-black border border-zinc-800 cursor-crosshair"
          onMouseDown={(e) => {
            const stage = e.target.getStage();
            if (stage && e.target === stage) {
              setSelectedId(null);
              setIsDetailsOpen(false);
            }
          }}
          onTouchStart={(e) => {
            const stage = e.target.getStage();
            if (stage && e.target === stage) {
              setSelectedId(null);
              setIsDetailsOpen(false);
            }
          }}
        >
          <Layer listening={false}>
            {image && (
              <KonvaImage image={image} width={800} height={600} opacity={0.4} />
            )}
          </Layer>

          <Layer>
            {tables.map((table) => (
              <Group
                key={table.id}
                ref={(node) => {
                  tableRefs.current[table.id] = node;
                }}
                x={table.x}
                y={table.y}
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
                {table.shape === 'circle' ? (
                  <Circle
                    x={table.radius}
                    y={table.radius}
                    radius={table.radius}
                    fill={table.id === selectedId ? '#3b82f6' : '#27272a'}
                    stroke={table.id === selectedId ? '#60a5fa' : '#52525b'}
                    strokeWidth={2}
                    shadowColor="black"
                    shadowBlur={table.id === selectedId ? 12 : 4}
                    shadowOpacity={0.6}
                  />
                ) : (
                  <Rect
                    width={table.width}
                    height={table.height}
                    fill={table.id === selectedId ? '#3b82f6' : '#27272a'}
                    stroke={table.id === selectedId ? '#60a5fa' : '#52525b'}
                    strokeWidth={2}
                    cornerRadius={6}
                    shadowColor="black"
                    shadowBlur={table.id === selectedId ? 12 : 4}
                    shadowOpacity={0.6}
                  />
                )}
                <Text
                  text={table.name}
                  fontSize={14}
                  fontFamily="sans-serif"
                  fill="white"
                  fontStyle="bold"
                  width={table.shape === 'circle' ? table.radius * 2 : table.width}
                  height={table.shape === 'circle' ? table.radius * 2 : table.height}
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
            ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              keepRatio={tables.find((table) => table.id === selectedId)?.shape === 'circle'}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 60 || newBox.height < 40) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      )}
      <Dialog
        open={isDetailsOpen && Boolean(selectedTable)}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (open && selectedTable) {
            setEditTableName(selectedTable.name);
            setEditTablePax(String(selectedTable.pax));
            setEditTablePrice(String(selectedTable.price));
          }
          if (!open) setIsEditMode(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Table Details</DialogTitle>
            <DialogDescription>View or edit this table.</DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <div className="mt-3 grid gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Name
                </label>
                {isEditMode ? (
                  <Input
                    value={editTableName}
                    onChange={(e) => setEditTableName(e.target.value)}
                  />
                ) : (
                  <div className="text-sm">{selectedTable.name}</div>
                )}
                {isEditMode && !editNameIsValid && (
                  <span className="text-xs text-destructive">Name is required.</span>
                )}
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Pax
                </label>
                {isEditMode ? (
                  <Input
                    type="number"
                    min={1}
                    value={editTablePax}
                    onChange={(e) => setEditTablePax(e.target.value)}
                  />
                ) : (
                  <div className="text-sm">{selectedTable.pax}</div>
                )}
                {isEditMode && !editPaxIsValid && (
                  <span className="text-xs text-destructive">
                    Pax must be greater than 0.
                  </span>
                )}
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Reservation price
                </label>
                {isEditMode ? (
                  <Input
                    type="number"
                    min={1}
                    value={editTablePrice}
                    onChange={(e) => setEditTablePrice(e.target.value)}
                  />
                ) : (
                  <div className="text-sm">
                    {currencyFormatter.format(selectedTable.price)}
                  </div>
                )}
                {isEditMode && !editPriceIsValid && (
                  <span className="text-xs text-destructive">
                    Price must be greater than 0.
                  </span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" size="sm" onClick={handleDeleteTable}>
              Delete
            </Button>
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleEditSave} disabled={!canSaveEdits}>
                  Save
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditMode(true)}>
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FloorplanCanvas;
