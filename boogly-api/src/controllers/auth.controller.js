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

export const authenticate = async (req, res) => {
  try {
    const { email, nick } = req.body;

    let user = await User.findOne({
      $or: [{ email }, { nickname: email }],
    });

    if (!user) {
      user = await User.create({
        email,
        nickname: nick || generateNick(),
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

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
    return res.status(500).json({ error: err.message });
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
