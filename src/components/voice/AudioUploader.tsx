'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Mic, Square, RotateCcw, FileAudio, Clock } from 'lucide-react';
import { toast } from 'sonner';
import VoicePlayer from '@/components/voice/VoicePlayer';

interface AudioUploaderProps {
    onAudioUploadedAction: (audioUrl: string, duration?: number) => void;
    isLoading?: boolean;
}

export default function AudioUploader({ onAudioUploadedAction, isLoading = false }: AudioUploaderProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState<'file' | 'recording' | null>(null);

    // Add drag and drop state
    const [isDragOver, setIsDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Validate and process file
    const processFile = (file: File) => {
        if (file && file.type.startsWith('audio/')) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return true;
        } else if (file) {
            toast.error('Invalid file type. Please select an audio file.');
            return false;
        }
        return false;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set drag over to false if we're leaving the drop zone itself
        // Check if the related target is outside the drop zone
        const dropZone = e.currentTarget as HTMLElement;
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!dropZone.contains(relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Ensure we show the correct drag effect
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const audioFile = files.find(file => file.type.startsWith('audio/'));

        if (audioFile) {
            processFile(audioFile);
        } else if (files.length > 0) {
            toast.error('Please drop an audio file (MP3, WAV, OGG, etc.)');
        }
    };

    const startRecording = async () => {
        if (typeof window === 'undefined') {
            toast.error('Recording is not available during server rendering');
            return;
        }

        if (!navigator?.mediaDevices?.getUserMedia) {
            toast.error('Audio recording is not supported in this browser. Please try Chrome, Firefox, or Safari.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const finalDuration = (Date.now() - startTimeRef.current) / 1000;
                setRecordingDuration(Math.round(finalDuration * 10) / 10);

                const blob = new Blob(chunks, { type: 'audio/wav' });
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            startTimeRef.current = Date.now();

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    toast.error('Microphone access denied. Please allow microphone access and try again.');
                } else if (error.name === 'NotFoundError') {
                    toast.error('No microphone found. Please connect a microphone and try again.');
                } else {
                    toast.error('Failed to access microphone. Please check your browser settings.');
                }
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const resetRecording = () => {
        setRecordedBlob(null);
        setRecordedUrl(null);
        setRecordingTime(0);
        setRecordingDuration(0);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleUpload = async (audioSource: 'file' | 'recording') => {
        let fileToUpload: File;
        let duration: number | undefined;

        if (audioSource === 'file' && selectedFile) {
            fileToUpload = selectedFile;
        } else if (audioSource === 'recording' && recordedBlob) {
            fileToUpload = new File([recordedBlob], 'recording.wav', { type: 'audio/wav' });
            duration = recordingDuration;
        } else {
            return;
        }

        setUploadProgress(audioSource);
        const formData = new FormData();
        formData.append('audio', fileToUpload);

        if (duration) {
            formData.append('duration', duration.toString());
        }

        try {
            const response = await fetch('/api/upload/audio', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload audio');
            }

            const data = await response.json();
            onAudioUploadedAction(data.url, duration);
            toast.success('Audio uploaded successfully!');
        } catch (error) {
            console.error('Error uploading audio:', error);
            toast.error('Failed to upload audio. Please try again.');
        } finally {
            setUploadProgress(null);
        }
    };

    return (
        <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <TabsTrigger
                    value="upload"
                    className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 transition-all"
                >
                    <Upload className="h-4 w-4" />
                    Upload File
                </TabsTrigger>
                <TabsTrigger
                    value="record"
                    className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 transition-all"
                >
                    <Mic className="h-4 w-4" />
                    Record Audio
                </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
                <div className="space-y-6">
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
                            isDragOver
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-400'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center space-y-4">
                            <div className={`p-4 rounded-full transition-all ${
                                isDragOver
                                    ? 'bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-800/40 dark:to-indigo-800/40'
                                    : 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-indigo-800/40'
                            }`}>
                                <FileAudio className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    {isDragOver ? 'Drop audio file here' : 'Choose audio file'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    or drag and drop it here
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                <FileAudio className="h-3 w-3" />
                                MP3, WAV, OGG • Max 10MB
                            </div>
                        </div>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>

                    {previewUrl && (
                        <Card className="border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
                            <CardContent className="p-4">
                                <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                                    <FileAudio className="h-4 w-4" />
                                    Preview
                                </Label>
                                <VoicePlayer audioUrl={previewUrl} />
                            </CardContent>
                        </Card>
                    )}

                    <Button
                        onClick={() => handleUpload('file')}
                        type="button"
                        disabled={!selectedFile || isLoading || uploadProgress === 'file'}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                    >
                        {uploadProgress === 'file' ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Audio
                            </div>
                        )}
                    </Button>
                </div>
            </TabsContent>

            <TabsContent value="record" className="mt-6">
                <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-6 p-8">
                        {!isRecording && !recordedUrl && (
                            <div className="text-center space-y-4">
                                <Button
                                    onClick={startRecording}
                                    type="button"
                                    size="lg"
                                    className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 p-0"
                                >
                                    <Mic className="h-8 w-8" />
                                </Button>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Click to start recording
                                </p>
                            </div>
                        )}

                        {isRecording && (
                            <div className="text-center space-y-4">
                                <Button
                                    onClick={stopRecording}
                                    type="button"
                                    size="lg"
                                    className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg animate-pulse transition-all duration-200 p-0"
                                >
                                    <Square className="h-8 w-8" />
                                </Button>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-lg font-mono font-medium">
                                        <Clock className="h-4 w-4 text-red-500" />
                                        {formatTime(recordingTime)}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Recording... Click to stop
                                    </p>
                                </div>
                            </div>
                        )}

                        {recordedUrl && (
                            <div className="w-full space-y-4">
                                <Card className="border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
                                    <CardContent className="p-4">
                                        <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                                            <Mic className="h-4 w-4 text-green-600" />
                                            Recorded Audio ({recordingDuration}s)
                                        </Label>
                                        <VoicePlayer
                                            audioUrl={recordedUrl}
                                            recordedDuration={recordingDuration}
                                        />
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={resetRecording}
                                        type="button"
                                        variant="outline"
                                        className="h-12 flex items-center gap-2 font-medium"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Record Again
                                    </Button>
                                    <Button
                                        onClick={() => handleUpload('recording')}
                                        type="button"
                                        disabled={isLoading || uploadProgress === 'recording'}
                                        className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200"
                                    >
                                        {uploadProgress === 'recording' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Uploading...
                                            </div>
                                        ) : (
                                            'Use Recording'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}