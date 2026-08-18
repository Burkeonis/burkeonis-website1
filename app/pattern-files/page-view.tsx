"use client";

import { useEffect } from "react";
import { trackPatternFilesEvent } from "./analytics";

export default function PatternFilesPageView() {
  useEffect(() => {
    trackPatternFilesEvent("pattern_files_viewed");
  }, []);

  return null;
}
