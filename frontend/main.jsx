import React from "react";
import { createRoot } from "react-dom/client";
import AdminLogin from "./adminLogin.jsx";
import "./style.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminLogin />
  </React.StrictMode>,
);
