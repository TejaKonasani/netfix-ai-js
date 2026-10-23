// Diagnostic endpoint — confirms the api/ serverless routing works.
export default function ping(req, res) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      ok: true,
      msg: "api routing works",
      path: req.url,
      vercel: process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
    })
  );
}