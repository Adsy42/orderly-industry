"use client";

import * as React from "react";
import { Search, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  IQL_TEMPLATES,
  getTemplatesByCategory,
  type IQLTemplate,
  generateIQLQuery,
} from "@/lib/iql-templates";
import { cn } from "@/lib/utils";

interface IQLTemplateSelectorProps {
  onSelectTemplate: (query: string) => void;
  className?: string;
}

export function IQLTemplateSelector({
  onSelectTemplate,
  className,
}: IQLTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<IQLTemplate | null>(null);
  const [parameterValue, setParameterValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Filter templates by search query
  const filteredTemplates = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return IQL_TEMPLATES;
    }
    const query = searchQuery.toLowerCase();
    return IQL_TEMPLATES.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.displayName.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  // Group by category
  const templatesByCategory = React.useMemo(() => {
    const filtered = filteredTemplates;
    const grouped: Record<string, IQLTemplate[]> = {};
    for (const template of filtered) {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    }
    return grouped;
  }, [filteredTemplates]);

  const handleTemplateSelect = (template: IQLTemplate) => {
    setSelectedTemplate(template);
    setParameterValue("");
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    // Validate parameter if required
    if (selectedTemplate.requiresParameter && !parameterValue.trim()) {
      console.error("Parameter is required for this template");
      return;
    }

    try {
      const query = generateIQLQuery(
        selectedTemplate,
        selectedTemplate.requiresParameter ? parameterValue.trim() : undefined,
      );
      console.log("Applying template query:", query);
      onSelectTemplate(query);
      // Reset selection
      setSelectedTemplate(null);
      setParameterValue("");
    } catch (error) {
      console.error("Error generating query:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to generate query"}`,
      );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label
          htmlFor="template-search"
          className="text-sm font-medium"
        >
          Search Templates
        </label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="template-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Template Categories */}
      {Object.keys(templatesByCategory).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <FileText className="text-muted-foreground mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm">No templates found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div
              key={category}
              className="space-y-2"
            >
              <h3 className="text-sm font-semibold">{category}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((template) => (
                  <Card
                    key={template.name}
                    className={cn(
                      "hover:bg-accent cursor-pointer p-3 transition-colors",
                      selectedTemplate?.name === template.name &&
                        "border-primary bg-accent",
                    )}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium">
                          {template.displayName}
                        </h4>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {template.description}
                        </p>
                        {template.requiresParameter && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Requires: {template.parameterName}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Template with Parameter Input */}
      {selectedTemplate && (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">{selectedTemplate.displayName}</h4>
              <p className="text-muted-foreground mt-1 text-sm">
                {selectedTemplate.description}
              </p>
              <p className="text-muted-foreground mt-2 font-mono text-xs">
                {selectedTemplate.example}
              </p>
            </div>

            {selectedTemplate.requiresParameter && (
              <div className="space-y-2">
                <label
                  htmlFor="template-parameter"
                  className="text-sm font-medium"
                >
                  {selectedTemplate.parameterName}
                </label>
                <Input
                  id="template-parameter"
                  value={parameterValue}
                  onChange={(e) => setParameterValue(e.target.value)}
                  placeholder={`Enter ${selectedTemplate.parameterName}`}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleApplyTemplate}
                disabled={
                  selectedTemplate.requiresParameter && !parameterValue.trim()
                }
                className="flex-1"
              >
                Apply Template
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null);
                  setParameterValue("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export type { IQLTemplateSelectorProps };
