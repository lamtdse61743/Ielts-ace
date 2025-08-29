
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  essayFeedback,
  type EssayFeedbackOutput,
} from '@/ai/flows/essay-feedback';
import {
  generateWritingTopic,
  type GenerateWritingTopicOutput,
} from '@/ai/flows/generate-writing-topic';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/app-header';
import { ExamTimer } from '@/components/exam-timer';
import type { AnalyzedEssay, SavedContent } from '@/lib/types';
import { useSavedContent } from '@/hooks/use-saved-content';
import {
  Bookmark,
  CheckCircle,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareQuote,
  RefreshCcw,
  SpellCheck,
  Waypoints,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const TopicFormSchema = z.object({
  task: z.enum(['Task 1', 'Task 2']),
  trainingType: z.enum(['Academic', 'General Training']),
  topic: z.string().optional(),
});
type TopicFormValues = z.infer<typeof TopicFormSchema>;

const EssayFormSchema = z.object({
  essay: z.string().min(50, 'Your essay should be at least 50 words.'),
});
type EssayFormValues = z.infer<typeof EssayFormSchema>;

function WritingPractice() {
  const searchParams = useSearchParams();
  const initialTrainingType =
    (searchParams.get('type') as 'Academic' | 'General Training' | null) ||
    'Academic';

  const [trainingType, setTrainingType] =
    useState<"Academic" | "General Training">(initialTrainingType);
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [generatedTopic, setGeneratedTopic] =
    useState<GenerateWritingTopicOutput | null>(null);
  const [analyzedEssay, setAnalyzedEssay] = useState<AnalyzedEssay | null>(
    null
  );
  const [wordCount, setWordCount] = useState(0);
  const [timerKey, setTimerKey] = useState(0);


  const { toast } = useToast();
  const { addSavedItem, removeSavedItem, isSaved } = useSavedContent();

  const topicForm = useForm<TopicFormValues>({
    resolver: zodResolver(TopicFormSchema),
    defaultValues: {
      task: 'Task 2',
      trainingType: initialTrainingType,
      topic: '',
    },
  });

  useEffect(() => {
    if (initialTrainingType) {
      setTrainingType(initialTrainingType);
      topicForm.setValue('trainingType', initialTrainingType);
    }
  }, [initialTrainingType, topicForm]);

  const essayForm = useForm<EssayFormValues>({
    resolver: zodResolver(EssayFormSchema),
    defaultValues: {
      essay: '',
    }
  });

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('API Error:', error);
    let description = defaultMessage;
    if (
      error instanceof Error &&
      (error.message.includes('429') || error.message.includes('rate limit'))
    ) {
      description =
        'API rate limit exceeded. Please check your billing status or try again later.';
    } else if (error instanceof Error) {
        description = error.message;
    }
    toast({
      variant: 'destructive',
      title: 'Error',
      description,
    });
  };

  const onGenerateSubmit: SubmitHandler<TopicFormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedTopic(null);
    setAnalyzedEssay(null);
    essayForm.reset();
    try {
      const result = await generateWritingTopic(data);
      if (!result || !result.topic) {
        throw new Error('The generated topic is invalid or empty.');
      }
      setGeneratedTopic(result);
      setTimerKey(prevKey => prevKey + 1); // Reset timer
    } catch (error) {
      handleApiError(error, 'Failed to generate a topic. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onEssaySubmit: SubmitHandler<EssayFormValues> = async (data) => {
    if (!generatedTopic) return;
    setIsFeedbackLoading(true);
    setAnalyzedEssay(null);

    try {
      const feedback = await essayFeedback({
        essay: data.essay,
        topic: generatedTopic.topic,
        instructions: generatedTopic.instructions,
      });

      const newAnalyzedEssay: AnalyzedEssay = {
        id: uuidv4(),
        type: 'essay',
        essay: data.essay,
        topic: generatedTopic.topic,
        trainingType: trainingType,
        task: topicForm.getValues('task'),
        createdAt: new Date().toISOString(),
        feedback,
      };
      setAnalyzedEssay(newAnalyzedEssay);
      toast({
        title: 'Feedback Received!',
        description: 'Your essay has been analyzed.',
      });
    } catch (error) {
      handleApiError(error, 'Failed to get feedback. Please try again.');
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const handleStartOver = () => {
    setGeneratedTopic(null);
    setAnalyzedEssay(null);
    essayForm.reset();
    setWordCount(0);
    topicForm.reset({
      task: 'Task 2',
      topic: '',
      trainingType: trainingType,
    });
  };

  const handleSaveToggle = () => {
    if (!analyzedEssay) return;
    if (isSaved(analyzedEssay.id)) {
      removeSavedItem(analyzedEssay.id);
      toast({ title: 'Removed from saved items.' });
    } else {
      addSavedItem(analyzedEssay as SavedContent);
      toast({
        title: 'Saved!',
        description: 'You can find it in the "Saved Content" section.',
      });
    }
  };

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    essayForm.setValue('essay', text); // Manually set value for react-hook-form
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  };

  const feedbackChartData = analyzedEssay
    ? [
        {
          name: 'Task Response',
          band: analyzedEssay.feedback.taskResponse.band,
        },
        {
          name: 'Coherence & Cohesion',
          band: analyzedEssay.feedback.coherenceAndCohesion.band,
        },
        {
          name: 'Lexical Resource',
          band: analyzedEssay.feedback.lexicalResource.band,
        },
        {
          name: 'Grammar',
          band: analyzedEssay.feedback.grammaticalRangeAndAccuracy.band,
        },
      ]
    : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title={`Writing Practice (${trainingType})`}>
        {(generatedTopic || analyzedEssay) && (
          <Button variant="outline" onClick={handleStartOver}>
            <RefreshCcw className="mr-2 size-4" />
            Start Over
          </Button>
        )}
        {analyzedEssay && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSaveToggle}
            aria-label="Save essay"
          >
            <Bookmark
              className={cn(
                'size-5',
                isSaved(analyzedEssay.id) && 'fill-primary text-primary'
              )}
            />
          </Button>
        )}
      </AppHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {!generatedTopic && !isLoading && (
          <div className="mx-auto w-full max-w-2xl pt-10">
            <Card>
              <CardHeader>
                <CardTitle>Generate Writing Task</CardTitle>
                <CardDescription>
                  Select your task and provide an optional topic to begin.
                </CardDescription>
              </CardHeader>
              <Form {...topicForm}>
                <form onSubmit={topicForm.handleSubmit(onGenerateSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={topicForm.control}
                      name="task"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task</FormLabel>
                          <FormControl>
                            <Tabs
                              value={field.value}
                              onValueChange={field.onChange}
                              className="w-full"
                            >
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="Task 1">Task 1</TabsTrigger>
                                <TabsTrigger value="Task 2">Task 2</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={topicForm.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                topicForm.watch('task') === 'Task 1'
                                  ? 'e.g., A letter to a friend about a holiday'
                                  : 'e.g., The impact of technology on society'
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Generate Topic
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>
        )}

        {isLoading && (
          <div className="flex w-full flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">Generating your topic...</p>
            <p className="text-sm text-muted-foreground">
              This may take a moment. Please wait.
            </p>
          </div>
        )}

        {generatedTopic && (
          <div className="mx-auto w-full max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Writing Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedTopic.topic }}
                />
                <div
                  className="prose dark:prose-invert max-w-none rounded-md border bg-muted p-4 italic"
                  dangerouslySetInnerHTML={{
                    __html: generatedTopic.instructions,
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <Form {...essayForm}>
                <form onSubmit={essayForm.handleSubmit(onEssaySubmit)}>
                  <CardHeader>
                    <CardTitle>Your Essay</CardTitle>
                    <CardDescription>
                      Write your response in the text area below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={essayForm.control}
                      name="essay"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              rows={15}
                              placeholder="Start writing your essay here..."
                              {...field}
                              onChange={handleEssayChange}
                              disabled={!!analyzedEssay}
                            />
                          </FormControl>
                          <div className="text-right text-sm text-muted-foreground">
                            Word Count: {wordCount}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex-col items-stretch gap-4">
                    {!analyzedEssay && (
                      <Button
                        type="submit"
                        disabled={isFeedbackLoading}
                        className="w-full"
                      >
                        {isFeedbackLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Get Feedback
                      </Button>
                    )}
                    <ExamTimer
                      key={timerKey}
                      initialTime={
                        topicForm.getValues('task') === 'Task 1' ? 1200 : 2400
                      }
                    />
                  </CardFooter>
                </form>
              </Form>
            </Card>

            {isFeedbackLoading && (
              <div className="flex w-full flex-col items-center justify-center space-y-4 rounded-lg border p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-semibold">Analyzing your essay...</p>
                <p className="text-sm text-muted-foreground">
                  This can take up to a minute.
                </p>
              </div>
            )}

            {analyzedEssay && (
              <Card>
                <CardHeader>
                  <CardTitle>Essay Feedback</CardTitle>
                  <CardDescription>
                    Your overall band score is{' '}
                    <strong className="text-primary">
                      {analyzedEssay.feedback.overallBand}
                    </strong>
                    . Here is a breakdown of your performance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={feedbackChartData} margin={{ top: 20 }}>
                        <XAxis
                          dataKey="name"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 9]}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                          }}
                        />
                        <Bar
                          dataKey="band"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        >
                          <LabelList
                            dataKey="band"
                            position="top"
                            className="fill-foreground"
                            fontSize={12}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <Accordion
                    type="multiple"
                    defaultValue={['improvements']}
                    className="w-full"
                  >
                    <AccordionItem value="improvements">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-5 text-primary" /> Key
                          Improvements
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: analyzedEssay.feedback.improvements,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="taskResponse">
                      <AccordionTrigger className="text-lg">
                        <div className="flex w-full items-center justify-between pr-2">
                          <div className="flex items-center gap-2">
                            <MessageSquareQuote className="size-5 text-primary" />{' '}
                            Task Response
                          </div>
                          <div className="rounded-md bg-muted px-2 py-1 text-base font-semibold">
                            Band: {analyzedEssay.feedback.taskResponse.band}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              analyzedEssay.feedback.taskResponse.feedback,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="coherence">
                      <AccordionTrigger className="text-lg">
                        <div className="flex w-full items-center justify-between pr-2">
                          <div className="flex items-center gap-2">
                            <Waypoints className="size-5 text-primary" />{' '}
                            Coherence & Cohesion
                          </div>
                          <div className="rounded-md bg-muted px-2 py-1 text-base font-semibold">
                            Band:{' '}
                            {analyzedEssay.feedback.coherenceAndCohesion.band}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              analyzedEssay.feedback.coherenceAndCohesion
                                .feedback,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="lexical">
                      <AccordionTrigger className="text-lg">
                        <div className="flex w-full items-center justify-between pr-2">
                          <div className="flex items-center gap-2">
                            <FileText className="size-5 text-primary" />{' '}
                            Lexical Resource
                          </div>
                          <div className="rounded-md bg-muted px-2 py-1 text-base font-semibold">
                            Band: {analyzedEssay.feedback.lexicalResource.band}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              analyzedEssay.feedback.lexicalResource.feedback,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="grammar">
                      <AccordionTrigger className="text-lg">
                        <div className="flex w-full items-center justify-between pr-2">
                          <div className="flex items-center gap-2">
                            <SpellCheck className="size-5 text-primary" />{' '}
                            Grammatical Range & Accuracy
                          </div>
                          <div className="rounded-md bg-muted px-2 py-1 text-base font-semibold">
                            Band:{' '}
                            {
                              analyzedEssay.feedback
                                .grammaticalRangeAndAccuracy.band
                            }
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              analyzedEssay.feedback
                                .grammaticalRangeAndAccuracy.feedback,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="errors">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-5 text-primary" />{' '}
                          Specific Errors
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: `<h4>Spelling Errors</h4>${analyzedEssay.feedback.spellingErrors}<h4 class="mt-4">Grammar Errors</h4>${analyzedEssay.feedback.grammaticalErrors}`,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function WritingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WritingPractice />
    </Suspense>
  );
}
