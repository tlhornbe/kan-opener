import React, { useState } from 'react';
import { Droppable, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { type Column as ColumnType, type Task as TaskType, useBoardStore } from '../store/useBoardStore';
import { Task } from './Task';
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence } from 'framer-motion';
import { TaskModal } from './TaskModal';

interface ColumnProps {
    column: ColumnType;
    tasks: TaskType[];
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const Column: React.FC<ColumnProps> = ({ column, tasks, dragHandleProps }) => {
    const updateColumnTitle = useBoardStore((state) => state.updateColumnTitle);
    const deleteColumn = useBoardStore((state) => state.deleteColumn);
    const addTask = useBoardStore((state) => state.addTask);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(column.title);

    // Task Creation State
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | undefined>(undefined);

    // Delete Confirmation State
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const handleTitleSubmit = () => {
        if (titleInput.trim()) {
            updateColumnTitle(column.id, titleInput);
        } else {
            setTitleInput(column.title);
        }
        setIsEditingTitle(false);
    };

    const handleAddTaskSubmit = () => {
        if (newTaskTitle.trim()) {
            addTask(column.id, newTaskTitle.trim());
            setNewTaskTitle("");
        }
    };

    const cancelAddTask = () => {
        setIsAddingTask(false);
        setNewTaskTitle("");
    };

    const openEditTask = (taskId: string) => {
        setEditingTaskId(taskId);
        setIsModalOpen(true);
    };

    const handleDeleteColumn = () => {
        deleteColumn(column.id);
        setIsConfirmingDelete(false);
    };

    return (
        <>
            <div className="flex flex-col w-full md:w-80 shrink-0 group/column bg-slate-50/50 dark:bg-slate-800/10 rounded-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 px-1 py-1 min-h-[32px]">
                    <div className="flex items-center gap-2 flex-1 relative">
                        {/* Drag Handle */}
                        {column.id !== 'done' && !isConfirmingDelete && (
                            <div
                                {...dragHandleProps}
                                className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <GripVertical size={16} />
                            </div>
                        )}

                        {isEditingTitle && !isConfirmingDelete ? (
                            <input
                                autoFocus
                                className="w-full px-2 py-1 text-sm font-semibold rounded bg-white dark:bg-slate-700 border border-blue-400 outline-none"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onBlur={handleTitleSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            />
                        ) : !isConfirmingDelete ? (
                            <h3
                                className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                onClick={() => setIsEditingTitle(true)}
                            >
                                {column.title}
                            </h3>
                        ) : (
                            <span className="text-sm font-bold text-red-500 animate-pulse">Delete this column?</span>
                        )}

                        {column.id !== 'done' && !isConfirmingDelete && (
                            <span className="text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                {tasks.length}
                            </span>
                        )}
                    </div>

                    {/* Column Actions */}
                    {column.id !== 'done' && (
                        !isConfirmingDelete ? (
                            <button
                                onClick={() => setIsConfirmingDelete(true)}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover/column:opacity-100 transition-all"
                                title="Delete Column"
                            >
                                <Trash2 size={14} />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsConfirmingDelete(false)}
                                    className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                    title="Cancel"
                                >
                                    <X size={14} />
                                </button>
                                <button
                                    onClick={handleDeleteColumn}
                                    className="p-1 text-white bg-red-500 hover:bg-red-600 rounded shadow-sm"
                                    title="Confirm Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )
                    )}
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id} type="task">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={clsx(
                                "flex-1 min-h-[150px] p-2 rounded-xl transition-colors flex flex-col",
                                snapshot.isDraggingOver ? "bg-slate-100 dark:bg-slate-700/50" : "bg-slate-50 dark:bg-slate-800/50",
                                column.id === 'done' && "bg-green-50/50 dark:bg-green-900/10 border border-transparent"
                            )}
                        >
                            <AnimatePresence initial={false}>
                                {tasks.map((task, index) => (
                                    <Task
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        columnId={column.id}
                                        onEdit={openEditTask}
                                    />
                                ))}
                            </AnimatePresence>
                            {provided.placeholder}

                            {/* Inline Add Task Input */}
                            {column.id !== 'done' && isAddingTask && (
                                <div className="mb-2 p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm border-2 border-blue-400 dark:border-blue-500">
                                    <input
                                        autoFocus
                                        placeholder="What needs doing?"
                                        className="w-full text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddTaskSubmit();
                                            if (e.key === 'Escape') cancelAddTask();
                                        }}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={cancelAddTask} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-400"><X size={14} /></button>
                                        <button onClick={handleAddTaskSubmit} className="p-1 bg-blue-500 hover:bg-blue-600 rounded text-white"><Check size={14} /></button>
                                    </div>
                                </div>
                            )}

                            {/* Add Task Button */}
                            {column.id !== 'done' && !isAddingTask && (
                                <button
                                    onClick={() => setIsAddingTask(true)}
                                    className="w-full mt-2 py-2 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800 border-dashed"
                                >
                                    <Plus size={16} className="mr-1" /> Add Task
                                </button>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>

            {/* Shared Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                columnId={column.id}
                taskId={editingTaskId}
            />
        </>
    );
};
