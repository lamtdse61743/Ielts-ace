
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  initialTime: number; // in seconds
  className?: string;
}

export function ExamTimer({ initialTime, className }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      if (interval) clearInterval(interval);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = useCallback(() => {
    if (timeLeft > 0) {
      setIsActive(!isActive);
    }
  }, [isActive, timeLeft]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(initialTime);
  }, [initialTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const isTimeUp = timeLeft === 0;

  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TimerIcon className="size-5 text-muted-foreground" />
            <p
              className={cn(
                'font-mono text-2xl font-semibold',
                isTimeUp && 'text-destructive'
              )}
            >
              {formatTime(timeLeft)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTimer}
              disabled={isTimeUp}
              aria-label={isActive ? 'Pause timer' : 'Start timer'}
            >
              {isActive ? <Pause className="size-5" /> : <Play className="size-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetTimer}
              aria-label="Reset timer"
            >
              <RotateCcw className="size-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
