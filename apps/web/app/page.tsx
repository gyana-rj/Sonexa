'use client';

import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import {
  TrendingSection,
  MoodSection,
  TimelineSection,
  FeaturesSection,
  DevicesSection,
  Footer,
} from '@/components/landing/sections';

export default function LandingPage() {
  return (
    <>
      <div
        className="relative w-full bg-[#160f1f] text-white"
        style={{ fontFamily: 'Inter, sans-serif', scrollBehavior: 'smooth' }}
      >
        <Navbar />
        <Hero />

        {/* scrollable platform content — warm ambient backdrop shared across sections */}
        <div className="relative overflow-hidden">
          {/* soft glows tying the sections to the golden-hour palette */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-[8%] h-96 w-96 rounded-full bg-orange-700/10 blur-[140px]" />
            <div className="absolute right-1/4 top-[38%] h-96 w-96 rounded-full bg-rose-800/10 blur-[140px]" />
            <div className="absolute left-1/3 top-[68%] h-96 w-96 rounded-full bg-emerald-800/10 blur-[140px]" />
          </div>

          <div className="relative">
            <TrendingSection />
            <DevicesSection />
            <MoodSection />
            <TimelineSection />
            <FeaturesSection />
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
