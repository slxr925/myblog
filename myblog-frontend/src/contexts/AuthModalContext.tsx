import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AuthModal } from '../components/auth/AuthModal';

interface AuthModalContextType {
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  toggleAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

interface AuthModalProviderProps {
  children: ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);
  const toggleAuthModal = useCallback(() => setIsAuthModalOpen((prev) => !prev), []);

  return (
    <AuthModalContext.Provider
      value={{
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        toggleAuthModal
      }}
    >
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = (): AuthModalContextType => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

