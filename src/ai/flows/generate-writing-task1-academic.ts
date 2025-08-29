
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (Academic) topics, including chart data.
 *
 * - generateWritingTask1Academic - A function that generates a Task 1 Academic topic.
 * - GenerateWritingTask1AcademicInput - The input type for the function.
 * - GenerateWritingTask1AcademicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWritingTask1AcademicInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateWritingTask1AcademicInput = z.infer<typeof GenerateWritingTask1AcademicInputSchema>;

const GenerateWritingTask1AcademicOutputSchema = z.object({
    topic: z.string().describe("The generated topic description for the chart or data. This should be formatted in HTML, and the entire prompt should be bold."),
    instructions: z.string().describe("Specific instructions for the task, formatted in HTML."),
});
export type GenerateWritingTask1AcademicOutput = z.infer<typeof GenerateWritingTask1AcademicOutputSchema>;


export async function generateWritingTask1Academic(
  input: GenerateWritingTask1AcademicInput
): Promise<GenerateWritingTask1AcademicOutput> {
  return generateWritingTask1AcademicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWritingTask1AcademicPrompt',
  input: {schema: GenerateWritingTask1AcademicInputSchema},
  output: {schema: GenerateWritingTask1AcademicOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a writing prompt for IELTS Writing Task 1 (Academic).

User-provided Topic (if any): {{{topic}}}

Instructions:
- You must generate a description of a chart, graph, table, or diagram. The topic should be suitable for data visualization (e.g., population trends, economic data, process diagrams). The entire topic description must be bold (using <strong> tags).
- The instruction should be "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."

If the user provides a topic, create a prompt related to it. If not, generate a random, high-quality topic appropriate for an IELTS exam.

Your entire response must be in a single JSON object that strictly follows the output schema. Format the 'topic' and 'instructions' fields as clean HTML.
`,
});

const generateWritingTask1AcademicFlow = ai.defineFlow(
  {
    name: 'generateWritingTask1AcademicFlow',
    inputSchema: GenerateWritingTask1AcademicInputSchema,
    outputSchema: GenerateWritingTask1AcademicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
