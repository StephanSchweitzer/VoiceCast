'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceWithUserAndGenre, Genre, GENDER_OPTIONS, UpdateVoiceFormData } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VoicePlayer from '@/components/voice/VoicePlayer';
import ChangeVoiceButton from '@/components/voice/ChangeVoiceButton';
import { User, Settings, Globe, Save, Edit3, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceEditFormProps {
    voice: VoiceWithUserAndGenre;
    genres: Genre[];
    onSuccess?: () => void;
    onVoiceUpdated?: () => void; // Add callback for voice sample updates
}

export default function VoiceEditForm({ voice, genres, onSuccess, onVoiceUpdated }: VoiceEditFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<UpdateVoiceFormData & { name: string }>({
        name: voice.name,
        description: voice.description || '',
        isPublic: voice.isPublic,
        genreId: voice.genre?.id || '',
        gender: voice.gender || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/voices/${voice.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    // Convert placeholder values back to null for the API
                    genreId: formData.genreId === 'none' ? null : formData.genreId,
                    gender: formData.gender === 'none' ? null : formData.gender
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update voice');
            }

            toast.success('Voice updated successfully!');

            if (onSuccess) {
                onSuccess();
            } else {
                router.push(`/voice/${voice.id}`);
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating voice:', error);
            toast.error('Failed to update voice. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-600 text-white">
                                <Edit3 className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Basic Information</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Update the details and settings for your voice
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
                                placeholder="Enter voice name"
                                className="h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Describe this voice..."
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
                                    value={formData.genreId || "none"}
                                    onValueChange={(value) => handleInputChange('genreId', value)}
                                >
                                    <SelectTrigger className="h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                        <SelectValue placeholder="Select genre (optional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-lg">
                                        <SelectItem value="none">No genre</SelectItem>
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
                                    value={formData.gender || "none"}
                                    onValueChange={(value) => handleInputChange('gender', value)}
                                >
                                    <SelectTrigger className="h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                        <SelectValue placeholder="Select gender (optional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-lg">
                                        <SelectItem value="none">No gender specified</SelectItem>
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
                            <div className="p-2 rounded-lg bg-green-600 text-white">
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
                            <div className="p-2 rounded-lg bg-purple-600 text-white">
                                <Volume2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl font-semibold">Reference Sample</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Your current voice reference. Changes affect future generations only.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-300">
                                Current Reference
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                            <Label className="text-sm font-medium mb-3 block">Current Audio Reference</Label>
                            <VoicePlayer audioUrl={voice.audioSample} />
                        </div>

                        <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
                            <ChangeVoiceButton
                                voiceId={voice.id}
                                onVoiceUpdated={onVoiceUpdated}
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
                        disabled={isLoading}
                        className="px-8 h-11 font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving Changes...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}