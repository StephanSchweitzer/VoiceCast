'use client';

import { useState, useEffect } from 'react';
import { Genre, CreateGenreData, UpdateGenreData, ApiError } from '@/types/genres';

interface GenreFormProps {
    genre?: Genre;
    onSubmit: (data: CreateGenreData | UpdateGenreData) => void;
    onCancel: () => void;
    isLoading: boolean;
}

function GenreForm({ genre, onSubmit, onCancel, isLoading }: GenreFormProps) {
    const [name, setName] = useState(genre?.name || '');
    const [errors, setErrors] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);

        if (!name.trim()) {
            setErrors(['Genre name is required']);
            return;
        }

        if (name.length > 50) {
            setErrors(['Genre name must be 50 characters or less']);
            return;
        }

        onSubmit({ name: name.trim() });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Genre Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter genre name"
                    disabled={isLoading}
                    maxLength={50}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {name.length}/50 characters
                </div>
            </div>

            {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <ul className="text-red-600 dark:text-red-400 text-sm">
                        {errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Saving...' : (genre ? 'Update Genre' : 'Create Genre')}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function GenreManager() {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchGenres = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/genres');
            if (!response.ok) {
                throw new Error('Failed to fetch genres');
            }
            const data = await response.json();
            setGenres(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGenres();
    }, []);

    const handleCreateGenre = async (data: CreateGenreData) => {
        try {
            setActionLoading(true);
            const response = await fetch('/api/genres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData: ApiError = await response.json();
                throw new Error(errorData.message);
            }

            await fetchGenres();
            setShowCreateForm(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create genre');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateGenre = async (data: UpdateGenreData) => {
        if (!editingGenre) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/genres/${editingGenre.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData: ApiError = await response.json();
                throw new Error(errorData.message);
            }

            await fetchGenres();
            setEditingGenre(null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update genre');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteGenre = async (genre: Genre) => {
        if (!confirm(`Are you sure you want to delete the genre "${genre.name}"?`)) {
            return;
        }

        try {
            setActionLoading(true);
            const response = await fetch(`/api/genres/${genre.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData: ApiError = await response.json();
                throw new Error(errorData.message);
            }

            await fetchGenres();
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete genre');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600 dark:text-gray-400">Loading genres...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Genre Management</h1>
                <button
                    onClick={() => setShowCreateForm(true)}
                    disabled={showCreateForm || !!editingGenre}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Add New Genre
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <div className="text-red-600 dark:text-red-400">{error}</div>
                </div>
            )}

            {showCreateForm && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Create New Genre</h2>
                    <GenreForm
                        onSubmit={handleCreateGenre}
                        onCancel={() => setShowCreateForm(false)}
                        isLoading={actionLoading}
                    />
                </div>
            )}

            {editingGenre && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Edit Genre</h2>
                    <GenreForm
                        genre={editingGenre}
                        onSubmit={handleUpdateGenre}
                        onCancel={() => setEditingGenre(null)}
                        isLoading={actionLoading}
                    />
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Genres ({genres.length})</h2>
                </div>

                {genres.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No genres found. Create your first genre to get started.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {genres.map((genre) => (
                            <div key={genre.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{genre.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {genre._count?.voices || 0} voice(s) • Created {new Date(genre.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingGenre(genre)}
                                        disabled={!!editingGenre || showCreateForm || actionLoading}
                                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGenre(genre)}
                                        disabled={!!editingGenre || showCreateForm || actionLoading}
                                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}