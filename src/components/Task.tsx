import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { type Task as TaskType, useBoardStore } from '../store/useBoardStore';
import { X, AlignLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface TaskProps {
    task: TaskType;
    index: number;
    columnId: string;
    onEdit: (taskId: string) => void;
}

export const Task: React.FC<TaskProps> = ({ task, index, columnId, onEdit }) => {
    const deleteTask = useBoardStore((state) => state.deleteTask);

    // Use 'title', allow backward compat if 'content' exists
    const displayTitle = task.title || (task as any).content || "Untitled Task";

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}
                    onClick={() => onEdit(task.id)}
                    className="mb-2 relative group"
                >
                    <motion.div
                        // layoutId removed to prevent conflict with @hello-pangea/dnd transforms
                        className={clsx(
                            "p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all select-none cursor-grab active:cursor-grabbing",
                            snapshot.isDragging && "shadow-xl rotate-2 z-50 ring-2 ring-blue-500/50 scale-105"
                        )}
                    >
                        <div className="pr-6">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words leading-tight">
                                {displayTitle}
                            </p>

                            {task.description && (
                                <div className="flex items-center mt-2 text-xs text-slate-400 dark:text-slate-500 gap-1">
                                    <AlignLeft size={12} />
                                    <span className="truncate max-w-[150px]">{task.description}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onPointerDown={(e) => {
                                e.stopPropagation(); // Safe usage for buttons inside draggable
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id, columnId);
                            }}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
                            title="Delete Task"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                </div>
            )}
        </Draggable>
    );
};
