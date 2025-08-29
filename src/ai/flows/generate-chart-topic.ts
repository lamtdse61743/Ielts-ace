
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (Academic) topics, including chart data.
 *
 * - generateChartTopic - A function that generates a Task 1 Academic topic with chart data.
 * - GenerateChartTopicInput - The input type for the function.
 * - GenerateChartTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChartTopicInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateChartTopicInput = z.infer<typeof GenerateChartTopicInputSchema>;

const ChartDataPointSchema = z.object({
    name: z.string().describe("The label for a data point (e.g., a year, a country). This will be the category."),
    value: z.number().describe("The numerical value for a data point."),
});

const ChartDataSchema = z.object({
    type: z.enum(['bar', 'line', 'pie']).describe("The type of chart to represent the data. Can be 'bar', 'line', or 'pie'."),
    data: z.array(ChartDataPointSchema).describe("An array of data objects for the chart. Each object must conform to the ChartDataPointSchema with a 'name' and a 'value'."),
    config: z.object({
        dataKey: z.string().describe("The key in the data objects that holds the numerical value. This must be 'value'."),
        categoryKey: z.string().describe("The key in the data objects that holds the category label. This must be 'name'."),
        xAxisLabel: z.string().optional().describe("The label for the X-axis of the chart."),
        yAxisLabel: z.string().optional().describe("The label for the Y-axis of the chart."),
    }).describe("Configuration for rendering the chart.")
});

const GenerateChartTopicOutputSchema = z.object({
    topic: z.string().describe("The generated topic description for the chart or data. This should be formatted in HTML, and the entire prompt should be bold."),
    instructions: z.string().describe("Specific instructions for the task, formatted in HTML."),
    chartData: ChartDataSchema.describe("Structured data for generating a visual chart. This should ONLY be generated for Task 1 Academic."),
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
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic).

This requires two parts:
1.  A text description of the chart.
2.  The structured JSON data for the chart itself.

User-provided Topic (if any): {{{topic}}}

Instructions:
- You must randomly choose to generate data for ONE of the following chart types: 'bar', 'line', or 'pie'.
- You must generate a 'topic' that accurately describes the data you are creating. The entire topic description must be bold (using <strong> tags).
- The 'instructions' field should always be "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."
- You must generate valid 'chartData'. 
- The 'data' array inside 'chartData' must contain objects that follow the schema: {name: string, value: number}.
- The 'config' object inside 'chartData' must set 'dataKey' to "value" and 'categoryKey' to "name".

Example of a valid output for a 'bar' chart:
{
  "topic": "<strong>The chart below shows the percentage of the population in four European countries who were aged 65 and over in 2020.</strong>",
  "instructions": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  "chartData": {
    "type": "bar",
    "data": [
      { "name": "Germany", "value": 22 },
      { "name": "Italy", "value": 23 },
      { "name": "France", "value": 21 },
      { "name": "Spain", "value": 20 }
    ],
    "config": {
      "dataKey": "value",
      "categoryKey": "name",
      "xAxisLabel": "Country",
      "yAxisLabel": "Percentage of Population"
    }
  }
}

If the user provides a topic, create a prompt related to it. If not, generate a random, high-quality topic and data appropriate for an IELTS exam.

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

