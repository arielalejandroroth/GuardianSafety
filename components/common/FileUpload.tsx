
import React, { useCallback, useState, useEffect } from 'react';
import { Attachment } from '../../types';
import { UploadIcon, FileTextIcon } from '../IconComponents';

interface FileUploadProps {
  onFilesChange: (files: Attachment[]) => void;
  multiple?: boolean;
  initialAttachments?: Attachment[];
}

const EMPTY_ARRAY: Attachment[] = [];

const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, multiple = true, initialAttachments = EMPTY_ARRAY }) => {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const uploaderId = React.useId();

  useEffect(() => {
    // This effect syncs the internal state with the prop from the parent,
    // which is essential for the "Edit" modal to display existing files.
    setAttachments(initialAttachments);
  }, [initialAttachments]);


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachmentPromises: Promise<Attachment>[] = [];
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > MAX_FILE_SIZE) {
          alert(`El archivo ${file.name} es demasiado grande. El límite es de 20MB.`);
          continue;
      }
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        newAttachmentPromises.push(
          new Promise((resolve, reject) => {
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDimension = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve({
                  name: file.name,
                  type: 'image/jpeg',
                  data: dataUrl.split(',')[1],
                });
              };
              img.onerror = reject;
              img.src = reader.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
        );
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        newAttachmentPromises.push(
          new Promise((resolve, reject) => {
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                data: (reader.result as string).split(',')[1],
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
        );
      }
    }

    Promise.all(newAttachmentPromises).then(results => {
      const updatedAttachments = multiple ? [...attachments, ...results] : results;
      setAttachments(updatedAttachments);
      onFilesChange(updatedAttachments);
    });
     // Reset file input to allow selecting the same file again
    if(event.target) {
        event.target.value = '';
    }
  }, [attachments, multiple, onFilesChange]);

  const removeAttachment = (indexToRemove: number) => {
    const updatedAttachments = attachments.filter((_, index) => index !== indexToRemove);
    setAttachments(updatedAttachments);
    onFilesChange(updatedAttachments);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">Adjuntar Archivos (Imágenes o PDF)</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg">
        <div className="space-y-1 text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
          <div className="flex text-sm text-slate-600">
            <label
              htmlFor={uploaderId}
              className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary"
            >
              <span>Subir un archivo</span>
              <input id={uploaderId} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} multiple={multiple} accept="image/*,application/pdf" />
            </label>
            <p className="pl-1">o arrastrar y soltar</p>
          </div>
          <p className="text-xs text-slate-500">PNG, JPG, PDF, etc.</p>
        </div>
      </div>
      {attachments.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-slate-700">Archivos adjuntos:</h4>
          <ul className="mt-2 border border-slate-200 rounded-md divide-y divide-slate-200">
            {attachments.map((file, index) => (
              <li key={`${file.name}-${index}`} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="w-0 flex-1 flex items-center">
                  {file.type.startsWith('image/') ? (
                    <img src={`data:${file.type};base64,${file.data}`} alt={file.name} className="flex-shrink-0 h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <FileTextIcon className="flex-shrink-0 h-8 w-8 text-slate-400" />
                  )}
                  <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button type="button" onClick={() => removeAttachment(index)} className="font-medium text-red-600 hover:text-red-500">
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
