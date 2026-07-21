import { ReactNode } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: 'fade-up' | 'scale-up';
  delayMs?: number;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delayMs = 0,
  threshold = 0.15,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal(threshold);

  const getAnimationClasses = () => {
    switch (animation) {
      case 'fade-up':
        return isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12';
      case 'scale-up':
        return isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95';
      default:
        return isVisible 
          ? 'opacity-100' 
          : 'opacity-0';
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${getAnimationClasses()}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
