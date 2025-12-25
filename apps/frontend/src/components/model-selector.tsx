"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Star,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getModelBranding,
  getStarredModels,
  getMainModels,
  getAllProviders,
  getModelsByProvider,
  searchModels,
  getModelTags,
  MODEL_BRANDING,
  type ModelBranding,
} from "@/lib/models-config";

// Re-export MODEL_BRANDING for use in other components
export { MODEL_BRANDING };

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

function ModelLogo({
  modelId,
  size = 18,
}: {
  modelId: string;
  size?: number;
}) {
  const branding = getModelBranding(modelId);
  const [imgError, setImgError] = useState(false);

  // If we have a logo path and no error loading it, show the logo
  if (branding.logo && !imgError) {
    return (
      <span
        className="flex items-center justify-center rounded-md overflow-hidden"
        style={{
          width: size,
          height: size,
          background: branding.bgColor,
        }}
      >
        <img
          src={branding.logo}
          alt={branding.name}
          width={size * 0.75}
          height={size * 0.75}
          className="object-contain"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  // Fallback to icon/letter
  return (
    <span
      className="flex items-center justify-center rounded-md font-semibold"
      style={{
        width: size,
        height: size,
        background: branding.bgColor,
        color: branding.color,
        fontSize: size * 0.6,
      }}
    >
      {branding.fallbackIcon}
    </span>
  );
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
  compact = false,
  className,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedProviders, setCollapsedProviders] = useState<Record<string, boolean>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentBranding = getModelBranding(selectedModel);

  const starredModels = useMemo(() => getStarredModels(), []);
  const allProviders = useMemo(() => getAllProviders(), []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelectModel = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const toggleProvider = (provider: string) => {
    setCollapsedProviders((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition-all",
          "hover:bg-gray-50 hover:border-gray-300",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && "ring-2 ring-primary/20",
          compact ? "px-2 py-1.5" : "px-3 py-2"
        )}
      >
        <ModelLogo modelId={selectedModel} size={compact ? 14 : 18} />
        <span className={cn("text-gray-700", compact && "text-xs")}>
          {currentBranding.shortName}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl border bg-white shadow-xl"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search */}
            <div className="border-b p-2">
              <div className="relative flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Model List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery ? (
                // Search Results
                (() => {
                  const results = searchModels(searchQuery);
                  if (results.length === 0) {
                    return (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No models found
                      </div>
                    );
                  }
                  return results.map((model) => (
                    <ModelOption
                      key={model.id}
                      modelId={model.id}
                      isSelected={selectedModel === model.id}
                      onSelect={handleSelectModel}
                    />
                  ));
                })()
              ) : (
                <>
                  {/* Featured Models */}
                  {starredModels.length > 0 && (
                    <div className="mb-2">
                      <div className="mb-1 flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <Star className="h-3 w-3 text-amber-500" />
                        Recommended
                      </div>
                      {starredModels.map((model) => (
                        <ModelOption
                          key={model.id}
                          modelId={model.id}
                          isSelected={selectedModel === model.id}
                          onSelect={handleSelectModel}
                        />
                      ))}
                    </div>
                  )}

                  {/* Provider Groups */}
                  {allProviders.map((provider) => {
                    const providerModels = getModelsByProvider(provider).filter(
                      (m) => !starredModels.some((sm) => sm.id === m.id)
                    );

                    if (providerModels.length === 0) return null;
                    const isCollapsed = collapsedProviders[provider];

                    return (
                      <div key={provider} className="mb-1">
                        <button
                          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50"
                          onClick={() => toggleProvider(provider)}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          <span>{provider}</span>
                          <span className="ml-auto text-gray-400">
                            {providerModels.length}
                          </span>
                        </button>

                        {!isCollapsed && (
                          <div className="ml-2">
                            {providerModels.map((model) => (
                              <ModelOption
                                key={model.id}
                                modelId={model.id}
                                isSelected={selectedModel === model.id}
                                onSelect={handleSelectModel}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModelOption({
  modelId,
  isSelected,
  onSelect,
}: {
  modelId: string;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}) {
  const branding = getModelBranding(modelId);
  const tags = getModelTags(modelId);

  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-gray-700 hover:bg-gray-50"
      )}
      onClick={() => onSelect(modelId)}
    >
      <ModelLogo modelId={modelId} size={18} />
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {branding.shortName}
          </span>
          {tags.map((tag) => (
            <span
              key={tag.label}
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                color: tag.color,
                backgroundColor: tag.bgColor,
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
        <span className="truncate text-xs text-gray-500">
          {branding.provider}
        </span>
      </div>
      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

export default ModelSelector;

