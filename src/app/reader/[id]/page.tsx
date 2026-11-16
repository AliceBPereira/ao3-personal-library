"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ReaderExperience } from "@/components/reader/ReaderExperience";

export default function ReaderPage() {
  const params = useParams<{ id: string }>();
  const workId = params?.id || "work-1";

  return <ReaderExperience workId={workId} />;
}
