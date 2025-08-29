
'use server';
/**
 * @fileOverview Generates IELTS Writing Task 1 (Academic) topics, including chart data, tables, or visual descriptions.
 *
 * - generateChartTopic - A function that generates a Task 1 Academic topic with a visual component.
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

const PromptInputSchema = GenerateChartTopicInputSchema.extend({
    taskType: z.string().describe("The type of visual task to generate."),
});

const ChartDataPointSchema = z.object({
    name: z.string().describe("The label for a data point (e.g., a year, a country). This will be the category."),
    value: z.number().describe("The numerical value for a data point."),
});

const MultiSeriesChartDataPointSchema = z.object({}).catchall(z.union([z.string(), z.number()]));


const ChartDataSchema = z.object({
    type: z.enum(['bar', 'line', 'pie', 'table', 'mixed']).describe("The type of chart to represent the data."),
    data: z.array(z.union([ChartDataPointSchema, MultiSeriesChartDataPointSchema])).describe("An array of data objects for the chart. For multi-series line charts, each object represents a point on the category axis (e.g., a year) and contains key-value pairs for each series."),
    config: z.object({
        dataKey: z.string().describe("The key in the data objects that holds the primary numerical value. This must be 'value' for single-series charts."),
        categoryKey: z.string().describe("The key in the data objects that holds the category label. This must be 'name' for single-series charts."),
        series: z.array(z.string()).optional().describe("For multi-series charts, an array of strings representing the names of the different data series (lines)."),
        xAxisLabel: z.string().optional().describe("The label for the X-axis of the chart."),
        yAxisLabel: z.string().optional().describe("The label for the Y-axis of the chart."),
    }).describe("Configuration for rendering the chart.")
});


const GenerateChartTopicOutputSchema = z.object({
    topic: z.string().describe("The generated topic description for the visual. This should be formatted in HTML, and the entire prompt should be bold."),
    instructions: z.string().describe("Specific instructions for the task, formatted in HTML."),
    chartData: ChartDataSchema.optional().describe("Structured data for generating a visual chart. Should be used for 'bar', 'line', 'pie', and 'table' types."),
    visualDescription: z.string().optional().describe("A detailed HTML description for visual tasks like maps or process diagrams, where structured data is not applicable."),
    imageUrl: z.string().optional().describe("A data URI of a generated image for visual tasks like maps."),
    taskType: z.enum(['bar', 'line', 'pie', 'table', 'map', 'process-diagram', 'mixed']).describe("The type of visual task generated.")
});
export type GenerateChartTopicOutput = z.infer<typeof GenerateChartTopicOutputSchema>;


export async function generateChartTopic(
  input: GenerateChartTopicInput
): Promise<GenerateChartTopicOutput> {
  return generateChartTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChartTopicPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: GenerateChartTopicOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a complete writing prompt for IELTS Writing Task 1 (Academic) based on the specified task type.

Task Type to Generate: {{{taskType}}}
User-provided Topic (if any): {{{topic}}}

**Response Instructions:**

- **If taskType is 'line':**
    - You MUST generate a line chart that compares 3 to 4 different categories over a period of time (e.g., 5-7 time points).
    - You MUST generate structured JSON in the 'chartData' field.
    - The 'topic' field MUST be a bold HTML string describing the visual.
    - Set 'taskType' to 'line'.
    - In the 'chartData.data' array, each object should represent a time point (e.g., a year). The object's 'categoryKey' should be the time point, and the other keys should be the names of the categories being measured, with their corresponding numerical values.
    - In the 'chartData.config' object:
        - 'categoryKey' MUST be the name of the property representing the time point (e.g., "Year").
        - 'series' MUST be an array of strings containing the names of the 3-4 categories.
        - 'dataKey' can be omitted or set to the name of one of the series.
    - Omit the 'visualDescription' and 'imageUrl' fields.

- **If taskType is 'bar', 'pie', or 'table':**
    - You MUST generate structured JSON in the 'chartData' field.
    - The 'topic' field MUST be a bold HTML string describing the visual.
    - Set 'taskType' to the one provided in the input (e.g., 'bar').
    - For the data, the 'name' property should be the category and the 'value' property should be the number.
    - In the config, 'dataKey' must be 'value' and 'categoryKey' must be 'name'.
    - Omit the 'visualDescription' and 'imageUrl' fields.

- **If taskType is 'map' or 'process-diagram':**
    - You MUST generate a detailed description of the visual in the 'visualDescription' field. This description should be formatted as HTML (e.g., using <p>, <ul>, <li>, <strong>) and act as the visual aid for the user. For a map, describe the key features of the 'before' and 'after' states.
    - The 'topic' field MUST be a bold HTML string introducing the map or diagram.
    - Set 'taskType' to the one provided in the input (e.g., 'map').
    - The 'chartData' field MUST be omitted.
    
- **If taskType is 'mixed':**
    - You MUST generate structured JSON in the 'chartData' field for one part of the visual (e.g., a bar chart) and a 'visualDescription' for the other part (e.g., a supplementary table described in HTML).
    - The 'topic' field MUST be a bold HTML string describing both visuals.
    - Set 'taskType' to 'mixed'.

- **For all types:**
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
    // const taskTypes = ['bar', 'line', 'pie', 'table', 'map', 'process-diagram', 'mixed'];
    // const randomTaskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const randomTaskType = 'line';

    const promptInput = {...input, taskType: randomTaskType};
    const {output} = await prompt(promptInput);

    if (output && output.taskType === 'map' && output.visualDescription) {
        try {
            const imagePrompt = `Generate a clear, simple, side-by-side map diagram suitable for an IELTS exam question. The diagram should visually represent the following changes: ${output.topic} - ${output.visualDescription}. Do not include any text or labels on the image itself. The map should be in a clean, black and white, blueprint or line-drawing style.`;
            const { media } = await ai.generate({
                model: googleAI.model('imagen-4.0-fast-generate-001'),
                prompt: imagePrompt,
            });
            if (media.url) {
                output.imageUrl = media.url;
            }
        } catch (e) {
            console.error("Image generation for map failed, falling back to description.", e);
        }
    }

    return output!;
  }
);
