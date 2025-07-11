import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface VoicesSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function VoicesSearch({
                                         value,
                                         onChange,
                                         placeholder = "Search voices..."
                                     }: VoicesSearchProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-10"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => onChange('')}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}