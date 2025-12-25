"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  Search,
  Plus,
  LoaderCircle,
  Zap,
  Settings,
  ArrowLeft,
  X,
  Save,
  Upload,
  Type,
  GitBranch,
  MessageSquare,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer,
  Play,
  Edit3,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Node types for workflow builder
const NODE_TYPES = [
  { id: "file_upload", name: "File Upload", icon: Upload, description: "Upload documents", category: "Input", color: "#475569" },
  { id: "text_input", name: "Text Input", icon: Type, description: "Ask a question", category: "Input", color: "#334155" },
  { id: "condition", name: "Condition", icon: GitBranch, description: "If/then branch", category: "Logic", color: "#10b981" },
  { id: "bates_stamping", name: "Bates Stamping", icon: FileText, description: "Number documents", category: "eDiscovery", color: "#3b82f6" },
  { id: "text_extraction", name: "Text Extraction", icon: FileText, description: "Extract text/OCR", category: "eDiscovery", color: "#3b82f6" },
  { id: "contract_review", name: "Contract Review", icon: Search, description: "Analyze contracts", category: "Contracts", color: "#f59e0b" },
  { id: "document_summary", name: "Document Summary", icon: MessageSquare, description: "Summarize docs", category: "Analysis", color: "#334155" },
  { id: "legal_research", name: "Legal Research", icon: Search, description: "Research case law", category: "Research", color: "#14b8a6" },
  { id: "generate_report", name: "Generate Report", icon: MessageSquare, description: "Create report", category: "Output", color: "#64748b" },
];

// Workflow templates
const WORKFLOW_TEMPLATES = [
  {
    id: "bates_stamp",
    name: "Bates Stamp Documents",
    description: "Number and stamp documents with Bates numbers for discovery",
    estimated_duration: "2-5 minutes",
    icon: FileText,
    category: "eDiscovery",
    steps: ["file_upload", "bates_stamping"],
  },
  {
    id: "contract_review",
    name: "Contract Review",
    description: "AI-powered contract analysis identifying key terms, obligations, and risks",
    estimated_duration: "2-5 minutes",
    icon: CheckCircle2,
    category: "Contract Review",
    steps: ["file_upload", "contract_review", "generate_report"],
  },
  {
    id: "document_summarization",
    name: "Document Summarization",
    description: "Generate concise summaries of legal documents and case materials",
    estimated_duration: "1-2 minutes",
    icon: MessageSquare,
    category: "Document Analysis",
    steps: ["file_upload", "document_summary"],
  },
  {
    id: "prepare_discovery",
    name: "Prepare for Discovery",
    description: "Complete discovery prep: Bates stamping, text extraction, metadata generation",
    estimated_duration: "5-10 minutes",
    icon: ArrowRight,
    category: "eDiscovery",
    steps: ["file_upload", "text_extraction", "bates_stamping", "generate_report"],
  },
  {
    id: "legal_research",
    name: "Legal Research",
    description: "Research legal questions across case law, statutes, and regulations",
    estimated_duration: "3-10 minutes",
    icon: Zap,
    category: "Research",
    steps: ["text_input", "legal_research", "generate_report"],
  },
];

interface WorkflowNode {
  id: string;
  type: string;
  typeName: string;
  color: string;
  x: number;
  y: number;
  description: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof WORKFLOW_TEMPLATES[0] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);

  // Workflow builder state
  const [workflowName, setWorkflowName] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showNodePicker, setShowNodePicker] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = searchQuery
    ? WORKFLOW_TEMPLATES.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : WORKFLOW_TEMPLATES;

  const handleSelectTemplate = (template: typeof WORKFLOW_TEMPLATES[0]) => {
    setSelectedTemplate(template);
  };

  const handleExecuteWorkflow = async () => {
    if (!selectedTemplate) return;
    setIsExecuting(true);
    setExecutionProgress(0);

    // Simulate workflow execution
    const interval = setInterval(() => {
      setExecutionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExecuting(false);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 500);
  };

  const handleOpenBuilder = (template?: typeof WORKFLOW_TEMPLATES[0]) => {
    if (template) {
      // Convert template steps to nodes
      const templateNodes = template.steps.map((stepId, index) => {
        const nodeType = NODE_TYPES.find((n) => n.id === stepId);
        return {
          id: `node_${index}`,
          type: stepId,
          typeName: nodeType?.name || stepId,
          color: nodeType?.color || "#475569",
          x: 100 + index * 280,
          y: 150,
          description: nodeType?.description || "",
        };
      });

      // Create connections between sequential nodes
      const templateConnections = templateNodes.slice(0, -1).map((node, index) => ({
        id: `conn_${index}`,
        from: node.id,
        to: templateNodes[index + 1].id,
      }));

      setNodes(templateNodes);
      setConnections(templateConnections);
      setWorkflowName(template.name);
    } else {
      setNodes([]);
      setConnections([]);
      setWorkflowName("");
    }
    setShowBuilder(true);
    setSelectedTemplate(null);
  };

  const handleAddNode = (nodeType: typeof NODE_TYPES[0]) => {
    const offset = nodes.length * 50;
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType.id,
      typeName: nodeType.name,
      color: nodeType.color,
      x: 100 + (offset % 300),
      y: 100 + Math.floor(offset / 300) * 150,
      description: nodeType.description,
    };
    setNodes((prev) => [...prev, newNode]);
    setShowNodePicker(false);
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) => prev.filter((c) => c.from !== nodeId && c.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const getNodeIcon = (typeId: string) => {
    return NODE_TYPES.find((t) => t.id === typeId)?.icon || FileText;
  };

  const getConnectionPath = (fromNode: WorkflowNode, toNode: WorkflowNode) => {
    const startX = fromNode.x + NODE_WIDTH;
    const startY = fromNode.y + NODE_HEIGHT / 2;
    const endX = toNode.x;
    const endY = toNode.y + NODE_HEIGHT / 2;
    const controlOffset = Math.min(Math.abs(endX - startX) / 2, 100);
    return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-200">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Workflows</h1>
                <p className="text-sm text-slate-500">Automate your legal tasks</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => handleOpenBuilder()}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {/* Workflow Templates Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template, index) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-lg"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {template.category}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{template.name}</h3>
                <p className="mb-4 text-sm text-slate-500">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {template.estimated_duration}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            );
          })}

          {/* Create Custom Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredTemplates.length * 0.1 }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-all hover:border-purple-400 hover:bg-purple-50"
            onClick={() => handleOpenBuilder()}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="mb-1 font-semibold text-slate-900">Create Custom Workflow</h3>
            <p className="text-sm text-slate-500">Build your own workflow tailored to your needs</p>
          </motion.div>
        </div>

        {/* Selected Template Modal */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                      <selectedTemplate.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h2>
                      <span className="text-sm text-slate-500">{selectedTemplate.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mb-6 text-slate-600">{selectedTemplate.description}</p>

                {/* Workflow Steps */}
                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-medium text-slate-700">Workflow Steps</h3>
                  <div className="space-y-2">
                    {selectedTemplate.steps.map((stepId, index) => {
                      const step = NODE_TYPES.find((n) => n.id === stepId);
                      if (!step) return null;
                      const Icon = step.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: step.color }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{step.name}</div>
                            <div className="text-xs text-slate-500">{step.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Execution Progress */}
                {isExecuting && (
                  <div className="mb-6">
                    <div className="mb-2 flex justify-between text-sm text-slate-600">
                      <span>Executing workflow...</span>
                      <span>{Math.round(executionProgress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${executionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleOpenBuilder(selectedTemplate)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Customize
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={handleExecuteWorkflow}
                    disabled={isExecuting}
                  >
                    {isExecuting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run Workflow
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workflow Builder Modal */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900"
            >
              {/* Builder Header */}
              <header className="flex h-14 items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowBuilder(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-white">Workflow Builder</span>
                </div>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Untitled Workflow"
                  className="w-64 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-center text-sm text-white placeholder:text-slate-400 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 bg-transparent text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={() => setShowBuilder(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1 bg-purple-600 hover:bg-purple-700"
                    disabled={!workflowName.trim()}
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </header>

              {/* Toolbar */}
              <div className="flex h-12 items-center gap-2 border-b border-slate-700 bg-slate-800/50 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => setShowNodePicker(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Step
                </Button>
                <div className="h-6 w-px bg-slate-700" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-xs text-slate-400">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="ml-auto text-sm text-slate-400">
                  {nodes.length} step{nodes.length !== 1 ? "s" : ""} · {connections.length}{" "}
                  connection{connections.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Canvas */}
              <div
                ref={canvasRef}
                className="relative h-[calc(100vh-6.5rem)] overflow-hidden"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)",
                  backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                  backgroundPosition: `${pan.x}px ${pan.y}px`,
                }}
              >
                {/* SVG for connections */}
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                  }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
                    </marker>
                  </defs>
                  {connections.map((conn) => {
                    const fromNode = nodes.find((n) => n.id === conn.from);
                    const toNode = nodes.find((n) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    return (
                      <path
                        key={conn.id}
                        d={getConnectionPath(fromNode, toNode)}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                </svg>

                {/* Nodes */}
                <div
                  className="absolute"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                  }}
                >
                  {nodes.map((node) => {
                    const Icon = getNodeIcon(node.type);
                    return (
                      <div
                        key={node.id}
                        className={`absolute cursor-move rounded-xl border-2 bg-slate-800 p-4 shadow-lg transition-all ${
                          selectedNodeId === node.id
                            ? "border-purple-500 ring-2 ring-purple-500/30"
                            : "border-slate-600 hover:border-slate-500"
                        }`}
                        style={{
                          left: node.x,
                          top: node.y,
                          width: NODE_WIDTH,
                        }}
                        onClick={() => setSelectedNodeId(node.id)}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: node.color }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-white">{node.typeName}</span>
                        </div>
                        <p className="text-sm text-slate-400">{node.description}</p>

                        {/* Delete button */}
                        {selectedNodeId === node.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}

                        {/* Ports */}
                        <div className="absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-500 bg-slate-700" />
                        <div className="absolute right-0 top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-purple-500 bg-purple-600" />
                      </div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setShowNodePicker(true)}
                      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/50 p-8 text-center transition-all hover:border-purple-500 hover:bg-slate-800"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20">
                        <Plus className="h-8 w-8 text-purple-400" />
                      </div>
                      <span className="text-lg font-medium text-white">Add your first step</span>
                      <span className="text-sm text-slate-400">
                        Click to add a legal AI action
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Node Picker Modal */}
              <AnimatePresence>
                {showNodePicker && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50"
                    onClick={() => setShowNodePicker(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-800 p-6 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">Add Step</h3>
                          <p className="text-sm text-slate-400">Choose a legal AI action</p>
                        </div>
                        <button
                          onClick={() => setShowNodePicker(false)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {Object.entries(
                          NODE_TYPES.reduce<Record<string, typeof NODE_TYPES>>((acc, type) => {
                            if (!acc[type.category]) acc[type.category] = [];
                            acc[type.category].push(type);
                            return acc;
                          }, {})
                        ).map(([category, types]) => (
                          <div key={category}>
                            <h4 className="mb-3 text-sm font-medium text-slate-400">{category}</h4>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {types.map((type) => {
                                const Icon = type.icon;
                                return (
                                  <button
                                    key={type.id}
                                    className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-700/50 p-3 text-left transition-all hover:border-purple-500 hover:bg-slate-700"
                                    onClick={() => handleAddNode(type)}
                                  >
                                    <div
                                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                                      style={{ backgroundColor: type.color }}
                                    >
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-white">{type.name}</div>
                                      <div className="text-xs text-slate-400">{type.description}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

