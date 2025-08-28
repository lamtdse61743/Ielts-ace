'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Notebook, Headphones, PenSquare, Mic } from 'lucide-react';

const skills = [
  {
    name: 'Reading',
    href: '/reading',
    icon: Notebook,
    description: 'Practice with academic and general training passages.',
    enabled: true,
  },
  {
    name: 'Listening',
    href: '#',
    icon: Headphones,
    description: 'Listen to recordings and answer questions. (Coming Soon)',
    enabled: false,
  },
  {
    name: 'Writing',
    href: '/writing',
    icon: PenSquare,
    description: 'Get AI feedback on your Task 1 and Task 2 essays.',
    enabled: true,
  },
  {
    name: 'Speaking',
    href: '#',
    icon: Mic,
    description: 'Practice speaking prompts and get feedback. (Coming Soon)',
    enabled: false,
  },
];

export default function SkillsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader title="Choose a Skill to Practice" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill) => (
            <Link key={skill.name} href={skill.enabled ? skill.href : '#'} passHref>
              <Card
                className={`flex h-full flex-col transition-all hover:border-primary hover:shadow-lg ${
                  !skill.enabled ? 'cursor-not-allowed bg-muted/50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <skill.icon className="size-8 text-primary" />
                    <CardTitle>{skill.name}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">{skill.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
