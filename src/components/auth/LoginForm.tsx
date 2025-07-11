'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

interface LoginFormProps {
    redirectUrl?: string;
    showRegisterLink?: boolean;
}

export default function LoginForm({
                                      redirectUrl = '/dashboard',
                                      showRegisterLink = true
                                  }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();

    // Check for success message from registration
    const message = searchParams.get('message');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError('Invalid email or password');
                setLoading(false);
                return;
            }

            // Success! AuthRedirect will handle the full page refresh redirect
            // Keep loading state active until redirect happens
        } catch (error) {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-card border rounded-xl p-6 shadow-lg">
                <div className="space-y-5">
                    {/* Show success message from registration */}
                    {message && (
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                            <AlertDescription className="text-sm">{message}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive" className="border-destructive/20">
                            <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
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
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="pl-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    disabled={loading}
                                />
                            </div>
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
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="pl-10 pr-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full h-10 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-sm disabled:bg-gray-400 disabled:border-gray-400 disabled:text-white disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>

                    {showRegisterLink && (
                        <div className="text-center pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <Link
                                    href="/auth/register"
                                    className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}