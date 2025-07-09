'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, User, Mail, Lock, CheckCircle2 } from "lucide-react";

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
    const searchParams = useSearchParams();

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
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
            isValid = false;
        }

        // Email validation
        if (!formData.email) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
            isValid = false;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password = 'Password must contain uppercase, lowercase, and number';
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
                general: '',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

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
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Check if there's a 'from' parameter to preserve the redirect
                    const from = searchParams.get('from');
                    const loginUrl = from
                        ? `/auth/login?message=${encodeURIComponent('Registration successful! Please sign in.')}&from=${from}`
                        : `/auth/login?message=${encodeURIComponent('Registration successful! Please sign in.')}`;

                    router.push(loginUrl);
                }
            } else {
                if (response.status === 409) {
                    setFormErrors({
                        ...formErrors,
                        email: 'An account with this email already exists',
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

    const getPasswordStrength = () => {
        const { password } = formData;
        if (!password) return { strength: 0, label: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

        return { strength, label: labels[strength], color: colors[strength] };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-card border rounded-xl p-6 shadow-lg">
                <div className="space-y-4">
                    {formErrors.general && (
                        <Alert variant="destructive" className="border-destructive/20">
                            <AlertDescription className="text-sm">{formErrors.general}</AlertDescription>
                        </Alert>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                Full Name
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    required
                                    className={`pl-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                                        formErrors.name ? 'border-destructive focus:border-destructive' : ''
                                    }`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {formErrors.name && (
                                <p className="text-xs text-destructive">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    required
                                    className={`pl-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                                        formErrors.email ? 'border-destructive focus:border-destructive' : ''
                                    }`}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                />
                            </div>
                            {formErrors.email && (
                                <p className="text-xs text-destructive">{formErrors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    required
                                    className={`pl-10 pr-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                                        formErrors.password ? 'border-destructive focus:border-destructive' : ''
                                    }`}
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {formData.password && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 w-full rounded-full transition-colors ${
                                                    level <= passwordStrength.strength
                                                        ? passwordStrength.color
                                                        : 'bg-muted'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    {passwordStrength.label && (
                                        <p className="text-xs text-muted-foreground">
                                            Password strength: {passwordStrength.label}
                                        </p>
                                    )}
                                </div>
                            )}

                            {formErrors.password && (
                                <p className="text-xs text-destructive">{formErrors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    required
                                    className={`pl-10 pr-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                                        formErrors.confirmPassword ? 'border-destructive focus:border-destructive' : ''
                                    }`}
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                {formData.confirmPassword && formData.confirmPassword === formData.password && (
                                    <CheckCircle2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                )}
                            </div>
                            {formErrors.confirmPassword && (
                                <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
                            className="w-full h-10 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-sm disabled:bg-gray-400 disabled:border-gray-400 disabled:text-white disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}