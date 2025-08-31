import type { EssayFeedbackOutput } from '@/ai/flows/essay-feedback';
import type { Passage } from '@/ai/flows/generate-practice-question';

export type ReadingQuestion = {
  questionNumber: number;
  questionText: string;
  questionType: string;
  options?: string[];
  answer: string;
};

export type QuestionGroup = {
    instruction: string;
    questions: ReadingQuestion[];
}

export type GeneratedQuestion = {
  id: string;
  type: 'question';
  questionType: 'reading-comprehension';
  trainingType?: 'Academic' | 'General Training';
  topic?: string;
  createdAt: string;
  passages: Passage[];
};

export type AnalyzedEssay = {
  id: string;
  type: 'essay';
  essay: string;
  topic: string;
  trainingType: 'Academic' | 'General Training';
  task: 'Task 1' | 'Task 2';
  feedback: EssayFeedbackOutput;
  createdAt: string;
};

export type SavedContent = GeneratedQuestion | AnalyzedEssay;
