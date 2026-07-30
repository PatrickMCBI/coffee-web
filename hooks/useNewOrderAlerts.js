"use client";

import { useEffect, useRef } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Subscribes to the orders collection and calls onNewOrder(order) for every
 * order that gets created AFTER this hook mounts. Orders that already
 * existed when the listener attaches (the initial snapshot) are ignored,
 * so admins don't get a flood of alerts for old orders on every page load.
 */
export function useNewOrderAlerts(onNewOrder) {
  const isFirstSnapshot = useRef(true);
  const callbackRef = useRef(onNewOrder);
  callbackRef.current = onNewOrder;

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      if (isFirstSnapshot.current) {
        isFirstSnapshot.current = false;
        return;
      }
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          callbackRef.current?.({ id: change.doc.id, ...change.doc.data() });
        }
      });
    });
    return () => unsub();
  }, []);
}
