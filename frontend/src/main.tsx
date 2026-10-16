import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Landing } from "./pages/Landing";
import { Simulation } from "./pages/Simulation";
import { Results } from "./pages/Results";
import { Admin } from "./pages/Admin";
import { LanguageProvider } from "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><LanguageProvider><BrowserRouter><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/join" element={<Landing />} />
    <Route path="/simulation/*" element={<Simulation />} />
    <Route path="/results" element={<Results />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></LanguageProvider></React.StrictMode>
);
