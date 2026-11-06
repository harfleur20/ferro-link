export function slugify(title, fallback = "offre") {
  const slug = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").slice(0, 80).replace(/-+$/, "");
  return slug || fallback;
}
