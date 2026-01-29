import React, { useState } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { GoogleSearch } from './GoogleSearch';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';

interface QuickDockProps {
    readOnly?: boolean;
}

export const QuickDock: React.FC<QuickDockProps> = ({ readOnly = false }) => {
    const { bookmarks, addBookmark, removeBookmark } = useBoardStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [isRemoving, setIsRemoving] = useState(false);

    const getFaviconUrl = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return `https://www.google.com/s2/favicons?domain=example.com&sz=64`;
        }
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle && newUrl) {
            let formattedUrl = newUrl;
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }
            addBookmark(newTitle, formattedUrl);
            setNewTitle("");
            setNewUrl("");
            setIsAdding(false);
        }
    };

    const handleBookmarkClick = (e: React.MouseEvent) => {
        if (isRemoving) {
            e.preventDefault();
            return;
        }
        // If not removing, let the link work naturally (it's an anchor tag)
    };

    return (
        <div className="flex items-center space-x-4">
            <GoogleSearch />

            <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-2" />

            <div className="flex items-center space-x-2">
                <AnimatePresence>
                    {bookmarks.map((bookmark) => (
                        <motion.div
                            key={bookmark.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="relative group"
                        >
                            <a
                                href={bookmark.url}
                                target="_blank" // Always new tab for bookmarks 
                                rel="noreferrer"
                                onClick={(e) => handleBookmarkClick(e)}
                                className={`block p-2 rounded-xl transition-all duration-200 ${isRemoving
                                    ? 'bg-red-100 hover:bg-red-200 cursor-pointer animate-pulse'
                                    : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                                    }`}
                                title={bookmark.title}
                            >
                                <img
                                    src={getFaviconUrl(bookmark.url)}
                                    alt={bookmark.title}
                                    className="w-5 h-5 drop-shadow-sm filter"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com';
                                    }}
                                />
                                {isRemoving && (
                                    <div
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            removeBookmark(bookmark.id);
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    >
                                        <X size={10} />
                                    </div>
                                )}
                            </a>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!readOnly && (
                    <div className="relative">
                        <div className="flex items-center space-x-1">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsAdding(!isAdding)}
                                className={`p-2 rounded-full transition-colors ${isAdding ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800'
                                    }`}
                                title="Add Bookmark"
                            >
                                <Plus size={20} />
                            </motion.button>

                            {bookmarks.length > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsRemoving(!isRemoving)}
                                    className={`p-2 rounded-full transition-colors ${isRemoving ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800'
                                        }`}
                                    title="Remove Bookmarks"
                                >
                                    <Trash2 size={16} />
                                </motion.button>
                            )}
                        </div>

                        <AnimatePresence>
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 backdrop-blur-xl"
                                >
                                    <form onSubmit={handleAddSubmit} className="flex flex-col space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add Shortcut</h3>
                                        <input
                                            autoFocus
                                            placeholder="Title (e.g., GitHub)"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors"
                                        />
                                        <input
                                            placeholder="URL (e.g., github.com)"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors"
                                        />
                                        <div className="flex justify-end space-x-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsAdding(false)}
                                                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-500/30"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </form>
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-t border-l border-slate-200 dark:border-slate-700 transform rotate-45" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};
