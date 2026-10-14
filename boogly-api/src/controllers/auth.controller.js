import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

function setCookie(res, token) {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: true, // 🔥 DEV
    sameSite: "none", // ou "none" se usar HTTPS
    maxAge: 7 * 24 * 3600 * 1000,
    path: "/",
  });
}

const isValidInstitutionalEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) return false;

  const domain = email.toLowerCase().split("@")[1];

  return [
    "acad.ifma.edu.br",
    "ifma.edu.br",
  ].includes(domain);
};

export const authenticate = async (req, res) => {
  try {
    const { email: identifier } = req.body;

    if (!identifier || typeof identifier !== "string") {
      return res.status(400).json({
        error: "Informe seu e-mail institucional ou nickname.",
      });
    }

    const login = identifier.trim().toLowerCase();
    const isEmail = login.includes("@");

    if (isEmail && !isValidInstitutionalEmail(login)) {
      return res.status(400).json({
        error:
          "Utilize seu e-mail institucional @acad.ifma.edu.br ou @ifma.edu.br.",
      });
    }

    const user = isEmail
      ? await User.findOne({ email: login })
      : await User.findOne({
          nickname: { $regex: `^${login}$`, $options: "i" },
        });

    if (!user) {
      if (!isEmail) {
        return res.status(404).json({
          error: "Nickname não encontrado.",
        });
      }

      // Mantém o cadastro automático por e-mail
      const newUser = await User.create({
        email: login,
        nickname: generateNick(),
      });

      const token = jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      setCookie(res, token);

      return res.json({
        user: {
          id: newUser._id,
          nickname: newUser.nickname,
          email: newUser.email,
          guest: false,
        },
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    setCookie(res, token);

    return res.json({
      user: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
        guest: false,
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};
// 🔥 LISTAR USUÁRIOS (debug)
export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// 🔥 GERADOR DE NICK
function generateNick() {
  const roles = ["Convidado", "Player", "Coder"];
  const themes = ["Stack", "Queue", "List", "Node", "Tree"];
  const num = Math.floor(Math.random() * 999);

  return `${roles[Math.floor(Math.random() * roles.length)]}_${themes[Math.floor(Math.random() * themes.length)]}_${num}`;
}

export const loginGuest = async (req, res) => {
  try {
    const nickname = `Visitante_${Date.now().toString().slice(-6)}`;

    const user = await User.create({
      email: `guest_${Date.now()}@guest.com`,
      nickname,
      guest: true,
    });

    const token = jwt.sign(
      { id: user._id, guest: true },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    setCookie(res, token);

    return res.json({
      user: {
        id: user._id,
        nickname: user.nickname,
        guest: true,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    path: "/",
  });

  res.json({ message: "Logout OK" });
};
