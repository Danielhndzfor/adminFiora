import { NextResponse } from "next/server";

// Version actual del PWA - increment when deploying
const PWA_VERSION = "1.0.1";
const BUILD_TIMESTAMP = new Date().getTime();

export async function GET() {
  return NextResponse.json(
    {
      version: PWA_VERSION,
      timestamp: BUILD_TIMESTAMP,
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
