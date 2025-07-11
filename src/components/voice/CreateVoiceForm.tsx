'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Genre, GENDER_OPTIONS } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AudioUploader from '@/components/voice/AudioUploader';
import { User, Mic, Settings, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CreateVoiceFormProps {
    genres: Genre[];
}

export default function CreateVoiceForm({ genres }: CreateVoiceFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false,
        genreId: '',
        gender: ''
    });

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAudioUploaded = (url: string) => {
        setAudioUrl(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!audioUrl) {
            toast.error('Please upload an audio sample');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/voices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    audioSample: audioUrl,
                    genreId: formData.genreId || null
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create voice');
            }

            const data = await response.json();
            toast.success('Voice created successfully!');
            router.push(`/voice/${data.id}`);
        } catch (error) {
            console.error('Error creating voice:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create voice');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Basic Information</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Tell us about your voice and how it should be used
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Voice Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                required
                                placeholder="e.g., Professional Narrator, Friendly Assistant..."
                                className="h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Describe the tone, style, and ideal use cases for this voice..."
                                rows={4}
                                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="genre" className="text-sm font-medium flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Genre
                                </Label>
                                <Select
                                    value={formData.genreId}
                                    onValueChange={(value) => handleInputChange('genreId', value)}
                                >
                                    <SelectTrigger className="h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                        <SelectValue placeholder="Select a genre (optional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-lg">
                                        {genres.map((genre) => (
                                            <SelectItem key={genre.id} value={genre.id}>
                                                {genre.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Gender
                                </Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => handleInputChange('gender', value)}
                                >
                                    <SelectTrigger className="h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                        <SelectValue placeholder="Select gender (optional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-lg">
                                        {GENDER_OPTIONS.map((gender) => (
                                            <SelectItem key={gender} value={gender}>
                                                {gender}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy & Sharing */}
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Privacy & Sharing</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Control who can discover and use your voice
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Visibility</Label>
                            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-700">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('isPublic', false)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                        !formData.isPublic
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Private
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('isPublic', true)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                        formData.isPublic
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Public
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                {formData.isPublic
                                    ? 'Visible to everyone in the community'
                                    : 'Only visible to you'
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Audio Sample */}
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                <Mic className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Audio Sample</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Upload or record a high-quality voice sample (3+ seconds recommended)
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl bg-white dark:bg-gray-700 p-4 border border-gray-200 dark:border-gray-600">
                            <AudioUploader
                                onAudioUploadedAction={handleAudioUploaded}
                                isLoading={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Actions */}
                <div className="flex justify-end space-x-4 pt-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="px-6 h-11 font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !audioUrl}
                        className="px-8 h-11 font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating Voice...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Create Voice
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}