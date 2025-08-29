
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (Academic) topics, focusing on bar charts.
 *
 * - generateBarChartTopic - A function that generates a Task 1 Academic topic with a bar chart.
 * - GenerateBarChartTopicInput - The input type for the function.
 * - GenerateBarChartTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBarChartTopicInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateBarChartTopicInput = z.infer<typeof GenerateBarChartTopicInputSchema>;

// Ultra-minimal structure: return the complex chart data as a stringified JSON object.
const GenerateBarChartTopicOutputSchema = z.object({
    topic: z.string(),
    instructions: z.string(),
    taskType: z.string(),
    // We will parse this string on the client side.
    rawData: z.string().describe("A string containing the JSON for the chart's data and configuration."),
});
export type GenerateBarChartTopicOutput = z.infer<typeof GenerateBarChartTopicOutputSchema>;


export async function generateBarChartTopic(
  input: GenerateBarChartTopicInput
): Promise<GenerateBarChartTopicOutput> {
  return generateBarChartTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBarChartTopicPrompt',
  input: {schema: GenerateBarChartTopicInputSchema},
  output: {schema: GenerateBarChartTopicOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic) that involves a bar chart comparing several categories.

{{#if topic}}
User-provided Topic: {{{topic}}}
Please create a prompt related to this topic.
{{else}}
Please generate a random, high-quality topic appropriate for an IELTS exam.
{{/if}}

**CRITICAL REQUIREMENTS:**
- The 'rawData' field MUST be a string containing a valid JSON object.
- The JSON object inside 'rawData' MUST have a 'type' property set to "bar".
- The topic must be varied. Do NOT repeatedly use the same topic. Choose from a diverse range of subjects like economics (e.g., average salaries for different professions), environment (e.g., waste recycling rates by material), social trends (e.g., preferred holiday destinations), or technology (e.g., percentage of people using different social media platforms).
- The prompt MUST be specific and compare different items in a single category. Invent a realistic context, including a specific country, city, or year (e.g., "in the UK in 2022," "in the city of Sydney," "for the company TechCorp").
- Generate a random number of categories to compare, between 4 and 6.
- Data MUST be realistic.

**Response Instructions:**
- You MUST generate a response where the 'rawData' field is a stringified JSON object.
- The 'topic' field MUST be a bold HTML string describing the visual.
- Set 'taskType' to exactly "bar".
- The 'instructions' field should always be exactly "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."

**Example for the 'rawData' string contents (Note the single data point per category):**
\`\`\`json
{
  "type": "bar",
  "data": [
    { "Profession": "Teachers", "Salary": 45000 },
    { "Profession": "Doctors", "Salary": 75000 },
    { "Profession": "Engineers", "Salary": 68000 },
    { "Profession": "Nurses", "Salary": 52000 },
    { "Profession": "Lawyers", "Salary": 82000 }
  ],
  "config": {
    "dataKey": "Salary",
    "categoryKey": "Profession",
    "series": ["Salary"],
    "xAxisLabel": "Profession",
    "yAxisLabel": "Average Annual Salary (USD)"
  }
}
\`\`\`

Your entire response must be in a single JSON object that strictly follows the output schema.
`,
});

const generateBarChartTopicFlow = ai.defineFlow(
  {
    name: 'generateBarChartTopicFlow',
    inputSchema: GenerateBarChartTopicInputSchema,
    outputSchema: GenerateBarChartTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
