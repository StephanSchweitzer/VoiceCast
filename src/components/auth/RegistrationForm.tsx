'use client';

import { useState, FormEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react"; // Install lucide-react if not already installed

interface RegistrationFormProps {
    onSubmit: (userData: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) => void;
    isLoading: boolean;
}

export function RegistrationForm({ onSubmit, isLoading }: RegistrationFormProps) {
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
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateForm = (): boolean => {
        const errors = {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
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
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
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
            });
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit(formData);
        }
    };

    // Helper function for form field styling
    const getInputStyles = (fieldName: keyof typeof formErrors) => {
        return formErrors[fieldName] ?
            "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700" :
            "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700";
    };

    return (
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
        </form>
    );
}