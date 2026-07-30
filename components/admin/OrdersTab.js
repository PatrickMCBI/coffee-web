"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ORDER_STATUSES, STATUS_COLORS } from "@/lib/constants";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const setStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {["all", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn btn-sm rounded-pill ${filter === s ? "btn-coffee" : "btn-outline-secondary"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 && <div className="alert alert-secondary">No orders here.</div>}

      <div className="row g-3">
        {visible.map((o) => (
          <div key={o.id} className="col-12 col-md-6 col-xl-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-semibold">{o.customerName}</div>
                    <div className="text-muted small">#{o.id.slice(0, 6).toUpperCase()}</div>
                  </div>
                  <span className={`badge bg-${STATUS_COLORS[o.status] || "secondary"} status-badge`}>{o.status}</span>
                </div>
                <ul className="list-unstyled small mb-2">
                  {o.items?.map((i, idx) => (
                    <li key={idx}>
                      {i.qty} × {i.name}
                    </li>
                  ))}
                </ul>
                {o.notes && <div className="small text-muted mb-2">Note: {o.notes}</div>}
                <div className="fw-bold mb-3">₱{Number(o.total).toFixed(2)}</div>
                <select
                  className="form-select form-select-sm"
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
