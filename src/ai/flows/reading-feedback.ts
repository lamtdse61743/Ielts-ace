'use server';
/**
 * @fileOverview Provides AI-driven feedback on reading comprehension answers.
 *
 * - readingFeedback - A function that handles the reading feedback process.
 * - ReadingFeedbackInput - The input type for the readingFeedback function.
 * - ReadingFeedbackOutput - The return type for the readingFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuestionAndAnswerSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  userAnswer: z.string().describe("The user's submitted answer."),
  correctAnswer: z.string().describe('The correct answer for the question.'),
});

const ReadingFeedbackInputSchema = z.object({
  passage: z.string().describe('The reading passage.'),
  questionsAndAnswers: z
    .array(QuestionAndAnswerSchema)
    .describe('An array of questions with user and correct answers.'),
});
export type ReadingFeedbackInput = z.infer<typeof ReadingFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
  questionText: z.string(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z
    .boolean()
    .describe('Whether the user answer was correct or not.'),
  explanation: z
    .string()
    .describe(
      "A detailed explanation of why the answer is correct, referencing parts of the reading passage. If the user's answer was incorrect, explain why their answer is wrong and why the correct one is right. The explanation should be in HTML format."
    ),
});

const ReadingFeedbackOutputSchema = z.object({
  feedback: z.array(FeedbackItemSchema),
});
export type ReadingFeedbackOutput = z.infer<typeof ReadingFeedbackOutputSchema>;

export async function readingFeedback(
  input: ReadingFeedbackInput
): Promise<ReadingFeedbackOutput> {
  return readingFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'readingFeedbackPrompt',
  input: {schema: ReadingFeedbackInputSchema},
  output: {schema: ReadingFeedbackOutputSchema},
  prompt: `You are an IELTS reading comprehension tutor. Your task is to provide feedback on a user's answers to a set of questions based on a reading passage.

For each question, you will be given the question text, the user's answer, and the correct answer. You must:
1.  Determine if the user's answer is correct. Be lenient with minor typos or case differences.
2.  Provide a clear and concise explanation for the correct answer, quoting or referencing specific sentences or phrases from the passage to support your explanation. Use <strong> tags to highlight key phrases from the passage.
3.  If the user's answer was incorrect, explain the mistake and why the correct answer is right.
4.  Do NOT mention that the user did not provide an answer if their answer is 'Not answered'. Just explain the correct answer.
5.  Your entire explanation must be a single block of HTML.

Reading Passage:
---
{{{passage}}}
---

Here are the questions and answers:
{{#each questionsAndAnswers}}
- Question: {{{this.questionText}}}
- User's Answer: {{{this.userAnswer}}}
- Correct Answer: {{{this.correctAnswer}}}
---
{{/each}}

Please provide your feedback in the specified JSON format.
`,
});

const readingFeedbackFlow = ai.defineFlow(
  {
    name: 'readingFeedbackFlow',
    inputSchema: ReadingFeedbackInputSchema,
    outputSchema: ReadingFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
