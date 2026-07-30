"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Bootstrap's JS (dropdowns, modals, toasts) needs the DOM, so load it client-side only.
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);
  return null;
}
