import React from "react";
import { createRoot } from "react-dom/client";
import AdminAnimais from "./adminAnimais.jsx";
import "./style.css"; 

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAnimais />
  </React.StrictMode>,
);