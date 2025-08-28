import type { EssayFeedbackOutput } from '@/ai/flows/essay-feedback';
import type { GeneratePracticeQuestionOutput } from '@/ai/flows/generate-practice-question';

export type ReadingQuestion = {
  questionText: string;
  questionType: 'multiple-choice' | 'true-false';
  options?: string[];
  answer: string;
};

export type GeneratedQuestion = GeneratePracticeQuestionOutput & {
  id: string;
  type: 'question';
  questionType: string;
  topic?: string;
  difficulty?: string;
  createdAt: string;
  passage?: string;
  questions?: ReadingQuestion[];
};

export type AnalyzedEssay = {
  id: string;
  type: 'essay';
  essay: string;
  topic: string;
  feedback: EssayFeedbackOutput;
  createdAt: string;
};

export type SavedContent = GeneratedQuestion | AnalyzedEssay;
