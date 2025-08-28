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

const ReadingQuestionSchema = z.object({
  questionText: z.string(),
  questionType: z.enum(['multiple-choice', 'true-false']),
  options: z.array(z.string()).optional().describe('Options for multiple-choice questions.'),
  answer: z.string(),
});

const GeneratePracticeQuestionOutputSchema = z.object({
  passage: z.string().optional().describe('The reading passage for the question. Only for reading comprehension.'),
  questions: z.array(ReadingQuestionSchema).optional().describe('A list of questions for the reading passage.'),
  question: z.string().optional().describe('The generated IELTS practice question for non-reading tasks.'),
  answer: z.string().optional().describe('An example answer to the generated question for non-reading tasks.'),
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

If the question type is 'reading-comprehension', you MUST provide a detailed reading passage of about 300-400 words. Following the passage, you MUST generate exactly 10 questions in the IELTS reading format. The questions should be a mix of 'multiple-choice' and 'true-false' types.
For 'multiple-choice' questions, provide 3 or 4 options.
For 'true-false' questions, the answer can only be 'True' or 'False'.
Your entire response must be in JSON format matching the output schema.

If the question type is NOT 'reading-comprehension', generate a single question and a sample answer.

Question Type: {{{questionType}}}
Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
`,
  config: {
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
