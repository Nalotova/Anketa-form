import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, X, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";

// ─── CONFIG ───
const SUBMIT_URL = "/api/submit-form";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── DATA ───
const wheelAreas = [
  { key: "health", label: "Здоровье и энергия", hint: "физическое самочувствие, сон, питание, тонус" },
  { key: "relationships", label: "Отношения и окружение", hint: "семья, друзья, значимые люди" },
  { key: "love", label: "Любовь и близость", hint: "романтические отношения, партнёрство, интимность" },
  { key: "work", label: "Работа и самореализация", hint: "карьера, проекты, профессиональный рост" },
  { key: "finances", label: "Финансы и ресурсы", hint: "доход, стабильность, обеспеченность" },
  { key: "meaning", label: "Смысл и духовность", hint: "ценности, ощущение осмысленности жизни" },
  { key: "rest", label: "Отдых и удовольствия", hint: "хобби, радость, восстановление" },
  { key: "growth", label: "Личностный рост", hint: "обучение, развитие, самопознание" },
];

const directions = [
  { key: "behavior", title: "Поведение", hint: "Привычные действия и реакции, которые вам мешают.", example: ["никак не могу начать задуманное", "сразу включаюсь в дело"] },
  { key: "self_image", title: "Образ себя", hint: "Как вы себя воспринимаете и что в этом образе ограничивает.", example: ["считаю себя необщительным человеком", "могу свободно говорить и договариваться"] },
  { key: "beliefs", title: "Убеждения", hint: "Внутренние установки и правила, которые тормозят.", example: ["«я должна соответствовать ожиданиям»", "«я вполне могу быть такой, какая есть»"] },
  { key: "state", title: "Эмоциональное состояние", hint: "Привычные состояния и настроения, отнимающие силы.", example: ["постоянная тревога", "спокойствие и уверенность"] },
  { key: "objects", title: "Реакции на конкретных людей, предметы, явления", hint: "Острые реакции на кого-то или что-то конкретное (человек, животное, предмет, место).", example: ["боюсь собак", "отношусь к ним спокойно"] },
  { key: "situations", title: "Реакции на типичные ситуации", hint: "Ситуации, в которых вы регулярно «проваливаетесь» в нежелательную реакцию.", example: ["паника при конфликтах", "сохраняю спокойствие и могу отстоять позицию"] },
];

export default function App() {
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    health: 5,
    relationships: 5,
    love: 5,
    work: 5,
    finances: 5,
    meaning: 5,
    rest: 5,
    growth: 5,
    extra_notes: "",
    obstacles: "",
    expectations: "",
    past_experience: "",
    referral_source: "",
    self_decision: false,
    no_contraindications: false,
    no_addictions: false,
    chk_doctor: false,
    doctor_note: "",
    chk_mental: false,
    mental_state_note: "",
  });

  const [directionPairs, setDirectionPairs] = useState<any>(
    directions.reduce((acc: any, dir) => {
      acc[dir.key] = [{ problem: "", goal: "" }];
      return acc;
    }, {})
  );

  const [status, setStatus] = useState<"idle" | "loading" | "analyzing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string; detailed: string } | null>(null);
  const [progress, setProgress] = useState(0);

  // Load draft on mount
  useEffect(() => {
    const savedForm = localStorage.getItem("anketa_form_draft");
    const savedPairs = localStorage.getItem("anketa_pairs_draft");
    if (savedForm) {
      try {
        setFormData(JSON.parse(savedForm));
      } catch (e) {
        console.error("Error parsing saved form draft", e);
      }
    }
    if (savedPairs) {
      try {
        setDirectionPairs(JSON.parse(savedPairs));
      } catch (e) {
        console.error("Error parsing saved pairs draft", e);
      }
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    localStorage.setItem("anketa_form_draft", JSON.stringify(formData));
    localStorage.setItem("anketa_pairs_draft", JSON.stringify(directionPairs));
  }, [formData, directionPairs]);

  // Calculate progress
  useEffect(() => {
    let filled = 0;
    let total = 0;

    // Basic fields
    const basicFields = ["name", "email", "phone", "extra_notes", "obstacles", "expectations", "past_experience", "referral_source"];
    basicFields.forEach(f => {
      total++;
      if (formData[f]?.trim()) filled++;
    });

    // Checkboxes
    const checks = ["self_decision", "no_contraindications", "no_addictions"];
    checks.forEach(c => {
      total++;
      if (formData[c]) filled++;
    });

    // Conditional
    if (formData.chk_doctor) {
      total++;
      if (formData.doctor_note?.trim()) filled++;
    }
    if (formData.chk_mental) {
      total++;
      if (formData.mental_state_note?.trim()) filled++;
    }

    // Sliders
    wheelAreas.forEach(a => {
      total++;
      filled++; // Sliders always have a value
    });

    // Directions
    Object.keys(directionPairs).forEach(key => {
      directionPairs[key].forEach((p: any) => {
        total += 2;
        if (p.problem.trim()) filled++;
        if (p.goal.trim()) filled++;
      });
    });

    setProgress(Math.round((filled / total) * 100));
  }, [formData, directionPairs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleDirectionChange = (key: string, index: number, field: "problem" | "goal", value: string) => {
    setDirectionPairs((prev: any) => {
      const newPairs = [...prev[key]];
      newPairs[index] = { ...newPairs[index], [field]: value };
      return { ...prev, [key]: newPairs };
    });
  };

  const addPair = (key: string) => {
    if (directionPairs[key].length >= 5) return;
    setDirectionPairs((prev: any) => ({
      ...prev,
      [key]: [...prev[key], { problem: "", goal: "" }],
    }));
  };

  const removePair = (key: string, index: number) => {
    if (directionPairs[key].length <= 1) return;
    setDirectionPairs((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setStatus("error");
      return;
    }

    setStatus("analyzing");
    setErrorMessage("");

    // 1. Perform AI Analysis
    let analysisResult = { summary: "", detailed: "" };
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const model = genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: "Краткое, теплое и поддерживающее напутствие для клиента (1-2 предложения).",
                },
                detailed: {
                  type: Type.STRING,
                  description: "Профессиональный психологический анализ ответов, выделение ключевых запросов и точек роста (до 1000 знаков).",
                },
              },
              required: ["summary", "detailed"],
            },
            systemInstruction: "Вы — опытный психолог-консультант. Ваша задача — проанализировать ответы клиента в анкете. Составьте два текста: 1) 'summary' — очень краткое, эмпатичное приветствие и поддержка для самого клиента. 2) 'detailed' — глубокий профессиональный анализ для психолога, выделяющий ключевые паттерны, запросы и потенциальные направления работы. Пишите на русском языке. Обращайтесь к клиенту по имени.",
          },
          contents: `Имя клиента: ${formData.name}
          
          Оценки Колеса Баланса:
          ${wheelAreas.map(a => `- ${a.label}: ${formData[a.key]}/10`).join("\n")}
          
          Направления работы (Проблемы и Цели):
          ${Object.keys(directionPairs).map(key => {
            const dir = directions.find(d => d.key === key);
            const pairs = directionPairs[key].filter((p: any) => p.problem.trim() || p.goal.trim());
            if (pairs.length === 0) return "";
            return `${dir?.title}:\n${pairs.map((p: any, i: number) => `  ${i+1}. Проблема: ${p.problem}\n     Цель: ${p.goal}`).join("\n")}`;
          }).filter(Boolean).join("\n\n")}
          
          Дополнительно:
          Препятствия: ${formData.obstacles}
          Ожидания: ${formData.expectations}
          Опыт: ${formData.past_experience}`,
        });

        const response = await model;
        try {
          analysisResult = JSON.parse(response.text || "{}");
          setAiAnalysis(analysisResult);
        } catch (e) {
          console.error("Failed to parse AI response:", e);
          analysisResult = { summary: "Спасибо за ваши ответы!", detailed: response.text || "" };
          setAiAnalysis(analysisResult);
        }
      } catch (aiErr) {
        console.error("AI Analysis failed:", aiErr);
      }
    }

    setStatus("loading");

    // Prepare final data
    const finalData = {
      ...formData,
      ai_analysis: analysisResult.detailed,
      ai_summary: analysisResult.summary,
      ...Object.keys(directionPairs).reduce((acc: any, key) => {
        acc[`${key}_problem`] = directionPairs[key].map((p: any, i: number) => `${i + 1}. ${p.problem}`).join("\n");
        acc[`${key}_goal`] = directionPairs[key].map((p: any, i: number) => `${i + 1}. ${p.goal}`).join("\n");
        return acc;
      }, {}),
    };

    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus("success");
        localStorage.removeItem("anketa_form_draft");
        localStorage.removeItem("anketa_pairs_draft");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMessage(result.message || "Ошибка на сервере");
        throw new Error(result.message || "Server error");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setStatus("error");
      if (!errorMessage) setErrorMessage("Произошла ошибка при отправке. Попробуйте позже.");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#FDFBFD] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full text-center space-y-8"
        >
          <div className="text-6xl text-[#6B4C6E]">✦</div>
          <h2 className="font-serif text-4xl text-[#6B4C6E]">Спасибо, {formData.name}!</h2>
          
          {aiAnalysis && aiAnalysis.summary && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-[#E5D5E8] p-8 rounded-2xl text-left shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit size={80} className="text-[#6B4C6E]" />
              </div>
              <h3 className="font-serif text-xl text-[#6B4C6E] mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-[#C4AACC]" />
                Первое напутствие:
              </h3>
              <div className="text-[#5A4D5C] leading-relaxed whitespace-pre-wrap italic text-lg">
                {aiAnalysis.summary}
              </div>
              <p className="mt-4 text-[10px] text-[#A090A1] uppercase tracking-widest text-right">
                * Сгенерировано ИИ на основе ваших ответов
              </p>
            </motion.div>
          )}

          <div className="space-y-4">
            <p className="text-[#7A6B7D] text-lg">
              Ваша анкета отправлена. Я внимательно её изучу вместе с этим анализом перед нашей встречей.
            </p>
            <p className="italic text-[#8B6C8E] text-xl">— Татьяна Налётова</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFD] text-[#3A2D3C] font-sans selection:bg-[#C4AACC]/30">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#6B4C6E] via-[#C4AACC] to-[#D4A0A8]" />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="sticky top-0 z-50 bg-[#FDFBFD]/80 backdrop-blur-sm py-4 border-b border-[#E5D5E8]">
          <div className="h-1 bg-[#E5D5E8] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#6B4C6E] to-[#D4A0A8]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[10px] text-[#7A6B7D] mt-1 text-right uppercase tracking-wider font-semibold">
            {progress}% заполнено
          </div>
        </div>

        {/* Header */}
        <header className="text-center mb-12 pb-8 border-b border-[#E5D5E8]">
          <h1 className="font-serif text-4xl text-[#6B4C6E] mb-2 leading-tight">
            Анкета для подготовки<br />к первой консультации
          </h1>
          <p className="font-serif italic text-lg text-[#8B6C8E]">
            Татьяна Налётова · Психолог-консультант
          </p>
        </header>

        <section className="bg-[#F3EBF4] rounded-xl p-6 mb-12 border-l-4 border-[#C4AACC] space-y-3 text-sm leading-relaxed">
          <p>Добрый день! Благодарю вас за доверие и решение обратиться за психологической поддержкой.</p>
          <p>Эта анкета поможет мне лучше понять вашу ситуацию ещё до нашей первой встречи, чтобы мы могли использовать время максимально эффективно.</p>
          <p>Заполнение займёт около <strong>15–20 минут</strong>. Здесь нет правильных или неправильных ответов — важна ваша честность с собой.</p>
          <p className="font-semibold text-[#6B4C6E]">Вся информация строго конфиденциальна.</p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-16">
          {/* 01 Contact */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-3 border-b border-[#E5D5E8] pb-2">
              <span className="font-serif text-3xl font-semibold text-[#C4AACC]">01</span>
              <h2 className="font-serif text-2xl font-semibold text-[#6B4C6E]">Контактная информация</h2>
            </div>
            <div className="space-y-4">
              <Field label="Имя *" required>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Как вас зовут?" 
                  className="w-full p-3 border border-[#E5D5E8] rounded-lg focus:ring-2 focus:ring-[#6B4C6E]/10 focus:border-[#C4AACC] outline-none transition-all"
                />
              </Field>
              <Field label="Email *" required>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com" 
                  className="w-full p-3 border border-[#E5D5E8] rounded-lg focus:ring-2 focus:ring-[#6B4C6E]/10 focus:border-[#C4AACC] outline-none transition-all"
                />
              </Field>
              <Field label="Телефон" hint="(необязательно)">
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+49..." 
                  className="w-full p-3 border border-[#E5D5E8] rounded-lg focus:ring-2 focus:ring-[#6B4C6E]/10 focus:border-[#C4AACC] outline-none transition-all"
                />
              </Field>
            </div>
          </section>

          {/* 02 Wheel */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-3 border-b border-[#E5D5E8] pb-2">
              <span className="font-serif text-3xl font-semibold text-[#C4AACC]">02</span>
              <h2 className="font-serif text-2xl font-semibold text-[#6B4C6E]">Удовлетворённость сферами жизни</h2>
            </div>
            <p className="text-sm text-[#7A6B7D]">Оцените от 1 до 10, насколько вы довольны каждой сферой прямо сейчас.</p>
            <div className="grid gap-4">
              {wheelAreas.map(area => (
                <div key={area.key} className="bg-white border border-[#E5D5E8] rounded-xl p-4 hover:border-[#C4AACC] transition-colors">
                  <div className="font-semibold text-[#6B4C6E] text-sm">{area.label}</div>
                  <div className="text-[11px] italic text-[#7A6B7D] mb-3">{area.hint}</div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      name={area.key}
                      value={formData[area.key]}
                      onChange={handleInputChange}
                      className="flex-1 h-1 bg-[#E5D5E8] rounded-full appearance-none cursor-pointer accent-[#6B4C6E]"
                    />
                    <span className="w-8 text-center font-bold text-lg text-[#6B4C6E]">{formData[area.key]}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#7A6B7D] mt-1">
                    <span>1 — низкая</span>
                    <span>10 — высокая</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 03 Directions */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-3 border-b border-[#E5D5E8] pb-2">
              <span className="font-serif text-3xl font-semibold text-[#C4AACC]">03</span>
              <h2 className="font-serif text-2xl font-semibold text-[#6B4C6E]">Что мешает вам жить так, как хочется?</h2>
            </div>
            <p className="text-sm text-[#7A6B7D]">Для каждого направления опишите: что мешает (проблема) и как хотелось бы (цель).</p>
            
            {directions.map(dir => (
              <div key={dir.key} className="bg-white border border-[#E5D5E8] rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-[#6B4C6E]">{dir.title}</h3>
                  <p className="text-xs text-[#7A6B7D] italic">{dir.hint}</p>
                </div>
                <div className="bg-[#F3EBF4] rounded-lg p-3 text-xs text-[#6E6070]">
                  <strong>Пример:</strong> {dir.example[0]} → {dir.example[1]}
                </div>
                <div className="space-y-4">
                  {directionPairs[dir.key].map((pair: any, idx: number) => (
                    <div key={idx} className="relative pt-2 group">
                      <div className="absolute -left-7 top-6 text-[10px] font-bold text-[#C4AACC] w-5 text-center">{idx + 1}</div>
                      {directionPairs[dir.key].length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removePair(dir.key, idx)}
                          className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-[#F5E8EA] text-[#C45B5B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          {idx === 0 && <label className="text-[10px] uppercase tracking-wider font-bold text-[#8B6C8E]">Что мешает</label>}
                          <textarea 
                            value={pair.problem}
                            onChange={(e) => handleDirectionChange(dir.key, idx, "problem", e.target.value)}
                            rows={2}
                            placeholder="Проблема..."
                            className="w-full p-3 text-sm border border-[#E5D5E8] rounded-lg focus:border-[#C4AACC] outline-none resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          {idx === 0 && <label className="text-[10px] uppercase tracking-wider font-bold text-[#8B6C8E]">Как хотелось бы</label>}
                          <textarea 
                            value={pair.goal}
                            onChange={(e) => handleDirectionChange(dir.key, idx, "goal", e.target.value)}
                            rows={2}
                            placeholder="Цель..."
                            className="w-full p-3 text-sm border border-[#E5D5E8] rounded-lg focus:border-[#C4AACC] outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {directionPairs[dir.key].length < 5 && (
                  <button 
                    type="button" 
                    onClick={() => addPair(dir.key)}
                    className="flex items-center gap-2 text-xs text-[#8B6C8E] border border-dashed border-[#C4AACC] rounded-lg px-4 py-2 hover:bg-[#F3EBF4] transition-colors"
                  >
                    <Plus size={14} /> Добавить ещё
                  </button>
                )}
              </div>
            ))}
          </section>

          {/* 04 Open Questions */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-3 border-b border-[#E5D5E8] pb-2">
              <span className="font-serif text-3xl font-semibold text-[#C4AACC]">04</span>
              <h2 className="font-serif text-2xl font-semibold text-[#6B4C6E]">Дополнительные вопросы</h2>
            </div>
            <div className="space-y-6">
              <Field label="Какие внешние или внутренние факторы могут помешать вам достичь цели?">
                <textarea 
                  name="obstacles"
                  value={formData.obstacles}
                  onChange={handleInputChange}
                  rows={3} 
                  className="w-full p-3 border border-[#E5D5E8] rounded-lg outline-none focus:border-[#C4AACC]"
                />
              </Field>
              <Field label="Что вы ожидаете от меня как от специалиста? Что будет для вас признаком, что работа идёт верно?">
                <textarea 
                  name="expectations"
                  value={formData.expectations}
                  onChange={handleInputChange}
                  rows={3} 
                  className="w-full p-3 border border-[#E5D5E8] rounded-lg outline-none focus:border-[#C4AACC]"
                />
              </Field>
              <Field label="Был ли у вас опыт работы с психологом ранее? Если да — что было полезным, а что нет?">
                <textarea 
                  name="past_experience"
                  value={formData.past_experience}
                  onChange={handleInputChange}
                  rows={3} 
                  className="w-full p-3 border border-[#E5D5E8] rounded-lg outline-none focus:border-[#C4AACC]"
                />
              </Field>
              <Field label="Как вы узнали обо мне?">
                <input 
                  type="text" 
                  name="referral_source"
                  value={formData.referral_source}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-[#E5D5E8] rounded-lg outline-none focus:border-[#C4AACC]"
                />
              </Field>
            </div>
          </section>

          {/* 05 Health */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-3 border-b border-[#E5D5E8] pb-2">
              <span className="font-serif text-3xl font-semibold text-[#C4AACC]">05</span>
              <h2 className="font-serif text-2xl font-semibold text-[#6B4C6E]">Важная информация о здоровье</h2>
            </div>
            
            <div className="space-y-2">
              <Checkbox 
                id="self_decision" 
                label="Я самостоятельно принял(а) решение обратиться к психологу (не по настоянию близких)." 
                checked={formData.self_decision}
                onChange={handleInputChange}
              />
              <Checkbox 
                id="no_contraindications" 
                label="У меня нет медицинских противопоказаний к стрессу (беременность, эпилепсия, тяжёлые заболевания, повышенное/пониженное давление)." 
                checked={formData.no_contraindications}
                onChange={handleInputChange}
              />
              <Checkbox 
                id="no_addictions" 
                label="У меня нет зависимостей (алкогольная, наркотическая, игровая)." 
                checked={formData.no_addictions}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-4">
              <Checkbox 
                id="chk_doctor" 
                label="Я сейчас наблюдаюсь у врача или принимаю препараты" 
                checked={formData.chk_doctor}
                onChange={handleInputChange}
              />
              <AnimatePresence>
                {formData.chk_doctor && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#F5E8EA] border-l-4 border-[#D4A0A8] p-4 rounded-r-lg text-sm text-[#6E6070] mb-3">
                      Это не является препятствием для работы — мне просто важно это учитывать.
                    </div>
                    <textarea 
                      name="doctor_note"
                      value={formData.doctor_note}
                      onChange={handleInputChange}
                      placeholder="У какого специалиста наблюдаетесь, какие препараты принимаете..."
                      className="w-full p-3 border border-[#E5D5E8] rounded-lg outline-none focus:border-[#C4AACC] text-sm"
                      rows={2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <Checkbox 
                id="chk_mental" 
                label="У меня бывают мысли о нежелании жить" 
                checked={formData.chk_mental}
                onChange={handleInputChange}
              />
              <AnimatePresence>
                {formData.chk_mental && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#F5E8EA] border-l-4 border-[#D4A0A8] p-4 rounded-r-lg text-sm text-[#6E6070] mb-3">
                      Спасибо за вашу честность. Это не препятствие — это информация, которая поможет мне предложить вам подходящий и безопасный формат работы.
                    </div>
                    <textarea 
                      name="mental_state_note"
                      value={formData.mental_state_note}
                      onChange={handleInputChange}
                      placeholder="Вы можете описать это здесь или обсудить на встрече..."
                      className="w-full p-3 border border-[#E5D5E8] rounded-lg outline-none focus:border-[#C4AACC] text-sm"
                      rows={2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Submit */}
          <div className="pt-12 border-t border-[#E5D5E8] text-center space-y-6">
            <button 
              type="submit" 
              disabled={status === "loading" || status === "analyzing"}
              className="inline-flex items-center justify-center gap-3 bg-[#6B4C6E] hover:bg-[#4E3550] text-white px-12 py-4 rounded-full font-bold text-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#6B4C6E]/20 disabled:bg-[#C4AACC] disabled:cursor-not-allowed"
            >
              {status === "analyzing" ? (
                <>Анализируем ответы... <BrainCircuit className="animate-pulse" /></>
              ) : status === "loading" ? (
                <>Отправляем... <Loader2 className="animate-spin" /></>
              ) : (
                <>Отправить анкету <Sparkles size={18} /></>
              )}
            </button>

            {status === "error" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm"
              >
                {errorMessage || "Произошла ошибка при отправке. Пожалуйста, заполните обязательные поля (Имя, Email) или попробуйте позже."}
              </motion.div>
            )}
          </div>
        </form>

        <footer className="mt-24 text-center text-[10px] text-[#7A6B7D] uppercase tracking-widest">
          Конфиденциально · Татьяна Налётова · Психолог-консультант
        </footer>
      </div>
    </div>
  );
}

function Field({ label, hint, children, required }: any) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">
        {label} {hint && <span className="text-[11px] italic text-[#7A6B7D] font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Checkbox({ id, label, checked, onChange }: any) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F3EBF4]/50 cursor-pointer transition-colors group">
      <div className="relative flex items-center justify-center mt-1">
        <input 
          type="checkbox" 
          id={id} 
          name={id}
          checked={checked}
          onChange={onChange}
          className="peer sr-only" 
        />
        <div className="w-5 h-5 border-2 border-[#C4AACC] rounded-md peer-checked:bg-[#6B4C6E] peer-checked:border-[#6B4C6E] transition-all" />
        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
      <span className="text-sm leading-relaxed text-[#3A2D3C]">{label}</span>
    </label>
  );
}
