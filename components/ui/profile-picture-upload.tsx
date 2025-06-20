"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Upload, X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Dynamically import react-easy-crop to avoid SSR issues
import dynamic from 'next/dynamic';

const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
});

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface ProfilePictureUploadProps {
  userId: string;
  currentPhotoURL?: string | null;
  displayName?: string | null;
  onPhotoUpdate: (newPhotoURL: string | null) => void;
  size?: "sm" | "md" | "lg";
}

// Helper function to create image from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to get cropped image
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set canvas size to square crop
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  // Calculate the position to center the crop if it's not square
  const offsetX = (pixelCrop.width - size) / 2;
  const offsetY = (pixelCrop.height - size) / 2;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x + offsetX,
    pixelCrop.y + offsetY,
    size,
    size,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/jpeg", 0.9);
  });
};

export function ProfilePictureUpload({
  userId,
  currentPhotoURL,
  displayName,
  onPhotoUpdate,
  size = "md"
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Read file and show crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setCropModalOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      console.log("Starting crop and upload process...");
      
      // Get cropped image blob
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Create file from blob
      const croppedFile = new File([croppedImageBlob], "profile-picture.jpg", {
        type: "image/jpeg",
      });

      console.log("Uploading to Supabase...");
      
      // Upload to Supabase
      const photoURL = await uploadProfilePicture(croppedFile, userId);
      
      if (photoURL) {
        console.log("Upload successful, updating profile...");
        onPhotoUpdate(photoURL);
        setCropModalOpen(false);
        setImageSrc(null);
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      const success = await deleteProfilePicture(userId);
      if (success) {
        onPhotoUpdate(null);
        toast({
          title: "Success",
          description: "Profile picture removed",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage 
              src={currentPhotoURL || undefined} 
              alt={displayName || "Profile"} 
            />
            <AvatarFallback className="text-lg">
              {displayName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          {/* Overlay on hover */}
          <div 
            className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
          
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Upload button clicked");
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            type="button"
          >
            <Upload className="h-4 w-4 mr-1" />
            {currentPhotoURL ? "Change" : "Upload"}
          </Button>
          
          {currentPhotoURL && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemove();
              }}
              disabled={uploading}
              type="button"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {/* Hidden file input for image selection */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Crop Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Crop Area */}
            <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  minZoom={1}
                  maxZoom={3}
                  zoomSpeed={0.1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                  restrictPosition={true}
                  mediaProps={{}}
                  cropperProps={{}}
                  keyboardStep={1}
                  style={{
                    containerStyle: {
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      background: '#333'
                    },
                    cropAreaStyle: {
                      border: '2px solid #fff'
                    }
                  }}
                  classes={{
                    containerClassName: 'crop-container',
                    cropAreaClassName: 'crop-area'
                  }}
                />
              )}
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4" />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(rotation - 90)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground flex-1 text-center">
                  Rotation: {rotation}°
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(rotation + 90)}
                >
                  <RotateCcw className="h-4 w-4 scale-x-[-1]" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCropModalOpen(false);
                setImageSrc(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleCropSave} disabled={uploading}>
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
