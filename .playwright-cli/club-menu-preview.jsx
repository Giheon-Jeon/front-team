import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ChallengeMenuPreview from "../src/features/signatures/preview/ChallengeMenuPreview.jsx";
import "../src/index.css";
createRoot(document.getElementById("root")).render(<BrowserRouter><ChallengeMenuPreview /></BrowserRouter>);
