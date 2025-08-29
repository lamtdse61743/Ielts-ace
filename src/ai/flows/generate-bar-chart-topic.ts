
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
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic) that involves a grouped bar chart comparing several categories with multiple data series.

{{#if topic}}
User-provided Topic: {{{topic}}}
Please create a prompt related to this topic.
{{else}}
Please generate a random, high-quality topic appropriate for an IELTS exam.
{{/if}}

**CRITICAL REQUIREMENTS:**
- The 'rawData' field MUST be a string containing a valid JSON object.
- The JSON object inside 'rawData' MUST have a 'type' property set to "bar".
- The topic must be varied and creative. You MUST be creative and avoid generating topics related to energy, finance, or consumer spending. Do NOT reuse the same topics. Choose from a diverse range of subjects like social trends (e.g., participation in various sports by gender, social media usage across age groups), education (e.g., university enrollment in different fields, reasons for choosing a university), or technology (e.g., internet usage by age group on different devices).
- The prompt MUST be specific. Invent a realistic context, including a specific country, city, or year (e.g., "in the UK in 2020," "for residents of Paris," "for the year 2023"). Do NOT just use the examples.
- Generate a random number of primary categories (the groups on the x-axis) between 4 and 6.
- Generate a random number of data series (the bars within each group) between 2 and 4.
- Data MUST be realistic and tell a story. The numbers should be plausible for the context (e.g., millions for sales figures, percentages for population segments). The values for each category and series should be distinct enough to allow for meaningful comparison. Avoid generating data where all bars are roughly the same height.

**Response Instructions:**
- You MUST generate a response where the 'rawData' field is a stringified JSON object.
- The 'topic' field MUST be a bold HTML string describing the visual.
- Set 'taskType' to exactly "bar".
- The 'instructions' field should always be exactly "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."

**Example for a GROUPED bar chart in the 'rawData' string contents:**
\`\`\`json
{
  "type": "bar",
  "data": [
    { "Country": "USA", "Online Sales": 350, "In-Store Sales": 750 },
    { "Country": "UK", "Online Sales": 280, "In-Store Sales": 620 },
    { "Country": "Germany", "Online Sales": 250, "In-Store Sales": 580 },
    { "Country": "Japan", "Online Sales": 220, "In-Store Sales": 550 }
  ],
  "config": {
    "categoryKey": "Country",
    "series": ["Online Sales", "In-Store Sales"],
    "xAxisLabel": "Country",
    "yAxisLabel": "Sales (in millions of USD)"
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
