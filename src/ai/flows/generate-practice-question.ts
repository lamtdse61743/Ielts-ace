'use server';

/**
 * @fileOverview Generates IELTS practice questions based on specified question types.
 *
 * - generatePracticeQuestion - A function that generates IELTS practice questions.
 * - GeneratePracticeQuestionInput - The input type for the generatePracticeQuestion function.
 * - GeneratePracticeQuestionOutput - The return type for the generatePracticeQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePracticeQuestionInputSchema = z.object({
  questionType: z
    .literal('reading-comprehension')
    .describe("Must be 'reading-comprehension' for this flow."),
  trainingType: z
    .enum(['Academic', 'General Training'])
    .describe('The type of IELTS training.'),
  difficulty: z
    .string()
    .optional()
    .describe('Optional difficulty of the question set (e.g., easy, medium, hard).'),
  topic: z
    .string()
    .optional()
    .describe('Optional topic to generate the test about.'),
});
export type GeneratePracticeQuestionInput = z.infer<
  typeof GeneratePracticeQuestionInputSchema
>;

const ReadingQuestionSchema = z.object({
  questionNumber: z.number().describe('The number of the question in the sequence (1-40).'),
  questionText: z.string().describe('The main text or instruction for the question.'),
  questionType: z.enum([
    'multiple-choice',
    'true-false-not-given',
    'yes-no-not-given',
    'matching-headings',
    'matching-information',
    'matching-features',
    'matching-sentence-endings',
    'sentence-completion',
    'summary-completion',
    'note-completion',
    'table-completion',
    'flow-chart-completion',
    'diagram-completion',
    'short-answer',
  ]),
  options: z.array(z.string()).optional().describe('Options for multiple-choice, matching, or completion questions.'),
  answer: z.string().describe('The correct answer for the question.'),
});
export type ReadingQuestion = z.infer<typeof ReadingQuestionSchema>;

const PassageSchema = z.object({
    passageNumber: z.number().describe('The number of the passage (1, 2, or 3).'),
    passageTitle: z.string().optional().describe('An optional title for the reading passage.'),
    passageText: z.string().describe('The full text of the reading passage.'),
    questions: z.array(ReadingQuestionSchema).describe('An array of questions associated with this passage.'),
});
export type Passage = z.infer<typeof PassageSchema>;

const GeneratePracticeQuestionOutputSchema = z.object({
  passages: z.array(PassageSchema).describe('An array of 3 reading passages, each with its own set of questions. The total number of questions across all passages should be 40.'),
});
export type GeneratePracticeQuestionOutput = z.infer<
  typeof GeneratePracticeQuestionOutputSchema
>;

export async function generatePracticeQuestion(
  input: GeneratePracticeQuestionInput
): Promise<GeneratePracticeQuestionOutput> {
  return generatePracticeQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePracticeQuestionPrompt',
  input: {schema: GeneratePracticeQuestionInputSchema},
  output: {schema: GeneratePracticeQuestionOutputSchema},
  prompt: `You are an expert IELTS exam creator. Your task is to generate a full IELTS Reading test.

The test must contain exactly 3 reading passages.
The total number of questions across all 3 passages must be exactly 40.
The difficulty should increase with each passage (Passage 1 should be the easiest, Passage 3 the hardest).

Based on the Training Type ({{{trainingType}}}), the passages should be:
- Academic: Texts from academic journals, books, magazines, and newspapers. The tone should be formal and academic.
- General Training: Texts from advertisements, official documents, company handbooks, books, and newspapers. The context should be more related to everyday situations.

Each passage must have a set of associated questions. You must create a mix of question types from the following list:
- multiple-choice
- true-false-not-given
- yes-no-not-given
- matching-headings (provide a list of headings in 'options')
- matching-information
- matching-features
- matching-sentence-endings
- sentence-completion
- summary-completion
- note-completion
- table-completion
- flow-chart-completion
- diagram-completion
- short-answer

Ensure the question numbering is sequential from 1 to 40 across all three passages.
Your entire response must be in a single JSON object that strictly follows the output schema.

Training Type: {{{trainingType}}}
Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generatePracticeQuestionFlow = ai.defineFlow(
  {
    name: 'generatePracticeQuestionFlow',
    inputSchema: GeneratePracticeQuestionInputSchema,
    outputSchema: GeneratePracticeQuestionOutputSchema,
  },
  async input => {
    // For reading comprehension, we force the questionType to be 'reading-comprehension'
    // and provide a more structured prompt.
    if (input.questionType === 'reading-comprehension') {
       const {output} = await prompt(input);
       return output!;
    }
    
    // This part is for other question types, which we are not focusing on now.
    const nonReadingPrompt = ai.definePrompt({
        name: 'generateSimpleQuestion',
        input: { schema: z.object({ questionType: z.string(), topic: z.string().optional(), difficulty: z.string().optional() })},
        output: { schema: z.object({ question: z.string(), answer: z.string() }) },
        prompt: `Generate a single IELTS practice question for a non-reading task.
        Question Type: {{{questionType}}}
        Topic: {{{topic}}}
        Difficulty: {{{difficulty}}}
        `,
    });

    const { output } = await nonReadingPrompt(input);
    return { passages: [ { passageNumber: 1, passageText: '', questions: [{...output!, questionNumber: 1, questionType: 'short-answer'}] }] };
  }
);
