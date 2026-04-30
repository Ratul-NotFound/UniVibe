import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidthClass = 'max-w-md' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed left-1/2 top-1/2 z-[60] w-[90%] ${maxWidthClass} -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-zinc-900 p-6 shadow-2xl border border-white/5 text-white`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="rounded-full p-1 hover:bg-white/5 text-zinc-400">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export { Modal };
