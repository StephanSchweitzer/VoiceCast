'use client';

import { useState, useCallback } from 'react';
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
import { AlertTriangle, Upload } from "lucide-react";
import { toast } from 'sonner';
import AudioUploader from '@/components/voice/AudioUploader';

interface ChangeVoiceButtonProps {
    voiceId: string;
    onVoiceUpdated?: () => void; // Add callback for when voice is updated
}

export default function ChangeVoiceButton({ voiceId, onVoiceUpdated }: ChangeVoiceButtonProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showUploader, setShowUploader] = useState(false);

    // Properly handle confirmation dialog closing
    const handleConfirmationClose = useCallback((open: boolean) => {
        if (!open) {
            setShowConfirmation(false);
        }
    }, []);

    // Properly handle uploader dialog closing
    const handleUploaderClose = useCallback((open: boolean) => {
        if (!open && !isUpdating) {
            setShowUploader(false);
        }
    }, [isUpdating]);

    // Handle the transition from confirmation to uploader
    const handleConfirmChange = useCallback(() => {
        setShowConfirmation(false);
        // Small delay to ensure clean transition between dialogs
        setTimeout(() => {
            setShowUploader(true);
        }, 100);
    }, []);

    // Handle manual cancel of confirmation
    const handleCancelConfirmation = useCallback(() => {
        setShowConfirmation(false);
    }, []);

    // Handle manual cancel of uploader
    const handleCancelUploader = useCallback(() => {
        if (!isUpdating) {
            setShowUploader(false);
        }
    }, [isUpdating]);

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
                throw new Error('Failed to update voice audio');
            }

            setShowUploader(false);
            toast.success('Voice sample updated successfully!');

            // Call the callback to refresh parent components
            if (onVoiceUpdated) {
                onVoiceUpdated();
            } else {
                // Fallback to router refresh if no callback provided
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating voice audio:', error);
            toast.error('Failed to update voice sample. Please try again.');
        } finally {
            setIsUpdating(false);
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
                    onInteractOutside={(e) => {
                        // Prevent closing when clicking outside if updating
                        if (isUpdating) {
                            e.preventDefault();
                        }
                    }}
                    onEscapeKeyDown={(e) => {
                        // Prevent closing with escape key if updating
                        if (isUpdating) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Upload New Voice Sample</DialogTitle>
                        <DialogDescription>
                            Upload a new audio file or record one to update this voice.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <AudioUploader
                            onAudioUploadedAction={handleAudioUploaded}
                            isLoading={isUpdating}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelUploader}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}