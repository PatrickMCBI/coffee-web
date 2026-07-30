"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function SiteNavbar() {
  const { count } = useCart();

  return (
    <nav className="navbar navbar-dark navbar-coffee navbar-expand-lg sticky-top">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold">
          <i className="bi bi-cup-hot-fill me-2"></i>
          Brew &amp; Bean
        </Link>
        <div className="d-flex align-items-center gap-3">
          <Link href="/track" className="nav-link text-white-50">
            Track order
          </Link>
          <Link href="/cart" className="btn btn-coffee position-relative">
            <i className="bi bi-cart3"></i> Cart
            {count > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
