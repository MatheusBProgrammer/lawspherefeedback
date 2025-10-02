import { NextRequest, NextResponse } from "next/server";

// Rate limiting store (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "cmTKxkA9UazmemsiKnaQwPHkVeOl97j1XQscXZqd+7k=";

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const clientIP =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";

    // Rate limiting check
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP);

    if (attempts) {
      // Reset if window has passed
      if (now - attempts.lastAttempt > WINDOW_MS) {
        loginAttempts.set(clientIP, { count: 1, lastAttempt: now });
      } else if (attempts.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          {
            success: false,
            message: "Too many login attempts. Please try again in 15 minutes.",
          },
          { status: 429 }
        );
      } else {
        attempts.count++;
        attempts.lastAttempt = now;
      }
    } else {
      loginAttempts.set(clientIP, { count: 1, lastAttempt: now });
    }

    // Verificar credenciais
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Reset attempts on successful login
      loginAttempts.delete(clientIP);
      // Criar sessão (usando cookie)
      const response = NextResponse.json(
        { success: true, message: "Login successful" },
        { status: 200 }
      );

      // Definir cookie de sessão que expira em 24 horas
      response.cookies.set("admin-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 horas
        path: "/",
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Rota para logout
export async function DELETE() {
  const response = NextResponse.json(
    { success: true, message: "Logout successful" },
    { status: 200 }
  );

  // Remover cookie de sessão
  response.cookies.set("admin-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}

// Rota para verificar sessão
export async function GET(request: NextRequest) {
  const adminSession = request.cookies.get("admin-session");

  if (adminSession?.value === "authenticated") {
    return NextResponse.json({ authenticated: true }, { status: 200 });
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
