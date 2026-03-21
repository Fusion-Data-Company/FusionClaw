"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit, DollarSign, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: any;
  onSave: (value: any) => void;
  type?: "text" | "email" | "tel" | "select" | "multiselect" | "currency" | "date" | "number";
  options?: { value: string; label: string }[];
  className?: string;
  displayValue?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

export default function EditableCell({
  value,
  onSave,
  type = "text",
  options = [],
  className = "",
  displayValue,
  placeholder = "",
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue when the value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    let processedValue = editValue;

    if (type === "currency" || type === "number") {
      processedValue = parseFloat(editValue) || 0;
    }

    // Skip API call if value hasn't actually changed
    if (processedValue === value || String(processedValue).trim() === String(value ?? "").trim()) {
      setIsEditing(false);
      return;
    }

    onSave(processedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const formatDisplayValue = (val: any) => {
    if (displayValue) return displayValue;

    switch (type) {
      case "currency":
        return val ? (
          <span className="font-bold tabular-nums text-success">{parseFloat(val).toLocaleString()}</span>
        ) : (
          <span className="text-text-muted">0</span>
        );
      case "date": {
        if (!val) return "";
        const d = new Date(val);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        let relative = "";
        if (diffDays === 0) relative = "Today";
        else if (diffDays === 1) relative = "1d ago";
        else if (diffDays < 7) relative = `${diffDays}d ago`;
        else if (diffDays < 30) relative = `${Math.floor(diffDays / 7)}w ago`;
        else relative = d.toLocaleDateString();
        return <span className="text-text-muted text-xs">{relative}</span>;
      }
      case "email":
        return val ? (
          <a
            href={`mailto:${val}`}
            className="text-accent hover:text-accent-light transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {val}
          </a>
        ) : (
          ""
        );
      case "tel":
        return val ? (
          <a
            href={`tel:${val}`}
            className="text-cyan hover:text-cyan/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {val}
          </a>
        ) : (
          ""
        );
      case "multiselect":
        return Array.isArray(val) ? (
          <div className="flex flex-wrap gap-1">
            {val.map((item: any, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          ""
        );
      default:
        return val || "";
    }
  };

  // Handle multiselect editing
  if (type === "multiselect") {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-5 w-5 p-0 text-text-muted hover:text-text-primary hover:bg-elevated rounded-full",
                className
              )}
            >
              <Edit className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 bg-surface border-accent/20"
            onClick={(e: any) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <div className="font-medium text-text-primary text-sm">Edit Tags</div>
              <div className="flex flex-wrap gap-1">
                {options.map((option) => {
                  const isSelected = Array.isArray(value) && value.includes(option.value);
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs",
                        isSelected
                          ? "bg-accent/20 text-accent border-accent/30"
                          : "border-border text-text-secondary hover:bg-elevated"
                      )}
                      onClick={() => {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = isSelected
                          ? currentValues.filter((v) => v !== option.value)
                          : [...currentValues, option.value];
                        onSave(newValues);
                      }}
                    >
                      {option.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Handle select editing
  if (type === "select") {
    if (disabled) {
      return (
        <div
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-border",
            className
          )}
        >
          {displayValue || value}
        </div>
      );
    }

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Select value={value} onValueChange={onSave}>
          <SelectTrigger
            className={cn(
              "h-auto p-0 border-none bg-transparent shadow-none hover:brightness-110 [&>svg]:hidden",
              className
            )}
          >
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-border cursor-pointer">
              {displayValue || <SelectValue placeholder={placeholder} />}
            </div>
          </SelectTrigger>
          <SelectContent className="bg-surface border-accent/20 min-w-[160px]">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-xs text-text-secondary hover:bg-elevated hover:text-text-primary cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Handle regular text/input editing
  if (isEditing) {
    return (
      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={inputRef}
          type={type === "currency" ? "number" : type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            // Don't save if clicking the save/cancel buttons
            const related = e.relatedTarget as HTMLElement | null;
            if (related?.closest("[data-editable-action]")) return;
            handleSave();
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-6 text-xs border-accent/30 focus:border-accent px-1"
          placeholder={placeholder}
          step={type === "currency" ? "0.01" : undefined}
          min={type === "currency" ? "0" : undefined}
        />
        <Button
          size="sm"
          variant="ghost"
          data-editable-action="save"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className="h-5 w-5 p-0 text-success hover:text-success/80"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          data-editable-action="cancel"
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="h-5 w-5 p-0 text-error hover:text-error/80"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group rounded transition-colors whitespace-nowrap overflow-hidden text-ellipsis",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-elevated/50",
        className
      )}
      onClick={
        disabled
          ? undefined
          : (e) => {
              e.stopPropagation();
              setIsEditing(true);
            }
      }
      style={{ lineHeight: "20px" }}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          {type === "currency" && <DollarSign className="w-3 h-3 text-success shrink-0" />}
          {type === "email" && <Mail className="w-3 h-3 text-accent shrink-0" />}
          {type === "tel" && <Phone className="w-3 h-3 text-cyan shrink-0" />}
          <span className="truncate">{formatDisplayValue(value)}</span>
        </div>
      </div>
    </div>
  );
}
