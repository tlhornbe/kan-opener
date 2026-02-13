import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../utils/storage';

export interface Task {
    id: string;
    title: string;
    description?: string;
    createdAt: number;
}

export interface Column {
    id: string;
    title: string;
    taskIds: string[];
}

export interface Bookmark {
    id: string;
    title: string;
    url: string;
}

interface BoardState {
    tasks: Record<string, Task>;
    columns: Record<string, Column>;
    columnOrder: string[];
    isRevealed: boolean;
    theme: 'dark' | 'light';
    bookmarks: Bookmark[];
    _hasHydrated: boolean; // Transient flag, not persisted to storage

    // Actions
    setRevealed: (revealed: boolean) => void;
    toggleTheme: () => void;
    setHasHydrated: (hydrated: boolean) => void;

    // Task Actions
    addTask: (columnId: string, title: string, description?: string) => void;
    updateTask: (taskId: string, title: string, description?: string) => void;
    deleteTask: (taskId: string, columnId: string) => void;
    moveTask: (
        taskId: string,
        sourceColumnId: string,
        destColumnId: string,
        sourceIndex: number,
        destIndex: number
    ) => void;

    // Column Actions
    addColumn: (title: string) => void;
    updateColumnTitle: (columnId: string, title: string) => void;
    deleteColumn: (columnId: string) => void;
    moveColumn: (sourceIndex: number, destIndex: number) => void;

    // Bookmark Actions
    addBookmark: (title: string, url: string) => void;
    removeBookmark: (id: string) => void;
}

const customStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const value = await storage.getItem(name, null);
        return value ? JSON.stringify(value) : null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await storage.setItem(name, JSON.parse(value));
    },
    removeItem: async (name: string): Promise<void> => {
        await storage.removeItem(name);
    }
};

export const useBoardStore = create<BoardState>()(
    persist(
        (set) => ({
            tasks: {},
            columns: {
                'todo': { id: 'todo', title: 'To Do', taskIds: [] },
                'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
                'done': { id: 'done', title: 'Done', taskIds: [] },
            },
            columnOrder: ['todo', 'in-progress', 'done'],
            isRevealed: false,
            theme: 'dark', // Default to dark as requested
            bookmarks: [
                { id: 'b1', title: 'Google', url: 'https://google.com' },
                { id: 'b2', title: 'YouTube', url: 'https://youtube.com' },
                { id: 'b3', title: 'Reddit', url: 'https://reddit.com' }
            ], // Default bookmarks
            _hasHydrated: false, // Start as false, set to true after storage loads

            setRevealed: (revealed) => set({ isRevealed: revealed }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
            setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

            addTask: (columnId, title, description) => set((state) => {
                const newTaskId = `task-${Date.now()}`;
                return {
                    tasks: {
                        ...state.tasks,
                        [newTaskId]: {
                            id: newTaskId,
                            title,
                            description,
                            createdAt: Date.now()
                        }
                    },
                    columns: {
                        ...state.columns,
                        [columnId]: {
                            ...state.columns[columnId],
                            taskIds: [...state.columns[columnId].taskIds, newTaskId]
                        }
                    }
                };
            }),

            updateTask: (taskId, title, description) => set((state) => ({
                tasks: {
                    ...state.tasks,
                    [taskId]: {
                        ...state.tasks[taskId],
                        title,
                        description
                    }
                }
            })),

            deleteTask: (taskId, columnId) => set((state) => {
                const newTasks = { ...state.tasks };
                delete newTasks[taskId];

                return {
                    tasks: newTasks,
                    columns: {
                        ...state.columns,
                        [columnId]: {
                            ...state.columns[columnId],
                            taskIds: state.columns[columnId].taskIds.filter((id) => id !== taskId)
                        }
                    }
                };
            }),

            moveTask: (taskId, sourceColumnId, destColumnId, sourceIndex, destIndex) => set((state) => {
                const startColumn = state.columns[sourceColumnId];
                const finishColumn = state.columns[destColumnId];

                if (startColumn === finishColumn) {
                    const newTaskIds = Array.from(startColumn.taskIds);
                    newTaskIds.splice(sourceIndex, 1);
                    newTaskIds.splice(destIndex, 0, taskId);

                    return {
                        columns: {
                            ...state.columns,
                            [sourceColumnId]: {
                                ...startColumn,
                                taskIds: newTaskIds,
                            },
                        },
                    };
                } else {
                    const startTaskIds = Array.from(startColumn.taskIds);
                    startTaskIds.splice(sourceIndex, 1);

                    const finishTaskIds = Array.from(finishColumn.taskIds);
                    finishTaskIds.splice(destIndex, 0, taskId);

                    return {
                        columns: {
                            ...state.columns,
                            [sourceColumnId]: {
                                ...startColumn,
                                taskIds: startTaskIds,
                            },
                            [destColumnId]: {
                                ...finishColumn,
                                taskIds: finishTaskIds,
                            },
                        },
                    };
                }
            }),

            addColumn: (title) => set((state) => {
                const newColumnId = `col-${Date.now()}`;
                return {
                    columns: {
                        ...state.columns,
                        [newColumnId]: { id: newColumnId, title, taskIds: [] }
                    },
                    columnOrder: [...state.columnOrder, newColumnId]
                };
            }),

            updateColumnTitle: (columnId, title) => set((state) => ({
                columns: {
                    ...state.columns,
                    [columnId]: {
                        ...state.columns[columnId],
                        title
                    }
                }
            })),

            deleteColumn: (columnId) => set((state) => {
                if (columnId === 'done') return state; // Prevent deleting Done column? Or allow? Let's safeguard it for now.

                const newColumns = { ...state.columns };
                const columnTasks = newColumns[columnId].taskIds;
                delete newColumns[columnId];

                const newTasks = { ...state.tasks };
                columnTasks.forEach(tId => delete newTasks[tId]); // Cleanup tasks in that column

                return {
                    columns: newColumns,
                    tasks: newTasks,
                    columnOrder: state.columnOrder.filter(id => id !== columnId)
                };
            }),

            moveColumn: (sourceIndex, destIndex) => set((state) => {
                const newColumnOrder = Array.from(state.columnOrder);
                const [removed] = newColumnOrder.splice(sourceIndex, 1);
                newColumnOrder.splice(destIndex, 0, removed);

                // Safety check: Ensure 'done' is always last if it exists
                if (newColumnOrder.includes('done')) {
                    const doneIndex = newColumnOrder.indexOf('done');
                    if (doneIndex !== newColumnOrder.length - 1) {
                        // If done moved or was jumped over, force it to end
                        const withoutDone = newColumnOrder.filter(id => id !== 'done');
                        withoutDone.push('done');
                        return { columnOrder: withoutDone };
                    }
                }

                return { columnOrder: newColumnOrder };
            }),

            addBookmark: (title, url) => set((state) => ({
                bookmarks: [...state.bookmarks, { id: `bm-${Date.now()}`, title, url }]
            })),

            removeBookmark: (id) => set((state) => ({
                bookmarks: state.bookmarks.filter(b => b.id !== id)
            })),
        }),
        {
            name: 'kan-opener-storage',
            version: 2,
            storage: createJSONStorage(() => customStorage),
            partialize: (state) => ({
                // Only persist these fields - _hasHydrated is transient
                tasks: state.tasks,
                columns: state.columns,
                columnOrder: state.columnOrder,
                theme: state.theme,
                bookmarks: state.bookmarks
            }),
            onRehydrateStorage: () => (state) => {
                // Called after storage is loaded
                if (state) {
                    state.setHasHydrated(true);
                    console.log('[Kan-Opener] Storage hydrated successfully');
                } else {
                    console.warn('[Kan-Opener] Storage hydration returned null state');
                    // Even on failure, mark as hydrated so app can render with defaults
                    useBoardStore.getState().setHasHydrated(true);
                }
            },
            migrate: (persistedState: unknown, version: number) => {
                // Migration logic for version upgrades
                console.log(`[Kan-Opener] Migrating from version ${version} to 2`);
                
                // Type guard for persisted state
                const state = persistedState as Partial<{
                    tasks: Record<string, Task>;
                    columns: Record<string, Column>;
                    columnOrder: string[];
                    theme: 'dark' | 'light';
                    bookmarks: Bookmark[];
                }> | null;
                
                // Version 1 to 2: No breaking changes, preserve all data
                if (version < 2) {
                    // Ensure all required fields exist with defaults if missing
                    return {
                        tasks: state?.tasks || {},
                        columns: state?.columns || {
                            'todo': { id: 'todo', title: 'To Do', taskIds: [] },
                            'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
                            'done': { id: 'done', title: 'Done', taskIds: [] },
                        },
                        columnOrder: state?.columnOrder || ['todo', 'in-progress', 'done'],
                        theme: state?.theme || 'dark',
                        bookmarks: state?.bookmarks || [
                            { id: 'b1', title: 'Google', url: 'https://google.com' },
                            { id: 'b2', title: 'YouTube', url: 'https://youtube.com' },
                            { id: 'b3', title: 'Reddit', url: 'https://reddit.com' }
                        ],
                    };
                }
                
                // Version 2: Return as-is, all data preserved
                return state;
            },
        }
    )
);
