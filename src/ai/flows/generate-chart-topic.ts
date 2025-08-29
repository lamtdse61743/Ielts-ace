
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (Academic) topics, focusing on multi-line charts.
 *
 * - generateChartTopic - A function that generates a Task 1 Academic topic with a line chart.
 * - GenerateChartTopicInput - The input type for the function.
 * - GenerateChartTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChartTopicInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateChartTopicInput = z.infer<typeof GenerateChartTopicInputSchema>;

// Ultra-minimal structure: return the complex chart data as a stringified JSON object.
const GenerateChartTopicOutputSchema = z.object({
    topic: z.string(),
    instructions: z.string(),
    taskType: z.string(),
    // We will parse this string on the client side.
    rawData: z.string().describe("A string containing the JSON for the chart's data and configuration."),
});
export type GenerateChartTopicOutput = z.infer<typeof GenerateChartTopicOutputSchema>;


export async function generateChartTopic(
  input: GenerateChartTopicInput
): Promise<GenerateChartTopicOutput> {
  return generateChartTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChartTopicPrompt',
  input: {schema: GenerateChartTopicInputSchema},
  output: {schema: GenerateChartTopicOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic) that involves a multi-line chart with realistic, fluctuating data.

User-provided Topic (if any): {{{topic}}}

**CRITICAL REQUIREMENTS:**
- The 'rawData' field MUST be a string containing a valid JSON object.
- The JSON object inside 'rawData' MUST have a 'type' property set to "line".
- The topic must be varied. Do NOT repeatedly use the same topic. Choose from a diverse range of subjects like economics (e.g., imports/exports), environment (e.g., recycling rates), social trends (e.g., population demographics), or technology (e.g., internet usage).
- The prompt MUST be specific. Invent a realistic context, including a specific country, city, or organization (e.g., "in the UK," "in the city of Sydney," "for the company TechCorp").
- Generate a random number of categories between 3 and 5, over 5-7 time points.
- **Data MUST be realistic and varied.** The lines should not all go in the same direction. Some should increase, some decrease, and some should fluctuate. The lines MUST cross at least once.

**Response Instructions:**
- You MUST generate a response where the 'rawData' field is a stringified JSON object.
- The 'topic' field MUST be a bold HTML string describing the visual.
- Set 'taskType' to exactly "line".
- The 'instructions' field should always be exactly "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."
- If the user provides a topic, create a prompt related to it. If not, generate a random, high-quality topic appropriate for an IELTS exam.

**Example for the 'rawData' string contents (Note the fluctuating data and specific context):**
\`\`\`json
{
  "type": "line",
  "data": [
    { "Year": "2015", "Cars": 45, "Bicycles": 60, "Public Transport": 55 },
    { "Year": "2017", "Cars": 42, "Bicycles": 65, "Public Transport": 58 },
    { "Year": "2019", "Cars": 48, "Bicycles": 62, "Public Transport": 65 },
    { "Year": "2021", "Cars": 55, "Bicycles": 58, "Public Transport": 60 },
    { "Year": "2023", "Cars": 50, "Bicycles": 70, "Public Transport": 55 }
  ],
  "config": {
    "dataKey": "Cars",
    "categoryKey": "Year",
    "series": ["Cars", "Bicycles", "Public Transport"],
    "xAxisLabel": "Year",
    "yAxisLabel": "Percentage of Commuters"
  }
}
\`\`\`

Your entire response must be in a single JSON object that strictly follows the output schema.
`,
});

const generateChartTopicFlow = ai.defineFlow(
  {
    name: 'generateChartTopicFlow',
    inputSchema: GenerateChartTopicInputSchema,
    outputSchema: GenerateChartTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
