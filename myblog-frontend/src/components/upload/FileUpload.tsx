import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, File, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { api } from '../../utils/api';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // MB
  type?: 'image' | 'file' | 'editor';
  multiple?: boolean;
  onUploadSuccess?: (url: string, file: File) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*',
  maxSize = 5,
  type = 'image',
  multiple = false,
  onUploadSuccess,
  onUploadError,
  className = '',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `文件大小不能超过 ${maxSize}MB`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return false;
    }

    // 检查文件类型
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileMimeType = file.type;
      const fileName = file.name.toLowerCase();

      const isAccepted = acceptedTypes.some(acceptedType => {
        if (acceptedType.startsWith('.')) {
          // 扩展名检查
          return fileName.endsWith(acceptedType.toLowerCase());
        } else if (acceptedType.includes('*')) {
          // MIME type 通配符
          const baseType = acceptedType.split('/')[0];
          return fileMimeType.startsWith(baseType + '/');
        } else {
          // 精确匹配
          return fileMimeType === acceptedType || fileName.endsWith(acceptedType.toLowerCase());
        }
      });

      if (!isAccepted) {
        const errorMsg = `不支持的文件类型: ${file.type}`;
        setError(errorMsg);
        onUploadError?.(errorMsg);
        return false;
      }
    }

    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);

    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        uploadFile(file);
      }
    });
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      let response;

      if (type === 'editor') {
        response = await api.upload.uploadEditorImage(file);
      } else if (type === 'image') {
        response = await api.upload.uploadImage(file, 'content');
      } else {
        response = await api.upload.uploadFile(file, 'document');
      }

      if (response && (response.url || (response as any).data?.url)) {
        const url = response.url || (response as any).data?.url;
        setProgress(100);
        onUploadSuccess?.(url, file);
        setError(null);
      } else {
        throw new Error('上传失败：响应格式错误');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '文件上传失败';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (!disabled && !uploading) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${dragOver
            ? 'border-blue-400 bg-blue-50'
            : disabled || uploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center p-8 text-center">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 mb-2 animate-spin" />
              <p className="text-sm text-gray-600 mb-2">上传中...</p>
              {progress > 0 && (
                <div className="w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                </div>
              )}
            </>
          ) : (
            <>
              {type === 'image' ? (
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              ) : (
                <File className="w-8 h-8 text-gray-400 mb-2" />
              )}
              <p className="text-sm text-gray-600 mb-1">
                点击上传或拖拽文件到此处
              </p>
              <p className="text-xs text-gray-500">
                支持 {accept} 格式，最大 {maxSize}MB
              </p>
              {multiple && (
                <p className="text-xs text-blue-500 mt-1">支持多文件上传</p>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
