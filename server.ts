import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Notion Client
const notionKey = process.env.NOTION_API_KEY?.trim();
const notion = notionKey ? new Client({ auth: notionKey }) : null;

// Email Transporter
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const transporter = (emailUser && emailPass) ? nodemailer.createTransport({
  service: "gmail",
  pool: true, // Use connection pooling
  auth: { user: emailUser, pass: emailPass },
}) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Notion Client
  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  // API Route for Form Submission
  app.post("/api/submit-form", async (req, res) => {
    const data = req.body;

    try {
      // 1. Save to Notion
      let databaseId = process.env.NOTION_DATABASE_ID?.trim();

      if (!notion || !databaseId) {
        throw new Error("Настройки Notion (API Key или Database ID) не найдены в Secrets. Пожалуйста, проверьте настройки.");
      }

      // If a full URL was provided, extract the ID
      if (databaseId.includes("notion.so/")) {
        const parts = databaseId.split("/");
        const lastPart = parts[parts.length - 1];
        // ID is the 32-char string before any query params
        databaseId = lastPart.split("?")[0].split("#")[0];
        // If it's a named URL, the ID is often at the end after a dash
        if (databaseId.includes("-")) {
          const subParts = databaseId.split("-");
          const potentialId = subParts[subParts.length - 1];
          if (potentialId.length === 32) {
            databaseId = potentialId;
          }
        }
      }

      console.log(`Attempting to connect to Notion Database ID: ${databaseId.substring(0, 5)}...`);

      // Prepare Wheel of Life text
      const wheelText = `Колесо баланса:
- Здоровье: ${data.health}/10
- Отношения: ${data.relationships}/10
- Любовь: ${data.love}/10
- Работа: ${data.work}/10
- Финансы: ${data.finances}/10
- Смысл: ${data.meaning}/10
- Отдых: ${data.rest}/10
- Рост: ${data.growth}/10`;

      // Prepare Directions text
      const directionsText = `Что мешает / Цели:
1. Поведение:
   Мешает: ${data.behavior_problem}
   Цель: ${data.behavior_goal}

2. Образ себя:
   Мешает: ${data.self_image_problem}
   Цель: ${data.self_image_goal}

3. Убеждения:
   Мешает: ${data.beliefs_problem}
   Цель: ${data.beliefs_goal}

4. Эмоции:
   Мешает: ${data.state_problem}
   Цель: ${data.state_goal}

5. Объекты:
   Мешает: ${data.objects_problem}
   Цель: ${data.objects_goal}

6. Ситуации:
   Мешает: ${data.situations_problem}
   Цель: ${data.situations_goal}`;

      // Prepare Notion Properties based on screenshots
      const properties: any = {
        "Имя": { title: [{ text: { content: data.name || "" } }] },
        "Email": { email: data.email || null },
        "Телефон": { phone_number: data.phone || null },
        "Дата заполнения": { date: { start: new Date().toISOString() } },
        "Здоровье и энергия": { number: Number(data.health) },
        "Отношения и окружение": { number: Number(data.relationships) },
        "Любовь и близость": { number: Number(data.love) },
        "Работа и самореализация": { number: Number(data.work) },
        "Финансы и ресурсы": { number: Number(data.finances) },
        "Смысл и духовность": { number: Number(data.meaning) },
        "Отдых и удовольствия": { number: Number(data.rest) },
        "Личностный рост": { number: Number(data.growth) },
        "Дополнительные наблюдения": { rich_text: [{ text: { content: data.extra_notes || "" } }] },
        "Факторы-препятствия": { rich_text: [{ text: { content: data.obstacles || "" } }] },
        "Ожидания от специалиста": { rich_text: [{ text: { content: data.expectations || "" } }] },
        "Опыт с психологом": { rich_text: [{ text: { content: data.past_experience || "" } }] },
        "Как узнали": { rich_text: [{ text: { content: data.referral_source || "" } }] },
        "Самостоятельное решение": { checkbox: Boolean(data.self_decision) },
        "Нет противопоказаний": { checkbox: Boolean(data.no_contraindications) },
        "Нет зависимостей": { checkbox: Boolean(data.no_addictions) },
        "Наблюдение у врача": { rich_text: [{ text: { content: data.doctor_note || "" } }] },
        "Примечание о состоянии": { rich_text: [{ text: { content: data.mental_state_note || "" } }] },
        "Поведение: проблема": { rich_text: [{ text: { content: data.behavior_problem || "" } }] },
        "Поведение: цель": { rich_text: [{ text: { content: data.behavior_goal || "" } }] },
        "Образ себя: проблема": { rich_text: [{ text: { content: data.self_image_problem || "" } }] },
        "Образ себя: цель": { rich_text: [{ text: { content: data.self_image_goal || "" } }] },
        "Убеждения: проблема": { rich_text: [{ text: { content: data.beliefs_problem || "" } }] },
        "Убеждения: цель": { rich_text: [{ text: { content: data.beliefs_goal || "" } }] },
        "Состояние: проблема": { rich_text: [{ text: { content: data.state_problem || "" } }] },
        "Состояние: цель": { rich_text: [{ text: { content: data.state_goal || "" } }] },
        "Реакции на объекты: проблема": { rich_text: [{ text: { content: data.objects_problem || "" } }] },
        "Реакции на объекты: цель": { rich_text: [{ text: { content: data.objects_goal || "" } }] },
        "Реакции на ситуации: проблема": { rich_text: [{ text: { content: data.situations_problem || "" } }] },
        "Реакции на ситуации: цель": { rich_text: [{ text: { content: data.situations_goal || "" } }] },
      };

      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: properties,
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: { rich_text: [{ text: { content: "Результаты анкеты" } }] },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: wheelText } }],
            },
          },
          {
            object: "block",
            type: "divider",
            divider: {},
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: directionsText } }],
            },
          },
        ],
      });

      // 2. Send Email to Client
      if (transporter) {
        const mailOptions = {
          from: `"Татьяна Налётова" <${emailUser}>`,
          to: data.email,
          subject: "Ваша анкета получена — Копия ваших ответов",
          text: `Здравствуйте, ${data.name}!\n\nБлагодарю вас за заполнение анкеты. Ниже приведена копия ваших ответов.\n\n${wheelText}\n\n${directionsText}\n\nС уважением,\nТатьяна Налётова`,
          html: `
            <div style="font-family: sans-serif; color: #3A2D3C; max-width: 600px; margin: 0 auto; border: 1px solid #E5D5E8; padding: 20px; border-radius: 10px;">
              <h2 style="color: #6B4C6E;">Здравствуйте, ${data.name}!</h2>
              <p>Благодарю вас за доверие и заполнение анкеты. Ваши ответы успешно сохранены и отправлены мне для изучения.</p>
              
              <div style="background-color: #FDFBFD; padding: 15px; border-radius: 8px; border: 1px solid #F3EBF4; margin: 20px 0;">
                <h3 style="color: #6B4C6E; border-bottom: 1px solid #E5D5E8; padding-bottom: 5px;">Колесо баланса</h3>
                <pre style="white-space: pre-wrap; font-family: sans-serif; font-size: 14px; color: #5A4D5C;">${wheelText}</pre>
              </div>

              <div style="background-color: #FDFBFD; padding: 15px; border-radius: 8px; border: 1px solid #F3EBF4; margin: 20px 0;">
                <h3 style="color: #6B4C6E; border-bottom: 1px solid #E5D5E8; padding-bottom: 5px;">Направления работы</h3>
                <pre style="white-space: pre-wrap; font-family: sans-serif; font-size: 14px; color: #5A4D5C;">${directionsText}</pre>
              </div>

              <p>Я внимательно изучу эти данные перед нашей встречей.</p>
              <hr style="border: 0; border-top: 1px solid #E5D5E8; margin: 20px 0;" />
              <p style="font-style: italic; color: #8B6C8E;">С уважением,<br />Татьяна Налётова</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Confirmation email sent to:", data.email);
      }

      res.status(200).json({ message: "Success" });
    } catch (error: any) {
      console.error("Submission Error:", error);
      const errorMessage = error.message || "Error processing submission";
      res.status(500).json({ message: errorMessage, details: error.body || null });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
