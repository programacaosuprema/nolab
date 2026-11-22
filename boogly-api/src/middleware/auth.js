import jwt from "jsonwebtoken";

/**
 * 🔓 Auth opcional (não quebra se não tiver auth)
 * - tenta cookie primeiro
 * - fallback para Authorization (opcional)
 */
export function optionalAuth(req, res, next) {
  try {
    let token = null;

    //  1. cookie (PRIORIDADE)
    if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    //  2. fallback header (opcional)
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

export function requireAuth(req, res, next) {
  const tokenFromCookie = req.cookies?.access_token;

  const authorization = req.headers.authorization;

  const tokenFromHeader = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;

 /* console.log("[AUTH] Rota:", req.method, req.originalUrl);
  console.log("[AUTH] Cookie presente:", Boolean(tokenFromCookie));
  console.log("[AUTH] Bearer presente:", Boolean(tokenFromHeader));**/

  if (!token) {
    console.log("[AUTH] Token ausente");

    return res.status(401).json({
      error: "Não autenticado",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.id) {
      return res.status(401).json({
        error: "Token sem identificação do usuário",
      });
    }

    req.userId = decoded.id;

    console.log("[AUTH] Autenticação validada");

    return next();
  } catch (err) {
    console.error("[AUTH] Falha JWT:", err.name);

    return res.status(401).json({
      error:
        err.name === "TokenExpiredError"
          ? "Sessão expirada"
          : "Token inválido",
    });
  }
}