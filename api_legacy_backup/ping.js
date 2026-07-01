export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    route: "/api/ping",
    source: "plain-vercel-function",
    time: new Date().toISOString()
  });
}
