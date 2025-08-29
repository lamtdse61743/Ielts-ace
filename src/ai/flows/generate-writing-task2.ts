
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 2 topics.
 *
 * - generateWritingTask2 - A function that generates a Task 2 topic.
 * - GenerateWritingTask2Input - The input type for the function.
 * - GenerateWritingTask2Output - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWritingTask2InputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateWritingTask2Input = z.infer<typeof GenerateWritingTask2InputSchema>;

const GenerateWritingTask2OutputSchema = z.object({
    topic: z.string().describe("The generated essay topic or question. This should be formatted in HTML with the entire prompt bold."),
    instructions: z.string().describe("Specific instructions for the task, formatted in HTML."),
});
export type GenerateWritingTask2Output = z.infer<typeof GenerateWritingTask2OutputSchema>;


export async function generateWritingTask2(
  input: GenerateWritingTask2Input
): Promise<GenerateWritingTask2Output> {
  return generateWritingTask2Flow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWritingTask2Prompt',
  input: {schema: GenerateWritingTask2InputSchema},
  output: {schema: GenerateWritingTask2OutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a writing prompt for IELTS Writing Task 2.

User-provided Topic (if any): {{{topic}}}

Instructions:
- Generate an essay question that requires a discursive response. The topic should be of general interest and allow for discussion of different viewpoints.
- The instruction should be "Write at least 250 words. Give reasons for your answer and include any relevant examples from your own knowledge or experience."
- You must randomly pick one of the following essay types to generate the question:
  1. Opinion Essay (Agree/Disagree): The user must state whether they agree, disagree, or partially agree with a statement. Example: "Some people think that university education should be free for everyone. To what extent do you agree or disagree?"
  2. Discussion Essay (Discuss Both Views): The user must discuss two perspectives and give their own opinion. Example: "Some people believe that technology has made our lives more complicated, while others think it has made life easier. Discuss both views and give your own opinion."
  3. Problem/Solution Essay: The user must identify problems and suggest solutions. Example: "Many cities around the world are facing traffic congestion. What are the main problems, and what solutions can be suggested to deal with this issue?"
  4. Advantages/Disadvantages Essay: The user must present the benefits and drawbacks of a given idea or development. Example: "In recent years, more people are choosing to work from home. What are the advantages and disadvantages of this trend?"
  5. Double Question Essay (Direct Question): The user will be asked two different questions about the same topic. Example: "Nowadays, many people prefer to shop online rather than in physical stores. Why is this the case? Do you think this is a positive or negative development?"
- Format the output 'topic' as HTML. Both the introductory statement and the question must be bold. The introductory statement should be in a <p> tag with a strong> tag inside it. The question itself should be in a separate <p> tag below it, also with a <strong> tag inside it.
- Example HTML format for Task 2 topic:
<p><strong>The increasing use of Artificial Intelligence (AI) in various aspects of our daily lives, from smart devices to automated services, is a significant technological development.</strong></p><p><strong>What are the advantages and disadvantages of this trend?</strong></p>

If the user provides a topic, create a prompt related to it. If not, generate a random, high-quality topic appropriate for an IELTS exam.

Your entire response must be in a single JSON object that strictly follows the output schema. Format the 'topic' and 'instructions' fields as clean HTML.
`,
});

const generateWritingTask2Flow = ai.defineFlow(
  {
    name: 'generateWritingTask2Flow',
    inputSchema: GenerateWritingTask2InputSchema,
    outputSchema: GenerateWritingTask2OutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
