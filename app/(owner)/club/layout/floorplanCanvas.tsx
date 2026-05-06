'use client';

import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

interface Table {
  id: string;
  name: string;
  pax: number;
  price: number;
  x: number;
  y: number;
  isSelected: boolean;
}

const initialTables: Table[] = [
  { id: 't1', name: 'VIP 1', pax: 10, price: 15000, x: 200, y: 150, isSelected: false },
  { id: 't2', name: 'VIP 2', pax: 8, price: 12000, x: 350, y: 150, isSelected: false },
  { id: 't3', name: 'Standard 1', pax: 5, price: 5000, x: 200, y: 300, isSelected: false },
];

const FloorplanCanvas = () => {
  const [tables, setTables] = useState<Table[]>(initialTables);
  
  // Load a placeholder blueprint image
  // In production, this URL would come from your Supabase club_details table
  const [image] = useImage('https://preview.redd.it/nightclub-3500-2100-px-25-by-15-squares-140-px-grid-v0-18vfy9b320ea1.jpg?auto=webp&s=f585e9c757e31aaa7c35d98abea29ffc6db37942');

  const handleDragEnd = (e: any, id: string) => {
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
    // Deselect all tables, then select the one that was clicked
    setTables((prevTables) =>
      prevTables.map((table) => ({
        ...table,
        isSelected: table.id === id,
      }))
    );
  };

  return (
    <div className="flex items-center justify-center p-4 rounded-xl overflow-hidden">
      <Stage 
        width={800} 
        height={600} 
        className="bg-black border border-zinc-800 cursor-crosshair"
      >
        {/* LAYER 1: Static Background Blueprint */}
        {/* listening={false} ensures the image cannot intercept click/drag events */}
        <Layer listening={false}>
          {image && (
            <KonvaImage
              image={image}
              width={800}
              height={600}
              opacity={0.4} // Dimmed so the interactive tables stand out more
            />
          )}
        </Layer>

        {/* LAYER 2: Interactive Tables */}
        <Layer>
          {tables.map((table) => (
            <Group
              key={table.id}
              x={table.x}
              y={table.y}
              draggable
              onClick={() => handleSelect(table.id)}
              onTap={() => handleSelect(table.id)} // Important for mobile touch support
              onDragEnd={(e) => handleDragEnd(e, table.id)}
              // Change cursor to grab hand when hovering over a table
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'grab';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'crosshair';
              }}
            >
              <Rect
                width={100}
                height={60}
                fill={table.isSelected ? '#3b82f6' : '#27272a'} // Blue if selected, dark gray if not
                stroke={table.isSelected ? '#60a5fa' : '#52525b'}
                strokeWidth={2}
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={table.isSelected ? 12 : 4}
                shadowOpacity={0.6}
              />
              <Text
                text={table.name}
                fontSize={14}
                fontFamily="sans-serif"
                fill="white"
                fontStyle="bold"
                width={100}
                height={60}
                align="center"
                verticalAlign="middle"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default FloorplanCanvas;