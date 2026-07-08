import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
};

export function requestId(): string {
  return crypto.randomUUID();
}

export function apiOk<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
      meta: {
        requestId: requestId(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status = 500
): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
      meta: {
        requestId: requestId(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}
