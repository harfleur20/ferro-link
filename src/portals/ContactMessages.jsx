import { useEffect, useState } from "react";

export default function ContactMessages({ api }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api("/api/staff/contact-messages")
      .then((data) => { if (alive) setMessages(data.messages); })
      .catch((loadError) => { if (alive) setError(loadError.message); });
    return () => { alive = false; };
  }, [api]);

  const markRead = async (message) => {
    setError("");
    try {
      await api(`/api/staff/contact-messages/${message.id}/read`, { method: "PATCH" });
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  return <section className="portal-panel">
    <div className="portal-panel-heading"><div><span className="portal-eyebrow">FORMULAIRE DE CONTACT</span><h3>Messages reçus</h3></div></div>
    {error && <p className="portal-alert error" role="alert">{error}</p>}
    {messages === null && !error && <p className="portal-empty" role="status">Chargement…</p>}
    {messages?.length === 0 && <p className="portal-empty">Aucun message pour le moment.</p>}
    {messages?.map((message) => <article className={`portal-notification contact-message ${message.readAt ? "" : "is-unread"}`} key={message.id}>
      <div>
        <strong>{message.subject}</strong>
        <small>{message.name} · <a href={`mailto:${message.email}`}>{message.email}</a> · {new Date(message.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</small>
        <p>{message.message}</p>
      </div>
      {!message.readAt && <button className="portal-text-button" type="button" onClick={() => markRead(message)}>Marquer comme lu</button>}
    </article>)}
  </section>;
}
