import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { quantity } = await request.json();
    const cartId = await params.id;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    // Verify cart item belongs to user
    const cartItem = await db.get(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [cartId, payload.userId]
    );

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    await db.run(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, cartId]
    );

    return NextResponse.json({
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const cartId = await params.id;

    // Verify cart item belongs to user
    const cartItem = await db.get(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [cartId, payload.userId]
    );

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    await db.run(
      'DELETE FROM cart WHERE id = ?',
      [cartId]
    );

    return NextResponse.json({
      message: 'Cart item removed successfully'
    });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}