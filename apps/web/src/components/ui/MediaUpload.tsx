/**
 * MediaUpload.tsx - Advanced media upload component
 * Supports drag & drop, multiple files, preview, compression, and progress tracking
 */
import { useState, useRef, useCallback } from "react";
import { X, Image as ImageIcon, Video, Upload, Loader2, AlertCircle } from "lucide-react";
import { uploadFile, compressImage, generateVideoThumbnail, formatFileSize, isImageFile, isVideoFile } from "@/lib/storage";
import { toast } from "sonner";

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  path?: string;
  uploading: boolean;
  error?: string;
  progress?: number;
}

interface MediaUploadProps {
  onUpload: (files: MediaFile[]) => void;
  onRemove?: (id: string) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function MediaUpload({
  onUpload,
  onRemove,
  maxFiles = 4,
  maxSize = 10,
  acceptedTypes = ["image/*", "video/*"],
  className = "",
  disabled = false,
}: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const generatePreview = useCallback(async (file: File): Promise<string> => {
    if (isImageFile(file)) {
      // Compress image and generate preview
      try {
        const compressed = await compressImage(file);
        return URL.createObjectURL(compressed);
      } catch (error) {
        return URL.createObjectURL(file);
      }
    } else if (isVideoFile(file)) {
      // Generate video thumbnail
      try {
        return await generateVideoThumbnail(file);
      } catch (error) {
        return URL.createObjectURL(file);
      }
    }
    
    return URL.createObjectURL(file);
  }, []);

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: MediaFile[] = [];
    
    // Check file count limit
    if (files.length + fileList.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds ${maxSize}MB limit`);
        continue;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isValidType) {
        toast.error(`File "${file.name}" is not a supported type`);
        continue;
      }

      const preview = await generatePreview(file);
      
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        preview,
        uploading: false,
      });
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onUpload(updatedFiles);
  }, [files, maxFiles, maxSize, acceptedTypes, onUpload, generatePreview]);

  const uploadSingleFile = useCallback(async (mediaFile: MediaFile) => {
    setFiles(prev => prev.map(f => 
      f.id === mediaFile.id ? { ...f, uploading: true, error: undefined } : f
    ));

    try {
      const result = await uploadFile({
        file: mediaFile.file,
        type: "post",
        userId: "current-user", // This should come from auth context
      });

      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { ...f, uploading: false, url: result.url, path: result.path }
          : f
      ));

      toast.success(`Uploaded ${mediaFile.file.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id ? { ...f, uploading: false, error: errorMessage } : f
      ));
      
      toast.error(`Failed to upload ${mediaFile.file.name}: ${errorMessage}`);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onUpload(updatedFiles);
    onRemove?.(id);
  }, [files, onUpload, onRemove]);

  const retryUpload = useCallback((mediaFile: MediaFile) => {
    uploadSingleFile(mediaFile);
  }, [uploadSingleFile]);

  const uploadAll = useCallback(() => {
    files.forEach(file => {
      if (!file.url && !file.uploading) {
        uploadSingleFile(file);
      }
    });
  }, [files, uploadSingleFile]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-surface/30"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`rounded-full p-3 ${
            isDragging ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
          }`}>
            {isDragging ? (
              <Upload className="h-6 w-6" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedTypes.join(", ")} • Max {maxSize}MB per file • Max {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Files ({files.length}/{maxFiles})
            </h4>
            
            {!disabled && (
              <button
                onClick={uploadAll}
                className="text-xs text-primary hover:underline font-medium"
              >
                Upload all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((mediaFile) => (
              <div
                key={mediaFile.id}
                className="relative group rounded-lg border border-border overflow-hidden bg-surface/40"
              >
                {/* Preview */}
                <div className="aspect-square relative">
                  {isImageFile(mediaFile.file) ? (
                    <img
                      src={mediaFile.preview}
                      alt={mediaFile.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!disabled && (
                      <button
                        onClick={() => removeFile(mediaFile.id)}
                        className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* Upload Progress */}
                  {mediaFile.uploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  {/* Error State */}
                  {mediaFile.error && (
                    <div className="absolute inset-0 bg-destructive/90 flex flex-col items-center justify-center p-2">
                      <AlertCircle className="h-5 w-5 text-white mb-1" />
                      <p className="text-xs text-white text-center">{mediaFile.error}</p>
                      {!disabled && (
                        <button
                          onClick={() => retryUpload(mediaFile)}
                          className="mt-2 text-xs text-white underline"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate">
                    {mediaFile.file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(mediaFile.file.size)}
                  </p>
                  {mediaFile.url && (
                    <p className="text-[10px] text-green-400">✓ Uploaded</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
