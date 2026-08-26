import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleError(error: unknown) {
  console.error(error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Invalid request data",
        errors: error.flatten().fieldErrors,
      },
      {
        status: 400,
      },
    );
  }

  // MongoDB duplicate key error
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11000
  ) {
    return NextResponse.json(
      {
        message: "The request resource already exists",
      },
      {
        status: 409,
      },
    );
  }

  // Unknown / unexpected errors
  return NextResponse.json(
    {
      message: "Internal server error",
    },
    {
      status: 500,
    },
  );
}
