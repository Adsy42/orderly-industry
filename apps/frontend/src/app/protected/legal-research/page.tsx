"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Scale,
  BookOpen,
  FileText,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Edit3,
  AlertCircle,
  Sparkles,
  LoaderCircle,
  Copy,
  ExternalLink,
  ArrowLeft,
  Download,
  CheckCircle2,
  BarChart3,
  AlertTriangle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/model-selector";
import Link from "next/link";

// Jurisdictions for Australian legal research
const JURISDICTIONS = [
  { id: "federal", name: "Federal (Commonwealth)", icon: "🏛️" },
  { id: "nsw", name: "New South Wales", icon: "🦘" },
  { id: "vic", name: "Victoria", icon: "🏔️" },
  { id: "qld", name: "Queensland", icon: "☀️" },
  { id: "wa", name: "Western Australia", icon: "🌾" },
  { id: "sa", name: "South Australia", icon: "🍇" },
  { id: "tas", name: "Tasmania", icon: "🌲" },
  { id: "nt", name: "Northern Territory", icon: "🐊" },
  { id: "act", name: "Australian Capital Territory", icon: "🏢" },
];

// Research depths
const RESEARCH_DEPTHS = [
  { id: "quick", name: "Quick Overview", time: "5-10 min", sources: "5-10" },
  { id: "standard", name: "Standard Research", time: "15-30 min", sources: "20-30" },
  { id: "comprehensive", name: "Comprehensive Analysis", time: "45-60 min", sources: "50+" },
];

// Mock research plan for demonstration
const MOCK_PLAN = {
  session_id: "demo-123",
  estimated_time_minutes: 25,
  plan: {
    question_analysis: {
      legal_area: "Corporate Law",
      complexity: "Medium",
    },
    overall_strategy: "doctrinal_analysis",
    research_approach: "Start with primary legislation, then examine relevant case law and commentary.",
    sub_tasks: [
      {
        id: "task_1",
        question: "What are the key provisions of the Corporations Act 2001 regarding director duties?",
        purpose: "Establish the statutory framework",
        priority: "high",
        strategy: "statutory_analysis",
        source_types: ["legislation", "commentary"],
        jurisdictions: ["federal"],
        estimated_time_minutes: 8,
        expected_sources: ["Corporations Act 2001", "ASIC Guidance"],
        dependencies: [],
      },
      {
        id: "task_2",
        question: "What are the leading cases on director's duty of care and diligence?",
        purpose: "Understand judicial interpretation",
        priority: "high",
        strategy: "case_analysis",
        source_types: ["case"],
        jurisdictions: ["federal", "nsw", "vic"],
        estimated_time_minutes: 10,
        expected_sources: ["ASIC v Healey", "Vrisakis v ASC"],
        dependencies: ["task_1"],
      },
      {
        id: "task_3",
        question: "What are the consequences of breaching director duties?",
        purpose: "Identify enforcement mechanisms and penalties",
        priority: "medium",
        strategy: "doctrinal_analysis",
        source_types: ["legislation", "case", "commentary"],
        jurisdictions: ["federal"],
        estimated_time_minutes: 7,
        expected_sources: [],
        dependencies: ["task_1", "task_2"],
      },
    ],
    key_legal_concepts: ["Duty of care", "Duty of diligence", "Business judgment rule", "Good faith"],
    follow_up_questions: [
      "How does the business judgment rule affect director liability?",
      "What are the differences between director duties and fiduciary duties?",
    ],
    potential_challenges: [
      "Complex interplay between statutory duties and common law",
      "Varying interpretations across jurisdictions",
    ],
  },
};

// Citation type
interface Citation {
  citation_string?: string;
  citation?: string;
  citation_type: "case" | "legislation" | "other";
  summary?: string;
  year?: string;
  court?: string;
  jurisdiction?: string;
  url?: string;
  verified?: boolean;
}

export default function LegalResearchPage() {
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState("standard");
  const [selectedJurisdictions, setSelectedJurisdictions] = useState(["federal", "nsw", "vic"]);
  const [showJurisdictions, setShowJurisdictions] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [plan, setPlan] = useState<typeof MOCK_PLAN | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-sonnet-4.5");
  const [activeTab, setActiveTab] = useState<"planner" | "progress" | "report">("planner");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  const toggleJurisdiction = (jurId: string) => {
    setSelectedJurisdictions((prev) =>
      prev.includes(jurId) ? prev.filter((j) => j !== jurId) : [...prev, jurId]
    );
  };

  const handleCreatePlan = useCallback(async () => {
    if (!question.trim()) return;
    setIsCreatingPlan(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPlan(MOCK_PLAN);
    setIsCreatingPlan(false);
  }, [question]);

  const handleStartResearch = useCallback(async () => {
    if (!plan) return;
    setIsResearching(true);
    setActiveTab("progress");
    setResearchProgress(0);

    // Simulate research progress
    const interval = setInterval(() => {
      setResearchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsResearching(false);
          setActiveTab("report");
          // Add mock citations
          setCitations([
            {
              citation_string: "ASIC v Healey [2011] FCA 717",
              citation_type: "case",
              summary: "Leading case on director's duty of care and diligence under s 180 of the Corporations Act 2001",
              year: "2011",
              court: "Federal Court of Australia",
              jurisdiction: "Federal",
              verified: true,
            },
            {
              citation_string: "Corporations Act 2001 (Cth) s 180",
              citation_type: "legislation",
              summary: "Statutory provision on care and diligence - civil obligation only",
              jurisdiction: "Federal",
              verified: true,
            },
            {
              citation_string: "Vrisakis v Australian Securities Commission [1993] FCA 369",
              citation_type: "case",
              summary: "Early authority on reasonable steps and prudent person standard",
              year: "1993",
              court: "Federal Court of Australia",
              jurisdiction: "Federal",
              verified: false,
            },
          ]);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 800);
  }, [plan]);

  const updateTaskQuestion = (taskId: string, newQuestion: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      plan: {
        ...plan.plan,
        sub_tasks: plan.plan.sub_tasks.map((t) =>
          t.id === taskId ? { ...t, question: newQuestion } : t
        ),
      },
    });
    setEditingTask(null);
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(text);
    setTimeout(() => setCopiedCitation(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/protected">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Legal Research</h1>
                <p className="text-sm text-slate-500">AI-powered research with multi-model deliberation</p>
              </div>
            </div>
          </div>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isResearching}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 flex gap-2 rounded-xl bg-slate-100 p-1">
          {[
            { id: "planner", label: "Research Planner", icon: Search },
            { id: "progress", label: "Progress", icon: Play },
            { id: "report", label: "Report", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Planner Tab */}
          {activeTab === "planner" && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Question Input */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Research Question
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your legal research question... e.g., 'What are the director's duties under the Corporations Act 2001?'"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    rows={3}
                  />
                </div>
              </div>

              {/* Configuration */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Depth Selection */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Research Depth
                  </label>
                  <div className="space-y-2">
                    {RESEARCH_DEPTHS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDepth(d.id)}
                        className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                          depth === d.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-medium text-slate-900">{d.name}</span>
                        <span className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {d.time} • {d.sources} sources
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jurisdiction Selection */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <button
                    onClick={() => setShowJurisdictions(!showJurisdictions)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-slate-600" />
                      <span className="font-medium text-slate-700">
                        Jurisdictions ({selectedJurisdictions.length} selected)
                      </span>
                    </div>
                    {showJurisdictions ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showJurisdictions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 grid grid-cols-2 gap-2 overflow-hidden"
                      >
                        {JURISDICTIONS.map((jur) => (
                          <button
                            key={jur.id}
                            onClick={() => toggleJurisdiction(jur.id)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                              selectedJurisdictions.includes(jur.id)
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <span>{jur.icon}</span>
                            <span className="truncate">{jur.name}</span>
                            {selectedJurisdictions.includes(jur.id) && (
                              <Check className="ml-auto h-3.5 w-3.5" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Create Plan Button */}
              {!plan && (
                <Button
                  onClick={handleCreatePlan}
                  disabled={!question.trim() || isCreatingPlan}
                  className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 py-6 text-lg hover:from-indigo-700 hover:to-purple-700"
                >
                  {isCreatingPlan ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Creating Research Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Create Research Plan
                    </>
                  )}
                </Button>
              )}

              {/* Plan Display */}
              {plan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Plan Header */}
                  <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-green-900">Research Plan Created</h3>
                      <span className="flex items-center gap-1 text-sm text-green-700">
                        <Clock className="h-4 w-4" />
                        Est. {plan.estimated_time_minutes} minutes
                      </span>
                    </div>

                    {/* Analysis Badges */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                        {plan.plan.question_analysis.legal_area}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                        {plan.plan.question_analysis.complexity}
                      </span>
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                        {plan.plan.overall_strategy.replace(/_/g, " ")}
                      </span>
                    </div>

                    {plan.plan.research_approach && (
                      <p className="mt-3 text-sm text-green-800">{plan.plan.research_approach}</p>
                    )}
                  </div>

                  {/* Sub-tasks */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h4 className="mb-4 font-semibold text-slate-900">
                      Research Sub-Questions ({plan.plan.sub_tasks.length})
                    </h4>
                    <div className="space-y-4">
                      {plan.plan.sub_tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className={`relative rounded-xl border-2 p-4 ${
                            task.priority === "high"
                              ? "border-red-200 bg-red-50/50"
                              : "border-slate-200 bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              {editingTask === task.id ? (
                                <input
                                  type="text"
                                  defaultValue={task.question}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  onBlur={(e) => updateTaskQuestion(task.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      updateTaskQuestion(task.id, e.currentTarget.value);
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <p className="font-medium text-slate-900">{task.question}</p>
                              )}
                              {task.purpose && (
                                <p className="mt-1 text-sm text-slate-500">{task.purpose}</p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded bg-slate-200 px-2 py-0.5 text-slate-600">
                                  {task.strategy?.replace(/_/g, " ")}
                                </span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <BookOpen className="h-3 w-3" />
                                  {task.source_types?.join(", ")}
                                </span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  {task.estimated_time_minutes} min
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingTask(task.id)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Concepts */}
                  {plan.plan.key_legal_concepts.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                      <h4 className="mb-3 font-semibold text-slate-900">Key Legal Concepts</h4>
                      <div className="flex flex-wrap gap-2">
                        {plan.plan.key_legal_concepts.map((concept, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setPlan(null)}
                      className="flex-1"
                    >
                      Modify Question
                    </Button>
                    <Button
                      onClick={handleStartResearch}
                      className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <Sparkles className="h-4 w-4" />
                      Start Research
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Progress Tab */}
          {activeTab === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border border-slate-200 bg-white p-8"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100">
                  {isResearching ? (
                    <LoaderCircle className="h-12 w-12 animate-spin text-indigo-600" />
                  ) : (
                    <Check className="h-12 w-12 text-green-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isResearching ? "Researching..." : "Research Complete"}
                </h2>
                <p className="mt-2 text-slate-500">
                  {isResearching
                    ? "AI agents are analyzing legal sources across multiple databases"
                    : "Your research report is ready to view"}
                </p>

                {/* Progress Bar */}
                <div className="mx-auto mt-8 max-w-md">
                  <div className="mb-2 flex justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span>{Math.round(researchProgress)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${researchProgress}%` }}
                    />
                  </div>
                </div>

                {/* Task Progress */}
                {plan && (
                  <div className="mx-auto mt-8 max-w-lg space-y-3">
                    {plan.plan.sub_tasks.map((task, index) => {
                      const taskProgress = Math.min(100, Math.max(0, (researchProgress - index * 30) * 3));
                      return (
                        <div key={task.id} className="flex items-center gap-3 text-left">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              taskProgress >= 100
                                ? "bg-green-500 text-white"
                                : taskProgress > 0
                                ? "bg-indigo-500 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {taskProgress >= 100 ? <Check className="h-3 w-3" /> : index + 1}
                          </div>
                          <span
                            className={`flex-1 text-sm ${
                              taskProgress >= 100 ? "text-green-600" : "text-slate-600"
                            }`}
                          >
                            {task.question.length > 60
                              ? task.question.substring(0, 60) + "..."
                              : task.question}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Report Tab */}
          {activeTab === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-6 lg:grid-cols-3"
            >
              {/* Main Report */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Legal Research Report</h2>
                      <p className="mt-1 text-slate-500">{question || "Director's Duties Research"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                        <Download className="h-3.5 w-3.5" />
                        Export PDF
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date().toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <BarChart3 className="h-4 w-4" />
                      87% Confidence
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-3 font-semibold text-slate-900">Executive Summary</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Directors of Australian companies owe a range of statutory and common law duties. 
                    The primary duties are codified in Part 2D.1 of the Corporations Act 2001 (Cth), 
                    including the duty to exercise care and diligence (s 180), act in good faith 
                    and for a proper purpose (s 181), avoid improper use of position (s 182), and 
                    avoid improper use of information (s 183). The business judgment rule (s 180(2)) 
                    provides a safe harbor where directors make informed, good faith decisions.
                  </p>
                </div>

                {/* Key Findings */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-4 font-semibold text-slate-900">Key Findings</h3>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="font-medium text-slate-900">1. Statutory Framework</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        The Corporations Act 2001 establishes both civil and criminal liability 
                        for breaches of director duties. Civil penalties under s 1317E can reach 
                        $200,000 for individuals, while criminal penalties may include imprisonment.
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="font-medium text-slate-900">2. Care and Diligence Standard</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        Per ASIC v Healey [2011] FCA 717, directors must understand the company's 
                        financial position and cannot rely solely on management representations. 
                        The standard is objective: what a reasonable person in the director's 
                        position would do.
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="font-medium text-slate-900">3. Business Judgment Rule</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        Section 180(2) provides protection where directors: (a) make judgments in 
                        good faith and for proper purpose; (b) have no material personal interest; 
                        (c) inform themselves appropriately; and (d) rationally believe the judgment 
                        is in the company's best interests.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-900">
                    <AlertTriangle className="h-5 w-5" />
                    Recommendations
                  </h3>
                  <ol className="list-inside list-decimal space-y-2 text-sm text-amber-800">
                    <li>Regularly review and understand the company's financial statements</li>
                    <li>Document all decision-making processes and the information relied upon</li>
                    <li>Disclose and manage any potential conflicts of interest</li>
                    <li>Seek independent professional advice where appropriate</li>
                    <li>Ensure adequate D&O insurance coverage is in place</li>
                  </ol>
                </div>
              </div>

              {/* Citation Panel */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                    <BookOpen className="h-5 w-5" />
                    Citations ({citations.length})
                  </h3>

                  {citations.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <BookOpen className="mx-auto mb-2 h-8 w-8" />
                      <p>No citations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {citations.map((citation, index) => (
                        <div
                          key={index}
                          className={`rounded-xl border p-3 ${
                            citation.verified
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {citation.citation_type === "case" ? (
                              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                            ) : (
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {citation.citation_string || citation.citation}
                              </p>
                              {citation.summary && (
                                <p className="mt-1 text-xs text-slate-500">{citation.summary}</p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                {citation.verified ? (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-amber-600">
                                    <AlertCircle className="h-3 w-3" />
                                    Unverified
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleCopyCitation(citation.citation_string || citation.citation || "")
                              }
                              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            >
                              {copiedCitation === (citation.citation_string || citation.citation) ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Models Used */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">AI Models Used</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                      Claude Opus 4.5
                    </span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      GPT-4o
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Gemini 3 Pro
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

