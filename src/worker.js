export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS para permitir peticiones desde el navegador
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // ═══════════════════════════════════════════
    // API: GET /api/ventas → devuelve todas las ventas
    // ═══════════════════════════════════════════
    if (path === '/api/ventas' && request.method === 'GET') {
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM ventas ORDER BY fecha DESC'
        ).all();
        return Response.json(results, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ═══════════════════════════════════════════
    // API: POST /api/ventas → guarda o actualiza una venta
    // ═══════════════════════════════════════════
    if (path === '/api/ventas' && request.method === 'POST') {
      try {
        const v = await request.json();
        await env.DB.prepare(`
          INSERT INTO ventas (
            id, fecha, colaborador, colaboradorEmail, cliente, telefono,
            ubicacion, piso, departamento, cantidad, metodo, referencia,
            montoPagado, nota, conciliado, conciliadoPor, conciliadoFecha,
            notaConciliacion, entregado, entregadoPor, entregadoFecha
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            cliente = excluded.cliente,
            telefono = excluded.telefono,
            ubicacion = excluded.ubicacion,
            piso = excluded.piso,
            departamento = excluded.departamento,
            cantidad = excluded.cantidad,
            metodo = excluded.metodo,
            referencia = excluded.referencia,
            montoPagado = excluded.montoPagado,
            nota = excluded.nota,
            conciliado = excluded.conciliado,
            conciliadoPor = excluded.conciliadoPor,
            conciliadoFecha = excluded.conciliadoFecha,
            notaConciliacion = excluded.notaConciliacion,
            entregado = excluded.entregado,
            entregadoPor = excluded.entregadoPor,
            entregadoFecha = excluded.entregadoFecha
        `).bind(
          v.id, v.fecha || new Date().toISOString(),
          v.colaborador || '', v.colaboradorEmail || '',
          v.cliente || '', v.telefono || '',
          v.ubicacion || '', v.piso || '', v.departamento || '',
          Number(v.cantidad) || 0, v.metodo || '', v.referencia || '',
          Number(v.montoPagado) || 0, v.nota || '',
          v.conciliado ? 1 : 0, v.conciliadoPor || '', v.conciliadoFecha || '',
          v.notaConciliacion || '',
          v.entregado ? 1 : 0, v.entregadoPor || '', v.entregadoFecha || ''
        ).run();
        return Response.json({ ok: true }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ══��════════════════════════════════════════
    // API: DELETE /api/ventas/:id → elimina una venta
    // ═══════════════════════════════════════════
    if (path.startsWith('/api/ventas/') && request.method === 'DELETE') {
      try {
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM ventas WHERE id = ?').bind(id).run();
        return Response.json({ ok: true }, { headers: cors });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: cors });
      }
    }

    // ═══════════════════════════════════════════
    // Cualquier otra ruta → sirve el index.html
    // ═══════════════════════════════════════════
    return env.ASSETS.fetch(request);
  }
};
