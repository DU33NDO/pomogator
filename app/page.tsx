import type React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Terminal,
  Shapes,
  Brain,
  GraduationCap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 pb-16 md:pt-44 md:pb-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
            The AI Framework for
            <span className="block text-blue-600">Mathematics Education</span>
          </h1>

          <p className="mt-6 text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            Used by leading educational institutions worldwide, Pomogator
            enables teachers to create
            <span className="text-black font-semibold">
              {" "}
              engaging learning experiences{" "}
            </span>
            with the power of artificial intelligence.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-6">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-6">
              Learn More
            </Button>
          </div>

          <div className="mt-8 bg-gray-950 text-gray-100 rounded-lg p-4 max-w-md mx-auto font-mono text-sm">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4" />
              <span>JUST DO IT 🚀🚀🚀</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              What's in Pomogator?
            </h2>
            <p className="mt-4 text-gray-600">
              Everything you need to transform mathematics education.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-8 w-8" />}
              title="AI-Powered Learning"
              description="Intelligent problem generation and step-by-step solutions tailored to each student's level."
            />
            <FeatureCard
              icon={<GraduationCap className="h-8 w-8" />}
              title="Teacher Dashboard"
              description="Comprehensive analytics and insights to track student progress and identify areas for improvement."
            />
            <FeatureCard
              icon={<Shapes className="h-8 w-8" />}
              title="Interactive Exercises"
              description="Dynamic, engaging exercises that adapt to student performance in real-time."
            />
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center justify-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Now with advanced visualization tools</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard number="2x" label="Teacher Efficiency" />
            <StatCard number="100%" label="Problem Accuracy" />
            <StatCard number="0%" label="Assignment Stress" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl md:text-5xl font-bold text-blue-600">
        {number}
      </div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
