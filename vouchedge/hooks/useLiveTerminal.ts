"use client";
import { useState, useEffect } from 'react';
export const useLiveTerminal = () => {
  const [data, setData] = useState({ confidence: 84.2, line: -115, latency: 14 });
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        confidence: parseFloat((prev.confidence + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        latency: Math.floor(Math.random() * (18 - 12 + 1) + 12),
        line: Math.random() > 0.9 ? prev.line - 1 : prev.line
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return data;
};
