
'use server';
/**
 * @fileOverview Ultra-minimal version for Google AI compatibility
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const GenerateChartTopicInputSchema = z.object({
  topic: z.string().optional(),
});
export type GenerateChartTopicInput = z.infer<typeof GenerateChartTopicInputSchema>;

// Ultra-minimal - just basic types, no nesting, no optional fields
const GenerateChartTopicOutputSchema = z.object({
    topic: z.string(),
    instructions: z.string(),
    taskType: z.string(),
    // Flatten the structure to avoid nested object issues
    chartType: z.string(),
    chartData: z.array(z.object({}).catchall(z.union([z.string(), z.number()]))),
    categoryKey: z.string(),
    series: z.array(z.string()),
    xAxisLabel: z.string(),
    yAxisLabel: z.string(),
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
  prompt: `Generate IELTS Writing Task 1 multi-line chart data.

Topic: {{{topic}}}

Return JSON with this structure:
{
  "topic": "<strong>Chart description here</strong>",
  "instructions": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  "taskType": "line",
  "chartType": "line", 
  "chartData": [
    { "Year": "2020", "SeriesA": 100, "SeriesB": 120, "SeriesC": 90 },
    { "Year": "2021", "SeriesA": 110, "SeriesB": 130, "SeriesC": 95 }
  ],
  "categoryKey": "Year",
  "series": ["SeriesA", "SeriesB", "SeriesC"],
  "xAxisLabel": "Year", 
  "yAxisLabel": "Value"
}

Generate 3-4 series with 5-7 time points. Use realistic data.`,
});

const generateChartTopicFlow = ai.defineFlow(
  {
    name: 'generateChartTopicFlow',
    inputSchema: GenerateChartTopicInputSchema,
    outputSchema: GenerateChartTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (output) {
      output.taskType = 'line';
      output.chartType = 'line';
    }
    
    return output!;
  }
);

// Helper to convert flat structure back to nested if needed
export function convertToNestedStructure(flatOutput: GenerateChartTopicOutput): any {
  return {
    topic: flatOutput.topic,
    instructions: flatOutput.instructions,
    taskType: flatOutput.taskType,
    chartData: {
      type: flatOutput.chartType,
      data: flatOutput.chartData,
      config: {
        categoryKey: flatOutput.categoryKey,
        series: flatOutput.series,
        xAxisLabel: flatOutput.xAxisLabel,
        yAxisLabel: flatOutput.yAxisLabel,
        dataKey: flatOutput.series[0] // Use first series as default dataKey
      }
    }
  };
}
