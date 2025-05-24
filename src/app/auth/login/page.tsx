import LoginForm from '@/components/auth/LoginForm';
import AuthRedirect from '@/components/auth/AuthRedirect';

export const metadata = {
    title: 'Sign In - Voicecast',
    description: 'Sign in to your Voicecast account',
};

export default function LoginPage() {
    return (
        <AuthRedirect>
            <div className="flex h-full items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <LoginForm />
                </div>
            </div>
        </AuthRedirect>
    );
}