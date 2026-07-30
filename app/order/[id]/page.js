"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SiteNavbar from "@/components/SiteNavbar";
import { STATUS_COLORS, ORDER_STATUSES } from "@/lib/constants";

export default function OrderStatusPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(
      doc(db, "orders", id),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setOrder({ id: snap.id, ...snap.data() });
      },
      (err) => console.error(err)
    );
    return () => unsub();
  }, [id]);

  const stepIndex = order ? ORDER_STATUSES.indexOf(order.status) : -1;

  return (
    <>
      <SiteNavbar />
      <main className="container py-4" style={{ maxWidth: 640 }}>
        {notFound && <div className="alert alert-danger">Order not found.</div>}
        {!order && !notFound && (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: "var(--coffee-mid)" }} role="status" />
          </div>
        )}
        {order && (
          <>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 className="mb-0">Order #{order.id.slice(0, 6).toUpperCase()}</h4>
                <div className="text-muted small">Thanks, {order.customerName}!</div>
              </div>
              <span className={`badge bg-${STATUS_COLORS[order.status] || "secondary"} status-badge`}>
                {order.status}
              </span>
            </div>

            {order.status !== "cancelled" && (
              <div className="progress mb-4" style={{ height: 8 }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${((stepIndex + 1) / (ORDER_STATUSES.length - 1)) * 100}%`,
                    backgroundColor: "var(--coffee-mid)",
                  }}
                />
              </div>
            )}

            <div className="card mb-3">
              <ul className="list-group list-group-flush">
                {order.items?.map((i, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>
                      {i.qty} × {i.name}
                    </span>
                    <span>₱{(i.price * i.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="card-footer d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span>₱{Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            {order.notes && (
              <div className="alert alert-light border">
                <strong>Notes:</strong> {order.notes}
              </div>
            )}

            <a href="/" className="btn btn-outline-secondary">
              Back to menu
            </a>
          </>
        )}
      </main>
    </>
  );
}
