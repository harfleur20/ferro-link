// The browser reports an unreachable server as a raw English TypeError.
export async function serverFetch(...args) {
  try {
    return await fetch(...args);
  } catch (error) {
    if (error instanceof TypeError) throw new Error("Le serveur ne répond pas. Réessayez dans un instant.");
    throw error;
  }
}
