'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { generatePracticeQuestion } from '@/ai/flows/generate-practice-question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/app-header';
import { ExamTimer } from '@/components/exam-timer';
import type { GeneratedQuestion } from '@/lib/types';
import { useSavedContent } from '@/hooks/use-saved-content';
import { Bookmark, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const FormSchema = z.object({
  questionType: z.string().min(1, 'Please select a question type.'),
  difficulty: z.string().min(1, 'Please select a difficulty level.'),
  topic: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

const questionTypes = [
  { value: 'reading-comprehension', label: 'Reading Comprehension', time: 1200 }, // 20 mins
  { value: 'essay', label: 'Essay Writing (Task 2)', time: 2400 }, // 40 mins
  { value: 'listening', label: 'Listening', time: 1800 }, // 30 mins
];

export default function PracticeQuestionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedQuestion | null>(null);
  const [timerDuration, setTimerDuration] = useState(2400);
  const { toast } = useToast();
  const { addSavedItem, removeSavedItem, isSaved } = useSavedContent();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      questionType: 'essay',
      difficulty: 'medium',
      topic: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedContent(null);
    try {
      const result = await generatePracticeQuestion(data);
      const content: GeneratedQuestion = {
        ...result,
        id: uuidv4(),
        type: 'question',
        questionType: data.questionType,
        topic: data.topic,
        difficulty: data.difficulty,
        createdAt: new Date().toISOString(),
      };
      setGeneratedContent(content);
      const selectedType = questionTypes.find(qt => qt.value === data.questionType);
      setTimerDuration(selectedType?.time || 2400);
    } catch (error) {
      console.error('Error generating practice question:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate practice question. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToggle = () => {
    if (!generatedContent) return;
    if (isSaved(generatedContent.id)) {
      removeSavedItem(generatedContent.id);
      toast({ title: 'Removed from saved items.' });
    } else {
      addSavedItem(generatedContent);
      toast({ title: 'Saved!', description: 'You can find it in the "Saved Content" section.' });
    }
  };
  
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title="Practice Questions" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Generate a Question</CardTitle>
                <CardDescription>Select your preferences to generate a custom IELTS practice question.</CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="questionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a difficulty level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
      
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
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
                            <Input placeholder="e.g., Environment, Technology" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {isLoading && (
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            )}

            {generatedContent && (
              <Card className="flex h-full flex-col">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-headline text-xl">Generated Question</CardTitle>
                    <CardDescription>
                      {generatedContent.difficulty && <span className="capitalize">{generatedContent.difficulty}</span>}
                      {generatedContent.topic && ` - ${generatedContent.topic}`}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSaveToggle}>
                    <Bookmark className={cn('size-5', isSaved(generatedContent.id) && 'fill-primary text-primary')} />
                    <span className="sr-only">Save question</span>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {generatedContent.passage && (
                    <ScrollArea className="h-48 rounded-md border bg-muted p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedContent.passage}
                      </p>
                    </ScrollArea>
                  )}
                  <p className="whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm leading-relaxed">
                    {generatedContent.question}
                  </p>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>View Example Answer</AccordionTrigger>
                      <AccordionContent className="whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedContent.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter>
                  <ExamTimer initialTime={timerDuration} />
                </CardFooter>
              </Card>
            )}

            {!isLoading && !generatedContent && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <p className="text-lg font-medium">Your question will appear here</p>
                  <p className="text-sm text-muted-foreground">Fill out the form and click "Generate"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
