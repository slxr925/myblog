import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { X } from 'lucide-react';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  const handleClose = () => {
    onClose();
    // 重置为初始模式
    setMode(initialMode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* 模态框内容 */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={handleClose}
                className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-10"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
              
              {mode === 'login' ? (
                <LoginForm 
                  onSwitchToRegister={handleSwitchToRegister}
                  onClose={handleClose}
                />
              ) : (
                <RegisterForm 
                  onSwitchToLogin={handleSwitchToLogin}
                  onClose={handleClose}
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};