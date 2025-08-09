import { NextRequest, NextResponse } from 'next/server';
import { oasisService } from '@/lib/oasisService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] Retrieving user preferences for:', userId);
    
    const preferences = await oasisService.getUserPreferences(userId);
    
    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('[API] Failed to get user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json(
        { success: false, error: 'User ID and preferences are required' },
        { status: 400 }
      );
    }

    console.log('[API] Storing user preferences for:', userId);
    
    const success = await oasisService.storeUserPreferences({
      ...preferences,
      userId,
      lastUpdated: Date.now()
    });

    if (!success) {
      throw new Error('Failed to store preferences');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Preferences stored securely on Oasis Confidential EVM'
    });
  } catch (error) {
    console.error('[API] Failed to store user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'User ID and updates are required' },
        { status: 400 }
      );
    }

    console.log('[API] Updating user preferences for:', userId);
    
    const success = await oasisService.updateUserPreferences(userId, updates);

    if (!success) {
      throw new Error('Failed to update preferences');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('[API] Failed to update user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] Deleting user preferences for:', userId);
    
    const success = await oasisService.deleteUserPreferences(userId);

    if (!success) {
      throw new Error('Failed to delete preferences');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Preferences deleted successfully'
    });
  } catch (error) {
    console.error('[API] Failed to delete user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete preferences' },
      { status: 500 }
    );
  }
}
