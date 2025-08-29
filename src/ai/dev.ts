import { config } from 'dotenv';
config();

import '@/ai/flows/essay-feedback.ts';
import '@/ai/flows/generate-practice-question.ts';
import '@/ai/flows/reading-feedback.ts';
import '@/ai/flows/generate-chart-topic.ts';
import '@/ai/flows/generate-bar-chart-topic.ts';
import '@/ai/flows/generate-stacked-bar-chart-topic.ts';
import '@/ai/flows/generate-writing-task1-general.ts';
import '@/ai/flows/generate-writing-task2.ts';
