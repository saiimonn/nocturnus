'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { X, Upload } from 'lucide-react';

interface ClubDetails {
  description: string;
  location: string;
  pictures: string[];
}

export default function ClubDetailsPage() {
  const [details, setDetails] = useState<ClubDetails>({
    description: '',
    location: '',
    pictures: [],
  });

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetails(prev => ({
      ...prev,
      description: e.target.value,
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails(prev => ({
      ...prev,
      location: e.target.value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (details.pictures.length + files.length > 5) {
      alert('Maximum 5 pictures allowed');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setDetails(prev => ({
          ...prev,
          pictures: [...prev.pictures, file.name],
        }));
        setPreviewUrls(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = (index: number) => {
    setDetails(prev => ({
      ...prev,
      pictures: prev.pictures.filter((_, i) => i !== index),
    }));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!details.description.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!details.location.trim()) {
      alert('Please enter a location');
      return;
    }

    console.log('[v0] Saving club details:', details);
    alert('Club details saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Club Details</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your club&apos;s information and photos
        </p>
      </div>

      <Separator />

      {/* Description Section */}
      <div className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
            Description
          </label>
          <textarea
            id="description"
            placeholder="Enter your club description..."
            value={details.description}
            onChange={handleDescriptionChange}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent min-h-[120px] resize-none"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {details.description.length} characters
          </p>
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-4">
        <div>
          <label htmlFor="location" className="block text-sm font-semibold text-foreground mb-2">
            Location
          </label>
          <Input
            id="location"
            placeholder="Enter your club location..."
            value={details.location}
            onChange={handleLocationChange}
            type="text"
            className="w-full"
          />
        </div>
      </div>

      {/* Pictures Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Pictures ({details.pictures.length}/5)
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={details.pictures.length >= 5}
            className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-border bg-background hover:border-pink-500 hover:bg-pink-50/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-foreground"
          >
            <Upload size={20} />
            <span>Click to upload or drag and drop</span>
          </button>
          
          <p className="mt-2 text-xs text-muted-foreground">
            PNG, JPG, GIF up to 10MB. Maximum 5 pictures.
          </p>
        </div>

        {/* Picture Preview Grid */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="rounded-lg overflow-hidden bg-muted aspect-square">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => handleRemovePicture(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove picture"
                >
                  <X size={16} />
                </button>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {details.pictures[index]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          Save Changes
        </Button>
        <Button
          variant="outline"
          className="text-foreground border-border hover:bg-muted"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
