"use client";

import * as React from "react";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StepIndicator } from "@/components/contract-analyzer/step-indicator";
import { UploadStep } from "@/components/contract-analyzer/upload-step";
import { PlaybookStep } from "@/components/contract-analyzer/playbook-step";
import { AnalyzingStep } from "@/components/contract-analyzer/analyzing-step";
import { ResultsStep } from "@/components/contract-analyzer/results-step";
import type {
  DemoStep,
  DocumentType,
  AnalysisResults,
} from "@/types/contract-analysis";
import type { Playbook } from "@/types/playbook";

export default function ContractAnalyzerPage() {
  const [step, setStep] = React.useState<DemoStep>("upload");
  const [documentType, setDocumentType] =
    React.useState<DocumentType>("contract_of_sale");
  const [documentName, setDocumentName] = React.useState("");
  const [documentFile, setDocumentFile] = React.useState<File | null>(null);
  const [selectedPlaybook, setSelectedPlaybook] =
    React.useState<Playbook | null>(null);
  const [results, setResults] = React.useState<AnalysisResults | null>(null);

  const handleUpload = (file: File | null, docType: DocumentType) => {
    setDocumentType(docType);
    setDocumentFile(file);
    setDocumentName(
      file?.name ||
        (docType === "contract_of_sale"
          ? "Sample Contract of Sale - 42 Example Street, Richmond VIC"
          : "Section 32 Vendor Statement - 42 Example Street, Richmond VIC"),
    );
    setStep("playbook");
  };

  const handlePlaybookContinue = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setStep("analyzing");
  };

  const handlePlaybookBack = () => {
    setStep("upload");
  };

  const handleAnalysisComplete = (analysisResults: AnalysisResults) => {
    setResults(analysisResults);
    setStep("results");
  };

  const handleReset = () => {
    setStep("upload");
    setDocumentType("contract_of_sale");
    setDocumentName("");
    setDocumentFile(null);
    setSelectedPlaybook(null);
    setResults(null);
  };

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Contract Risk Analyzer"
        subtitle="AI-powered red flag detection for Victorian property contracts"
        icon={Shield}
      />

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Step Content */}
      {step === "upload" && <UploadStep onUpload={handleUpload} />}

      {step === "playbook" && (
        <PlaybookStep
          documentType={documentType}
          onBack={handlePlaybookBack}
          onContinue={handlePlaybookContinue}
        />
      )}

      {step === "analyzing" && (
        <AnalyzingStep
          documentType={documentType}
          documentName={documentName}
          playbook={selectedPlaybook ?? undefined}
          onComplete={handleAnalysisComplete}
        />
      )}

      {step === "results" && results && (
        <ResultsStep
          results={results}
          onReset={handleReset}
          documentFile={documentFile}
        />
      )}
    </div>
  );
}
