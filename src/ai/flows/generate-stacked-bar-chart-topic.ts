
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (Academic) topics, focusing on stacked bar charts.
 *
 * - generateStackedBarChartTopic - A function that generates a Task 1 Academic topic with a stacked bar chart.
 * - GenerateStackedBarChartTopicInput - The input type for the function.
 * - GenerateStackedBarChartTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStackedBarChartTopicInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateStackedBarChartTopicInput = z.infer<typeof GenerateStackedBarChartTopicInputSchema>;

const GenerateStackedBarChartTopicOutputSchema = z.object({
    topic: z.string(),
    instructions: z.string(),
    taskType: z.string(),
    rawData: z.string().describe("A string containing the JSON for the chart's data and configuration."),
});
export type GenerateStackedBarChartTopicOutput = z.infer<typeof GenerateStackedBarChartTopicOutputSchema>;


export async function generateStackedBarChartTopic(
  input: GenerateStackedBarChartTopicInput
): Promise<GenerateStackedBarChartTopicOutput> {
  return generateStackedBarChartTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStackedBarChartTopicPrompt',
  input: {schema: GenerateStackedBarChartTopicInputSchema},
  output: {schema: GenerateStackedBarChartTopicOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic) that involves a STACKED bar chart comparing the composition of several categories. The data can be in absolute numbers or percentages.

{{#if topic}}
User-provided Topic: {{{topic}}}
Please create a prompt related to this topic.
{{else}}
Please generate a random, high-quality topic appropriate for an IELTS exam.
{{/if}}

**CRITICAL REQUIREMENTS:**
- The 'rawData' field MUST be a string containing a valid JSON object.
- The JSON object inside 'rawData' MUST have a 'type' property set to "bar".
- The topic must be varied and creative. You MUST be creative and avoid generating topics related to energy consumption, production, or sources. Do NOT reuse the same topics. Choose from a diverse range of subjects like demographics (e.g., population by age group in different cities), economics (e.g., company revenue from different product lines), or social habits (e.g., time spent on various daily activities like work, leisure, sleep).
- The prompt MUST be specific. Invent a realistic context, including a specific country, city, or year (e.g., "in Germany in 2022," "for the city of Sydney," "for the year 2021").
- Generate a random number of primary categories (the bars on the x-axis) between 4 and 6.
- Generate a random number of data series (the segments within each bar) between 3 and 5.
- Data MUST be realistic and tell a story. The numbers should be plausible for the context. The segments within each bar should have a logical relationship. If the data represents percentages, the segments MUST sum to exactly 100 for each bar. The composition of each bar should be different enough to allow for meaningful comparison.

**Response Instructions:**
- You MUST generate a response where the 'rawData' field is a stringified JSON object.
- The 'topic' field MUST be a bold HTML string describing the visual.
- Set 'taskType' to exactly "bar".
- The 'instructions' field should always be exactly "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."

**Example for a STACKED bar chart in the 'rawData' string contents (representing absolute values):**
\`\`\`json
{
  "type": "bar",
  "data": [
    { "City": "New York", "Paper": 120, "Glass": 80, "Plastics": 90, "Metals": 50 },
    { "City": "Los Angeles", "Paper": 150, "Glass": 100, "Plastics": 110, "Metals": 60 },
    { "City": "Chicago", "Paper": 90, "Glass": 70, "Plastics": 80, "Metals": 40 }
  ],
  "config": {
    "categoryKey": "City",
    "series": ["Paper", "Glass", "Plastics", "Metals"],
    "xAxisLabel": "City",
    "yAxisLabel": "Waste Recycled (in thousands of tonnes)"
  }
}
\`\`\`

Your entire response must be in a single JSON object that strictly follows the output schema.
`,
});

const generateStackedBarChartTopicFlow = ai.defineFlow(
  {
    name: 'generateStackedBarChartTopicFlow',
    inputSchema: GenerateStackedBarChartTopicInputSchema,
    outputSchema: GenerateStackedBarChartTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
