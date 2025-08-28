'use client';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSavedContent } from '@/hooks/use-saved-content';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Bookmark, FileText, Notebook, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function SavedPage() {
  const { savedItems, removeSavedItem } = useSavedContent();

  const questions = savedItems.filter((item) => item.type === 'question');
  const essays = savedItems.filter((item) => item.type === 'essay');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title="Saved Content" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {savedItems.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">No Saved Content Yet</h2>
              <p className="text-muted-foreground">
                Save practice tests and essay feedback to review them here.
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">
                <Notebook className="mr-2 size-4" />
                Tests ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="essays">
                <FileText className="mr-2 size-4" />
                Essays ({essays.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="questions" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {questions.map((item) =>
                  item.type === 'question' ? (
                    <Card key={item.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-base">{item.trainingType} Reading Test</CardTitle>
                        <CardDescription>
                          Saved {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="line-clamp-4 text-sm">
                          {item.topic ? `Topic: ${item.topic}` : 'A full 3-passage reading test.'}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" onClick={() => removeSavedItem(item.id)}>
                          <Trash2 className="mr-2 size-4" />
                          Remove
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : null
                )}
              </div>
            </TabsContent>
            <TabsContent value="essays" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {essays.map((item) =>
                  item.type === 'essay' ? (
                     <Card key={item.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="truncate text-base" title={item.topic}>{item.topic}</CardTitle>
                        <CardDescription>
                          Saved {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="essay">
                            <AccordionTrigger>View Original Essay</AccordionTrigger>
                            <AccordionContent className="line-clamp-4">{item.essay}</AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="feedback">
                            <AccordionTrigger>View Feedback</AccordionTrigger>
                            <AccordionContent className="line-clamp-4">{item.feedback.overallFeedback}</AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" onClick={() => removeSavedItem(item.id)}>
                          <Trash2 className="mr-2 size-4" />
                          Remove
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : null
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
