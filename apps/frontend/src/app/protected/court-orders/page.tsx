"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Scale,
  Building2,
  Check,
  ChevronRight,
  Loader2,
  ArrowRight,
  Sparkles,
  User,
  Download,
  Edit3,
  Save,
  ZoomIn,
  ZoomOut,
  FileDown,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Court order templates configuration
const COURT_ORDERS_TEMPLATES = {
  "common-law": [
    {
      id: "consent-order",
      name: "Consent Order (General)",
      description: "Standard consent order for settling proceedings",
      category: "Settlement",
      popular: true,
    },
    {
      id: "general-personal-injury",
      name: "Personal Injury - General",
      description: "Standard orders for personal injury matters",
      category: "Personal Injury",
      popular: true,
    },
    {
      id: "serious-injury-tac",
      name: "Serious Injury - TAC",
      description: "Orders for TAC serious injury applications",
      category: "Personal Injury",
      popular: true,
    },
    {
      id: "extension-adjournment",
      name: "Extension/Adjournment",
      description: "Orders for time extensions or adjournments",
      category: "Procedural",
      popular: false,
    },
    {
      id: "discovery-orders",
      name: "Discovery Orders",
      description: "Orders relating to document discovery",
      category: "Discovery",
      popular: false,
    },
    {
      id: "summary-judgment",
      name: "Summary Judgment",
      description: "Orders for summary judgment applications",
      category: "Judgment",
      popular: false,
    },
  ],
  "commercial": [
    {
      id: "consent-order-commercial",
      name: "Consent Order (Commercial)",
      description: "Standard commercial consent order",
      category: "Settlement",
      popular: true,
    },
    {
      id: "building-cases",
      name: "Building Cases List",
      description: "Orders for building and construction disputes",
      category: "Building",
      popular: true,
    },
    {
      id: "corporations-list",
      name: "Corporations List",
      description: "Orders for corporations law matters",
      category: "Corporations",
      popular: true,
    },
    {
      id: "commercial-general",
      name: "Commercial General",
      description: "General commercial orders",
      category: "Commercial",
      popular: false,
    },
    {
      id: "arbitration-enforcement",
      name: "Arbitration Enforcement",
      description: "Orders for arbitration enforcement",
      category: "Arbitration",
      popular: false,
    },
  ],
};

// Demo data for templates
const DEMO_DATA = {
  location: "MELBOURNE",
  list: "GENERAL LIST",
  matter_number: "CI-25-01234",
  plaintiff_name: "Sarah Johnson",
  defendant_name: "Victorian Workcover Authority",
  document_date: "29 November 2025",
  filing_party: "Defendant",
  preparer_name: "Williams & Associates",
  preparer_address: "123 Collins Street, Melbourne VIC 3000",
  solicitor_code: "WAL001",
  attention: "John Smith",
  email: "john.smith@williamslaw.com.au",
  before_judge: "",
  type_of_order:
    "In Chambers Order (based on signed Minutes of Consent Orders dated 25 November 2025)",
  date_of_order: "",
  consent_orders_date: "25 November 2025",
  orders:
    "1. The hearing listed for 15 November 2025 be vacated.\n2. The Defendant to pay the Plaintiff's costs pursuant to the WorkCover (Litigated Claims) Legal Costs Order 2024.\n3. The proceeding otherwise be dismissed.",
  dated: "29 November 2025",
  plaintiff_solicitor_firm: "Williams & Associates",
  defendant_solicitor_firm: "VWA Legal Services",
};

type Division = "common-law" | "commercial";

export default function CourtOrdersPage() {
  const [division, setDivision] = useState<Division>("common-law");
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof COURT_ORDERS_TEMPLATES)["common-law"][0] | null
  >(null);
  const [showFillingMode, setShowFillingMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const templates = COURT_ORDERS_TEMPLATES[division];
  const popularTemplates = templates.filter((t) => t.popular);
  const displayTemplates = showAllTemplates ? templates : popularTemplates;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [inputMessage]);

  const handleDivisionChange = (newDivision: Division) => {
    setDivision(newDivision);
    setSelectedTemplate(null);
    setShowFillingMode(false);
    setChatMessages([]);
    setGeneratedOrder(null);
    setEditableData({});
  };

  const handleTemplateSelect = (template: (typeof templates)[0]) => {
    setSelectedTemplate(template);
    setShowFillingMode(false);
    setGeneratedOrder(null);
    setEditableData({});
  };

  const handleStartFilling = () => {
    setShowFillingMode(true);
    setChatMessages([
      {
        role: "assistant",
        content: `I'm ready to help you fill out the **${selectedTemplate?.name}** template.\n\n• **Upload documents** to extract information automatically\n• **Tell me the details** directly (e.g., "Plaintiff is John Smith")\n• **Say "demo"** to fill with sample data\n• **Say "generate"** when ready to create the order`,
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = { role: "user" as const, content: inputMessage };
    setChatMessages((prev) => [...prev, userMessage]);
    const messageContent = inputMessage;
    setInputMessage("");
    setIsProcessing(true);

    const lower = messageContent.toLowerCase();

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (lower.includes("demo") || lower.includes("sample")) {
      setEditableData(DEMO_DATA);
      setGeneratedOrder(generateHtmlPreview(DEMO_DATA));

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've filled in the **${selectedTemplate?.name}** with sample data:\n\n• **Plaintiff:** ${DEMO_DATA.plaintiff_name}\n• **Defendant:** ${DEMO_DATA.defendant_name}\n• **Matter No:** ${DEMO_DATA.matter_number}\n\nYou can download the preview or edit the fields.`,
        },
      ]);
    } else if (
      lower.includes("generate") ||
      lower.includes("create") ||
      lower.includes("preview")
    ) {
      const finalData = { ...DEMO_DATA, ...editableData };
      setGeneratedOrder(generateHtmlPreview(finalData));
      setEditableData(finalData);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I've generated the court order! You can:\n\n• **Download as DOCX** - Get a proper Word document\n• **Download as PDF** - Get a PDF version\n\nThe document follows the official County Court of Victoria format.",
        },
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I understand you want to work on this order.\n\n**You can:**\n• Provide party names, matter number, court location\n• Say **"demo"** to fill with sample data\n• Say **"generate"** when ready to create the order.`,
        },
      ]);
    }

    setIsProcessing(false);
  };

  const generateHtmlPreview = (data: Record<string, string>) => {
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; max-width: 700px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 16px; letter-spacing: 2px;">COUNTY COURT OF VICTORIA</h2>
          <p style="margin: 10px 0 0 0; font-size: 14px;">AT ${data.location || "MELBOURNE"}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${data.list || "GENERAL LIST"}</p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <strong>No. ${data.matter_number || "CI-XX-XXXXX"}</strong>
        </div>
        
        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding: 10px 0;"><strong>${data.plaintiff_name || "[Plaintiff Name]"}</strong></td>
            <td style="width: 20%; text-align: center; vertical-align: top; padding: 10px 0;">Plaintiff</td>
          </tr>
          <tr>
            <td colspan="2" style="text-align: center; padding: 10px 0;">— and —</td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 10px 0;"><strong>${data.defendant_name || "[Defendant Name]"}</strong></td>
            <td style="text-align: center; vertical-align: top; padding: 10px 0;">Defendant</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000;">
          <h3 style="margin: 0; font-size: 18px; letter-spacing: 1px;">CONSENT ORDER</h3>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Date of Document:</strong> ${data.document_date || "[Date]"}</p>
          <p><strong>Filed on behalf of:</strong> ${data.filing_party || "[Party]"}</p>
          <p><strong>Prepared by:</strong> ${data.preparer_name || "[Firm Name]"}</p>
          <p style="padding-left: 100px;">${data.preparer_address || "[Address]"}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <p><strong>BEFORE:</strong> ${data.before_judge || "The Registrar"}</p>
          <p><strong>DATE OF ORDER:</strong> ${data.date_of_order || "[Date]"}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <h4 style="margin-bottom: 15px;">THE COURT ORDERS THAT:</h4>
          <div style="white-space: pre-line; line-height: 1.8;">${data.orders || "[Orders will appear here]"}</div>
        </div>
        
        <div style="margin-top: 50px;">
          <p><strong>DATED:</strong> ${data.dated || "[Date]"}</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 80px;">
          <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #000; padding-top: 10px;">
              <p style="margin: 0; font-size: 12px;">${data.plaintiff_solicitor_firm || "[Plaintiff's Solicitors]"}</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">Plaintiff's Solicitors</p>
            </div>
          </div>
          <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #000; padding-top: 10px;">
              <p style="margin: 0; font-size: 12px;">${data.defendant_solicitor_firm || "[Defendant's Solicitors]"}</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">Defendant's Solicitors</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditableData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    setGeneratedOrder(generateHtmlPreview(editableData));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-14 z-30 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/protected/chat">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/20">
                <Scale className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Court Orders
                </h1>
                <p className="text-sm text-slate-400">
                  Victorian court document templates
                </p>
              </div>
            </div>
          </div>

          {/* Division Toggle */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-800/50 p-1">
            <button
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                division === "common-law"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
              onClick={() => handleDivisionChange("common-law")}
            >
              <Scale className="h-4 w-4" />
              Common Law
            </button>
            <button
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                division === "commercial"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
              onClick={() => handleDivisionChange("commercial")}
            >
              <Building2 className="h-4 w-4" />
              Commercial
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container grid gap-6 px-4 py-8 lg:grid-cols-2">
        {/* Left Panel - Template Selection & Chat */}
        <div className="space-y-6">
          {/* Template Selection */}
          {!selectedTemplate && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">
                  Select a Template
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose a court order template to get started
                </p>
              </div>

              <div className="grid gap-3">
                {displayTemplates.map((template) => (
                  <motion.button
                    key={template.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left transition-all",
                      "hover:border-indigo-500/50 hover:bg-slate-800"
                    )}
                    onClick={() => handleTemplateSelect(template)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20">
                      <FileText className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{template.name}</h3>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {template.description}
                      </p>
                      <span className="mt-1 inline-block rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                        {template.category}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </motion.button>
                ))}
              </div>

              {!showAllTemplates &&
                templates.length > popularTemplates.length && (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/30 py-3 text-sm text-slate-400 hover:text-white"
                    onClick={() => setShowAllTemplates(true)}
                  >
                    Show all {templates.length} templates
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
            </motion.div>
          )}

          {/* Template Preview (Before Filling) */}
          {selectedTemplate && !showFillingMode && (
            <div className="space-y-6">
              <button
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                onClick={() => setSelectedTemplate(null)}
              >
                ← Back to templates
              </button>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <span className="font-medium text-white">
                    {selectedTemplate.name}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white">
                  About this template
                </h3>
                <p className="mb-6 text-slate-400">
                  {selectedTemplate.description}
                </p>

                <div className="mb-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <h4 className="mb-3 font-medium text-slate-300">
                    What you&apos;ll need
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      Case number and parties&apos; names
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      Court location
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      Specific orders sought
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      Supporting documents (optional)
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={handleStartFilling}
                  className="w-full bg-indigo-600 hover:bg-indigo-500"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Fill Out Template
                </Button>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {selectedTemplate && showFillingMode && (
            <div className="flex h-[calc(100vh-16rem)] flex-col rounded-xl border border-slate-700 bg-slate-800/50">
              {/* Chat Header */}
              <div className="border-b border-slate-700 p-4">
                <button
                  className="mb-2 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                  onClick={() => {
                    setShowFillingMode(false);
                    setChatMessages([]);
                    setGeneratedOrder(null);
                  }}
                >
                  ← Back to templates
                </button>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">
                    {selectedTemplate.name}
                  </span>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-b border-slate-700 p-4">
                <div
                  className={cn(
                    "rounded-lg border-2 border-dashed p-4 text-center transition-all",
                    uploadedFiles.length > 0
                      ? "border-indigo-500/50 bg-indigo-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  )}
                >
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      e.target.files &&
                      setUploadedFiles(Array.from(e.target.files))
                    }
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex cursor-pointer flex-col items-center gap-2"
                  >
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {uploadedFiles.length > 0
                        ? `${uploadedFiles.length} file(s) selected`
                        : "Drop documents or click to upload"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "mb-4 flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3",
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-700 text-slate-200"
                      )}
                    >
                      <div
                        className="prose prose-sm prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isProcessing && (
                  <motion.div
                    className="mb-4 flex gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-700 p-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-slate-600 text-slate-300"
                    onClick={() => {
                      const finalData = { ...DEMO_DATA, ...editableData };
                      setGeneratedOrder(generateHtmlPreview(finalData));
                      setEditableData(finalData);
                    }}
                    disabled={isProcessing}
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate
                  </Button>
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Enter matter details..."
                    className="min-h-[44px] resize-none border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-500"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50">
          {selectedTemplate ? (
            <div className="flex h-full flex-col">
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <span className="font-medium text-white">Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Save className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      disabled={!generatedOrder}
                      className="border-slate-600 text-slate-300"
                    >
                      <Edit3 className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!generatedOrder}
                    className="border-slate-600 text-slate-300"
                  >
                    <FileDown className="mr-1 h-3 w-3" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    disabled={!generatedOrder}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    DOCX
                  </Button>
                  <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                    <button
                      onClick={() => setPreviewZoom((z) => Math.max(0.6, z - 0.1))}
                      className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-xs text-slate-400">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setPreviewZoom((z) => Math.min(1.5, z + 0.1))}
                      className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto bg-white p-4">
                {generatedOrder ? (
                  isEditing ? (
                    <div className="space-y-4 p-4">
                      <h3 className="font-bold text-gray-900">Edit Fields</h3>
                      {Object.entries(editableData).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-gray-700">
                            {key.replace(/_/g, " ")}
                          </Label>
                          {key === "orders" ? (
                            <Textarea
                              value={value}
                              onChange={(e) =>
                                handleFieldChange(key, e.target.value)
                              }
                              rows={4}
                              className="mt-1"
                            />
                          ) : (
                            <Input
                              type="text"
                              value={value}
                              onChange={(e) =>
                                handleFieldChange(key, e.target.value)
                              }
                              className="mt-1"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: "top left",
                      }}
                      dangerouslySetInnerHTML={{ __html: generatedOrder }}
                    />
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <Scale className="mb-4 h-16 w-16 text-slate-300" />
                    <h3 className="text-lg font-medium text-gray-500">
                      Court Order Preview
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Fill out the template to see a preview here
                    </p>
                  </div>
                )}
              </div>

              {/* Template Badge */}
              {generatedOrder && (
                <div className="border-t border-slate-700 p-3">
                  <span className="rounded bg-indigo-600/20 px-2 py-1 text-xs font-medium text-indigo-400">
                    {selectedTemplate.name}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Scale className="mb-4 h-16 w-16 text-slate-600" />
              <h3 className="text-lg font-medium text-slate-400">
                Court Order Preview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Select a template from the left to get started
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

