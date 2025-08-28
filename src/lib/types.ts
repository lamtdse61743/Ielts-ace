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
  difficulty?: string;
  createdAt: string;
  passages: Passage[];
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
