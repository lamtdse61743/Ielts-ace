'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { generatePracticeQuestion } from '@/ai/flows/generate-practice-question';
import { readingFeedback, type ReadingFeedbackOutput } from '@/ai/flows/reading-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/app-header';
import { ExamTimer } from '@/components/exam-timer';
import type { GeneratedQuestion, ReadingQuestion } from '@/lib/types';
import { useSavedContent } from '@/hooks/use-saved-content';
import { Bookmark, Loader2, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedQuestion | null>(null);
  const [timerDuration, setTimerDuration] = useState(2400);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<ReadingFeedbackOutput | null>(null);
  const { toast } = useToast();
  const { addSavedItem, removeSavedItem, isSaved } = useSavedContent();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      questionType: 'reading-comprehension',
      difficulty: 'medium',
      topic: '',
    },
  });

  const readingForm = useForm();

  const onGenerateSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedContent(null);
    setScore(null);
    setFeedback(null);
    readingForm.reset();
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
  
  const handleStartOver = () => {
    setGeneratedContent(null);
    setScore(null);
    setFeedback(null);
    form.reset();
    readingForm.reset();
  }

  const onAnswersSubmit: SubmitHandler<FieldValues> = (data) => {
    if (!generatedContent || !generatedContent.questions) return;
    
    let correctAnswers = 0;
    generatedContent.questions.forEach((q, index) => {
      if (data[`q_${index}`]?.toLowerCase() === q.answer.toLowerCase()) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    toast({
      title: "Submitted!",
      description: `You scored ${correctAnswers} out of ${generatedContent.questions.length}`,
    });
  };

  const handleGetFeedback = async () => {
    if (!generatedContent || !generatedContent.questions || !generatedContent.passage) return;
    
    setIsFeedbackLoading(true);
    setFeedback(null);

    try {
      const userAnswers = readingForm.getValues();
      const questionsAndAnswers = generatedContent.questions.map((q, index) => ({
        questionText: q.questionText,
        userAnswer: userAnswers[`q_${index}`] || 'Not answered',
        correctAnswer: q.answer,
      }));

      const feedbackResult = await readingFeedback({
        passage: generatedContent.passage,
        questionsAndAnswers: questionsAndAnswers,
      });

      setFeedback(feedbackResult);

    } catch (error) {
       console.error('Error getting feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get feedback. Please try again.',
      });
    } finally {
      setIsFeedbackLoading(false);
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

  const renderQuestion = (question: ReadingQuestion, index: number) => {
    const fieldName = `q_${index}`;
    const feedbackItem = feedback?.feedback[index];

    return (
      <div key={index} className="mb-4 rounded-md border p-4">
        <p className="mb-2 font-semibold">{index + 1}. {question.questionText}</p>
        <FormField
          control={readingForm.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                {question.questionType === 'multiple-choice' ? (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                      {question.options?.map((option, i) => (
                        <FormItem key={i} className="flex items-center space-x-3">
                          <FormControl>
                              <RadioGroupItem value={option} id={`${fieldName}-${i}`} disabled={score !== null}/>
                          </FormControl>
                          <FormLabel htmlFor={`${fieldName}-${i}`} className="font-normal">{option}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                ) : question.questionType === 'true-false' ? (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                        <FormItem className="flex items-center space-x-3">
                          <FormControl>
                            <RadioGroupItem value="True" id={`${fieldName}-true`} disabled={score !== null}/>
                          </FormControl>
                          <FormLabel htmlFor={`${fieldName}-true`} className="font-normal">True</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3">
                          <FormControl>
                              <RadioGroupItem value="False" id={`${fieldName}-false`} disabled={score !== null}/>
                          </FormControl>
                          <FormLabel htmlFor={`${fieldName}-false`} className="font-normal">False</FormLabel>
                        </FormItem>
                    </RadioGroup>
                ) : null}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {feedbackItem && (
          <Alert className="mt-4" variant={feedbackItem.isCorrect ? 'default' : 'destructive'}>
            {feedbackItem.isCorrect ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {feedbackItem.isCorrect ? 'Correct!' : 'Incorrect'}
            </AlertTitle>
            <AlertDescription className="prose prose-sm dark:prose-invert max-w-none space-y-1">
              <p><strong>Your answer:</strong> {feedbackItem.userAnswer}</p>
              <p><strong>Correct answer:</strong> {feedbackItem.correctAnswer}</p>
              <p><strong>Explanation:</strong> {feedbackItem.explanation}</p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title="Practice Questions">
         {generatedContent && (
          <Button variant="outline" onClick={handleStartOver}>
            <RefreshCcw className="mr-2 size-4" />
            Start Over
          </Button>
        )}
      </AppHeader>
      <main className="flex flex-1 items-start justify-center overflow-auto p-4 md:p-6">
        {!generatedContent && !isLoading && (
            <div className="w-full max-w-2xl pt-10">
              <Card>
                <CardHeader>
                  <CardTitle>Generate a Question</CardTitle>
                  <CardDescription>Select your preferences to generate a custom IELTS practice question.</CardDescription>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onGenerateSubmit)}>
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
        )}

        {isLoading && (
          <div className="w-full max-w-4xl">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {generatedContent && !isLoading && (
            <div className="w-full max-w-4xl">
              <Card className="flex h-full flex-col">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-headline text-xl">Generated Question</CardTitle>
                    <CardDescription>
                      {questionTypes.find(qt => qt.value === generatedContent.questionType)?.label}
                      {generatedContent.difficulty && <span className="capitalize"> - {generatedContent.difficulty}</span>}
                      {generatedContent.topic && ` - ${generatedContent.topic}`}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSaveToggle}>
                    <Bookmark className={cn('size-5', isSaved(generatedContent.id) && 'fill-primary text-primary')} />
                    <span className="sr-only">Save question</span>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  {generatedContent.passage && (
                    <div className="space-y-2 rounded-md border bg-muted p-4">
                       <h3 className="text-lg font-semibold">Reading Passage</h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedContent.passage}
                      </p>
                    </div>
                  )}
                  {generatedContent.questions && (
                    <Form {...readingForm}>
                      <form onSubmit={readingForm.handleSubmit(onAnswersSubmit)}>
                        <h3 className="mb-4 text-lg font-semibold">Questions</h3>
                        {generatedContent.questions.map(renderQuestion)}
                         <div className="mt-6 flex items-center justify-between gap-4">
                          <Button type="submit" disabled={score !== null}>Submit Answers</Button>
                          {score !== null && (
                            <div className='flex items-center gap-4'>
                              <p className="text-lg font-bold">Your Score: {score}/{generatedContent.questions.length}</p>
                              <Button onClick={handleGetFeedback} disabled={isFeedbackLoading}>
                                {isFeedbackLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Get Feedback
                              </Button>
                            </div>
                          )}
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
                <CardFooter>
                  <ExamTimer initialTime={timerDuration} />
                </CardFooter>
              </Card>
            </div>
        )}
      </main>
    </div>
  );
}

    