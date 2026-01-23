import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    columnId?: string;
    taskId?: string; // If provided, we are editing
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, columnId, taskId }) => {
    const addTask = useBoardStore((state) => state.addTask);
    const updateTask = useBoardStore((state) => state.updateTask);
    const tasks = useBoardStore((state) => state.tasks);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Hydrate fields if editing
    useEffect(() => {
        if (taskId && tasks[taskId]) {
            setTitle(tasks[taskId].title);
            setDescription(tasks[taskId].description || '');
        } else {
            setTitle('');
            setDescription('');
        }
    }, [taskId, tasks, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        if (taskId) {
            updateTask(taskId, title, description);
        } else if (columnId) {
            addTask(columnId, title, description);
        }

        setTitle('');
        setDescription('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <React.Fragment>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-700"
                        >
                            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                        {taskId ? 'Edit Task' : 'New Task'}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                            placeholder="What needs to be done?"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Description <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-sm"
                                            placeholder="Add details, subtasks, or random thoughts..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!title.trim()}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Save size={16} />
                                        {taskId ? 'Save Changes' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
    );
};
