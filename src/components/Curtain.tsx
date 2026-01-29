import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore } from '../store/useBoardStore';
import { Logo } from './Logo';
import { QuickDock } from './QuickDock';

const KANBAN_PUNS = [
    "Pop the top on productivity.",
    "Fresh focus inside.",
    "Contents: 100% Organic Focus.",
    "No preservatives. Just tasks.",
    "Best if used by: EOD.",
    "100% Condensed Focus.",
    "Packed with potential.",
    "No artificial fillers. Just tasks.",
    "Contents settled during shipping.",
    "High in fiber. Low in distractions.",
    "Store in a cool, dry place (like this tab).",
];

export const Curtain: React.FC = () => {
    const isRevealed = useBoardStore((state) => state.isRevealed);
    const setRevealed = useBoardStore((state) => state.setRevealed);
    const [pun, setPun] = useState("");

    useEffect(() => {
        setPun(KANBAN_PUNS[Math.floor(Math.random() * KANBAN_PUNS.length)]);
    }, [isRevealed]);

    return (
        <AnimatePresence>
            {!isRevealed && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: "none" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md text-center px-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="flex flex-col items-center"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="cursor-pointer mb-8"
                            onClick={() => setRevealed(true)}
                        >
                            <Logo className="drop-shadow-2xl shadow-blue-500/50" />
                        </motion.div>

                        <motion.h1
                            className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Kan-Opener
                        </motion.h1>

                        <motion.p
                            className="text-slate-200 mb-10 text-lg font-medium max-w-md h-8 drop-shadow-sm italic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            "{pun}"
                        </motion.p>

                        <motion.button
                            onClick={() => setRevealed(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 overflow-hidden mb-12"
                        >
                            <span className="relative z-10 flex items-center">
                                Open Kan
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.button>

                        <QuickDock readOnly={true} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
