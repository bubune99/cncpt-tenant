/**
 * Primitives API
 *
 * CRUD operations for primitives
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loadBuiltInPrimitives } from '@/lib/plugins';

export async function GET() {
  try {
    // Ensure built-in primitives are loaded
    await loadBuiltInPrimitives();

    const primitives = await prisma.primitive.findMany({
      where: { enabled: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        tags: true,
        inputSchema: true,
        builtIn: true,
        timeout: true,
      },
    });

    return NextResponse.json({ primitives });
  } catch (error) {
    console.error('Failed to fetch primitives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch primitives' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      inputSchema,
      handler,
      category,
      tags,
      icon,
      timeout,
    } = body;

    // Validate required fields
    if (!name || !handler) {
      return NextResponse.json(
        { error: 'Name and handler are required' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await prisma.primitive.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A primitive with this name already exists' },
        { status: 409 }
      );
    }

    // Create primitive
    const primitive = await prisma.primitive.create({
      data: {
        name,
        description: description || '',
        inputSchema: inputSchema || { type: 'object', properties: {} },
        handler,
        category: category || 'custom',
        tags: tags || [],
        icon: icon || 'Box',
        timeout: timeout || 30000,
        enabled: true,
        builtIn: false,
      },
    });

    return NextResponse.json({ primitive }, { status: 201 });
  } catch (error) {
    console.error('Failed to create primitive:', error);
    return NextResponse.json(
      { error: 'Failed to create primitive' },
      { status: 500 }
    );
  }
}
