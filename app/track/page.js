"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteNavbar from "@/components/SiteNavbar";

export default function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const router = useRouter();

  const submit = (e) => {
    e.preventDefault();
    if (orderId.trim()) router.push(`/order/${orderId.trim()}`);
  };

  return (
    <>
      <SiteNavbar />
      <main className="container py-5" style={{ maxWidth: 480 }}>
        <h4 className="mb-3">Track your order</h4>
        <p className="text-muted">
          Enter the order ID from your confirmation link. It's the code shown right after you placed the order.
        </p>
        <form onSubmit={submit} className="d-flex gap-2">
          <input
            className="form-control"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button className="btn btn-coffee">Track</button>
        </form>
      </main>
    </>
  );
}
