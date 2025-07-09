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
import { AlertTriangle, Upload, X } from "lucide-react";
import { toast } from 'sonner';
import AudioUploader from '@/components/voice/AudioUploader';

interface ChangeVoiceButtonProps {
    voiceId: string;
    onVoiceUpdated?: () => void;
}

export default function ChangeVoiceButton({ voiceId, onVoiceUpdated }: ChangeVoiceButtonProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showUploader, setShowUploader] = useState(false);

    // Safety timeout to reset updating state if it gets stuck
    useEffect(() => {
        if (isUpdating) {
            const timeout = setTimeout(() => {
                console.warn('Updating state was stuck, resetting...');
                setIsUpdating(false);
            }, 30000); // 30 second timeout

            return () => clearTimeout(timeout);
        }
    }, [isUpdating]);

    // Global error handler for unhandled promise rejections that might occur in AudioUploader
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection in AudioUploader context:', event.reason);

            // If dialog is open and there's an error, provide user with recovery option
            if (showUploader) {
                toast.error('An error occurred. You can force close this dialog if needed.');
                setIsUpdating(false);
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [showUploader]);

    // Force close function that overrides everything - declare first
    const forceCloseUploader = useCallback(() => {
        setIsUpdating(false);
        setShowUploader(false);
        setShowConfirmation(false);
    }, []);

    // Always allow closing confirmation dialog
    const handleConfirmationClose = useCallback((open: boolean) => {
        if (!open) {
            setShowConfirmation(false);
        }
    }, []);

    // Force close the uploader dialog regardless of any child component state
    const handleUploaderClose = useCallback((open: boolean) => {
        if (!open) {
            // Force close regardless of state
            if (isUpdating) {
                toast.info('Upload cancelled');
            }
            forceCloseUploader();
        }
    }, [isUpdating, forceCloseUploader]);

    const handleConfirmChange = useCallback(() => {
        setShowConfirmation(false);
        setTimeout(() => {
            setShowUploader(true);
        }, 100);
    }, []);

    const handleCancelConfirmation = useCallback(() => {
        setShowConfirmation(false);
    }, []);

    // Allow cancelling even during upload
    const handleCancelUploader = useCallback(() => {
        if (isUpdating) {
            toast.info('Upload cancelled');
        }
        forceCloseUploader();
    }, [isUpdating, forceCloseUploader]);

    const handleAudioUploaded = async (audioUrl: string) => {
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

            // Always close the dialog first, regardless of callback success
            setShowUploader(false);
            setIsUpdating(false);
            toast.success('Voice sample updated successfully!');

            // Then attempt to refresh parent data, but don't block dialog closing
            if (onVoiceUpdated) {
                // Run callback asynchronously without blocking
                setTimeout(() => {
                    try {
                        onVoiceUpdated();
                    } catch (error) {
                        console.error('Error in onVoiceUpdated callback:', error);
                        // Don't show error to user, just log it
                    }
                }, 100);
            } else {
                // Fallback to router refresh if no callback provided
                setTimeout(() => {
                    router.refresh();
                }, 100);
            }
        } catch (error) {
            console.error('Error updating voice audio:', error);

            // Always close the dialog first, then show error
            setShowUploader(false);
            setIsUpdating(false);

            // More specific error handling
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
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setShowConfirmation(true)}
                className="flex items-center gap-2"
                type="button"
            >
                <Upload className="h-4 w-4" />
                Change Voice Sample
            </Button>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmation} onOpenChange={handleConfirmationClose}>
                <DialogContent className="bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <DialogTitle>Change Voice Sample</DialogTitle>
                        </div>
                        <div className="text-left space-y-3">
                            <DialogDescription>
                                Are you sure you want to change this voice sample? This will affect how this voice sounds for all future text-to-speech generations.
                            </DialogDescription>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                <strong>Note:</strong> Any TTS outputs that have already been generated will remain unchanged.
                            </p>
                        </div>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelConfirmation}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmChange}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Audio Uploader Dialog */}
            <Dialog open={showUploader} onOpenChange={handleUploaderClose}>
                <DialogContent
                    className="bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-lg max-w-2xl"
                    // Force close on any outside interaction
                    onInteractOutside={(e) => {
                        // Don't prevent default - always allow closing
                        if (isUpdating) {
                            toast.info('Upload cancelled');
                        }
                        forceCloseUploader();
                    }}
                    onEscapeKeyDown={(e) => {
                        // Don't prevent default - always allow closing
                        if (isUpdating) {
                            toast.info('Upload cancelled');
                        }
                        forceCloseUploader();
                    }}
                >
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle>Upload New Voice Sample</DialogTitle>
                                <DialogDescription>
                                    Upload a new audio file or record one to update this voice.
                                </DialogDescription>
                            </div>
                            {/* Manual close button for extra safety */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={forceCloseUploader}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="py-4">
                        {/* Wrap AudioUploader in error boundary logic */}
                        <div key={showUploader ? 'uploader-active' : 'uploader-inactive'}>
                            <AudioUploader
                                onAudioUploadedAction={handleAudioUploaded}
                                isLoading={isUpdating}
                            />
                        </div>

                        {/* Emergency close button if AudioUploader fails */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Having trouble? You can force close this dialog:
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={forceCloseUploader}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            >
                                Force Close Dialog
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelUploader}
                            // Don't disable the cancel button even during upload
                        >
                            {isUpdating ? 'Cancel Upload' : 'Cancel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}