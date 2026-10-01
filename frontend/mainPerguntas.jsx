import React from "react";
import { createRoot } from "react-dom/client";
import AdminPerguntas from "./adminPerguntas.jsx";
import "./style.css"; 

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminPerguntas />
  </React.StrictMode>,
);