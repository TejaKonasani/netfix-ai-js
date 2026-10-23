// DIAGNOSTIC catch-all — no imports, to test whether the catch-all registers.
export default function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ ok: true, caught: true, url: req.url }));
}
