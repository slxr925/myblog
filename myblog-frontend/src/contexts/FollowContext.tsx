import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FollowContextType {
    followedUsers: Set<number>;
    addFollowedUser: (userId: number) => void;
    removeFollowedUser: (userId: number) => void;
    isUserFollowed: (userId: number) => boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());

    const addFollowedUser = useCallback((userId: number) => {
        setFollowedUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(userId);
            return newSet;
        });
    }, []);

    const removeFollowedUser = useCallback((userId: number) => {
        setFollowedUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    }, []);

    const isUserFollowed = useCallback((userId: number) => {
        return followedUsers.has(userId);
    }, [followedUsers]);

    return (
        <FollowContext.Provider value={{ followedUsers, addFollowedUser, removeFollowedUser, isUserFollowed }}>
            {children}
        </FollowContext.Provider>
    );
};

export const useFollow = () => {
    const context = useContext(FollowContext);
    if (context === undefined) {
        throw new Error('useFollow must be used within a FollowProvider');
    }
    return context;
};
