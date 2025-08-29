
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

const ChartDataSchema = z.object({
    type: z.enum(['bar', 'line', 'pie', 'table', 'mixed']).describe("The type of chart to represent the data."),
    data: z.array(ChartDataPointSchema).describe("An array of data objects for the chart. Each object must conform to the ChartDataPointSchema with a 'name' and a 'value'."),
    config: z.object({
        dataKey: z.string().describe("The key in the data objects that holds the numerical value. This must be 'value'."),
        categoryKey: z.string().describe("The key in the data objects that holds the category label. This must be 'name'."),
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

- **If taskType is 'bar', 'line', 'pie', or 'table':**
    - You MUST generate structured JSON in the 'chartData' field.
    - The 'topic' field MUST be a bold HTML string describing the visual.
    - Set 'taskType' to the one provided in the input (e.g., 'bar').
    - Omit the 'visualDescription' and 'imageUrl' fields.
    - For the data, the 'name' property should be the category and the 'value' property should be the number.
    - In the config, \`dataKey\` must be 'value' and \`categoryKey\` must be 'name'.

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

**Example for a Bar Chart:**
{
  "topic": "<strong>The chart below shows the percentage of the population in four European countries who were aged 65 and over in 2020.</strong>",
  "instructions": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  "taskType": "bar",
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

**Example for a Map:**
{
  "topic": "<strong>The two maps below show the changes to an industrial area called Chorleywood between 1995 and the present day.</strong>",
  "instructions": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  "taskType": "map",
  "visualDescription": "<h3>Chorleywood - 1995</h3><p>The map shows a large industrial area with several factories to the north. A main road runs through the center. To the south, there is a large area of undeveloped farmland.</p><h3>Chorleywood - Present Day</h3><p>The factories have been demolished and replaced with a new housing estate. A new school has been constructed next to the housing. The main road has been pedestrianized, and the farmland has been converted into a large park with a lake.</p>"
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
    const taskTypes = ['bar', 'line', 'pie', 'table', 'map', 'process-diagram', 'mixed'];
    const randomTaskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];

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
