import { prisma } from "./db.js";
import { newApplicationTitle, removeApplication } from "./applications.js";
import { newContactMessageTitle } from "./contact.js";

// The privacy page (/confidentialite) announces this duration: change both together.
const retentionMonths = 24;
const purgeInterval = 24 * 60 * 60 * 1000;

export async function purgeExpiredData() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);
  const applications = await prisma.application.findMany({ where: { updatedAt: { lt: cutoff } } });
  for (const application of applications) await removeApplication(application);
  const messages = await prisma.contactMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
  await prisma.notification.deleteMany({ where: { title: { in: [newApplicationTitle, newContactMessageTitle] }, createdAt: { lt: cutoff } } });
  return { applications: applications.length, messages: messages.count };
}

export function scheduleDataPurge() {
  const run = async () => {
    try {
      const { applications, messages } = await purgeExpiredData();
      if (applications || messages) console.log(`Purge : ${applications} candidature(s) et ${messages} message(s) supprimés.`);
    } catch (err) {
      console.error("Purge des données impossible :", err.message);
    }
  };
  setTimeout(run, 10000).unref();
  setInterval(run, purgeInterval).unref();
}
