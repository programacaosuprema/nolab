import React, { useState } from "react";
import StudentProfileModal from "../modals/StudentProfileModal";
import { useAuth } from "../../autenticator/useAuth";
import { useTheme } from "../../theme/useTheme";

const actionButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 16px", // px-4 py-1.5
  borderRadius: "12px", // rounded-lg
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s",
};

export default function ProfileButton() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Perfil"
        style={{
          ...actionButtonStyle,
          ackground: theme.card,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          cursor: "pointer"
        }}
      >
        {`👤 ${user?.nickname ?? "Perfil"}`}
      </button>

      <StudentProfileModal
        isOpen={open}
        onClose={() => setOpen(false)}
        // userProp={user} // opcional: passar explicitamente
      />
    </>
  );
}
