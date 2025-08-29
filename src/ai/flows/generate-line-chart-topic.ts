
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (Academic) topics, focusing on multi-line charts.
 *
 * - generateLineChartTopic - A function that generates a Task 1 Academic topic with a multi-line chart.
 * - GenerateLineChartTopicInput - The input type for the function.
 * - GenerateLineChartTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLineChartTopicInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateLineChartTopicInput = z.infer<typeof GenerateLineChartTopicInputSchema>;

const GenerateLineChartTopicOutputSchema = z.object({
    topic: z.string(),
    instructions: z.string(),
    taskType: z.string(),
    rawData: z.string().describe("A string containing the JSON for the chart's data and configuration."),
});
export type GenerateLineChartTopicOutput = z.infer<typeof GenerateLineChartTopicOutputSchema>;


export async function generateLineChartTopic(
  input: GenerateLineChartTopicInput
): Promise<GenerateLineChartTopicOutput> {
  return generateLineChartTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLineChartTopicPrompt',
  input: {schema: GenerateLineChartTopicInputSchema},
  output: {schema: GenerateLineChartTopicOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic) that involves a multi-line chart comparing several categories over time.

{{#if topic}}
User-provided Topic: {{{topic}}}
Please create a prompt related to this topic.
{{else}}
Please generate a random, high-quality topic appropriate for an IELTS exam.
{{/if}}

**CRITICAL REQUIREMENTS:**
- The 'rawData' field MUST be a string containing a valid JSON object.
- The JSON object inside 'rawData' MUST have a 'type' property set to "line".
- The topic must be varied and creative. Do NOT repeatedly use the same topic. Choose from a diverse range of subjects like economics (e.g., unemployment rates), environment (e.g., CO2 emissions from different sectors), social trends (e.g., average house prices in different cities, international tourism numbers), or technology (e.g., mobile phone subscriptions vs. landlines).
- The prompt MUST be specific and compare different items over time. Invent a realistic context, including a specific country, city, or year range (e.g., "in the UK between 2015 and 2025,").
- Generate a random number of data series (lines on the chart), between 3 and 5.
- Generate a random number of time points (e.g., years), between 5 and 8.
- Data MUST be realistic and tell a story. The numbers should be plausible for the context. For example, if the topic is "Average Monthly Rent," the numbers should be in the hundreds or thousands, not single digits. The lines should show different, clear trends (some increasing, some decreasing, some fluctuating) and should intersect at least once to provide clear points for comparison. Avoid generating flat lines or data where all categories have very similar values.

**Response Instructions:**
- You MUST generate a response where the 'rawData' field is a stringified JSON object.
- The 'topic' field MUST be a bold HTML string describing the chart.
- Set 'taskType' to exactly "line".
- The 'instructions' field should always be exactly "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."

**Example for the 'rawData' string contents:**
\`\`\`json
{
  "type": "line",
  "data": [
    { "Year": "2010", "Beef": 120, "Chicken": 80, "Lamb": 60 },
    { "Year": "2012", "Beef": 110, "Chicken": 90, "Lamb": 65 },
    { "Year": "2014", "Beef": 130, "Chicken": 95, "Lamb": 60 },
    { "Year": "2016", "Beef": 115, "Chicken": 105, "Lamb": 70 },
    { "Year": "2018", "Beef": 125, "Chicken": 120, "Lamb": 75 },
    { "Year": "2020", "Beef": 135, "Chicken": 115, "Lamb": 80 }
  ],
  "config": {
    "categoryKey": "Year",
    "series": ["Beef", "Chicken", "Lamb"],
    "xAxisLabel": "Year",
    "yAxisLabel": "Consumption (in thousands of tonnes)"
  }
}
\`\`\`

Your entire response must be in a single JSON object that strictly follows the output schema.
`,
});

const generateLineChartTopicFlow = ai.defineFlow(
  {
    name: 'generateLineChartTopicFlow',
    inputSchema: GenerateLineChartTopicInputSchema,
    outputSchema: GenerateLineChartTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
