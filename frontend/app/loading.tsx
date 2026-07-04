import { BrandMark } from "@/components/BrandMark";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-white p-5 shadow-line">
        <BrandMark />
        <div className="mt-6 space-y-3">
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-ink/10" />
          <div className="h-3 w-full animate-pulse rounded-full bg-ink/10" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-ink/10" />
        </div>
      </div>
    </main>
  );
}
