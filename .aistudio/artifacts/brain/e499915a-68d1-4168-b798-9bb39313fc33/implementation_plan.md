# Implementation Plan: Visual Design & Copy Refinement

## Objective

Elevate CareLens AI's overall visual polish and typography hierarchy by:
1. **Strengthening Headings & Typography**: Upgrade hero titles, card headings, and section labels with high-contrast, publication-grade typography.
2. **Sharpening Card Borders & Spatial Depth**: Refine card borders, subtle drop shadows, and active hover states across Key Findings, Spatial Inspector, and Overall Score cards.
3. **Polishing Report Hero & Header Layouts**: Enhance `ReportHero.tsx` and `ReportNav.tsx` with clean spacing, elegant status indicators, and prominent primary actions.
4. **Streamlining Copy**: Remove weak or repetitive prose, ensuring every description and recommendation is concise, actionable, and professional.

---

## Targeted Files & Proposed Changes

### 1. `src/components/reports/ReportHero.tsx` & `src/components/reports/ReportNav.tsx`
- Refine hero header layout with clean typographic hierarchy, elevated room title styling, and high-visibility report action buttons (Export PDF, Share, Re-scan).

### 2. `src/components/reports/OverallScoreCard.tsx` & `src/components/reports/KeyFindings.tsx`
- Sharpen card borders (`border-border/80`), refine evidence tag styling, and improve contrast on hazard title headers.
- Enhance spatial relationship chips and evidence badges with crisp contrast and clean layout alignment.

### 3. `src/components/scan/AnalysisWorkspace.tsx`
- Polish the scanning workspace with crisp bounding box overlays, smooth status transitions, and refined visualizer controls.

### 4. `src/pages/OverviewPage.tsx` & `src/pages/ScanPage.tsx`
- Refine section titles, card borders, and primary CTA cards for a cohesive, production-grade experience.

---

## Verification Plan

1. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to verify zero build or TypeScript errors.
2. **Unit Tests**: Run `npx vitest run` to ensure all 13 spatial reasoning and score deduction tests pass.
3. **Visual Verification**: Review the app in the preview browser to confirm crisp typography, clean card borders, and elevated report hero styling.
