"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  FolderOpen,
  Hash,
  Layers,
  Zap,
  Upload,
  AlertCircle,
  ChevronRight,
  Calendar,
  FileText,
  HardDrive,
  Clock,
  Play,
  X,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMatters } from "@/hooks/use-matters";
import { cn } from "@/lib/utils";

// Discovery field defaults
const DEFAULT_FIELDS = [
  "Group/Document Type Group",
  "Privileged",
  "Privilege_Basis",
  "Confidential",
  "Secrecy Obligation",
  "Reason_for_Redaction",
  "Reason for Redaction",
  "Redacted",
  "Password_Protected",
  "Placeholder",
  "Document Date and Time",
  "System Created Date and Time",
  "System Last Modified Date and Time",
  "MD5 Hash",
  "IsEmbedded",
  "Conversation ID",
  "Source",
  "Produced by",
  "EDRM-MIH",
];

const AUTO_FIELDS = new Set([
  "Document Date and Time",
  "System Created Date and Time",
  "System Last Modified Date and Time",
  "MD5 Hash",
]);

const STEPS = [
  { id: 1, label: "Source", icon: FolderOpen, description: "Select document source" },
  { id: 2, label: "Bates", icon: Hash, description: "Configure numbering" },
  { id: 3, label: "Fields", icon: Layers, description: "Select metadata" },
  { id: 4, label: "Execute", icon: Zap, description: "Run workflow" },
];

export default function DiscoveryPage() {
  const { matters } = useMatters();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Matter selection
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const selectedMatter = matters.find((m) => m.id === selectedMatterId);

  // Bates config
  const [partyCode, setPartyCode] = useState("TST");
  const [boxNumber, setBoxNumber] = useState("1");
  const [fileNumber, setFileNumber] = useState("1");
  const [startPage, setStartPage] = useState("1");
  const [dateFormat, setDateFormat] = useState("dd mmm yyyy");

  // Fields config
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const [fieldDefaults, setFieldDefaults] = useState<Record<string, string>>({});
  const [generateFinalFiles, setGenerateFinalFiles] = useState(true);

  // Upload state
  const [folderPath, setFolderPath] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Workflow state
  const [workflowComplete, setWorkflowComplete] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const canContinueStep1 = !!selectedMatterId || !!folderPath.trim() || uploadedFiles.length > 0;

  const handleRunDiscovery = async () => {
    setError(null);
    setLoading(true);
    
    // Simulate workflow execution
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setWorkflowComplete(true);
    setLoading(false);
  };

  const batesPreview = `${partyCode}.${boxNumber.padStart(3, "0")}.${fileNumber.padStart(4, "0")}.0001`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-14 z-30 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/protected/chat">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20">
                <FolderOpen className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">eDiscovery Production</h1>
                <p className="text-sm text-slate-400">Bates stamping & metadata generation</p>
              </div>
            </div>
          </div>

          {selectedMatter && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">{selectedMatter.title}</span>
            </div>
          )}
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-slate-700/50 bg-slate-800/30">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, idx) => {
              const isActive = s.id === step;
              const isDone = s.id < step;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center">
                  <motion.button
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                      isActive
                        ? "bg-indigo-600/20 ring-2 ring-indigo-500"
                        : isDone
                        ? "bg-emerald-600/20 cursor-pointer hover:bg-emerald-600/30"
                        : "bg-slate-800/50"
                    )}
                    onClick={() => s.id < step && setStep(s.id)}
                    whileHover={s.id < step ? { scale: 1.02 } : {}}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-slate-400"
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="text-left">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-white" : isDone ? "text-emerald-400" : "text-slate-400"
                        )}
                      >
                        {s.label}
                      </div>
                      <div className="text-xs text-slate-500">{s.description}</div>
                    </div>
                  </motion.button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="mx-2 h-5 w-5 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-4 w-4 text-red-400 hover:text-red-300" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Source Files */}
        {step === 1 && (
          <motion.div
            className="mx-auto max-w-3xl space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20">
                <FolderOpen className="h-8 w-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Document Source</h2>
              <p className="mt-2 text-slate-400">
                Select a matter, upload files, or specify a server folder
              </p>
            </div>

            {/* Matter Selection */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <Label className="mb-2 text-slate-300">Select Matter</Label>
              <Select
                value={selectedMatterId || "none"}
                onValueChange={(v) => setSelectedMatterId(v === "none" ? null : v)}
              >
                <SelectTrigger className="border-slate-600 bg-slate-900 text-white">
                  <SelectValue placeholder="Choose a matter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No matter selected</SelectItem>
                  {matters.map((matter) => (
                    <SelectItem key={matter.id} value={matter.id}>
                      {matter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload Zone */}
            <div
              className={cn(
                "relative rounded-xl border-2 border-dashed p-12 text-center transition-all",
                dragOver
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-600 bg-slate-800/30 hover:border-slate-500"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && setUploadedFiles(Array.from(e.target.files))}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>
              <div className="text-lg font-medium text-slate-300">
                {uploading ? "Uploading..." : "Drop files here"}
              </div>
              <div className="mt-1 text-sm text-slate-500">or click to browse</div>
              {uploading && (
                <div className="mt-4">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-400" />
                </div>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <FileText className="h-4 w-4" />
                  Files selected ({uploadedFiles.length})
                </div>
                <div className="grid gap-2">
                  {uploadedFiles.slice(0, 5).map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                      <span className="ml-auto text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                  {uploadedFiles.length > 5 && (
                    <div className="text-sm text-slate-500">
                      +{uploadedFiles.length - 5} more files
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-sm text-slate-500">or</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            {/* Server Path */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <HardDrive className="h-4 w-4" />
                Server Folder Path
              </div>
              <Input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/path/to/documents"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                Use this if documents already exist on the server
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Bates Numbering */}
        {step === 2 && (
          <motion.div
            className="mx-auto max-w-3xl space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600/20">
                <Hash className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Bates Numbering</h2>
              <p className="mt-2 text-slate-400">
                Configure the naming convention for your production documents
              </p>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-center">
              <div className="text-sm text-cyan-300">Preview:</div>
              <div className="mt-2 font-mono text-2xl font-bold text-white">{batesPreview}</div>
            </div>

            {/* Config Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <Label className="mb-2 block text-slate-300">Party Code</Label>
                <Input
                  type="text"
                  value={partyCode}
                  onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="border-slate-600 bg-slate-900 text-white"
                />
                <p className="mt-1.5 text-xs text-slate-500">e.g., PLT, DEF, TST</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <Label className="mb-2 block text-slate-300">Box Number</Label>
                <Input
                  type="number"
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  min={1}
                  className="border-slate-600 bg-slate-900 text-white"
                />
                <p className="mt-1.5 text-xs text-slate-500">Volume or box identifier</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <Label className="mb-2 block text-slate-300">Starting File #</Label>
                <Input
                  type="number"
                  value={fileNumber}
                  onChange={(e) => setFileNumber(e.target.value)}
                  min={1}
                  className="border-slate-600 bg-slate-900 text-white"
                />
                <p className="mt-1.5 text-xs text-slate-500">First document number</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <Label className="mb-2 block text-slate-300">Starting Page</Label>
                <Input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  min={1}
                  className="border-slate-600 bg-slate-900 text-white"
                />
                <p className="mt-1.5 text-xs text-slate-500">Usually 1</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="border-slate-600 text-slate-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-500">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Field Configuration */}
        {step === 3 && (
          <motion.div
            className="mx-auto max-w-4xl space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20">
                <Layers className="h-8 w-8 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Metadata Fields</h2>
              <p className="mt-2 text-slate-400">
                Select which fields to include in your production tables
              </p>
            </div>

            {/* Date Format & Options */}
            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="w-40 border-slate-600 bg-slate-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd mmm yyyy">DD MMM YYYY</SelectItem>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="dd/mm/yy">DD/MM/YY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={generateFinalFiles}
                  onCheckedChange={setGenerateFinalFiles}
                />
                <span className="text-sm text-slate-300">Generate CSV/DAT files</span>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Export Fields</span>
                <span className="text-sm text-slate-500">{selectedFields.length} selected</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_FIELDS.map((field) => {
                  const isAuto = AUTO_FIELDS.has(field);
                  const isSelected = selectedFields.includes(field);
                  return (
                    <label
                      key={field}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all",
                        isSelected
                          ? "border-indigo-500/50 bg-indigo-500/10"
                          : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleField(field)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border",
                          isSelected
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-slate-600 bg-slate-800"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={cn("flex-1 text-sm", isSelected ? "text-white" : "text-slate-400")}>
                        {field}
                      </span>
                      {isAuto && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                          Auto
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="border-slate-600 text-slate-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-500">
                Review & Execute
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Execute */}
        {step === 4 && (
          <motion.div
            className="mx-auto max-w-3xl space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600/20">
                <Zap className="h-8 w-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Execute Workflow</h2>
              <p className="mt-2 text-slate-400">
                Review your configuration and start the discovery process
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                  <Hash className="h-4 w-4" />
                  Bates Format
                </div>
                <div className="font-mono text-lg font-semibold text-white">{batesPreview}</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                  <Layers className="h-4 w-4" />
                  Metadata Fields
                </div>
                <div className="text-lg font-semibold text-white">{selectedFields.length} fields</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="h-4 w-4" />
                  Date Format
                </div>
                <div className="text-lg font-semibold text-white">{dateFormat.toUpperCase()}</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  Output
                </div>
                <div className="text-lg font-semibold text-white">
                  Excel{generateFinalFiles ? " + CSV/DAT" : ""}
                </div>
              </div>
            </div>

            {/* Execute Button */}
            {!workflowComplete ? (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleRunDiscovery}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-lg hover:from-indigo-500 hover:to-purple-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Run Discovery Workflow
                    </>
                  )}
                </Button>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  Estimated time: 2-10 minutes depending on file count
                </div>
              </div>
            ) : (
              <motion.div
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400">Workflow Complete!</h3>
                <p className="mt-2 text-slate-400">
                  Your discovery documents have been processed successfully.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline" className="border-slate-600 text-slate-300">
                    Download Results
                  </Button>
                  <Link href="/protected/chat">
                    <Button className="bg-indigo-600 hover:bg-indigo-500">
                      Back to Chat
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep(3)} className="border-slate-600 text-slate-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

