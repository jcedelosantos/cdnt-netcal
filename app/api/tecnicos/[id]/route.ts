export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const tecnico = await prisma.tecnico.findFirst({
    where: { id: params.id, userId },
    include: {
      rol: true,
      asignaciones: { include: { project: { select: { id: true, nombre: true, cliente: true } } } },
    },
  });
  if (!tecnico) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(tecnico);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const data = await request.json();
    const existing = await prisma.tecnico.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const updated = await prisma.tecnico.update({
      where: { id: params.id },
      data: {
        nombre: data.nombre ?? existing.nombre,
        codigo: data.codigo !== undefined ? (data.codigo || null) : existing.codigo,
        cedula: data.cedula !== undefined ? (data.cedula || null) : existing.cedula,
        telefono: data.telefono !== undefined ? (data.telefono || null) : existing.telefono,
        email: data.email !== undefined ? (data.email || null) : existing.email,
        direccion: data.direccion !== undefined ? (data.direccion || null) : existing.direccion,
        foto: data.foto !== undefined ? (data.foto || null) : existing.foto,
        rolId: data.rolId !== undefined ? (data.rolId || null) : existing.rolId,
        especialidades: data.especialidades !== undefined ? (data.especialidades || null) : existing.especialidades,
        tarifaDiaria: data.tarifaDiaria !== undefined ? parseFloat(data.tarifaDiaria) : existing.tarifaDiaria,
        tarifaHora: data.tarifaHora !== undefined ? (data.tarifaHora ? parseFloat(data.tarifaHora) : null) : existing.tarifaHora,
        tarifaHoraExtra: data.tarifaHoraExtra !== undefined ? parseFloat(data.tarifaHoraExtra) : existing.tarifaHoraExtra,
        fechaIngreso: data.fechaIngreso !== undefined ? (data.fechaIngreso ? new Date(data.fechaIngreso) : null) : existing.fechaIngreso,
        estado: data.estado ?? existing.estado,
        tipoContratacion: data.tipoContratacion ?? existing.tipoContratacion,
        datosBancarios: data.datosBancarios !== undefined ? (data.datosBancarios || null) : existing.datosBancarios,
        notas: data.notas !== undefined ? (data.notas || null) : existing.notas,
      },
      include: { rol: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar técnico' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const existing = await prisma.tecnico.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  await prisma.tecnico.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
