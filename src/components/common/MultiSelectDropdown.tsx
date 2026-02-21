
"use client";

import {
  Award,
  Building,
  Check,
  ChevronRight,
  FileText,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Category Icon Mapping
export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Funding & Investment":
      return <TrendingUp className="h-4 w-4" />;
    case "Policy & Government Schemes":
      return <Building className="h-4 w-4" />;
    case "Technology & Innovation":
      return <Zap className="h-4 w-4" />;
    case "Awards & Recognition":
      return <Award className="h-4 w-4" />;
    case "Launches":
      return <Target className="h-4 w-4" />;
    case "Partnerships":
      return <Users className="h-4 w-4" />;
    case "Success Stories":
      return <FileText className="h-4 w-4" />;
    case "Industry Trends":
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

// Reusable MultiSelectDropdown Component
interface MultiSelectDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allOptionLabel?: string;
}

export const MultiSelectDropdown = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  allOptionLabel = "All",
}: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (value: string) => {
    if (value === allOptionLabel) {
      // If "All" is selected, toggle all options
      if (selectedValues.length === options.length) {
        onChange([]);
      } else {
        onChange([...options]);
      }
    } else {
      // Toggle individual option
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter(v => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    }
  };

  const isAllSelected = selectedValues.length === options.length;
  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === options.length 
      ? `All ${label} (${selectedValues.length})`
      : `${selectedValues.length} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border rounded-lg flex items-center justify-between transition-colors ${
          selectedValues.length > 0
            ? "border-primary bg-primary/5"
            : "border-border bg-white"
        }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm truncate">{displayText}</span>
        </div>
        <ChevronRight 
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 bg-white border border-border rounded-lg shadow-lg overflow-y-auto">
          <div className="p-2 space-y-1">
            {/* "All" option */}
            <button
              type="button"
              onClick={() => handleSelect(allOptionLabel)}
              className={`w-full px-3 py-2 text-left rounded flex items-center justify-between hover:bg-secondary transition-colors ${
                isAllSelected ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <span className="text-sm font-medium">{allOptionLabel}</span>
              {isAllSelected && <Check className="h-4 w-4" />}
            </button>

            <div className="border-t border-border my-1"></div>

            {/* Individual options */}
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2 text-left rounded flex items-center justify-between hover:bg-secondary transition-colors ${
                  selectedValues.includes(option) ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <span className="text-sm truncate">{option}</span>
                {selectedValues.includes(option) && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
