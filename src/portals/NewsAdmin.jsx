import { useEffect, useState } from "react";

export default function NewsAdmin({ api }) {
  const [articles, setArticles] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let alive = true;
    api("/api/staff/news")
      .then((data) => { if (alive) setArticles(data.articles); })
      .catch((loadError) => { if (alive) setError(loadError.message); });
    return () => { alive = false; };
  }, [api]);

  const refresh = async () => {
    setError("");
    setFeedback("");
    setRefreshing(true);
    try {
      const { added, failed } = await api("/api/staff/news/refresh", { method: "POST" });
      const { articles: latest } = await api("/api/staff/news");
      setArticles(latest);
      setFeedback(`${added} nouvel${added > 1 ? "s" : ""} article${added > 1 ? "s" : ""}.${failed.length ? ` Flux indisponible : ${failed.join(", ")}.` : ""}`);
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggle = async (article) => {
    setError("");
    try {
      await api(`/api/staff/news/${article.id}`, { method: "PATCH", body: JSON.stringify({ hidden: !article.hidden }) });
      setArticles((current) => current.map((item) => item.id === article.id ? { ...item, hidden: !article.hidden } : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  return <section className="portal-panel">
    <div className="portal-panel-heading">
      <div><span className="portal-eyebrow">VEILLE FERROVIAIRE</span><h3>Actualités</h3></div>
      <button className="portal-primary-button portal-add-job" type="button" onClick={refresh} disabled={refreshing}>{refreshing ? "Actualisation…" : "Actualiser les flux"}</button>
    </div>
    <p className="portal-muted portal-permission-note">Les flux sont relus automatiquement toutes les heures. Un article masqué n’apparaît plus sur le site.</p>
    {error && <p className="portal-alert error" role="alert">{error}</p>}
    {feedback && <p className="portal-alert success" role="status">{feedback}</p>}
    {articles === null && !error && <p className="portal-empty" role="status">Chargement…</p>}
    {articles?.length === 0 && <p className="portal-empty">Aucun article pour le moment.</p>}
    {articles?.length > 0 && <div className="portal-table-wrap">
      <table className="portal-table">
        <thead><tr><th>Titre</th><th>Source</th><th>Date</th><th>Visibilité</th></tr></thead>
        <tbody>{articles.map((article) => <tr key={article.id}>
          <td><a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">{article.title}</a></td>
          <td>{article.sourceName}</td>
          <td>{new Date(article.publishedAt).toLocaleDateString("fr-FR")}</td>
          <td><button className="portal-text-button" type="button" onClick={() => toggle(article)}>{article.hidden ? "Afficher" : "Masquer"}</button></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
