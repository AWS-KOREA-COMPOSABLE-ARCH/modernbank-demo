import apiClient from '@/utils/apiClient';
import { getApiMessage } from '@/utils/apiI18n';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, username, password } = body;

    if (!user_id || !username || !password) {
      return NextResponse.json(
        { error: getApiMessage(request, 'api.allFieldsRequired') },
        { status: 400 }
      );
    }

    const response = await apiClient("AUTH", "", "POST", {
      user_id,
      username,
      password
    });

    if (!response?.data) {
      return NextResponse.json(
        { error: getApiMessage(request, 'api.signupFailed') },
        { status: 400 }
      );
    }

    return NextResponse.json(response.data);

  } catch (error: unknown) {
    console.error('[Signup API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : getApiMessage(request, 'api.serverError');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 