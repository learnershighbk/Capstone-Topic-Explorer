'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Globe, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Topic Discovery',
      description: 'Get personalized capstone topic suggestions using the latest AI technology',
    },
    {
      icon: Globe,
      title: '193 Countries Covered',
      description: 'Analyze policy issues across all UN member states',
    },
    {
      icon: BookOpen,
      title: 'Verified Sources',
      description: 'Access real, verified data sources and academic references',
    },
  ];

  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden bg-gradient-to-b from-[#FFFCF1] via-white to-gray-50">
      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center lg:pt-32">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-serif text-4xl font-bold italic leading-tight text-gray-900 md:text-5xl lg:text-6xl"
        >
          Capstone Project
          <br />
          Topic Explorer
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 lg:text-xl"
        >
          An AI-powered capstone project topic discovery tool for KDI School students.
          <br />
          Select a country and area of interest to explore tailored policy issues and research topics.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10"
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

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mx-auto mt-20 grid max-w-5xl gap-8 md:grid-cols-3"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#615EEB]/10">
                  <Icon className="h-6 w-6 text-[#615EEB]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-[#615EEB]/5 to-purple-50/50 p-8">
            <h3 className="mb-6 text-2xl font-semibold text-gray-900">
              Why Use Capstone Topic Explorer?
            </h3>
            <div className="grid gap-4 text-left md:grid-cols-2">
              {[
                'AI-suggested topics linked to verified real-world sources',
                'Global perspective with data from 193 UN member states',
                'Policy issue analysis with importance and frequency scores',
                'Save your analyses and revisit them anytime',
                'Anti-hallucination measures for trustworthy information',
                'Quick topic exploration through a simple 4-step process',
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#615EEB]" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#615EEB]/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>
    </section>
  );
}

