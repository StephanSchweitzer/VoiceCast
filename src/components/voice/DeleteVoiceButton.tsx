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
import { AlertTriangle } from "lucide-react";

interface DeleteVoiceButtonProps {
    voiceId: string;
}

export default function DeleteVoiceButton({ voiceId }: DeleteVoiceButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/voice/${voiceId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete voice');
            }

            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting voice:', error);
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                className="
                  bg-transparent
                  text-red-600
                  border
                  border-red-600
                  hover:bg-red-50
                  focus:ring-red-300
                  dark:text-red-400
                  dark:border-red-400
                  dark:hover:bg-red-900
                  disabled:opacity-50
    "                onClick={() => setShowConfirmation(true)}
            >
                Delete
            </Button>

            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <DialogTitle>Delete Voice</DialogTitle>
                        </div>
                        <DialogDescription>
                            Are you sure you want to delete this voice? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="
                              bg-transparent
                              text-red-600
                              border
                              border-red-600
                              hover:bg-red-50
                              focus:ring-red-300
                              dark:text-red-400
                              dark:border-red-400
                              dark:hover:bg-red-900
                              disabled:opacity-50
                            "
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}