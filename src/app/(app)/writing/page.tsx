
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { essayFeedback } from '@/ai/flows/essay-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/app-header';
import { ExamTimer } from '@/components/exam-timer';
import type { AnalyzedEssay, SavedContent } from '@/lib/types';
import { useSavedContent } from '@/hooks/use-saved-content';
import { Bookmark, BrainCircuit, Loader2, SpellCheck, Waypoints, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FormSchema = z.object({
  task: z.enum(['Task 1', 'Task 2']),
  topic: z.string().optional(),
  essay: z.string().min(50, 'Essay must be at least 50 characters long.'),
});

type FormValues = z.infer<typeof FormSchema>;

function WritingPractice() {
  const searchParams = useSearchParams();
  const trainingType = searchParams.get('type') as 'Academic' | 'General Training' | null;

  const [isLoading, setIsLoading] = useState(false);
  const [analyzedEssay, setAnalyzedEssay] = useState<AnalyzedEssay | null>(null);
  const { toast } = useToast();
  const { addSavedItem, removeSavedItem, isSaved } = useSavedContent();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      task: 'Task 2',
      topic: '',
      essay: '',
    },
  });

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('API Error:', error);
    let description = defaultMessage;
    if (error instanceof Error && error.message.includes('429')) {
      description = 'API rate limit exceeded. Please check your billing status or try again later.';
    }
    toast({
      variant: 'destructive',
      title: 'Error',
      description,
    });
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAnalyzedEssay(null);

    const topicWithTask = `${trainingType} ${data.task}: ${data.topic || 'General Topic'}`;

    try {
      const feedback = await essayFeedback({
        topic: topicWithTask,
        essay: data.essay,
      });
      const content: AnalyzedEssay = {
        id: uuidv4(),
        type: 'essay',
        essay: data.essay,
        topic: topicWithTask,
        feedback,
        createdAt: new Date().toISOString(),
      };
      setAnalyzedEssay(content);
    } catch (error) {
      handleApiError(error, 'Failed to get feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToggle = () => {
    if (!analyzedEssay) return;
    if (isSaved(analyzedEssay.id)) {
      removeSavedItem(analyzedEssay.id);
       toast({ title: 'Removed from saved items.' });
    } else {
      addSavedItem(analyzedEssay as SavedContent);
      toast({ title: 'Saved!', description: 'You can find it in the "Saved Content" section.' });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title={`Writing Practice (${trainingType || '...'})`} />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Get AI Feedback</CardTitle>
              <CardDescription>Submit your essay to receive detailed feedback on key writing aspects.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={
                              form.watch('task') === 'Task 1' 
                                ? 'e.g., Describe the provided chart/graph' 
                                : 'e.g., The advantages of online learning'
                            } 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="essay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Essay</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paste your essay here..." className="min-h-[200px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analyze Essay
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          <div className="lg:col-span-2">
            {isLoading && (
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            )}

            {analyzedEssay && (
              <Card className="flex h-full flex-col">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-headline text-xl">Feedback for Your Essay</CardTitle>
                    <CardDescription>{analyzedEssay.topic}</CardDescription>
                  </div>
                   <Button variant="ghost" size="icon" onClick={handleSaveToggle}>
                    <Bookmark className={cn('size-5', isSaved(analyzedEssay.id) && 'fill-primary text-primary')} />
                    <span className="sr-only">Save feedback</span>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <Accordion type="multiple" defaultValue={['overall', 'grammar']} className="w-full">
                    <AccordionItem value="overall">
                      <AccordionTrigger className='text-base font-semibold'><Zap className="mr-2 size-4 text-primary"/>Overall Feedback</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none p-2 text-sm leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: analyzedEssay.feedback.overallFeedback }} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="grammar">
                      <AccordionTrigger className='text-base font-semibold'><SpellCheck className="mr-2 size-4 text-primary"/>Grammar</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none p-2 text-sm leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: analyzedEssay.feedback.grammar }} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="vocabulary">
                      <AccordionTrigger className='text-base font-semibold'><BrainCircuit className="mr-2 size-4 text-primary"/>Vocabulary</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none p-2 text-sm leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: analyzedEssay.feedback.vocabulary }} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="coherence">
                      <AccordionTrigger className='text-base font-semibold'><Waypoints className="mr-2 size-4 text-primary"/>Coherence</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none p-2 text-sm leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: analyzedEssay.feedback.coherence }} />
                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="argumentation">
                      <AccordionTrigger className='text-base font-semibold'><BrainCircuit className="mr-2 size-4 text-primary"/>Argumentation</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none p-2 text-sm leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: analyzedEssay.feedback.argumentation }} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter>
                   <ExamTimer initialTime={form.getValues('task') === 'Task 1' ? 1200 : 2400} />
                </CardFooter>
              </Card>
            )}

            {!isLoading && !analyzedEssay && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <p className="text-lg font-medium">Your feedback will appear here</p>
                  <p className="text-sm text-muted-foreground">Submit your essay to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
