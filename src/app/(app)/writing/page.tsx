
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
    },
  });

  // This will be used later to handle topic generation.
  const onGenerateSubmit: SubmitHandler<FormValues> = async (data) => {
    console.log('Generating topic for:', data);
    // Logic to generate topic will be added here.
  };


  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title={`Writing Practice (${trainingType || '...'})`} />
      <main className="flex flex-1 items-start justify-center overflow-auto p-4 pt-10 md:p-6">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Generate Writing Task</CardTitle>
              <CardDescription>Select your task and topic to begin.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onGenerateSubmit)}>
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
                                ? 'e.g., Describe a provided chart/graph' 
                                : 'e.g., The advantages of online learning'
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
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Topic
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
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
