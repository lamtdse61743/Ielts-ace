
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
import { googleAI } from '@genkit-ai/googleai';

const GenerateChartTopicInputSchema = z.object({
  topic: z.string().optional().describe('An optional user-provided topic or keywords.'),
});
export type GenerateChartTopicInput = z.infer<typeof GenerateChartTopicInputSchema>;

const MultiSeriesChartDataPointSchema = z.object({}).catchall(z.union([z.string(), z.number()]));

const ChartDataSchema = z.object({
    type: z.literal('line').describe("The type of chart to represent the data."),
    data: z.array(MultiSeriesChartDataPointSchema).describe("An array of data objects for the chart. Each object represents a point on the category axis (e.g., a year) and contains key-value pairs for each series."),
    config: z.object({
        dataKey: z.string().describe("The key in the data objects that holds the primary numerical value."),
        categoryKey: z.string().describe("The key in the data objects that holds the category label (e.g., 'Year')."),
        series: z.array(z.string()).describe("An array of strings representing the names of the different data series (lines)."),
        xAxisLabel: z.string().optional().describe("The label for the X-axis of the chart."),
        yAxisLabel: z.string().optional().describe("The label for the Y-axis of the chart."),
    }).describe("Configuration for rendering the chart.")
});

const GenerateChartTopicOutputSchema = z.object({
    topic: z.string().describe("The generated topic description for the visual. This should be formatted in HTML, and the entire prompt should be bold."),
    instructions: z.string().describe("Specific instructions for the task, formatted in HTML."),
    chartData: ChartDataSchema.describe("Structured data for generating a visual chart."),
    taskType: z.literal('line').describe("The type of visual task generated.")
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
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic) that involves a multi-line chart.

User-provided Topic (if any): {{{topic}}}

**Response Instructions:**

- You MUST generate a line chart that compares 3 to 4 different categories over a period of time (e.g., 5-7 time points).
- You MUST generate structured JSON in the 'chartData' field.
- The 'topic' field MUST be a bold HTML string describing the visual.
- Set 'taskType' to 'line'.
- In the 'chartData.data' array, each object should represent a time point (e.g., a year). The object's 'categoryKey' should be the time point, and the other keys should be the names of the categories being measured, with their corresponding numerical values.
- In the 'chartData.config' object:
    - 'categoryKey' MUST be the name of the property representing the time point (e.g., "Year").
    - 'series' MUST be an array of strings containing the names of the 3-4 categories.
    - 'dataKey' MUST be the name of one of the series.
- The 'instructions' field should always be "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."
- If the user provides a topic, create a prompt related to it. If not, generate a random, high-quality topic appropriate for an IELTS exam.

**Example for a Multi-Line Chart:**
{
  "topic": "<strong>The line graph below shows the average monthly consumption of different types of meat in a European country from 2010 to 2025.</strong>",
  "instructions": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  "taskType": "line",
  "chartData": {
    "type": "line",
    "data": [
      { "Year": "2010", "Beef": 1.5, "Chicken": 2.2, "Pork": 1.8 },
      { "Year": "2015", "Beef": 1.2, "Chicken": 2.8, "Pork": 1.7 },
      { "Year": "2020", "Beef": 1.0, "Chicken": 3.5, "Pork": 1.5 },
      { "Year": "2025", "Beef": 0.8, "Chicken": 4.0, "Pork": 1.4 }
    ],
    "config": {
      "dataKey": "Beef",
      "categoryKey": "Year",
      "series": ["Beef", "Chicken", "Pork"],
      "xAxisLabel": "Year",
      "yAxisLabel": "Consumption (kg per person)"
    }
  }
}

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
