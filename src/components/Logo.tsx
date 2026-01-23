import React from 'react';
import { motion } from 'framer-motion';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <motion.svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial="closed"
                whileHover="open"
                animate="closed"
            >
                {/* Can Body */}
                <motion.path
                    d="M20 30H100V100C100 105.523 95.5228 110 90 110H30C24.4772 110 20 105.523 20 100V30Z"
                    fill="#3B82F6"
                    stroke="#1E40AF"
                    strokeWidth="4"
                />
                <path
                    d="M20 35C20 35 40 40 60 40C80 40 100 35 100 35"
                    stroke="#1E40AF"
                    strokeWidth="2"
                    strokeOpacity="0.3"
                />

                {/* Can Lid (Animated) */}
                <motion.g
                    variants={{
                        closed: { y: 0 },
                        open: { y: -15 }
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                    <path
                        d="M100 30H20V20C20 14.4772 24.4772 10 30 10H90C95.5228 10 100 14.4772 100 20V30Z"
                        fill="#60A5FA"
                        stroke="#1E40AF"
                        strokeWidth="4"
                    />
                    {/* Pull Tab */}
                    <circle cx="60" cy="20" r="6" fill="#1E40AF" />
                </motion.g>

                {/* Contents (Revealed on Open) */}
                <motion.g
                    variants={{
                        closed: { opacity: 0, y: 10, scale: 0.9 },
                        open: { opacity: 1, y: -10, scale: 1, transition: { delay: 0.1 } }
                    }}
                >
                    {/* Confetti / Kanban Cards internal representation */}
                    <rect x="35" y="50" width="20" height="30" rx="2" fill="#FFFFFF" fillOpacity="0.9" />
                    <rect x="65" y="45" width="20" height="30" rx="2" fill="#93C5FD" fillOpacity="0.9" />
                </motion.g>
            </motion.svg>
        </div>
    );
};
