import React, { useEffect, useState } from 'react';
import { DragDropContext, type DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import canvasConfetti from 'canvas-confetti';
import { useBoardStore } from '../store/useBoardStore';
import { Column } from './Column';
import { Plus } from 'lucide-react';

export const Board: React.FC = () => {
    const { columns, columnOrder, tasks, moveTask, moveColumn, deleteTask, addColumn } = useBoardStore();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Column Reordering
        if (type === 'column') {
            moveColumn(source.index, destination.index);
            return;
        }

        // Task Reordering
        moveTask(
            draggableId,
            source.droppableId,
            destination.droppableId,
            source.index,
            destination.index
        );

        // Shredder Logic for "Done" column
        if (destination.droppableId === 'done' && source.droppableId !== 'done') {
            triggerShredder(draggableId);
        }
    };

    const triggerShredder = (taskId: string) => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio: number, opts: any) {
            canvasConfetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });

        setTimeout(() => {
            deleteTask(taskId, 'done');
        }, 1200);
    };

    const handleAddColumn = () => {
        const title = prompt("New Column Title:");
        if (title) {
            addColumn(title);
        }
    };

    if (!isClient) return null;

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="column">
                    {(provided) => (
                        <div
                            className="flex flex-col md:flex-row h-full items-start px-4 md:px-8 py-8 gap-6 md:space-x-6 w-full md:w-auto overflow-y-auto md:overflow-y-hidden"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {columnOrder.map((columnId, index) => {
                                const column = columns[columnId];
                                const columnTasks = column.taskIds
                                    .map((taskId) => tasks[taskId])
                                    .filter(Boolean);

                                const isDragDisabled = column.id === 'done';

                                return (
                                    <Draggable
                                        key={column.id}
                                        draggableId={column.id}
                                        index={index}
                                        isDragDisabled={isDragDisabled}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="w-full md:w-auto"
                                            >
                                                <Column
                                                    column={column}
                                                    tasks={columnTasks}
                                                    dragHandleProps={provided.dragHandleProps}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}

                            {/* Add Column Button */}
                            <div className="w-full md:w-80 shrink-0">
                                <button
                                    onClick={handleAddColumn}
                                    className="w-full h-[150px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer gap-2"
                                >
                                    <Plus size={32} />
                                    <span className="font-semibold">Add Column</span>
                                </button>
                            </div>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};
