import { Suspense } from "react";
import Results from "../components/Results";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Results />
    </Suspense>
  );
}
