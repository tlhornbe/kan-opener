import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const GoogleSearch: React.FC = () => {
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
    };

    return (
        <motion.form
            onSubmit={handleSearch}
            initial={false}
            animate={{ width: isFocused ? 300 : 200 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative flex items-center h-10 rounded-full transition-shadow duration-300 ${isFocused
                    ? 'bg-white text-slate-900 shadow-lg ring-2 ring-blue-400/50'
                    : 'bg-white/20 hover:bg-white/30 text-slate-800 dark:text-slate-100 backdrop-blur-sm border border-white/20'
                }`}
        >
            <Search
                size={16}
                className={`absolute left-3 transition-colors ${isFocused ? 'text-blue-500' : 'text-slate-500 dark:text-slate-300'
                    }`}
            />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Google Search"
                className="w-full bg-transparent border-none outline-none pl-9 pr-4 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-400/70"
            />
        </motion.form>
    );
};
