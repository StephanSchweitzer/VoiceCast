'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from 'sonner';
import AudioUploader from '@/components/voice/AudioUploader';

interface ChangeVoiceButtonProps {
    voiceId: string;
    onVoiceUpdated?: () => void;
}

export default function ChangeVoiceButton({ voiceId, onVoiceUpdated }: ChangeVoiceButtonProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [uploaderKey, setUploaderKey] = useState(0);

    // Force close everything
    const forceClose = useCallback(() => {
        console.log('Force closing dialog');
        setIsUpdating(false);
        setIsDialogOpen(false);
        setUploaderKey(prev => prev + 1);
    }, []);

    // Safety timeout
    useEffect(() => {
        if (isUpdating) {
            const timeout = setTimeout(() => {
                console.warn('Upload timed out, force closing');
                forceClose();
                toast.error('Upload timed out. Please try again.');
            }, 30000);

            return () => clearTimeout(timeout);
        }
    }, [isUpdating, forceClose]);

    // Handle dialog close
    const handleDialogClose = useCallback((open: boolean) => {
        if (!open) {
            if (isUpdating) {
                toast.info('Upload cancelled');
            }
            forceClose();
        }
    }, [isUpdating, forceClose]);

    // Button click - directly open upload dialog
    const handleButtonClick = useCallback(() => {
        setUploaderKey(prev => prev + 1);
        setIsDialogOpen(true);
    }, []);

    // Upload handlers
    const handleUploadCancel = useCallback(() => {
        if (isUpdating) {
            toast.info('Upload cancelled');
        }
        forceClose();
    }, [isUpdating, forceClose]);

    const handleAudioUploaded = useCallback(async (audioUrl: string) => {
        console.log('Audio uploaded, updating voice...');
        setIsUpdating(true);

        try {
            const response = await fetch(`/api/voices/${voiceId}/audio`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ audioSample: audioUrl }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to update voice audio: ${response.status} ${errorData}`);
            }

            // Success - close dialog and show message
            forceClose();
            toast.success('Voice sample updated successfully!');

            // Refresh parent data
            if (onVoiceUpdated) {
                setTimeout(() => {
                    try {
                        onVoiceUpdated();
                    } catch (error) {
                        console.error('Error in onVoiceUpdated callback:', error);
                    }
                }, 100);
            } else {
                setTimeout(() => {
                    router.refresh();
                }, 100);
            }
        } catch (error) {
            console.error('Error updating voice audio:', error);
            forceClose();

            if (error instanceof Error) {
                if (error.message.includes('404')) {
                    toast.error('Voice not found. It may have been deleted.');
                } else if (error.message.includes('400')) {
                    toast.error('Invalid audio file. Please try a different file.');
                } else {
                    toast.error('Failed to update voice sample. Please try again.');
                }
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        }
    }, [voiceId, onVoiceUpdated, router, forceClose]);

    return (
        <>
            <Button
                variant="outline"
                onClick={handleButtonClick}
                className="flex items-center gap-2"
                type="button"
            >
                <Upload className="h-4 w-4" />
                Change Voice Sample
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent
                    className="bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-lg max-w-2xl"
                    onInteractOutside={() => handleDialogClose(false)}
                    onEscapeKeyDown={() => handleDialogClose(false)}
                >
                    <DialogHeader>
                        <DialogTitle>Upload New Voice Sample</DialogTitle>
                        <DialogDescription>
                            Upload a new audio file or record one to update this voice.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <AudioUploader
                            key={uploaderKey}
                            onAudioUploadedAction={handleAudioUploaded}
                            isLoading={isUpdating}
                        />

                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Having trouble closing this dialog?
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={forceClose}
                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                >
                                    Force Close
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleUploadCancel}
                        >
                            {isUpdating ? 'Cancel Upload' : 'Cancel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}