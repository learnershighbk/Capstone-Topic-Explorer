'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, BarChart3, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/features/capstone-auth';

interface HeroSectionProps {
  isLoggedIn: boolean;
  onGetStarted: () => void;
  onLoginSuccess: () => void;
}

const FEATURE_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Verified Sources',
    description: 'AI-suggested topics linked to verified real-world sources',
  },
  {
    icon: Zap,
    title: 'Simple 4-Step Process',
    description: 'Quick topic exploration through a guided workflow',
  },
  {
    icon: BarChart3,
    title: 'Policy Analysis',
    description: 'Policy issue analysis with importance and frequency scores',
  },
  {
    icon: BookmarkCheck,
    title: 'Save & Revisit',
    description: 'Save your analyses and revisit them anytime',
  },
];

export function HeroSection({ isLoggedIn, onGetStarted, onLoginSuccess }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#FFFCF1] via-white to-gray-50">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-14 text-center lg:pt-16">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-3xl font-bold italic leading-tight text-gray-900 md:text-4xl lg:text-5xl"
        >
          Capstone Project Topic Explorer
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-4 max-w-2xl text-base text-gray-600 lg:text-lg"
        >
          An AI-powered capstone project topic discovery tool for KDI School students.
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 max-w-5xl"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Why use Capstone Topic Explorer?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.07 }}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#615EEB]/10">
                    <Icon className="h-4 w-4 text-[#615EEB]" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-500">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Login / Get Started section */}
        {isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 pb-14"
          >
            <Button
              onClick={onGetStarted}
              size="lg"
              className="group rounded-full bg-[#615EEB] px-8 py-6 text-base font-medium text-white transition-all hover:bg-[#5250d9] hover:shadow-lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto mt-10 max-w-md pb-14"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <h2 className="mb-2 text-xl font-bold text-gray-900">LOGIN</h2>
              <p className="mb-5 text-sm text-gray-500">
                9자리 학번을 입력하여 로그인 하세요
              </p>
              <LoginForm layout="inline" onSuccess={onLoginSuccess} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Decorative Background */}
      <div className="absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#615EEB]/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>
    </section>
  );
}
