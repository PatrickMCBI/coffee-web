"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import OrdersTab from "@/components/admin/OrdersTab";
import MenuTab from "@/components/admin/MenuTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import ToastStack from "@/components/admin/ToastStack";
import { useAuth } from "@/context/AuthContext";
import { useNewOrderAlerts } from "@/hooks/useNewOrderAlerts";
import { playChime } from "@/lib/sound";

const SOUND_KEY = "coffee-shop-admin-sound";

function DashboardInner() {
  const [tab, setTab] = useState("analytics");
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const saved = window.localStorage.getItem(SOUND_KEY);
    if (saved !== null) setSoundEnabled(saved === "1");
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");
      // Playing right on toggle both confirms the change and (as a user
      // gesture) unlocks the AudioContext for later automatic chimes.
      if (next) playChime();
      return next;
    });
  };

  useNewOrderAlerts((order) => {
    const toastId = `${order.id}-${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, order }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 8000);

    if (soundEnabled) playChime();
    setUnreadCount((prev) => (tab === "orders" ? prev : prev + 1));

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("New coffee order", {
        body: `${order.customerName || "A customer"} · ₱${Number(order.total || 0).toFixed(2)}`,
      });
    }
  });

  const goToOrders = () => {
    setTab("orders");
    setUnreadCount(0);
  };

  const selectTab = (t) => {
    setTab(t);
    if (t === "orders") setUnreadCount(0);
  };

  const requestBrowserNotifications = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  return (
    <>
      <nav className="navbar navbar-dark navbar-coffee">
        <div className="container">
          <span className="navbar-brand fw-bold">
            <i className="bi bi-speedometer2 me-2"></i>
            Admin dashboard
          </span>
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <button
              className="btn btn-outline-light btn-sm position-relative"
              onClick={goToOrders}
              title="Go to orders"
            >
              <i className="bi bi-bell-fill"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => {
                toggleSound();
                requestBrowserNotifications();
              }}
              title={soundEnabled ? "Mute new-order sound" : "Unmute new-order sound"}
            >
              <i className={`bi ${soundEnabled ? "bi-volume-up-fill" : "bi-volume-mute-fill"}`}></i>
            </button>
            <span className="text-white-50 small d-none d-sm-inline">{user?.email}</span>
            <button className="btn btn-outline-light btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <ul className="nav nav-pills mb-4">
          <li className="nav-item">
            <button className={`nav-link ${tab === "analytics" ? "active" : ""}`} onClick={() => selectTab("analytics")}>
              Analytics
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "orders" ? "active" : ""}`} onClick={() => selectTab("orders")}>
              Orders
              {unreadCount > 0 && <span className="badge bg-danger rounded-pill ms-2">{unreadCount}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "menu" ? "active" : ""}`} onClick={() => selectTab("menu")}>
              Menu
            </button>
          </li>
        </ul>

        {tab === "analytics" && <AnalyticsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "menu" && <MenuTab />}
      </main>

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} onView={goToOrders} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <AdminGuard>
      <DashboardInner />
    </AdminGuard>
  );
}
