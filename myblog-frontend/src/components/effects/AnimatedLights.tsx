import React, { useEffect, useState } from 'react';

interface LightSpot {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export const AnimatedLights: React.FC = () => {
  const [lightSpots, setLightSpots] = useState<LightSpot[]>([]);

  // 生成随机光斑
  const generateLightSpots = () => {
    const spots: LightSpot[] = [];
    const colors = [
      'rgba(59, 130, 246, 0.3)',  // blue
      'rgba(99, 102, 241, 0.25)', // indigo
      'rgba(139, 92, 246, 0.2)', // violet
      'rgba(168, 85, 247, 0.15)', // purple
      'rgba(196, 181, 253, 0.2)', // purple
      'rgba(219, 39, 119, 0.15)', // pink
      'rgba(244, 114, 182, 0.1)', // pink
      'rgba(251, 146, 60, 0.15)', // orange
      'rgba(254, 240, 138, 0.2)', // yellow
    ];

    for (let i = 0; i < 6; i++) {
      spots.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 300 + 100, // 100-400px
        duration: Math.random() * 10 + 15, // 15-25s
        delay: Math.random() * 5, // 0-5s delay
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    return spots;
  };

  useEffect(() => {
    setLightSpots(generateLightSpots());

    // 每隔一段时间重新生成光斑位置
    const interval = setInterval(() => {
      setLightSpots(generateLightSpots());
    }, 30000); // 30秒重新生成一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute inset-0">
        {lightSpots.map((spot) => (
          <div
            key={spot.id}
            className="absolute rounded-full blur-3xl animate-pulse"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.size}px`,
              height: `${spot.size}px`,
              background: `radial-gradient(circle, ${spot.color} 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              animation: `float ${spot.duration}s ease-in-out ${spot.delay}s infinite`,
              filter: 'blur(40px)',
            }}
          />
        ))}
      </div>

      {/* 添加额外的光晕效果 */}
      <div className="absolute inset-0">
        <div
          className="absolute top-10 left-10 w-96 h-96 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(147, 197, 253, 0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(196, 181, 253, 0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
            animationDelay: '2s',
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(254, 240, 138, 0.06) 0%, transparent 70%)',
            filter: 'blur(45px)',
            animationDelay: '4s',
          }}
        />
      </div>

      {/* CSS动画 */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1) rotate(0deg);
              opacity: 0.6;
            }
            25% {
              transform: translate(-45%, -55%) scale(1.1) rotate(90deg);
              opacity: 0.8;
            }
            50% {
              transform: translate(-55%, -45%) scale(0.9) rotate(180deg);
              opacity: 0.4;
            }
            75% {
              transform: translate(-50%, -50%) scale(1.05) rotate(270deg);
              opacity: 0.7;
            }
          }
        `}
      </style>
    </div>
  );
};