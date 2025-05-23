'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface RegistrationFormProps {
    onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [formErrors, setFormErrors] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        general: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const validateForm = (): boolean => {
        const errors = {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            general: '',
        };
        let isValid = true;

        // Name validation
        if (!formData.name.trim()) {
            errors.name = 'Name is required';
            isValid = false;
        }

        // Email validation
        if (!formData.email) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email is invalid';
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
            isValid = false;
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
            isValid = false;
        } else if (formData.confirmPassword !== formData.password) {
            errors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear the error for this field when user types
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors({
                ...formErrors,
                [name]: '',
                general: '', // Clear general error too
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Client-side validation
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.toLowerCase(),
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Default behavior: redirect to login
                    router.push('/login?message=Registration successful! Please sign in.');
                }
            } else {
                // Handle specific error responses
                if (response.status === 409) {
                    setFormErrors({
                        ...formErrors,
                        email: 'User with this email already exists',
                        general: '',
                    });
                } else {
                    setFormErrors({
                        ...formErrors,
                        general: data.error || 'Registration failed. Please try again.',
                    });
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            setFormErrors({
                ...formErrors,
                general: 'Network error. Please check your connection and try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function for form field styling
    const getInputStyles = (fieldName: keyof typeof formErrors) => {
        return formErrors[fieldName] ?
            "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700" :
            "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700";
    };

    return (
        <>
            {/* Display general error */}
            {formErrors.general && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                {formErrors.general}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        required
                        className={getInputStyles("name")}
                        placeholder="Enter your name"
                    />
                    {formErrors.name && (
                        <p className="text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">
                        Email address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        required
                        className={getInputStyles("email")}
                        placeholder="Enter your email"
                        autoComplete="email"
                    />
                    {formErrors.email && (
                        <p className="text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            required
                            className={getInputStyles("password")}
                            placeholder="Create a password"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Password must be at least 8 characters
                    </p>
                    {formErrors.password && (
                        <p className="text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                        Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            required
                            className={getInputStyles("confirmPassword")}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {formErrors.confirmPassword && (
                        <p className="text-sm text-red-600 dark:text-red-400">{formErrors.confirmPassword}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                >
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
            </form>
        </>
    );
}