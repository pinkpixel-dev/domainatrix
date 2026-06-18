"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, ExternalLink, HelpCircle, X, ShieldAlert } from "lucide-react";

type HelpWidgetProps = {
  variant: "sidebar" | "header";
};

export function HelpWidget({ variant }: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const modalContent = isOpen && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      <div className="bg-card border border-border w-full max-w-md rounded-lg p-6 relative space-y-5 shadow-xl z-10 animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
            <HelpCircle className="size-5 text-primary" />
            Help & Support
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md hover:bg-muted transition"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Domainatrix is open-source. For setup guides or troubleshooting, reference our documentation or submit bugs on GitHub.
        </p>

        <div className="space-y-3">
          <a
            href="https://domainatrix.xyz"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3.5 hover:bg-muted/40 transition group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="size-5 text-primary group-hover:scale-105 transition duration-150" />
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">Documentation</div>
                <div className="text-xs text-muted-foreground">Setup guides, env vars, FAQs</div>
              </div>
            </div>
            <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition" />
          </a>

          <a
            href="https://github.com/pinkpixel-dev/domainatrix/issues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3.5 hover:bg-muted/40 transition group"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 text-primary group-hover:scale-105 transition duration-150" />
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">Report Issues</div>
                <div className="text-xs text-muted-foreground">Submit bugs, feature requests</div>
              </div>
            </div>
            <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition" />
          </a>
        </div>

        <div className="pt-4 text-center text-xs text-muted-foreground border-t border-border">
          <span>Made with 💖 by </span>
          <a
            href="https://pinkpixel.dev"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            Pink Pixel
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {variant === "sidebar" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer text-left font-normal"
        >
          <HelpCircle className="size-4" aria-hidden="true" />
          Help & Support
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground cursor-pointer md:hidden flex items-center justify-center rounded-md hover:bg-muted"
          aria-label="Help and Support"
        >
          <HelpCircle className="size-5" />
        </button>
      )}

      {isOpen && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
