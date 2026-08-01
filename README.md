# Psychological Consultation Intake Form / Анкета для подготовки к консультации

[English](#english) | [Русский](#russian)

---

<a name="english"></a>
## 🇬🇧 English Version

Interactive web questionnaire for data collection before the first psychological session. The system automatically analyzes responses using AI (Gemini), saves data to Notion, and sends email notifications.

### 🌟 Key Features

*   **Interactive "Wheel of Life"**: Visual assessment of 8 key life areas.
*   **Deep Direction Analysis**: Collection of "Problem — Goal" pairs across 6 psychological vectors (Behavior, Self-image, Beliefs, etc.).
*   **AI-Powered Analysis**:
    *   **For the Client**: Brief, warm, and supportive message immediately after submission.
    *   **For the Therapist**: Deep professional breakdown of patterns and hidden requests (sent only to you).
*   **Notion Integration**: Automatic creation of a new database row with all responses and analysis.
*   **Email Notifications**:
    *   **To Client**: Copy of their responses and AI support message.
    *   **To Therapist**: Full report with professional AI analysis.
*   **Draft Saving**: Data is saved in the browser (LocalStorage) to prevent loss on accidental refresh.

### 🛠 Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Lucide React.
*   **Backend**: Node.js (Express).
*   **AI**: Google Gemini API (`gemini-3-flash-preview`).
*   **Database**: Notion API.
*   **Email**: Nodemailer (via Gmail App Passwords).

### ⚙️ Environment Variables

To run the project, configure the following variables in **Settings -> Secrets**:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API key (for response analysis). |
| `NOTION_API_KEY` | Notion Internal Integration Token. |
| `NOTION_DATABASE_ID` | Your Notion Database ID. |
| `EMAIL_USER` | Your Gmail address (sender). |
| `EMAIL_PASS` | Gmail App Password. |

### 📋 Notion Setup

1. Create a database in Notion.
2. Add columns with the following types (names must match):
    * `Имя` (Title)
    * `Email` (Email)
    * `AI Анализ` (Rich Text) — for deep analysis.
    * `AI Резюме` (Rich Text) — for client summary.
    * `Здоровье и энергия` (Number) ... and other Wheel areas.
3. Create an integration at [developers.notion.com](https://developers.notion.com) and grant it access to this database.

### 📧 Email Setup (Gmail)

1. Enable 2FA in your Google account.
2. Create an "App Password" in Google security settings.
3. Use this 16-character code in the `EMAIL_PASS` variable.

### 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

<a name="russian"></a>
## 🇷🇺 Русская версия

Интерактивная веб-анкета для сбора данных перед первой психологической сессией. Система автоматически анализирует ответы с помощью ИИ (Gemini), сохраняет данные в Notion и отправляет уведомления на почту.

### 🌟 Основные возможности

*   **Интерактивное «Колесо баланса»**: Визуальная оценка 8 ключевых сфер жизни.
*   **Глубокий анализ направлений**: Сбор пар «Проблема — Цель» по 6 психологическим векторам (Поведение, Образ себя, Убеждения и др.).
*   **Интеллектуальный анализ (AI)**:
    *   **Для клиента**: Краткое, теплое и поддерживающее напутствие сразу после отправки.
    *   **Для психолога**: Глубокий профессиональный разбор паттернов и скрытых запросов (приходит только вам).
*   **Интеграция с Notion**: Автоматическое создание новой строки в базе данных со всеми ответами и анализом.
*   **Email-уведомления**:
    *   **Клиенту**: Копия его ответов и напутствие от ИИ.
    *   **Психологу**: Полный отчет с профессиональным анализом ИИ.
*   **Сохранение черновиков**: Данные сохраняются в браузере (LocalStorage), чтобы клиент не потерял их при случайной перезагрузке.

### 🛠 Технический стек

*   **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion (анимации), Lucide React (иконки).
*   **Backend**: Node.js (Express).
*   **AI**: Google Gemini API (`gemini-3-flash-preview`).
*   **Database**: Notion API.
*   **Email**: Nodemailer (через Gmail App Passwords).

### ⚙️ Настройка окружения (Environment Variables)

Для работы проекта необходимо настроить следующие переменные в разделе **Settings -> Secrets**:

| Переменная | Описание |
| :--- | :--- |
| `GEMINI_API_KEY` | API ключ от Google AI Studio (для анализа ответов). |
| `NOTION_API_KEY` | Internal Integration Token от Notion. |
| `NOTION_DATABASE_ID` | ID вашей базы данных в Notion. |
| `EMAIL_USER` | Ваш Gmail адрес (от которого будут уходить письма). |
| `EMAIL_PASS` | Пароль приложения Gmail (App Password). |

### 📋 Настройка Notion

1. Создайте базу данных в Notion.
2. Добавьте колонки со следующими типами (названия должны совпадать):
   * `Имя` (Title)
   * `Email` (Email)
   * `AI Анализ` (Rich Text) — для глубокого разбора.
   * `AI Резюме` (Rich Text) — для напутствия клиенту.
   * `Здоровье и энергия` (Number) ... и остальные сферы Колеса.
3. Создайте интеграцию на [developers.notion.com](https://developers.notion.com) и дайте ей доступ к этой базе данных.

### 📧 Настройка почты (Gmail)

1. Включите 2FA в вашем Google аккаунте.
2. Создайте «Пароль приложения» (App Password) в настройках безопасности Google.
3. Используйте этот 16-значный код в переменной `EMAIL_PASS`.

### 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробности см. в файле [LICENSE](./LICENSE).

---
*Developed specifically for Tatiana Nalyotova's private practice / Разработано специально для частной практики Татьяны Налётовой.*
