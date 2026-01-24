import { NextResponse } from "next/server";

/**
 * Health check endpoint for monitoring services.
 * Returns 200 OK if the application is healthy.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
