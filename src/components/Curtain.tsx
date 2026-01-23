import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoardStore } from '../store/useBoardStore';
import { Logo } from './Logo';


export const Curtain: React.FC = () => {
    const isRevealed = useBoardStore((state) => state.isRevealed);
    const setRevealed = useBoardStore((state) => state.setRevealed);


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


                        <motion.button
                            onClick={() => setRevealed(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center">
                                Open Kan
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.button>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
