import React, { useEffect, useRef, useState, ReactNode } from 'react';
// Import directly with require to avoid TypeScript issues
const anime = require('animejs');

interface AnimeTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  staggerDelay?: number;
  easing?: string;
  style?: React.CSSProperties;
}

export const AnimeText: React.FC<AnimeTextProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 1000,
  staggerDelay = 30,
  easing = 'easeOutExpo',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [letters, setLetters] = useState<string[]>([]);

  useEffect(() => {
    // Convert the text to an array of characters
    setLetters(children.split(''));
  }, [children]);

  useEffect(() => {
    if (containerRef.current && letters.length > 0) {
      anime.timeline({
        targets: containerRef.current.querySelectorAll('.anime-letter'),
        delay,
      })
      .add({
        translateY: [40, 0],
        translateZ: 0,
        opacity: [0, 1],
        easing,
        duration,
        delay: anime.stagger(staggerDelay),
      });
    }
  }, [letters, delay, duration, staggerDelay, easing]);

  return (
    <div ref={containerRef} className={className} style={{ ...style, display: 'inline-block' }}>
      {letters.map((letter, index) => (
        <span 
          key={index} 
          className="anime-letter inline-block"
          style={{ display: 'inline-block', opacity: 0 }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </div>
  );
};

interface AnimeStaggerGridProps {
  children: ReactNode[];
  className?: string;
  delay?: number;
  duration?: number;
  staggerDelay?: number;
  easing?: string;
  gridClassName?: string;
}

export const AnimeStaggerGrid: React.FC<AnimeStaggerGridProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 600,
  staggerDelay = 100,
  easing = 'easeOutExpo',
  gridClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      anime.timeline({
        targets: containerRef.current.querySelectorAll('.anime-grid-item'),
        delay,
      })
      .add({
        translateY: [60, 0],
        translateZ: 0,
        opacity: [0, 1],
        easing,
        duration,
        delay: anime.stagger(staggerDelay),
      });
    }
  }, [delay, duration, staggerDelay, easing]);

  return (
    <div ref={containerRef} className={className}>
      <div className={gridClassName}>
        {React.Children.map(children, (child, index) => (
          <div key={index} className="anime-grid-item" style={{ opacity: 0 }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

interface AnimeCounterProps {
  end: number;
  className?: string;
  delay?: number;
  duration?: number;
  easing?: string;
  format?: (value: number) => string;
}

export const AnimeCounter: React.FC<AnimeCounterProps> = ({
  end,
  className = '',
  delay = 0,
  duration = 2000,
  easing = 'easeOutExpo',
  format = (value) => `${value.toFixed(0)}`,
}) => {
  const counterRef = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const obj = { count: 0 };
    const animation = anime({
      targets: obj,
      count: end,
      delay,
      duration,
      easing,
      round: 1,
      update: () => {
        setCount(obj.count);
      },
    });
    
    // Return cleanup function to handle component unmounting
    return () => {
      if (animation && animation.pause) {
        animation.pause();
      }
    };
  }, [end, delay, duration, easing]);

  return (
    <span ref={counterRef} className={className}>
      {format(count)}
    </span>
  );
};

interface AnimeBlobProps {
  className?: string;
  color?: string;
  size?: number;
  duration?: number;
  delay?: number;
}

export const AnimeBlob: React.FC<AnimeBlobProps> = ({
  className = '',
  color = 'rgba(255, 0, 0, 0.2)',
  size = 200,
  duration = 6000,
  delay = 0,
}) => {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animation: any = null;
    
    if (blobRef.current) {
      try {
        // Using static values instead of functions to avoid issues
        animation = anime({
          targets: blobRef.current,
          translateX: ['0%', '5%', '-5%', '0%'],
          translateY: ['0%', '-5%', '5%', '0%'],
          scale: [1, 1.1, 0.9, 1],
          borderRadius: ['40% 60% 70% 30%', '60% 40% 30% 70%', '30% 60% 70% 40%', '40% 60% 70% 30%'],
          duration: duration,
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutSine',
          delay: delay,
        });
      } catch (error) {
        console.error('AnimeBlob animation error:', error);
      }
    }
    
    return () => {
      if (animation && animation.pause) {
        animation.pause();
      }
    };
  }, [duration, delay]);

  return (
    <div 
      ref={blobRef} 
      className={`absolute ${className}`}
      style={{
        background: color,
        width: size + 'px',
        height: size + 'px',
        borderRadius: '40% 60% 70% 30%',
        filter: 'blur(60px)',
        zIndex: 0,
        opacity: 0.8,
        transform: 'translate(0, 0) scale(1)',
      }}
    />
  );
};

export const AnimeScrambleText: React.FC<AnimeTextProps & { characters?: string }> = ({
  children,
  className = '',
  delay = 0,
  duration = 2000,
  easing = 'easeInOutQuad',
  style = {},
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [originalText] = useState<string>(children);
  const [currentText, setCurrentText] = useState<string>(children);

  useEffect(() => {
    let interval: number | null = null;
    
    if (textRef.current) {
      const targetText = originalText;
      let result = '';
      let targetIndex = 0;
      
      // For each letter, scramble it until it matches the target letter
      setTimeout(() => {
        interval = window.setInterval(() => {
          if (targetIndex >= targetText.length) {
            if (interval) clearInterval(interval);
            return;
          }
          
          let scrambled = '';
          
          for (let i = 0; i < targetText.length; i++) {
            if (i < targetIndex) {
              scrambled += targetText[i];
            } else if (i === targetIndex) {
              scrambled += targetText[i];
              targetIndex++;
            } else {
              scrambled += characters[Math.floor(Math.random() * characters.length)];
            }
          }
          
          setCurrentText(scrambled);
          
          if (scrambled === targetText) {
            if (interval) clearInterval(interval);
          }
        }, duration / targetText.length);
      }, delay);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [originalText, delay, duration, characters]);

  return (
    <div ref={textRef} className={className} style={style}>
      {currentText}
    </div>
  );
};

// End of component file