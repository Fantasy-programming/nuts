import React from "react"
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./app";
import "./core/i18n/config.ts"
import { PageLoader } from "@/core/components/loading";

import "./index.css";

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <React.Suspense fallback={<PageLoader />}>
        <App />
      </React.Suspense>
    </StrictMode>
  );
}
