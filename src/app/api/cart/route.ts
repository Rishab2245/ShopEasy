import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

interface CartItem {
  cart_id: number;
  total_price: number;
  quantity: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string;
}

export async function GET(request: NextRequest) {
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

    const cartItems = await db.query<CartItem>(`
      SELECT 
        c.id as cart_id,
        c.quantity,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.category,
        p.image_url,
        (p.price * c.quantity) as total_price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [payload.userId]);

    const totalAmount = (cartItems as CartItem[]).reduce((sum: number, item: CartItem) => sum + item.total_price, 0);

    return NextResponse.json({
      cartItems,
      totalAmount,
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.get(
      'SELECT id, stock FROM products WHERE id = ?',
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if item already in cart
    const existingCartItem = await db.get(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [payload.userId, productId]
    );

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      await db.run(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingCartItem.id]
      );
    } else {
      // Add new item to cart
      await db.run(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [payload.userId, productId, quantity]
      );
    }

    return NextResponse.json({
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}