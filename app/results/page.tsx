import { Suspense } from "react";
import ResultsNew from "../components/ResultsNew";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResultsNew />
    </Suspense>
  );
}
