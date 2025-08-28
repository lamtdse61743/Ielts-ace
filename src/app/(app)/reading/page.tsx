
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { generatePracticeQuestion, type QuestionGroup, type ReadingQuestion } from '@/ai/flows/generate-practice-question';
import { readingFeedback, type ReadingFeedbackOutput } from '@/ai/flows/reading-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/app-header';
import { ExamTimer } from '@/components/exam-timer';
import type { GeneratedQuestion, SavedContent } from '@/lib/types';
import { useSavedContent } from '@/hooks/use-saved-content';
import { Bookmark, Loader2, CheckCircle2, XCircle, RefreshCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const FormSchema = z.object({
  questionType: z.literal('reading-comprehension'),
  trainingType: z.enum(['Academic', 'General Training']),
  difficulty: z.string().min(1, 'Please select a difficulty level.'),
  topic: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

function ReadingPractice() {
  const searchParams = useSearchParams();
  const initialTrainingType = searchParams.get('type') as 'Academic' | 'General Training' | null;

  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedQuestion | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<ReadingFeedbackOutput | null>(null);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  const { toast } = useToast();
  const { addSavedItem, removeSavedItem, isSaved } = useSavedContent();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      questionType: 'reading-comprehension',
      trainingType: 'Academic',
      difficulty: 'medium',
      topic: '',
    },
  });

  // Set training type from URL search params
  useEffect(() => {
    if (initialTrainingType) {
      form.setValue('trainingType', initialTrainingType);
    }
  }, [initialTrainingType, form]);


  const readingForm = useForm();

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('API Error:', error);
    let description = defaultMessage;
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate limit'))) {
      description = 'API rate limit exceeded. Please check your billing status or try again later.';
    }
    toast({
      variant: 'destructive',
      title: 'Error',
      description,
    });
  };

  const onGenerateSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedContent(null);
    setScore(null);
    setFeedback(null);
    readingForm.reset();
    setCurrentPassageIndex(0);
    try {
      const result = await generatePracticeQuestion(data);
      if (!result || !result.passages || result.passages.length === 0) {
        throw new Error('The generated content is invalid or empty.');
      }
      const content: GeneratedQuestion = {
        ...result,
        id: uuidv4(),
        type: 'question',
        questionType: data.questionType,
        trainingType: data.trainingType,
        topic: data.topic,
        difficulty: data.difficulty,
        createdAt: new Date().toISOString(),
      };
      setGeneratedContent(content);
    } catch (error) {
      handleApiError(error, 'Failed to generate practice question. Please try again.');
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
    setCurrentPassageIndex(0);
  }

  const onAnswersSubmit: SubmitHandler<FieldValues> = (data) => {
    if (!generatedContent || !generatedContent.passages) return;
    
    let correctAnswers = 0;
    generatedContent.passages.forEach(passage => {
      passage.questionGroups.forEach(group => {
        group.questions.forEach((q) => {
          const userAnswer = data[`q_${q.questionNumber}`];
          if (userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
            correctAnswers++;
          }
        });
      });
    });

    const totalQuestions = generatedContent.passages.reduce((sum, p) => sum + p.questionGroups.reduce((s, g) => s + g.questions.length, 0), 0);
    setScore(correctAnswers);
    toast({
      title: "Submitted!",
      description: `You scored ${correctAnswers} out of ${totalQuestions}`,
    });
  };

  const handleGetFeedback = async () => {
    if (!generatedContent || !generatedContent.passages) return;
    
    setIsFeedbackLoading(true);
    setFeedback(null);
    const userAnswers = readingForm.getValues();

    try {
      const feedbackPromises = generatedContent.passages.map(passage => {
        const passageQuestions = passage.questionGroups.flatMap(group => 
          group.questions.map(q => ({
            questionText: `Q${q.questionNumber}:`, // Match the feedback lookup key
            userAnswer: userAnswers[`q_${q.questionNumber}`] || 'Not answered',
            correctAnswer: q.answer,
          }))
        );

        return readingFeedback({
            passage: passage.passageText,
            questionsAndAnswers: passageQuestions
        });
      });

      const feedbackResults = await Promise.all(feedbackPromises);
      
      const combinedFeedback: ReadingFeedbackOutput = { feedback: [] };
      feedbackResults.forEach(result => {
        combinedFeedback.feedback.push(...result.feedback);
      });
      
      setFeedback(combinedFeedback);

    } catch (error) {
       handleApiError(error, 'Failed to get feedback. Please try again.');
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
      addSavedItem(generatedContent as SavedContent);
      toast({ title: 'Saved!', description: 'You can find it in the "Saved Content" section.' });
    }
  };
  
  const renderQuestion = (question: ReadingQuestion) => {
    const fieldName = `q_${question.questionNumber}`;
    const feedbackItem = feedback?.feedback.find(f => f.questionText.startsWith(`Q${question.questionNumber}:`));

    const questionContent = () => {
       switch (question.questionType) {
        case 'multiple-choice':
        case 'matching-headings':
        case 'matching-features':
        case 'matching-sentence-endings':
          return (
            <>
              <div className="mb-3 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html: `<strong>${question.questionNumber}.</strong> ${question.questionText}`}}/>
              <RadioGroup onValueChange={(value) => readingForm.setValue(fieldName, value)} className="space-y-2">
                {question.options?.map((option: string, i: number) => (
                  <FormItem key={i} className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem value={option} id={`${fieldName}-${i}`} disabled={score !== null} />
                    </FormControl>
                    <FormLabel htmlFor={`${fieldName}-${i}`} className="font-normal">{option}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </>
          );
        case 'true-false-not-given':
        case 'yes-no-not-given':
          const options = question.questionType === 'true-false-not-given' 
            ? ['True', 'False', 'Not Given'] 
            : ['Yes', 'No', 'Not Given'];
          return (
            <>
              <div className="mb-3 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html: `<strong>${question.questionNumber}.</strong> ${question.questionText}`}}/>
              <RadioGroup onValueChange={(value) => readingForm.setValue(fieldName, value)} className="flex space-x-4">
                {options.map((opt, i) => (
                  <FormItem key={i} className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem value={opt} id={`${fieldName}-${i}`} disabled={score !== null} />
                    </FormControl>
                    <FormLabel htmlFor={`${fieldName}-${i}`} className="font-normal">{opt}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </>
          );
        case 'short-answer':
        case 'sentence-completion':
        case 'summary-completion':
        case 'note-completion':
        case 'table-completion':
        case 'flow-chart-completion':
        case 'diagram-completion':
           return (
            <>
              <div className="mb-3 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html: `<strong>${question.questionNumber}.</strong> ${question.questionText}`}}/>
              <Input {...readingForm.register(fieldName)} disabled={score !== null} placeholder="Your answer" />
            </>
          );
        default:
          return <p className="text-sm text-muted-foreground">Unsupported question type: {question.questionType}</p>;
      }
    };
    
    return (
      <div key={question.questionNumber} className="mb-6">
         <FormField
          control={readingForm.control}
          name={fieldName}
          render={() => (
            <FormItem className="rounded-md border p-4">
              <FormControl>
                <div>{questionContent()}</div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {feedbackItem && (
          <Alert className="mt-4" variant={feedbackItem.isCorrect ? 'default' : 'destructive'}>
            {feedbackItem.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{feedbackItem.isCorrect ? 'Correct!' : 'Incorrect'}</AlertTitle>
            <AlertDescription className="prose prose-sm dark:prose-invert max-w-none space-y-1">
              <p><strong>Your answer:</strong> {feedbackItem.userAnswer}</p>
              <p><strong>Correct answer:</strong> {feedbackItem.correctAnswer}</p>
              <div dangerouslySetInnerHTML={{ __html: feedbackItem.explanation }} />
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  const currentPassage = generatedContent?.passages?.[currentPassageIndex];
  const totalQuestions = generatedContent?.passages?.reduce((sum, p) => sum + p.questionGroups.reduce((s, g) => s + g.questions.length, 0), 0) || 0;
  
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title="Reading Practice">
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
                  <CardTitle>Generate Reading Test</CardTitle>
                  <CardDescription>Select your preferences to generate a full IELTS reading test.</CardDescription>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onGenerateSubmit)}>
                    <CardContent className="space-y-4">
                       <FormField
                        control={form.control}
                        name="trainingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Test Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a test type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Academic">Academic</SelectItem>
                                <SelectItem value="General Training">General Training</SelectItem>
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
                              <Input placeholder="e.g., Space Exploration, Ancient Civilizations" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Test
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
            <p className="text-lg font-semibold">Generating your test...</p>
            <p className="text-sm text-muted-foreground">This may take a moment. Please wait.</p>
          </div>
        )}

        {generatedContent && !isLoading && currentPassage && (
            <div className="w-full max-w-4xl space-y-6">
                <Card>
                  <CardHeader className="flex-row items-start justify-between">
                    <div>
                      <CardTitle>{currentPassage.passageTitle || `Passage ${currentPassage.passageNumber}`}</CardTitle>
                      <CardDescription>
                        {generatedContent.trainingType} - {generatedContent.difficulty && <span className="capitalize">{generatedContent.difficulty}</span>}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleSaveToggle} aria-label="Save test">
                      <Bookmark className={cn('size-5', isSaved(generatedContent.id) && 'fill-primary text-primary')} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentPassage.passageText }} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...readingForm}>
                      <form onSubmit={readingForm.handleSubmit(onAnswersSubmit)}>
                        {currentPassage.questionGroups.map((group, groupIndex) => (
                           <div key={groupIndex} className="mb-8">
                            <div className="prose prose-sm dark:prose-invert max-w-none mb-4 rounded-md bg-muted p-4" dangerouslySetInnerHTML={{ __html: group.instruction }} />
                            {group.questions.map(renderQuestion)}
                          </div>
                        ))}
                        {currentPassageIndex === (generatedContent.passages.length - 1) && score === null && (
                          <div className="mt-6 flex items-center justify-between gap-4">
                            <Button type="submit" disabled={score !== null}>Submit All Answers</Button>
                          </div>
                        )}
                      </form>
                    </Form>
                     {score !== null && (
                      <div className="mt-6 flex flex-col items-center justify-center gap-4 rounded-lg border bg-card p-6 text-center">
                        <p className="text-lg font-bold">Total Score: {score}/{totalQuestions}</p>
                        {!feedback && (
                           <Button onClick={handleGetFeedback} disabled={isFeedbackLoading} className="w-full max-w-xs">
                            {isFeedbackLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Get Feedback
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-4">
                    <div className="flex items-center justify-between">
                        <Button 
                          variant="outline"
                          onClick={() => setCurrentPassageIndex(p => p - 1)} 
                          disabled={currentPassageIndex === 0}>
                            <ArrowLeft className="mr-2 size-4" />
                            Back
                        </Button>
                        <div className="text-center">
                          <p className="text-sm font-medium">Passage {currentPassageIndex + 1} of {generatedContent.passages.length}</p>
                          <Progress value={((currentPassageIndex + 1) / generatedContent.passages.length) * 100} className="mt-1 h-2 w-24" />
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => setCurrentPassageIndex(p => p + 1)}
                          disabled={currentPassageIndex === generatedContent.passages.length - 1}>
                            Next
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                    </div>
                    <ExamTimer initialTime={3600} />
                  </CardFooter>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
}

export default function PracticeQuestionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReadingPractice />
    </Suspense>
  )
}
