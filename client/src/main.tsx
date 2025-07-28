import React from "react"
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./app";
import "./core/i18n/config.ts"
import { PageLoader } from "@/core/components/loading";

import "./index.css";

// Register service worker for better performance
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

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
