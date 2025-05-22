'use client';

import { useState } from 'react';
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
}

export default function ChangeVoiceButton({ voiceId }: ChangeVoiceButtonProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showUploader, setShowUploader] = useState(false);

    const handleConfirmChange = () => {
        setShowConfirmation(false);
        setShowUploader(true);
    };

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
            router.refresh();
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
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
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
                        <Button variant="outline" onClick={() => setShowConfirmation(false)}>
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
            <Dialog open={showUploader} onOpenChange={setShowUploader}>
                <DialogContent className="bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-lg max-w-2xl">
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
                        <Button variant="outline" onClick={() => setShowUploader(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}