"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import SiteNavbar from "@/components/SiteNavbar";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const { addItem } = useCart();

  useEffect(() => {
    const q = query(collection(db, "menuItems"), where("available", "==", true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category || "Other"));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = activeCategory === "All" ? items : items.filter((i) => (i.category || "Other") === activeCategory);

  return (
    <>
      <SiteNavbar />
      <header className="text-center py-5" style={{ background: "linear-gradient(135deg,#3b2418,#6f4e37)" }}>
        <div className="container text-white">
          <h1 className="display-5 fw-bold">Order your coffee, ready when you arrive</h1>
          <p className="lead mb-0">Browse the menu, add to cart, and check out in seconds.</p>
        </div>
      </header>

      <main className="container py-4">
        <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn btn-sm rounded-pill ${activeCategory === cat ? "btn-coffee" : "btn-outline-secondary"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: "var(--coffee-mid)" }} role="status" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="alert alert-secondary text-center">
            No menu items yet. Add some from the <a href="/admin/login">admin panel</a>.
          </div>
        )}

        <div className="row g-4">
          {filtered.map((item) => (
            <div key={item.id} className="col-12 col-sm-6 col-lg-4">
              <div className="card menu-card h-100">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} className="card-img-top" alt={item.name} style={{ height: 180, objectFit: "cover" }} />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light"
                    style={{ height: 180 }}
                  >
                    <i className="bi bi-cup-hot" style={{ fontSize: "3rem", color: "var(--coffee-mid)" }}></i>
                  </div>
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text text-muted small flex-grow-1">{item.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">₱{Number(item.price).toFixed(2)}</span>
                    <button className="btn btn-coffee btn-sm" onClick={() => addItem(item)}>
                      <i className="bi bi-plus-lg"></i> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
