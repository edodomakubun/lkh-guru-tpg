export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM daily_logs ORDER BY tanggal ASC"
      ).all();
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST") {
      const data = await request.json();
      const { tanggal, cp, tp, kls, non_tatap, dok, vol, ket } = data;

      if (!tanggal) {
        return new Response("Tanggal is required", { status: 400, headers: corsHeaders });
      }

      const info = await env.DB.prepare(
        "INSERT INTO daily_logs (tanggal, cp, tp, kls, non_tatap, dok, vol, ket) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(tanggal, cp || "", tp || "", kls || "", non_tatap || "", dok || "", vol || "", ket || "").run();

      return new Response(JSON.stringify({ success: true, info }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("ID required", { status: 400, headers: corsHeaders });

      await env.DB.prepare("DELETE FROM daily_logs WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (e) {
    return new Response(e.message, { status: 500, headers: corsHeaders });
  }
}
