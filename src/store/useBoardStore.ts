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

interface BoardState {
    tasks: Record<string, Task>;
    columns: Record<string, Column>;
    columnOrder: string[];
    isRevealed: boolean;
    theme: 'dark' | 'light';

    // Actions
    setRevealed: (revealed: boolean) => void;
    toggleTheme: () => void;

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

            setRevealed: (revealed) => set({ isRevealed: revealed }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

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
        }),
        {
            name: 'kan-opener-storage',
            version: 2, // Increment version for potential migration handling (though zustand persist simple doesn't auto-migrate strongly)
            storage: createJSONStorage(() => customStorage),
            partialize: (state) => ({
                tasks: state.tasks,
                columns: state.columns,
                columnOrder: state.columnOrder,
                theme: state.theme
            }),
        }
    )
);
