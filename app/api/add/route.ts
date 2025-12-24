import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "API is alive" });
}

export async function POST(request: Request) {
  const { a, b } = await request.json();
  const sum = a + b;

  return NextResponse.json({ sum });
}