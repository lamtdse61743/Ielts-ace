
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (General Training) topics.
 *
 * - generateWritingTask1General - A function that generates a Task 1 General Training topic.
 * - GenerateWritingTask1GeneralInput - The input type for the function.
 * - GenerateWritingTask1GeneralOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWritingTask1GeneralInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateWritingTask1GeneralInput = z.infer<typeof GenerateWritingTask1GeneralInputSchema>;

const GenerateWritingTask1GeneralOutputSchema = z.object({
    topic: z.string().describe("The generated situation for the letter. This should be formatted in HTML, and the entire prompt should be bold."),
    instructions: z.string().describe("Specific instructions for the task, formatted in HTML."),
});
export type GenerateWritingTask1GeneralOutput = z.infer<typeof GenerateWritingTask1GeneralOutputSchema>;


export async function generateWritingTask1General(
  input: GenerateWritingTask1GeneralInput
): Promise<GenerateWritingTask1GeneralOutput> {
  return generateWritingTask1GeneralFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWritingTask1GeneralPrompt',
  input: {schema: GenerateWritingTask1GeneralInputSchema},
  output: {schema: GenerateWritingTask1GeneralOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a writing prompt for IELTS Writing Task 1 (General Training).

User-provided Topic (if any): {{{topic}}}

Instructions:
- Generate a situation for a letter. The topic should be a common, everyday scenario requiring a formal, semi-formal, or informal letter. The generated 'topic' text must be formatted as HTML with the entire scenario in bold (using <strong> tags).
- The instruction should be "Write at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear ...,"

If the user provides a topic, create a prompt related to it. If not, generate a random, high-quality topic appropriate for an IELTS exam.

Your entire response must be in a single JSON object that strictly follows the output schema. Format the 'topic' and 'instructions' fields as clean HTML.
`,
});

const generateWritingTask1GeneralFlow = ai.defineFlow(
  {
    name: 'generateWritingTask1GeneralFlow',
    inputSchema: GenerateWritingTask1GeneralInputSchema,
    outputSchema: GenerateWritingTask1GeneralOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
