import "server-only";
import { waitUntil } from "@vercel/functions";

export function runInBackground(work: Promise<unknown>) {
  if (process.env.VERCEL) {
    waitUntil(work);
    return;
  }

  work.catch((error) => {
    console.error("Background pipeline failed", error);
  });
}
