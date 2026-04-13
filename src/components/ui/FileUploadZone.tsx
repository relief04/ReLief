import React, { useState, useRef } from 'react';
import styles from './FileUploadZone.module.css';

interface FileUploadZoneProps {
    onFileDrop: (file: File) => void;
    accept?: string;
    label?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    onFileDrop,
    accept = 'image/*,application/pdf',
    label = 'Drag and drop or click to upload',
    icon,
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isDragging) setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileDrop(files[0]);
        }
    };

    const handleClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileDrop(e.target.files[0]);
            // Reset so same file can be selected again
            e.target.value = '';
        }
    };

    return (
        <div
            className={`${styles.container} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            role="button"
            tabIndex={disabled ? -1 : 0}
        >
            <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenInput}
                accept={accept}
                onChange={handleFileChange}
                disabled={disabled}
            />
            {icon && <div className={styles.iconWrapper}>{icon}</div>}
            <p className={styles.label}>{label}</p>
        </div>
    );
};
