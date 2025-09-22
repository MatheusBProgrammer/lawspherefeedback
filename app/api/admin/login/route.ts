import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = 'peter';
const ADMIN_PASSWORD = 'maphumulo321';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Verificar credenciais
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Criar sessão (usando cookie)
      const response = NextResponse.json(
        { success: true, message: 'Login realizado com sucesso' },
        { status: 200 }
      );

      // Definir cookie de sessão que expira em 24 horas
      response.cookies.set('admin-session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Rota para logout
export async function DELETE() {
  const response = NextResponse.json(
    { success: true, message: 'Logout realizado com sucesso' },
    { status: 200 }
  );

  // Remover cookie de sessão
  response.cookies.set('admin-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}

// Rota para verificar sessão
export async function GET(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  
  if (adminSession?.value === 'authenticated') {
    return NextResponse.json({ authenticated: true }, { status: 200 });
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
