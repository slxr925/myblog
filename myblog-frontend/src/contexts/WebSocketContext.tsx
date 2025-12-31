import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { NotificationVO } from '../types/api';

interface WebSocketContextType {
    isConnected: boolean;
    lastMessage: any | null;
    unreadCount: number | null;
    newNotification: NotificationVO | null;
    sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        // Return default values instead of throwing to prevent component crashes
        console.warn('useWebSocket used outside WebSocketProvider, returning defaults');
        return {
            isConnected: false,
            lastMessage: null,
            unreadCount: null,
            newNotification: null,
            sendMessage: () => { }
        };
    }
    return context;
};

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any | null>(null);
    const [unreadCount, setUnreadCount] = useState<number | null>(null);
    const [newNotification, setNewNotification] = useState<NotificationVO | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const getWsUrl = () => {
        // 根据环境判断 ws 还是 wss
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // 开发环境通常是 localhost:8081, 生产环境是 /api/.. 或者直接 /ws
        // 假设后端运行在 8081, 前端在 3000 (开发)
        if (import.meta.env.DEV) {
            return `ws://localhost:8081/ws/notification?token=${token}`;
        }
        // 生产环境, 假设通过Nginx转发 /ws 到后端
        return `${protocol}//${window.location.host}/ws/notification?token=${token}`;
    };

    const connect = useCallback(() => {
        if (!token || !isAuthenticated) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const wsUrl = getWsUrl();
            console.log('Connecting to WebSocket:', wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket Connected');
                setIsConnected(true);
                // Start Heartbeat
                startHeartbeat();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // console.log('WebSocket Message:', data);
                    setLastMessage(data);

                    switch (data.type) {
                        case 'NOTIFICATION':
                            if (data.data) {
                                // 解析 extraData
                                const notification = data.data;
                                if (notification.extraData && typeof notification.extraData === 'string') {
                                    try {
                                        notification.parsedExtraData = JSON.parse(notification.extraData);
                                    } catch (e) {/* ignore */ }
                                }
                                setNewNotification(notification);
                                // 如果后端没有同时推 unreadCount, 前端可以自己 +1
                                setUnreadCount(prev => (prev || 0) + 1);
                            }
                            break;
                        case 'UNREAD_COUNT':
                            if (typeof data.count === 'number') {
                                setUnreadCount(data.count);
                            }
                            break;
                        case 'PONG':
                            // console.log('Heartbeat Pong');
                            break;
                        default:
                            break;
                    }
                } catch (error) {
                    console.error('WebSocket message parse error:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket Disconnected:', event.code, event.reason);
                setIsConnected(false);
                stopHeartbeat();
                // Reconnect logic (exponential backoff could be better, but simple delay for now)
                if (isAuthenticated) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                ws.close();
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('WebSocket Connection Failed:', error);
        }
    }, [token, isAuthenticated]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        stopHeartbeat();
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const startHeartbeat = () => {
        stopHeartbeat();
        heartbeatIntervalRef.current = setInterval(() => {
            sendMessage({ type: 'PING' });
        }, 30000); // 30s heartbeat
    };

    const stopHeartbeat = () => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [isAuthenticated, token, connect, disconnect]);

    return (
        <WebSocketContext.Provider value={{
            isConnected,
            lastMessage,
            unreadCount,
            newNotification,
            sendMessage
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};
