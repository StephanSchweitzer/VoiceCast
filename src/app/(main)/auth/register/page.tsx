import Link from 'next/link';
import { RegistrationForm } from '@/components/auth/RegistrationForm';

export const metadata = {
    title: 'Create Account - Voicecast',
    description: 'Create your Voicecast account to get started',
};

export default function RegisterPage() {
    return (
        <div className="flex h-full items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Create account
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Get started with your new account today
                    </p>
                </div>

                <RegistrationForm />

                <div className="space-y-3 text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/auth/login"
                            className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                        By creating an account, you agree to our{' '}
                        <Link href="/terms" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline">
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}