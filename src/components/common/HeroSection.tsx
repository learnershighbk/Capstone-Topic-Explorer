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
      title: 'AI 기반 주제 탐색',
      description: '최신 AI 기술로 맞춤형 캡스톤 주제를 제안합니다',
    },
    {
      icon: Globe,
      title: '193개국 데이터',
      description: 'UN 회원국 전역의 정책 이슈를 분석합니다',
    },
    {
      icon: BookOpen,
      title: '검증된 자료',
      description: '실제 존재하는 데이터 소스와 참고문헌을 제공합니다',
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
          KDI School 학생들을 위한 AI 기반 캡스톤 프로젝트 주제 탐색 도구
          <br />
          국가와 관심사를 선택하면 맞춤형 정책 이슈와 연구 주제를 제안합니다
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
            시작하기
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
              왜 Capstone Topic Explorer를 사용해야 할까요?
            </h3>
            <div className="grid gap-4 text-left md:grid-cols-2">
              {[
                'AI가 제안한 주제를 실제 검증된 자료와 연결',
                '193개 UN 회원국 데이터로 글로벌 시각 확보',
                '정책 이슈의 중요도와 빈도 분석 제공',
                '저장 기능으로 나중에 다시 확인 가능',
                '할루시네이션 방지로 신뢰할 수 있는 정보',
                '간편한 4단계 프로세스로 빠른 주제 탐색',
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

