"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { db } from "@/lib/firebase";
import { ORDER_STATUSES, STATUS_COLORS } from "@/lib/constants";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

function startOfRange(key) {
  const now = new Date();
  if (key === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (key === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (key === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null; // all time
}

function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

function dayKey(d) {
  return d.toISOString().slice(0, 10);
}

export default function AnalyticsTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const from = startOfRange(range);
    return orders.filter((o) => {
      const created = toDate(o.createdAt);
      if (!created) return range === "all" || range === "today"; // brand new order, still pending server timestamp
      if (!from) return true;
      return created >= from;
    });
  }, [orders, range]);

  const revenueOrders = filtered.filter((o) => o.status !== "cancelled");

  const totalRevenue = revenueOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrders = filtered.length;
  const avgOrderValue = revenueOrders.length ? totalRevenue / revenueOrders.length : 0;
  const cancelledCount = filtered.filter((o) => o.status === "cancelled").length;

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
    filtered.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
    });
    return counts;
  }, [filtered]);

  const revenueByDay = useMemo(() => {
    const map = {};
    revenueOrders.forEach((o) => {
      const created = toDate(o.createdAt) || new Date();
      const key = dayKey(created);
      map[key] = (map[key] || 0) + Number(o.total || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, revenue]) => ({
        date: date.slice(5), // MM-DD
        revenue: Number(revenue.toFixed(2)),
      }));
  }, [revenueOrders]);

  const topItems = useMemo(() => {
    const map = {};
    revenueOrders.forEach((o) => {
      (o.items || []).forEach((i) => {
        if (!map[i.name]) map[i.name] = { name: i.name, qty: 0, revenue: 0 };
        map[i.name].qty += i.qty;
        map[i.name].revenue += i.price * i.qty;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [revenueOrders]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "var(--coffee-mid)" }} role="status" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`btn btn-sm rounded-pill ${range === r.key ? "btn-coffee" : "btn-outline-secondary"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Revenue</div>
              <div className="fs-4 fw-bold">₱{totalRevenue.toFixed(2)}</div>
              <div className="text-muted small">excludes cancelled</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Orders</div>
              <div className="fs-4 fw-bold">{totalOrders}</div>
              <div className="text-muted small">{cancelledCount} cancelled</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Avg. order value</div>
              <div className="fs-4 fw-bold">₱{avgOrderValue.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Pending + preparing</div>
              <div className="fs-4 fw-bold">{statusCounts.pending + statusCounts.preparing}</div>
              <div className="text-muted small">needs attention</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title">Revenue over time</h6>
              {revenueByDay.length === 0 ? (
                <div className="text-muted small py-4 text-center">No revenue in this range yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v) => [`₱${v}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#6f4e37" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title">Orders by status</h6>
              <ul className="list-group list-group-flush">
                {ORDER_STATUSES.map((s) => (
                  <li key={s} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className={`badge bg-${STATUS_COLORS[s]} status-badge`}>{s}</span>
                    <span className="fw-semibold">{statusCounts[s]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h6 className="card-title">Top selling items</h6>
          {topItems.length === 0 ? (
            <div className="text-muted small py-4 text-center">No items sold in this range yet.</div>
          ) : (
            <div className="row">
              <div className="col-lg-7">
                <ResponsiveContainer width="100%" height={Math.max(220, topItems.length * 36)}>
                  <BarChart data={topItems} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis type="category" dataKey="name" fontSize={12} width={110} />
                    <Tooltip formatter={(v, key) => (key === "qty" ? [v, "Sold"] : [`₱${v.toFixed(2)}`, "Revenue"])} />
                    <Bar dataKey="qty" fill="#c8a27a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="col-lg-5">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-end">Sold</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((i) => (
                      <tr key={i.name}>
                        <td>{i.name}</td>
                        <td className="text-end">{i.qty}</td>
                        <td className="text-end">₱{i.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
