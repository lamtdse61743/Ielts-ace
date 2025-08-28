'use server';

/**
 * @fileOverview Generates IELTS practice questions based on specified question types.
 *
 * - generatePracticeQuestion - A function that generates IELTS practice questions.
 * - GeneratePracticeQuestionInput - The input type for the generatePracticeQuestion function.
 * - GeneratePracticeQuestionOutput - The return type for the generatePracticeQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePracticeQuestionInputSchema = z.object({
  questionType: z
    .string()
    .describe(
      'The type of IELTS practice question to generate (e.g., reading comprehension, essay, listening).'
    ),
  topic: z
    .string()
    .optional()
    .describe('Optional topic to generate question about'),
  difficulty: z
    .string()
    .optional()
    .describe('Optional difficulty of the question'),
});
export type GeneratePracticeQuestionInput = z.infer<
  typeof GeneratePracticeQuestionInputSchema
>;

const GeneratePracticeQuestionOutputSchema = z.object({
  passage: z.string().optional().describe('The reading passage for the question. Only for reading comprehension.'),
  question: z.string().describe('The generated IELTS practice question.'),
  answer: z.string().describe('An example answer to the generated question'),
});
export type GeneratePracticeQuestionOutput = z.infer<
  typeof GeneratePracticeQuestionOutputSchema
>;

export async function generatePracticeQuestion(
  input: GeneratePracticeQuestionInput
): Promise<GeneratePracticeQuestionOutput> {
  return generatePracticeQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePracticeQuestionPrompt',
  input: {schema: GeneratePracticeQuestionInputSchema},
  output: {schema: GeneratePracticeQuestionOutputSchema},
  prompt: `You are an IELTS exam preparation assistant. Generate an IELTS practice question based on the specified question type, topic and difficulty.

If the question type is 'reading-comprehension', you MUST provide a reading passage for the user to read.

Question Type: {{{questionType}}}
Topic: {{{topic}}}
Difficulty: {{{difficulty}}}

Question:
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generatePracticeQuestionFlow = ai.defineFlow(
  {
    name: 'generatePracticeQuestionFlow',
    inputSchema: GeneratePracticeQuestionInputSchema,
    outputSchema: GeneratePracticeQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
