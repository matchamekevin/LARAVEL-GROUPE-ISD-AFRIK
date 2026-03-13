import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token"); // récupère ton token Sanctum

  useEffect(() => {
    if (token) {
      axios
        .get("http://localhost:8000/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        .then((res) => {
          setNotifications(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [token]);

  return (
    <div style={{ position: "relative" }}>
      {/* Icône cloche */}
      <i className="fas fa-bell"></i>

      {/* Badge rouge avec le nombre de notifications */}
      {notifications.length > 0 && (
        <span
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            background: "red",
            color: "white",
            borderRadius: "50%",
            padding: "4px 8px",
            fontSize: "12px",
          }}
        >
          {notifications.length}
        </span>
      )}

      {/* Liste des notifications */}
      <ul>
        {notifications.map((n) => (
          <li key={n.id}>
            {n.data && n.data.message ? n.data.message : "Notification reçue"}
          </li>
        ))}
      </ul>
    </div>
  );
}
