import { useEffect, useState } from "react";
import { FaCircleCheck, FaCircleExclamation, FaXmark } from "react-icons/fa6";

const durations = { success: 4000, error: 8000 };
const maxVisible = 3;
let nextId = 1;
let show = () => {};

export const toast = {
  success: (message) => show(message, "success"),
  error: (message) => show(message, "error"),
};

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const timers = new Set();
    const dismiss = (id) => setItems((current) => current.filter((item) => item.id !== id));
    show = (message, type) => {
      const id = nextId++;
      setItems((current) => [...current.slice(1 - maxVisible), { id, message, type, dismiss: () => dismiss(id) }]);
      timers.add(setTimeout(() => dismiss(id), durations[type]));
    };
    return () => {
      show = () => {};
      timers.forEach(clearTimeout);
    };
  }, []);

  return <div className="portal-toasts">
    {items.map((item) => <div key={item.id} className={`portal-toast ${item.type}`} role={item.type === "error" ? "alert" : "status"}>
      {item.type === "error" ? <FaCircleExclamation aria-hidden="true" /> : <FaCircleCheck aria-hidden="true" />}
      <p>{item.message}</p>
      <button type="button" onClick={item.dismiss} aria-label="Fermer ce message"><FaXmark aria-hidden="true" /></button>
    </div>)}
  </div>;
}
