import jwt from "jsonwebtoken";

/**
 * 🔓 Auth opcional (não quebra se não tiver auth)
 * - tenta cookie primeiro
 * - fallback para Authorization (opcional)
 */
export function optionalAuth(req, res, next) {
  try {
    let token = null;

    // 🍪 1. cookie (PRIORIDADE)
    if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    // 🔑 2. fallback header (opcional)
    else if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
  } catch (err) {
    req.userId = null;
  }

  next();
}

/**
 * 🔒 Auth obrigatório
 * - aceita cookie OU header
 */
export function requireAuth(req, res, next) {
  const tokenFromHeader = req.headers.authorization?.split(" ")[1];
  const tokenFromCookie = req.cookies?.access_token;

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}
