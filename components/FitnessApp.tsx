"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Activity, ArrowLeft, ArrowRight, BarChart3, Check, ChevronRight, CircleUserRound, Clock3, Dumbbell, Flame, HeartPulse, LogIn, LogOut, Menu, Play, Plus, Search, Utensils, UserRound, X } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import type { AppData, BodyRecord, Exercise, NutritionPlan, Program, WorkoutLog } from "@/lib/types";

type Tab = "Workout" | "Program" | "Analyse" | "Profile";
const groups = ["ทั้งหมด", "อก", "ไหล่", "หลัง", "ขา", "แขน"];
const exerciseLibrary = [
  { name: "Pec Deck Fly", group: "อก" }, { name: "Incline Dumbbell Press", group: "อก" }, { name: "Smith Machine Bench Press", group: "อก" },
  { name: "Dumbbell Shoulder Press", group: "ไหล่" }, { name: "Lateral Raise", group: "ไหล่" }, { name: "Lat Pulldown", group: "หลัง" },
  { name: "Cable Row", group: "หลัง" }, { name: "Leg Curl", group: "ขา" }, { name: "Squat", group: "ขา" }, { name: "Biceps Curl", group: "แขน" },
];
const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const weekdayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
const weekdayShortNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseLocalDate = (value: string) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day, 12); };
const startOfCalendarWeek = (date: Date) => { const start = new Date(date); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); return start; };
const makeExercise = (name: string, group: string, n = 3): Exercise => ({ id: id(), name, group, sets: Array.from({ length: n }, (_, i) => ({ id: id(), weight: i === 0 ? 10 : i === 1 ? 12 : 18, reps: i < 2 ? 8 : 12, done: false })) });
const starterProgram: Program = { id: "starter-upper", name: "Upper", source: "สำเร็จรูป" as Program["source"], goal: "สร้างกล้ามเนื้อ", createdAt: new Date().toISOString(), exercises: [makeExercise("Pec Deck Fly", "อก"), makeExercise("Smith Machine Incline Bench Press", "อก"), makeExercise("Lat Pulldown", "หลัง"), makeExercise("Cable Row", "หลัง"), makeExercise("Shoulder Press", "ไหล่")] };
const seed: AppData = { programs: [starterProgram], bodyRecords: [{ id: "seed-body", date: new Date().toISOString().slice(0, 10), weight: 60, height: 170, muscle: 50, fat: 20 }], nutritionPlans: [] };
type MealTemplate = { name: string; suggestion: string; share: number };
const mealTemplates: Record<string, MealTemplate[]> = {
  "สมดุล": [
    { name: "มื้อเช้า", suggestion: "ข้าวโอ๊ตหรือข้าวกล้อง + ไข่/โยเกิร์ต + ผลไม้", share: 0.35 },
    { name: "มื้อกลางวัน", suggestion: "ข้าวกล้อง + ไก่/ปลา/เต้าหู้ + ผักครึ่งจาน", share: 0.4 },
    { name: "มื้อเย็น", suggestion: "ปลา/เต้าหู้/ไข่ + ผัก และข้าวตามเวลาฝึก", share: 0.25 },
  ],
  "คีโต": [
    { name: "มื้อเช้า", suggestion: "ไข่ + เต้าหู้/ปลา + ผักใบเขียวและถั่ว", share: 0.35 },
    { name: "มื้อกลางวัน", suggestion: "ไก่/ปลา + สลัดหรือผักไม่แป้ง + ไขมันไม่อิ่มตัว", share: 0.4 },
    { name: "มื้อเย็น", suggestion: "ปลา/ไข่/เต้าหู้ + ผักไม่แป้ง ลดข้าวและน้ำหวาน", share: 0.25 },
  ],
  "IF": [
    { name: "มื้อแรกในช่วงกิน", suggestion: "โปรตีน + ข้าวไม่ขัดสี/มัน + ผักหรือผลไม้", share: 0.45 },
    { name: "มื้อที่สองในช่วงกิน", suggestion: "โปรตีน + ผัก + คาร์บให้พอกับเวลาฝึก", share: 0.55 },
  ],
  "ไขมันต่ำ": [
    { name: "มื้อเช้า", suggestion: "ข้าวโอ๊ต + นมไขมันต่ำ/ไข่ + ผลไม้", share: 0.35 },
    { name: "มื้อกลางวัน", suggestion: "ข้าวกล้อง + ปลา/เนื้อไม่ติดมัน + ผัก ลดของทอด", share: 0.4 },
    { name: "มื้อเย็น", suggestion: "ปลา/อกไก่/เต้าหู้ + ผัก และคาร์บตามเวลาฝึก", share: 0.25 },
  ],
  "คาร์โบไฮเดรตต่ำ · เน้นโปรตีน": [
    { name: "มื้อเช้า", suggestion: "ไข่/โยเกิร์ตกรีก/เต้าหู้ + ผักและผลไม้ส่วนพอดี", share: 0.35 },
    { name: "มื้อกลางวัน", suggestion: "ไก่/ปลา/เต้าหู้ + ผักครึ่งจาน + ข้าวส่วนพอดี", share: 0.4 },
    { name: "มื้อเย็น", suggestion: "ปลา/ไก่/เต้าหู้ + ผัก เพิ่มคาร์บเมื่อมีฝึก", share: 0.25 },
  ],
};

type PlanExercise = { name: string; group: string; sets: number; reps: number };
type PlanSession = { label: string; focus: string; exercises: PlanExercise[] };
type CuratedPlan = { id: string; category: string; name: string; schedule: string; level: string; sourceName: string; sourceUrl: string; sessions: PlanSession[] };
const ex = (name: string, group: string, sets: number, reps: number): PlanExercise => ({ name, group, sets, reps });
const curatedPlans: CuratedPlan[] = [
  { id: "sbd-beginner", category: "Powerlifting", name: "SBD Beginner Base", schedule: "3 วัน/สัปดาห์ · ฝึกทั้งตัว", level: "เริ่มต้น", sourceName: "BarBend — Beginner Program", sourceUrl: "https://barbend.com/beginners-guide-to-the-gym/", sessions: [
    { label: "จันทร์", focus: "Squat + bench", exercises: [ex("Back Squat","ขา",3,5),ex("Bench Press","อก",3,5),ex("Lat Pulldown","หลัง",2,8),ex("Lunge","ขา",2,12)] },
    { label: "พุธ", focus: "Press + row", exercises: [ex("Barbell Row","หลัง",3,6),ex("Dip","อก",3,8),ex("Overhead Press","ไหล่",3,8),ex("Back Extension","หลัง",2,12)] },
    { label: "ศุกร์", focus: "Deadlift + squat", exercises: [ex("Deadlift","ขา",2,5),ex("Front Squat","ขา",3,6),ex("Dumbbell Pullover","หลัง",2,8),ex("Triceps Extension","แขน",2,12),ex("Cable Crunch","หน้าท้อง",2,12)] },
  ] },
  { id: "sbd-frequency", category: "Powerlifting", name: "SBD Frequency Plan", schedule: "4 วัน/สัปดาห์ · เน้นท่าหลัก", level: "กลาง", sourceName: "Calgary Barbell — 16 Week Program (หลักการฝึก)", sourceUrl: "https://www.calgarybarbell.com/16-week-program", sessions: [
    { label: "จันทร์", focus: "Squat + bench", exercises: [ex("Back Squat","ขา",3,5),ex("Bench Press","อก",4,5),ex("Barbell Row","หลัง",3,8)] },
    { label: "อังคาร", focus: "Bench + deadlift", exercises: [ex("Bench Press","อก",4,5),ex("Deadlift","ขา",3,5),ex("Lat Pulldown","หลัง",3,8)] },
    { label: "พฤหัส", focus: "Squat + bench volume", exercises: [ex("Back Squat","ขา",3,6),ex("Bench Press","อก",3,6),ex("Overhead Press","ไหล่",3,8)] },
    { label: "เสาร์", focus: "Deadlift + bench technique", exercises: [ex("Deadlift","ขา",3,4),ex("Paused Bench Press","อก",3,5),ex("Romanian Deadlift","ขา",2,8)] },
  ] },
  { id: "sbs-strength", category: "Powerlifting", name: "Linear Strength Builder", schedule: "3 วัน/สัปดาห์ · เพิ่มแรงทีละขั้น", level: "เริ่มต้น–กลาง", sourceName: "Stronger By Science — Program Bundle", sourceUrl: "https://www.strongerbyscience.com/program-bundle/", sessions: [
    { label: "จันทร์", focus: "Squat + bench", exercises: [ex("Back Squat","ขา",3,5),ex("Bench Press","อก",3,5),ex("Barbell Row","หลัง",3,8)] },
    { label: "พุธ", focus: "Deadlift + press", exercises: [ex("Deadlift","ขา",3,5),ex("Overhead Press","ไหล่",3,6),ex("Lat Pulldown","หลัง",3,8)] },
    { label: "ศุกร์", focus: "Squat + bench volume", exercises: [ex("Front Squat","ขา",3,6),ex("Incline Bench Press","อก",3,8),ex("Romanian Deadlift","ขา",3,8)] },
  ] },
  { id: "body-upper-lower", category: "Bodybuilding", name: "Upper / Lower Bodybuilding", schedule: "4 วัน/สัปดาห์ · บน/ล่าง", level: "เริ่มต้น–กลาง", sourceName: "Muscle & Strength — Upper/Lower 4 Day", sourceUrl: "https://www.muscleandstrength.com/workouts/upper-lower-4-day-gym-bodybuilding-workout", sessions: [
    { label: "จันทร์", focus: "Upper A · อก หลัง ไหล่ แขน", exercises: [ex("Bench Press","อก",3,8),ex("Barbell Row","หลัง",3,8),ex("Seated Overhead Dumbbell Press","ไหล่",3,10),ex("Pec Deck","อก",2,11),ex("Lat Pulldown","หลัง",2,11),ex("Lateral Raise","ไหล่",2,12),ex("Cable Triceps Extension","แขน",3,10),ex("Cable Curl","แขน",3,10)] },
    { label: "อังคาร", focus: "Lower A · ขาและหน้าท้อง", exercises: [ex("Squat","ขา",3,9),ex("Stiff-Leg Deadlift","ขา",3,10),ex("Standing Calf Raise","ขา",3,12),ex("Leg Extension","ขา",2,11),ex("Leg Curl","ขา",2,11),ex("Cable Crunch","หน้าท้อง",3,11)] },
    { label: "พฤหัส", focus: "Upper B · อก หลัง ไหล่ แขน", exercises: [ex("Incline Dumbbell Bench Press","อก",3,10),ex("Rack Deadlift","หลัง",3,6),ex("Military Press","ไหล่",3,10),ex("Machine Chest Press","อก",2,10),ex("Machine Row","หลัง",2,10),ex("Dumbbell Curl","แขน",3,10),ex("Machine Triceps Dip","แขน",3,10)] },
    { label: "ศุกร์", focus: "Lower B · ขาและแกนกลาง", exercises: [ex("Leg Press","ขา",3,15),ex("Dumbbell Stiff-Leg Deadlift","ขา",3,10),ex("Leg Press Calf Raise","ขา",3,12),ex("Hack Squat","ขา",2,10),ex("Seated Leg Curl","ขา",2,11),ex("Plank","หน้าท้อง",3,30)] },
  ] },
  { id: "body-drop5", category: "Bodybuilding", name: "Drop 5 Mass Split", schedule: "4 วัน/สัปดาห์ · เพิ่มน้ำหนักเป็นรอบ", level: "กลาง", sourceName: "Muscle & Strength — Drop 5 Four Day Split", sourceUrl: "https://www.muscleandstrength.com/workouts/drop-5-system-4-day-workout", sessions: [
    { label: "จันทร์", focus: "Lower A", exercises: [ex("Deadlift","ขา",4,6),ex("Leg Press","ขา",4,17),ex("Leg Curl","ขา",4,13),ex("Seated Calf Raise","ขา",4,16),ex("Plank","หน้าท้อง",4,30)] },
    { label: "อังคาร", focus: "Upper A", exercises: [ex("Bench Press","อก",4,8),ex("Upright Row","ไหล่",4,10),ex("Pull-Up","หลัง",4,10),ex("Close-Grip Bench Press","แขน",4,10),ex("EZ Bar Curl","แขน",4,11)] },
    { label: "พฤหัส", focus: "Lower B", exercises: [ex("Squat","ขา",4,8),ex("Leg Extension","ขา",4,13),ex("Stiff-Leg Deadlift","ขา",4,8),ex("Leg Press Calf Raise","ขา",4,17),ex("Cable Crunch","หน้าท้อง",4,17)] },
    { label: "ศุกร์", focus: "Upper B", exercises: [ex("Military Press","ไหล่",3,8),ex("Barbell Row","หลัง",4,10),ex("Incline Dumbbell Bench Press","อก",4,11),ex("Cable Triceps Extension","แขน",4,12),ex("Dumbbell Curl","แขน",4,11)] },
  ] },
  { id: "body-classic", category: "Bodybuilding", name: "Classic 4-Day Body-Part Split", schedule: "4 วัน/สัปดาห์ · แยกกลุ่มกล้ามเนื้อ", level: "กลาง–สูง", sourceName: "Muscle & Strength — 4 Day Bodybuilding Split", sourceUrl: "https://www.muscleandstrength.com/workouts/22-4-day-split-bodybuilding-split-routine.html", sessions: [
    { label: "จันทร์", focus: "Quads + biceps", exercises: [ex("Squat","ขา",4,9),ex("Hack Squat","ขา",4,9),ex("Dumbbell Step-Up","ขา",3,10),ex("Chin-Up","หลัง",4,10),ex("Incline Dumbbell Curl","แขน",3,8),ex("Hammer Curl","แขน",3,8)] },
    { label: "อังคาร", focus: "Chest + calves", exercises: [ex("Incline Dumbbell Bench Press","อก",4,9),ex("Chest Dip","อก",4,10),ex("Cable Crossover","อก",4,12),ex("Flat Dumbbell Fly","อก",4,10),ex("Seated Calf Raise","ขา",4,8),ex("Standing Calf Raise","ขา",3,15)] },
    { label: "พฤหัส", focus: "Hamstrings + back", exercises: [ex("Stiff-Leg Deadlift","ขา",4,9),ex("Leg Curl","ขา",4,12),ex("Underhand Barbell Row","หลัง",4,9),ex("Lat Pulldown","หลัง",4,10),ex("One-Arm Dumbbell Row","หลัง",4,10)] },
    { label: "ศุกร์", focus: "Shoulders + triceps", exercises: [ex("Barbell Shoulder Press","ไหล่",4,9),ex("Dumbbell Upright Row","ไหล่",4,9),ex("Reverse Raise","ไหล่",4,9),ex("Shrug","ไหล่",4,9),ex("Bench Dip","แขน",4,10),ex("Triceps Extension","แขน",3,8)] },
  ] },
  { id: "hyper-fullbody", category: "Hepertrophy", name: "Full Body Hypertrophy Starter", schedule: "3 วัน/สัปดาห์ · เว้นวันพัก", level: "เริ่มต้น", sourceName: "Muscle & Strength — High-Frequency Starter", sourceUrl: "https://www.muscleandstrength.com/articles/high-frequency-training", sessions: [
    { label: "จันทร์", focus: "Squat, press & pull", exercises: [ex("Barbell Back Squat","ขา",3,8),ex("Leg Curl","ขา",3,10),ex("Incline Bench Press","อก",3,10),ex("Wide-Grip Pull-Up","หลัง",3,10),ex("Dumbbell Upright Row","ไหล่",3,10),ex("Standing Barbell Curl","แขน",3,10)] },
    { label: "พุธ", focus: "Single-leg, hinge & upper body", exercises: [ex("Bulgarian Split Squat","ขา",3,9),ex("Dumbbell Romanian Deadlift","ขา",3,10),ex("Flat Dumbbell Press","อก",3,10),ex("Bent-Over Barbell Row","หลัง",3,10),ex("Seated Dumbbell Press","ไหล่",3,10),ex("Incline Dumbbell Curl","แขน",3,10)] },
    { label: "ศุกร์", focus: "Leg press, hinge, press & pull", exercises: [ex("Leg Press","ขา",3,9),ex("Barbell Romanian Deadlift","ขา",3,10),ex("Incline Dumbbell Press","อก",3,10),ex("T-Bar Row","หลัง",3,10),ex("Dumbbell Side Lateral Raise","ไหล่",3,10),ex("Lying Triceps Extension","แขน",3,10)] },
  ] },
  { id: "hyper-upper-lower", category: "Hepertrophy", name: "Upper / Lower Hypertrophy", schedule: "4 วัน/สัปดาห์ · บน/ล่าง", level: "เริ่มต้น–กลาง", sourceName: "Muscle & Strength — Upper/Lower 4 Day", sourceUrl: "https://www.muscleandstrength.com/workouts/upper-lower-4-day-gym-bodybuilding-workout", sessions: [
    { label: "จันทร์", focus: "Upper A", exercises: [ex("Bench Press","อก",3,10),ex("Barbell Row","หลัง",3,10),ex("Shoulder Press","ไหล่",3,10),ex("Pec Deck","อก",2,12),ex("Lat Pulldown","หลัง",2,12),ex("Cable Curl","แขน",3,12)] },
    { label: "อังคาร", focus: "Lower A", exercises: [ex("Squat","ขา",3,10),ex("Romanian Deadlift","ขา",3,10),ex("Leg Extension","ขา",2,12),ex("Leg Curl","ขา",2,12),ex("Calf Raise","ขา",3,15)] },
    { label: "พฤหัส", focus: "Upper B", exercises: [ex("Incline Dumbbell Press","อก",3,10),ex("Machine Row","หลัง",3,10),ex("Lateral Raise","ไหล่",3,12),ex("Chest Press","อก",2,12),ex("Triceps Extension","แขน",3,12)] },
    { label: "ศุกร์", focus: "Lower B", exercises: [ex("Leg Press","ขา",3,12),ex("Stiff-Leg Deadlift","ขา",3,10),ex("Hack Squat","ขา",2,10),ex("Seated Leg Curl","ขา",2,12),ex("Cable Crunch","หน้าท้อง",3,12)] },
  ] },
  { id: "sbs-novice-hypertrophy", category: "Hepertrophy", name: "Novice Hypertrophy Builder", schedule: "3 วัน/สัปดาห์ · เพิ่ม reps/น้ำหนัก", level: "เริ่มต้น / กลับมาฝึกใหม่", sourceName: "Stronger By Science — Program Bundle", sourceUrl: "https://www.strongerbyscience.com/program-bundle/", sessions: [
    { label: "จันทร์", focus: "Squat + bench + accessories", exercises: [ex("Back Squat","ขา",3,8),ex("Bench Press","อก",3,8),ex("Lat Pulldown","หลัง",3,10),ex("Lateral Raise","ไหล่",2,12)] },
    { label: "พุธ", focus: "Deadlift + overhead press", exercises: [ex("Deadlift","ขา",3,6),ex("Overhead Press","ไหล่",3,8),ex("Barbell Row","หลัง",3,10),ex("Leg Curl","ขา",2,12)] },
    { label: "ศุกร์", focus: "Squat variation + upper body", exercises: [ex("Front Squat","ขา",3,8),ex("Incline Dumbbell Press","อก",3,10),ex("Cable Row","หลัง",3,10),ex("Biceps Curl","แขน",2,12)] },
  ] },
];
export default function FitnessApp() {
  const [tab, setTab] = useState<Tab>("Workout");
  const [data, setData] = useState<AppData>(seed);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"local" | "supabase">("local");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"builder" | "body" | "nutrition" | "auth" | null>(null);
  const [activeProgramId, setActiveProgramId] = useState(starterProgram.id);
  const [filter, setFilter] = useState("ทั้งหมด");
  const [programCategory, setProgramCategory] = useState("Powerlifting");
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("My exercises program");
  const [chosen, setChosen] = useState<string[]>(["Pec Deck Fly", "Incline Dumbbell Press"]);
  const [customSets, setCustomSets] = useState("3");
  const [customReps, setCustomReps] = useState("8");
  const [customSetWeights, setCustomSetWeights] = useState<Record<string, string[]>>({});
  const [customDays, setCustomDays] = useState<string[]>(["จันทร์", "พุธ", "ศุกร์"]);
  const [bodyDraft, setBodyDraft] = useState({ weight: "60", height: "170", muscle: "50", fat: "20" });
  const [planStyle, setPlanStyle] = useState("สมดุล");
  const [calorieProfile, setCalorieProfile] = useState({ age: "", sex: "", activity: "1.2" });
  const [calorieProfileLoaded, setCalorieProfileLoaded] = useState(false);
  const [workoutStartedAt, setWorkoutStartedAt] = useState<number | null>(null);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);
  const [workoutScreenVisible, setWorkoutScreenVisible] = useState(false);
  const [showCancelWorkoutConfirm, setShowCancelWorkoutConfirm] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  const activeProgram = data.programs.find((p) => p.id === activeProgramId) ?? data.programs[0] ?? starterProgram;
  const latestBody = data.bodyRecords[0] ?? seed.bodyRecords[0];
  const latestNutritionPlan = data.nutritionPlans[0];
  const isLegacySampleCalories = latestNutritionPlan?.calories === 2540 && latestNutritionPlan.carbs === 300 && latestNutritionPlan.fat === 150;
  const calories = isLegacySampleCalories ? undefined : latestNutritionPlan?.calories;
  const calorieEstimate = useMemo(() => {
    const age = Number(calorieProfile.age);
    const activity = Number(calorieProfile.activity);
    if (!calorieProfile.age || age < 19 || age > 78 || !Number.isFinite(age) || !["male", "female", "average"].includes(calorieProfile.sex) || !Number.isFinite(activity) || latestBody.weight <= 0 || latestBody.height <= 0) return null;
    const sexAdjustment = calorieProfile.sex === "male" ? 5 : calorieProfile.sex === "female" ? -161 : -78;
    const restingCalories = 10 * latestBody.weight + 6.25 * latestBody.height - 5 * age + sexAdjustment;
    return Math.max(0, Math.round(restingCalories * activity));
  }, [calorieProfile, latestBody.height, latestBody.weight]);
  const displayedCalories = calorieEstimate;
  const calorieMacros = useMemo(() => {
    if (!calorieEstimate) return null;
    let protein = Math.round(latestBody.weight * 1.6);
    let fat = Math.round(latestBody.weight * 0.8);
    let carbs = 0;
    if (planStyle === "คีโต") {
      protein = Math.round(latestBody.weight * 1.5);
      carbs = Math.min(50, Math.floor(calorieEstimate * 0.05 / 4));
      fat = Math.max(0, Math.round((calorieEstimate - protein * 4 - carbs * 4) / 9));
    } else if (planStyle === "คาร์โบไฮเดรตต่ำ · เน้นโปรตีน") {
      protein = Math.round(latestBody.weight * 2);
      carbs = Math.min(130, Math.floor(calorieEstimate * 0.25 / 4));
      fat = Math.max(0, Math.round((calorieEstimate - protein * 4 - carbs * 4) / 9));
    } else if (planStyle === "ไขมันต่ำ") {
      fat = Math.floor(calorieEstimate * 0.2 / 9);
      carbs = Math.max(0, Math.round((calorieEstimate - protein * 4 - fat * 9) / 4));
    } else {
      carbs = Math.max(0, Math.round((calorieEstimate - protein * 4 - fat * 9) / 4));
    }
    return { protein, carbs, fat };
  }, [calorieEstimate, latestBody.weight, planStyle]);
  const currentMealTemplates = mealTemplates[planStyle] ?? mealTemplates["สมดุล"];
  const mealAllocationText = currentMealTemplates.map((meal) => `${meal.name} ${Math.round(meal.share * 100)}%`).join(" · ");
  const mealAllocationDescription = planStyle === "IF" ? "แบ่งพลังงานสองมื้อภายในช่วงเวลากินที่คุณเลือก โดยยอดรวมต่อวันยังเท่าเดิม" : planStyle === "คีโต" ? "จำกัดคาร์บและเติมพลังงานส่วนที่เหลือด้วยไขมันจากแหล่งอาหารที่เหมาะสม" : planStyle === "ไขมันต่ำ" ? "ตั้งไขมันราว 20% ของพลังงาน และเลือกโปรตีนไม่ติดมัน" : planStyle === "คาร์โบไฮเดรตต่ำ · เน้นโปรตีน" ? "คาร์บไม่เกินประมาณ 25% ของพลังงานหรือ 130 g/วัน พร้อมโปรตีนสูง" : "มื้อกลางวันมากสุด มื้อเย็นเบาสุด และยังคงโปรตีนกับผักครบ";
  const mealPlanNote = planStyle === "IF" ? "IF เน้นกำหนดช่วงเวลากิน ไม่ได้กำหนดว่าต้องลดแคลอรีหรือใช้เวลาอดแบบเดียวกันทุกคน" : planStyle === "คีโต" ? "คีโตเป็นรูปแบบคาร์บต่ำมาก เป้าหมายคาร์บในแผนนี้ไม่เกิน 50 g/วัน; ผู้มีโรคประจำตัวหรือใช้ยาควรปรึกษาบุคลากรสุขภาพก่อน" : planStyle === "ไขมันต่ำ" ? "ไขมันยังเป็นสารอาหารจำเป็น เลือกไขมันไม่อิ่มตัวในปริมาณพอเหมาะแทนการตัดออกทั้งหมด" : planStyle === "คาร์โบไฮเดรตต่ำ · เน้นโปรตีน" ? "เลือกโปรตีนจากปลา ไก่ ไข่ เต้าหู้ หรือถั่ว และคงผักไว้ทุกมื้อ" : "ถ้าฝึกช่วงเย็น เลื่อนพลังงานบางส่วนมาไว้ก่อนหรือหลังฝึกได้ ไม่จำเป็นต้องฝืนลดมื้อเย็น";
  const plannedMeals = calorieMacros && displayedCalories ? currentMealTemplates.map((meal) => {
    const mealCalories = Math.round(displayedCalories * meal.share);
    const protein = Math.round(calorieMacros.protein / currentMealTemplates.length);
    const fat = Math.round(calorieMacros.fat * meal.share);
    const carbs = Math.max(0, Math.round((mealCalories - protein * 4 - fat * 9) / 4));
    return { ...meal, calories: mealCalories, share: Math.round(meal.share * 100), carbs, protein, fat };
  }) : [];
  const weightSeries = [...data.bodyRecords].slice(0, 6).reverse();
  const weightMin = Math.min(...weightSeries.map((record) => record.weight));
  const weightMax = Math.max(...weightSeries.map((record) => record.weight));
  const weightSpan = Math.max(1, weightMax - weightMin);
  const chartCoordinates = weightSeries.map((record, index) => ({ x: weightSeries.length < 2 ? 310 : index * 310 / (weightSeries.length - 1), y: 92 - (record.weight - weightMin) / weightSpan * 68 }));
  const chartPath = chartCoordinates.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
  const chartFillPath = chartPath ? `${chartPath} L310 104 L0 104 Z` : "";
  const selectedDate = parseLocalDate(selectedCalendarDate);
  const calendarWeekStart = startOfCalendarWeek(selectedDate);
  const calendarDates = Array.from({ length: 7 }, (_, index) => { const date = new Date(calendarWeekStart); date.setDate(date.getDate() + index); return date; });
  const todayDateKey = localDateKey(new Date());
  const selectedWeekday = weekdayNames[selectedDate.getDay()];
  const calendarMonthLabel = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(selectedDate);
  const workoutSessionLabels = activeProgram.trainingDays?.filter((label) => activeProgram.exercises.some((exercise) => exercise.name.startsWith(`${label} :: `))) ?? [];
  const activeWorkoutSession = workoutSessionLabels.find((label) => label.startsWith(selectedWeekday)) ?? "";
  const isScheduledWorkout = activeProgram.trainingDays?.length ? activeProgram.trainingDays.some((label) => label.startsWith(selectedWeekday)) : true;
  const activeWorkoutExercises = !isScheduledWorkout ? [] : activeWorkoutSession ? activeProgram.exercises.filter((exercise) => exercise.name.startsWith(`${activeWorkoutSession} :: `)) : activeProgram.exercises.filter((exercise) => !exercise.name.includes(" :: "));
  const visibleExerciseName = (name: string) => name.includes(" :: ") ? name.slice(name.indexOf(" :: ") + 4) : name;
  const allSets = activeWorkoutExercises.flatMap((exercise) => exercise.sets.map((set) => ({ exercise, set })));
  const doneCount = allSets.filter(({ set }) => set.done).length;
  const sessionTime = `${String(Math.floor(workoutElapsedSeconds / 60)).padStart(2, "0")}:${String(workoutElapsedSeconds % 60).padStart(2, "0")}`;
  const weekStart = startOfCalendarWeek(new Date());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekLogs = workoutLogs.filter((log) => { const at = new Date(log.completedAt); return at >= weekStart && at < weekEnd; });
  const muscleGroups = ["อก", "หลัง", "ไหล่", "แขน", "ขา", "หน้าท้อง"];
  const muscleSummary = muscleGroups.map((group) => ({ group, sets: weekLogs.filter((log) => log.muscleGroup === group).length, volume: weekLogs.filter((log) => log.muscleGroup === group).reduce((sum, log) => sum + log.weight * log.reps, 0) }));
  const dailyTraining = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(date.getDate() + index); const key = localDateKey(date); const logs = weekLogs.filter((log) => localDateKey(new Date(log.completedAt)) === key); return { date, label: weekdayShortNames[date.getDay()], volume: logs.reduce((sum, log) => sum + log.weight * log.reps, 0), sets: logs.length }; });
  const maxDailyVolume = Math.max(1, ...dailyTraining.map((day) => day.volume));
  const workoutCount = new Set(weekLogs.map((log) => log.sessionId)).size;
  const weeklyVolume = weekLogs.reduce((sum, log) => sum + log.weight * log.reps, 0);
  const bmi = latestBody.height > 0 ? latestBody.weight / ((latestBody.height / 100) ** 2) : 0;
  const fatMass = latestBody.weight * latestBody.fat / 100;
  const leanMass = latestBody.weight - fatMass;
  const basalCalories = calorieEstimate && Number(calorieProfile.activity) ? Math.round(calorieEstimate / Number(calorieProfile.activity)) : null;

  useEffect(() => {
    const savedCalorieProfile = localStorage.getItem("best-fitness-calorie-profile");
    if (savedCalorieProfile) {
      try { setCalorieProfile(JSON.parse(savedCalorieProfile) as typeof calorieProfile); } catch { localStorage.removeItem("best-fitness-calorie-profile"); }
    }
    setCalorieProfileLoaded(true);
    const saved = localStorage.getItem("best-fitness-data");
    if (saved) {
      try {
        const stored = JSON.parse(saved) as AppData;
        setData(stored);
        const rememberedProgram = localStorage.getItem("best-fitness-active-program");
        setActiveProgramId(stored.programs.find((program) => program.id === rememberedProgram)?.id ?? stored.programs.find((program) => program.id === "starter-upper" || program.name === "Upper")?.id ?? stored.programs[0]?.id ?? starterProgram.id);
      } catch { localStorage.removeItem("best-fitness-data"); }
    }
    try { setWorkoutLogs(JSON.parse(localStorage.getItem("best-fitness-workout-logs") ?? "[]") as WorkoutLog[]); } catch { localStorage.removeItem("best-fitness-workout-logs"); }
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      setMode("supabase");
      supabase.auth.getUser().then(({ data: auth }) => {
        if (auth.user) { setUserEmail(auth.user.email ?? ""); void loadFromSupabase(auth.user.id); }
        else setReady(true);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user.email ?? "");
        if (session?.user) void loadFromSupabase(session.user.id);
        else setReady(true);
      });
      return () => listener.subscription.unsubscribe();
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (calorieProfileLoaded) localStorage.setItem("best-fitness-calorie-profile", JSON.stringify(calorieProfile));
  }, [calorieProfile, calorieProfileLoaded]);

  useEffect(() => {
    if (ready && (mode === "local" || !userEmail)) localStorage.setItem("best-fitness-data", JSON.stringify(data));
  }, [data, mode, ready, userEmail]);

  useEffect(() => { if (ready) localStorage.setItem("best-fitness-workout-logs", JSON.stringify(workoutLogs)); }, [workoutLogs, ready]);

  useEffect(() => {
    if (ready && data.programs.some((program) => program.id === activeProgramId)) localStorage.setItem("best-fitness-active-program", activeProgramId);
  }, [activeProgramId, data.programs, ready]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);
  useEffect(() => {
    if (workoutStartedAt === null) return;
    const updateElapsed = () => setWorkoutElapsedSeconds(Math.floor((Date.now() - workoutStartedAt) / 1000));
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [workoutStartedAt]);
  useEffect(() => {
    if (modal === "nutrition") setPlanStyle(data.nutritionPlans[0]?.style ?? "สมดุล");
  }, [modal]);
  useEffect(() => { setSelectedCalendarDate(localDateKey(new Date())); }, []);
  async function loadFromSupabase(userId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const [programRows, bodyRows, nutritionRows, profileRows, workoutLogRows] = await Promise.all([
      supabase.from("programs").select("id,name,source,goal,duration_weeks,training_days,minutes_per_session,target_weight_kg,created_at,program_exercises(id,name,muscle_group,position,exercise_sets(id,position,weight_kg,reps,done))").order("created_at", { ascending: false }),
      supabase.from("body_records").select("id,recorded_on,weight_kg,height_cm,muscle_mass_kg,body_fat_pct").order("recorded_on", { ascending: false }),
      supabase.from("nutrition_plans").select("id,style,calories,protein_g,carbs_g,fat_g,created_at").order("created_at", { ascending: false }),
      supabase.from("user_profiles").select("display_name,age,sex,activity_factor").eq("user_id", userId).maybeSingle(),
      supabase.from("workout_set_logs").select("id,session_id,set_id,program_name,exercise_name,muscle_group,weight_kg,reps,completed_at").eq("user_id", userId).order("completed_at", { ascending: false }),
    ]);
    const error = programRows.error ?? bodyRows.error ?? nutritionRows.error ?? profileRows.error ?? workoutLogRows.error;
    if (error) { setMessage(`โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ${error.message}`); setReady(true); return; }
    const programs: Program[] = (programRows.data ?? []).map((p: any) => ({ id: p.id, name: p.name, source: p.source, goal: p.goal, durationWeeks: p.duration_weeks, trainingDays: p.training_days, minutesPerSession: p.minutes_per_session, targetWeightKg: p.target_weight_kg ? Number(p.target_weight_kg) : undefined, createdAt: p.created_at, exercises: [...(p.program_exercises ?? [])].sort((a: any,b: any) => a.position-b.position).map((e: any) => ({ id: e.id, name: e.name, group: e.muscle_group, sets: [...(e.exercise_sets ?? [])].sort((a: any,b: any) => a.position-b.position).map((s: any) => ({ id: s.id, weight: Number(s.weight_kg), reps: s.reps, done: s.done })) })) }));
    const bodyRecords: BodyRecord[] = (bodyRows.data ?? []).map((b: any) => ({ id: b.id, date: b.recorded_on, weight: Number(b.weight_kg), height: Number(b.height_cm), muscle: Number(b.muscle_mass_kg), fat: Number(b.body_fat_pct) }));
    const nutritionPlans: NutritionPlan[] = (nutritionRows.data ?? []).map((p: any) => ({ id: p.id, style: p.style, calories: p.calories, protein: Number(p.protein_g), carbs: Number(p.carbs_g), fat: Number(p.fat_g), createdAt: p.created_at }));
    const remoteWorkoutLogs: WorkoutLog[] = (workoutLogRows.data ?? []).map((log: any) => ({ id: log.id, sessionId: log.session_id, setId: log.set_id, programName: log.program_name, exerciseName: log.exercise_name, muscleGroup: log.muscle_group, weight: Number(log.weight_kg), reps: log.reps, completedAt: log.completed_at }));
    const profile = profileRows.data as { display_name: string | null; age: number | null; sex: string | null; activity_factor: number | null } | null;
    if (profile) setCalorieProfile({ age: profile.age ? String(profile.age) : "", sex: profile.sex ?? "", activity: profile.activity_factor ? String(profile.activity_factor) : "1.2" });
    setCalorieProfileLoaded(true);
    setWorkoutLogs((current) => [...current.filter((log) => !remoteWorkoutLogs.some((remoteLog) => remoteLog.id === log.id)), ...remoteWorkoutLogs]);
    setData({ programs: programs.length ? programs : seed.programs, bodyRecords: bodyRecords.length ? bodyRecords : seed.bodyRecords, nutritionPlans });
    setActiveProgramId(programs[0]?.id ?? starterProgram.id);
    setReady(true);
    void userId;
  }

  async function saveProgram(program: Program) {
    setData((current) => ({ ...current, programs: [program, ...current.programs.filter((p) => p.id !== program.id)] }));
    setActiveProgramId(program.id);
    if (mode === "supabase" && userEmail) {
      const supabase = getSupabaseBrowserClient(); if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser(); const userId = userData.user?.id;
      if (!userId) return;
      const { data: p, error } = await supabase.from("programs").insert({ user_id: userId, name: program.name, source: program.source, goal: program.goal, duration_weeks: program.durationWeeks, training_days: program.trainingDays ?? [], minutes_per_session: program.minutesPerSession, target_weight_kg: program.targetWeightKg }).select("id").single();
      if (error || !p) { setMessage(`บันทึกโปรแกรมไม่สำเร็จ: ${error?.message ?? "ลองอีกครั้ง"}`); return; }
      const rows = program.exercises.map((exercise, position) => ({ program_id: p.id, user_id: userId, name: exercise.name, muscle_group: exercise.group, position }));
      const inserted = rows.length ? await supabase.from("program_exercises").insert(rows).select("id,position") : { data: [], error: null };
      if (inserted.error) { setMessage(`บันทึกท่าไม่สำเร็จ: ${inserted.error.message}`); return; }
      const sets = (inserted.data ?? []).flatMap((e: any) => program.exercises[e.position].sets.map((s, position) => ({ exercise_id: e.id, user_id: userId, position, weight_kg: s.weight, reps: s.reps, done: s.done })));
      if (sets.length) { const result = await supabase.from("exercise_sets").insert(sets); if (result.error) setMessage(`บันทึกเซตไม่สำเร็จ: ${result.error.message}`); }
      await loadFromSupabase(userId);
    }
    setMessage("บันทึกโปรแกรมแล้ว");
  }

  async function saveBody() {
    const record: BodyRecord = { id: id(), date: new Date().toISOString().slice(0, 10), weight: Number(bodyDraft.weight), height: Number(bodyDraft.height), muscle: Number(bodyDraft.muscle), fat: Number(bodyDraft.fat) };
    if (Object.values(bodyDraft).some((v) => !Number.isFinite(Number(v)) || Number(v) <= 0) || record.fat > 100) { setMessage("กรุณากรอกตัวเลขให้ถูกต้อง (เปอร์เซ็นต์ไขมันไม่เกิน 100)"); return; }
    setData((current) => ({ ...current, bodyRecords: [record, ...current.bodyRecords] }));
    const supabase = getSupabaseBrowserClient();
    if (supabase && userEmail) { const { data: user } = await supabase.auth.getUser(); if (user.user) { const { error } = await supabase.from("body_records").insert({ user_id: user.user.id, recorded_on: record.date, weight_kg: record.weight, height_cm: record.height, muscle_mass_kg: record.muscle, body_fat_pct: record.fat }); if (error) setMessage(`บันทึกไม่สำเร็จ: ${error.message}`); else void loadFromSupabase(user.user.id); } }
    setModal(null); setMessage("บันทึกข้อมูลร่างกายแล้ว");
  }

  function editBodyRecord() {
    setBodyDraft({ weight: String(latestBody.weight), height: String(latestBody.height), muscle: String(latestBody.muscle), fat: String(latestBody.fat) });
    setModal("body");
  }

  async function saveNutrition() {
    if (!calorieEstimate || !calorieMacros) { setMessage("กรอกอายุและเลือกเพศในสมการก่อนคำนวณแคลอรี"); return; }
    const plan: NutritionPlan = { id: id(), calories: calorieEstimate, protein: calorieMacros.protein, carbs: calorieMacros.carbs, fat: calorieMacros.fat, style: planStyle, createdAt: new Date().toISOString() };
    setData((current) => ({ ...current, nutritionPlans: [plan, ...current.nutritionPlans] }));
    const supabase = getSupabaseBrowserClient();
    if (supabase && userEmail) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { error: profileError } = await supabase.from("user_profiles").upsert({ user_id: auth.user.id, display_name: auth.user.user_metadata?.full_name ?? null, age: Number(calorieProfile.age), sex: calorieProfile.sex, activity_factor: Number(calorieProfile.activity), updated_at: new Date().toISOString() });
        const { error } = await supabase.from("nutrition_plans").insert({ user_id: auth.user.id, style: plan.style, calories: plan.calories, protein_g: plan.protein, carbs_g: plan.carbs, fat_g: plan.fat });
        if (profileError) setMessage(`บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ: ${profileError.message}`);
        else if (error) setMessage(`บันทึกแผนไม่สำเร็จ: ${error.message}`);
        else void loadFromSupabase(auth.user.id);
      }
    }
    setModal(null); setMessage("สร้างแผนโภชนาการแล้ว");
  }

  async function toggleSet(exerciseId: string, setId: string) {
    const next = { ...data, programs: data.programs.map((p) => ({ ...p, exercises: p.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => s.id === setId ? { ...s, done: !s.done } : s) })) })) };
    setData(next);
    const changedSet = next.programs.flatMap((program) => program.exercises).flatMap((exercise) => exercise.sets).find((set) => set.id === setId);
    const changedExercise = next.programs.flatMap((program) => program.exercises).find((exercise) => exercise.id === exerciseId);
    if (changedSet && changedExercise && workoutStartedAt !== null) {
      const sessionId = workoutSessionId ?? String(workoutStartedAt);
      const currentLog = workoutLogs.find((log) => log.sessionId === sessionId && log.setId === setId);
      if (changedSet.done) {
        const log: WorkoutLog = { id: currentLog?.id ?? id(), sessionId, setId, programName: activeProgram.name, exerciseName: visibleExerciseName(changedExercise.name), muscleGroup: changedExercise.group, weight: changedSet.weight, reps: changedSet.reps, completedAt: new Date().toISOString() };
        setWorkoutLogs((logs) => [...logs.filter((item) => item.id !== log.id), log]);
        const supabase = getSupabaseBrowserClient();
        if (supabase && userEmail && workoutSessionId) {
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) {
            const { error } = await supabase.from("workout_set_logs").upsert({ id: log.id, user_id: auth.user.id, session_id: workoutSessionId, set_id: setId, program_name: log.programName, exercise_name: log.exerciseName, muscle_group: log.muscleGroup, weight_kg: log.weight, reps: log.reps, completed_at: log.completedAt }, { onConflict: "session_id,set_id" });
            if (error) setMessage(`บันทึกประวัติเซตไม่สำเร็จ: ${error.message}`);
          }
        }
      } else {
        setWorkoutLogs((logs) => logs.filter((log) => !(log.sessionId === sessionId && log.setId === setId)));
        const supabase = getSupabaseBrowserClient();
        if (supabase && userEmail && workoutSessionId) {
          const { error } = await supabase.from("workout_set_logs").delete().eq("session_id", workoutSessionId).eq("set_id", setId);
          if (error) setMessage(`ลบประวัติเซตไม่สำเร็จ: ${error.message}`);
        }
      }
    }
    const supabase = getSupabaseBrowserClient();
    if (supabase && userEmail && activeProgram.id !== "starter-upper") {
      const set = next.programs.flatMap((p) => p.exercises).flatMap((e) => e.sets).find((s) => s.id === setId);
      if (set) { const { error } = await supabase.from("exercise_sets").update({ done: set.done }).eq("id", setId); if (error) setMessage(`ซิงก์สถานะเซตไม่สำเร็จ: ${error.message}`); }
    }
  }

  async function startWorkout() {
    if (!activeWorkoutExercises.length) { setMessage("โปรแกรมนี้ยังไม่มีท่าออกกำลังกาย"); return; }
    if (workoutStartedAt === null) {
      const exerciseIds = new Set(activeWorkoutExercises.map((exercise) => exercise.id));
      const setIds = activeWorkoutExercises.flatMap((exercise) => exercise.sets.map((set) => set.id));
      setData((current) => ({ ...current, programs: current.programs.map((program) => ({ ...program, exercises: program.exercises.map((exercise) => exerciseIds.has(exercise.id) ? { ...exercise, sets: exercise.sets.map((set) => ({ ...set, done: false })) } : exercise) })) }));
      const sessionId = id();
      const startedAt = Date.now();
      setWorkoutSessionId(sessionId);
      setWorkoutStartedAt(startedAt);
      const supabase = getSupabaseBrowserClient();
      if (supabase && userEmail) {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          const { error } = await supabase.from("workout_sessions").insert({ id: sessionId, user_id: auth.user.id, program_id: activeProgram.id === "starter-upper" ? null : activeProgram.id, started_at: new Date(startedAt).toISOString() });
          if (error) setMessage(`เริ่มฝึกแล้ว แต่บันทึกรอบฝึกไม่สำเร็จ: ${error.message}`);
          if (activeProgram.id !== "starter-upper" && setIds.length) {
            const reset = await supabase.from("exercise_sets").update({ done: false }).in("id", setIds);
            if (reset.error) setMessage(`เริ่มฝึกแล้ว แต่ล้างสถานะเซตเดิมไม่สำเร็จ: ${reset.error.message}`);
          }
        }
      }
      setWorkoutElapsedSeconds(0);
    }
    setShowCancelWorkoutConfirm(false);
    setWorkoutScreenVisible(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function returnToWorkoutHome() {
    setWorkoutScreenVisible(false);
    setShowCancelWorkoutConfirm(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function cancelWorkout() {
    const sessionId = workoutSessionId;
    if (sessionId) setWorkoutLogs((logs) => logs.filter((log) => log.sessionId !== sessionId));
    const supabase = getSupabaseBrowserClient();
    if (supabase && userEmail && sessionId) {
      const { error } = await supabase.from("workout_sessions").delete().eq("id", sessionId);
      if (error) setMessage(`ยกเลิกแล้ว แต่ลบรอบฝึกไม่สำเร็จ: ${error.message}`);
    }
    setShowCancelWorkoutConfirm(false);
    setWorkoutScreenVisible(false);
    setWorkoutStartedAt(null);
    setWorkoutSessionId(null);
    setWorkoutElapsedSeconds(0);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function finishWorkout() {
    const sessionId = workoutSessionId;
    const startedAt = workoutStartedAt;
    const supabase = getSupabaseBrowserClient();
    if (supabase && userEmail && sessionId) {
      const { error } = await supabase.from("workout_sessions").update({ completed_at: new Date().toISOString(), duration_seconds: startedAt === null ? workoutElapsedSeconds : Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) }).eq("id", sessionId);
      if (error) setMessage(`เสร็จแล้ว แต่บันทึกเวลารอบฝึกไม่สำเร็จ: ${error.message}`);
    }
    setShowCancelWorkoutConfirm(false);
    setWorkoutScreenVisible(false);
    setWorkoutStartedAt(null);
    setWorkoutSessionId(null);
    setWorkoutElapsedSeconds(0);
    window.scrollTo({ top: 0, behavior: "instant" });
    setMessage("ออกกำลังกายเสร็จแล้ว");
  }

  async function authenticate(email: string, password: string, signup: boolean) {
    const supabase = getSupabaseBrowserClient(); if (!supabase) { setMessage("ยังไม่ได้ตั้งค่า Supabase"); return; }
    const result = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setMessage(result.error.message); return; }
    setUserEmail(result.data.session?.user.email ?? ""); setModal(null);
    setMessage(signup && !result.data.session ? "สมัครแล้ว ตรวจอีเมลเพื่อยืนยันบัญชีก่อนลงชื่อเข้าใช้" : signup ? "สมัครและลงชื่อเข้าใช้แล้ว" : "ลงชื่อเข้าใช้แล้ว");
  }

  async function signOut() { const supabase = getSupabaseBrowserClient(); await supabase?.auth.signOut(); setUserEmail(""); setMessage("ออกจากระบบแล้ว"); }

  function addCuratedProgram(plan: CuratedPlan) {
    const existing = data.programs.find((program) => program.name === plan.name);
    if (existing) {
      setActiveProgramId(existing.id);
      setTab("Workout");
      setMessage("โปรแกรมนี้อยู่ในรายการแล้ว");
      return;
    }
    const trainingDays = plan.sessions.map((session) => session.label);
    const program: Program = {
      id: id(), name: plan.name, source: "สำเร็จรูป", goal: plan.category,
      trainingDays, createdAt: new Date().toISOString(), minutesPerSession: 60,
      exercises: plan.sessions.flatMap((session) => session.exercises.map((item) => ({
        ...makeExercise(`${session.label} :: ${item.name}`, item.group, item.sets),
        sets: Array.from({ length: item.sets }, () => ({ id: id(), weight: 0, reps: item.reps, done: false })),
      }))),
    };
    void saveProgram(program);
    setSelectedCalendarDate(localDateKey(new Date()));
    setTab("Workout");
  }

  function updateCustomSetWeight(exerciseName: string, setIndex: number, value: string) {
    setCustomSetWeights((current) => {
      const weights = [...(current[exerciseName] ?? [])];
      weights[setIndex] = value;
      return { ...current, [exerciseName]: weights };
    });
  }

  function toggleCustomDay(day: string) {
    setCustomDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  }

  function createCustomProgram() {
    if (!chosen.length || !customName.trim()) { setMessage("ใส่ชื่อโปรแกรมและเลือกอย่างน้อย 1 ท่า"); return; }
    if (!customDays.length) { setMessage("เลือกวันฝึกอย่างน้อย 1 วัน"); return; }
    const count = Math.min(8, Math.max(1, Number(customSets) || 3));
    const reps = Math.max(1, Number(customReps) || 8);
    const hasMissingWeight = chosen.some((name) => Array.from({ length: count }, (_, index) => customSetWeights[name]?.[index]).some((weight) => weight === undefined || weight.trim() === "" || !Number.isFinite(Number(weight)) || Number(weight) < 0));
    if (hasMissingWeight) { setMessage("กรอกน้ำหนักแยกให้ครบทุกเซต (ใส่ 0 หากไม่เพิ่มน้ำหนัก)"); return; }
    const exercises = chosen.map((name) => ({ ...makeExercise(name, exerciseLibrary.find((item) => item.name === name)?.group ?? "อก", count), sets: Array.from({ length: count }, (_, index) => ({ id: id(), weight: Number(customSetWeights[name][index]), reps, done: false })) }));
    const program: Program = { id: id(), name: customName.trim(), source: "สร้างเอง", goal: "สร้างกล้ามเนื้อ", trainingDays: customDays, createdAt: new Date().toISOString(), exercises };
    void saveProgram(program); setModal(null); setTab("Workout");
  }

  const filteredExercises = useMemo(() => exerciseLibrary.filter((e) => (filter === "ทั้งหมด" || e.group === filter) && e.name.toLowerCase().includes(search.toLowerCase())), [filter, search]);
  const visiblePlans = curatedPlans.filter((plan) => plan.category === programCategory && `${plan.name} ${plan.schedule} ${plan.level}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <main className="app-shell">
      {workoutScreenVisible ? <section className="training-session" aria-label="หน้าออกกำลังกาย">
        <header className="training-session-header"><button className="session-back" onClick={returnToWorkoutHome} aria-label="ย้อนกลับหน้าหลักโดยไม่หยุดเวลา"><ArrowLeft size={19}/></button><div><span>กำลังฝึก</span><b>{activeProgram.name}</b></div><button className="session-cancel" onClick={()=>setShowCancelWorkoutConfirm(true)}><X size={16}/> ยกเลิก</button></header>
        <div className="session-timer-card"><span><Clock3 size={16}/> เวลาที่ฝึก</span><strong aria-live="off">{sessionTime}</strong><small>{activeWorkoutSession ? `วันนี้ · ${activeWorkoutSession}` : "เริ่มจับเวลาตั้งแต่เริ่มออกกำลังกาย"}</small></div>
        <div className="session-progress"><div><b>ความคืบหน้า</b><span>{doneCount}/{allSets.length} เซต</span></div><div className="session-progress-track"><span style={{ width: `${allSets.length ? doneCount / allSets.length * 100 : 0}%` }}/></div></div>
        <div className="session-exercise-list">{activeWorkoutExercises.map((exercise, exerciseIndex) => <article className="session-exercise-card" key={exercise.id}>
          <div className="session-exercise-heading"><span className="session-exercise-index">{String(exerciseIndex + 1).padStart(2, "0")}</span><div><b>{visibleExerciseName(exercise.name)}</b><small>{exercise.group} · {exercise.sets.length} เซต</small></div></div>
          <div className="session-set-list" aria-label={`เซตของ ${visibleExerciseName(exercise.name)}`}>{exercise.sets.map((set, setIndex) => <button type="button" role="checkbox" aria-checked={set.done} className={`session-set ${set.done ? "done" : ""}`} key={set.id} onClick={() => void toggleSet(exercise.id, set.id)}><span className="session-set-check">{set.done && <Check size={14}/>}</span><span>เซต {setIndex + 1}</span><b>{set.weight} kg</b><span>× {set.reps} ครั้ง</span></button>)}</div>
        </article>)}</div>
        {allSets.length > 0 && doneCount === allSets.length && <button className="session-finish" onClick={finishWorkout}><Check size={18}/> เสร็จสิ้นการออกกำลังกาย</button>}
        {showCancelWorkoutConfirm && <div className="cancel-session-backdrop"><section className="cancel-session-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cancel-session-title" aria-describedby="cancel-session-description"><span className="cancel-session-icon"><X size={17}/></span><h2 id="cancel-session-title">ยืนยันยกเลิกการออกกำลังกาย?</h2><p id="cancel-session-description">เวลาของรอบนี้จะถูกรีเซ็ต หากแค่ต้องการกลับไปหน้าหลัก ให้กดย้อนกลับ</p><div><button className="cancel-session-keep" onClick={()=>setShowCancelWorkoutConfirm(false)}>ฝึกต่อ</button><button className="cancel-session-confirm" onClick={cancelWorkout}>ยืนยันยกเลิก</button></div></section></div>}
      </section> : tab === "Workout" && <section className="figma-screen workout-screen">
        <header className="figma-greeting"><Image src="/assets/best-logo.png" alt="BEST" width={62} height={62} className="figma-logo"/><div><h1>Hi, PONGSATHORN N !</h1><p>Let’s get your body moving today.</p></div><button className="figma-avatar" onClick={() => setTab("Profile")} aria-label="โปรไฟล์"><CircleUserRound size={22}/></button></header>
        <section className="calendar-widget" aria-label="ปฏิทินการฝึก">
          <div className="calendar-toolbar"><div><h2>{calendarMonthLabel}</h2><p>{workoutStartedAt !== null ? "กำลังฝึกอยู่ · ปฏิทินล็อกไว้ชั่วคราว" : "เลือกวันที่เพื่อดูแผนฝึก"}</p></div><div className="calendar-controls"><button className="calendar-today" onClick={()=>setSelectedCalendarDate(todayDateKey)} disabled={workoutStartedAt !== null}>วันนี้</button><button className="calendar-arrow" aria-label="สัปดาห์ก่อน" onClick={()=>{const next=new Date(selectedDate);next.setDate(next.getDate()-7);setSelectedCalendarDate(localDateKey(next));}} disabled={workoutStartedAt !== null}><ArrowLeft size={16}/></button><button className="calendar-arrow" aria-label="สัปดาห์ถัดไป" onClick={()=>{const next=new Date(selectedDate);next.setDate(next.getDate()+7);setSelectedCalendarDate(localDateKey(next));}} disabled={workoutStartedAt !== null}><ArrowRight size={16}/></button></div></div>
          <div className="figma-week" role="group" aria-label="เลือกวันในสัปดาห์">{calendarDates.map((date)=>{const dateKey=localDateKey(date);const dayIndex=date.getDay();const hasWorkout=activeProgram.trainingDays?.length ? activeProgram.trainingDays.some((label)=>label.startsWith(weekdayNames[dayIndex])) : activeProgram.exercises.length>0;const label=new Intl.DateTimeFormat("th-TH",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(date);return <button type="button" key={dateKey} className={`figma-day ${dateKey===selectedCalendarDate?"selected":""} ${dateKey===todayDateKey?"today":""}`} aria-label={`${label}${hasWorkout?" · มีแผนฝึก":" · วันพัก"}`} aria-pressed={dateKey===selectedCalendarDate} aria-current={dateKey===todayDateKey?"date":undefined} disabled={workoutStartedAt!==null} onClick={()=>setSelectedCalendarDate(dateKey)}><span>{weekdayShortNames[dayIndex]}</span><b>{date.getDate()}</b>{hasWorkout&&<i aria-hidden="true"/>}</button>})}</div>
        </section>
        <section className="figma-workout-panel"><div className="figma-panel-title"><h2>My practice program</h2><button className="figma-calorie" onClick={()=>setModal("nutrition")}><span>🔥</span>{(calorieEstimate ?? calories) ? `${(calorieEstimate ?? calories)?.toLocaleString()} kcal` : "คำนวณ kcal"}</button></div>
          <article className="figma-hero"><div><span className="figma-subtle">{isScheduledWorkout ? `${activeProgram.trainingDays?.length ?? 1} DAY PLAN · ${activeWorkoutExercises.length} MOVES` : "REST DAY"}</span><h3>{activeProgram.name === "Upper Body" ? "Upper" : activeProgram.name}</h3><button className="figma-go" aria-label={workoutStartedAt !== null ? "ฝึกต่อจากเวลาที่บันทึกไว้" : "เริ่มออกกำลังกาย"} onClick={startWorkout} disabled={!isScheduledWorkout || activeWorkoutExercises.length===0}>{workoutStartedAt !== null ? "ฝึกต่อ" : isScheduledWorkout ? "เริ่มฝึก" : "วันพัก"} {isScheduledWorkout&&<Play size={12} fill="currentColor"/>}</button>{workoutStartedAt !== null && <small className="figma-active-timer">กำลังฝึก · {sessionTime}</small>}</div><Image src="/assets/workout-illustration.png" alt="ภาพประกอบโปรแกรมออกกำลังกาย" width={135} height={118} className="figma-workout-art"/></article>
          <article className="figma-exercises"><div className="figma-exercise-title"><h3>แผนฝึก · {selectedWeekday} {selectedDate.getDate()}</h3><button onClick={()=>setTab("Program")}>แก้ไข <ArrowRight size={13}/></button></div><p className="figma-plan-name">{activeProgram.name}</p>
            {activeProgram.trainingDays?.length ? <p className="figma-training-days">วันฝึกประจำสัปดาห์ · {activeProgram.trainingDays.join(" · ")}</p> : <p className="figma-training-days">เลือกวันใดก็ได้เพื่อดูโปรแกรม</p>}
            {activeWorkoutExercises.length ? activeWorkoutExercises.map(exercise=><div className="figma-exercise" key={exercise.id}><div className="figma-exercise-main"><span>{visibleExerciseName(exercise.name)}</span><small>x{exercise.sets.length} set</small></div><button className="figma-play" aria-label={`ดู ${visibleExerciseName(exercise.name)}`} onClick={()=>setMessage(`วิดีโอสาธิต ${visibleExerciseName(exercise.name)} จะเพิ่มเมื่อเชื่อมต่อคลังวิดีโอ`)}><Play size={12} fill="currentColor"/></button></div>) : <div className="calendar-rest-note"><b>{isScheduledWorkout ? "ยังไม่มีท่าในแผนวันนี้" : "วันนี้เป็นวันพัก"}</b><span>{isScheduledWorkout ? "เลือกแก้ไขโปรแกรมเพื่อเพิ่มท่าฝึก" : "เลือกวันที่มีจุดสีเขียวเพื่อดูวันที่มีแผนฝึก"}</span></div>}
          </article>
        </section>
      </section>}

      {tab === "Program" && <section className="figma-screen figma-program-screen"><label className="figma-search"><Image src="/assets/program-search.png" alt="" width={19} height={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search program"/></label><div className="figma-library-eyebrow"><span>PROGRAM LIBRARY</span><span>{visiblePlans.length} PLANS</span></div><h1>Finding your program<br/>for workout</h1><div className="figma-categories">{["Powerlifting","Bodybuilding","Hepertrophy"].map(cat=><button key={cat} className={programCategory===cat?"selected":""} onClick={()=>setProgramCategory(cat)}>{cat}</button>)}</div>
        <div className="figma-program-list">{visiblePlans.map((plan,i)=><article key={plan.id} className="figma-program-card"><span className={`figma-program-thumb thumb-${i%4}`}><Dumbbell size={24}/></span><span className="figma-routine-copy"><b>{plan.name}</b><small>{plan.schedule}</small><small>{plan.level} · {plan.sessions.length} วัน · {plan.sessions.reduce((sum,session)=>sum+session.exercises.length,0)} ท่า</small><a href={plan.sourceUrl} target="_blank" rel="noreferrer">อ้างอิง: {plan.sourceName}</a></span><button className="figma-use-program" onClick={()=>addCuratedProgram(plan)} aria-label={`เพิ่ม ${plan.name}`}><Plus size={17}/></button></article>)}</div>        <p className="figma-source-note">โปรแกรมเป็นตัวอย่างที่คัดและเรียบเรียงจากแหล่งอ้างอิง เปิดลิงก์เพื่อดูตารางเต็มและรายละเอียดการฝึก</p>
                <div className="figma-program-actions"><button onClick={()=>setModal("builder")}><Image src="/assets/program-self.png" alt="" width={22} height={22}/>Program yourself</button></div>
      </section>}

      {tab === "Analyse" && <section className="figma-screen analyse-dashboard">
        <header className="analyse-heading"><div><span className="analyse-kicker">TRAINING OVERVIEW</span><h1>วิเคราะห์การฝึก</h1><p>ภาพรวมสุขภาพและความสม่ำเสมอของคุณ</p></div><span className="analyse-heading-icon"><BarChart3 size={21}/></span></header>
        <section className="analyse-week-card"><div className="analyse-section-heading"><div><span className="analyse-kicker">สัปดาห์นี้</span><h2>{new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(weekStart)} – {new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(weekEnd.getTime() - 86400000))}</h2></div><span className="analyse-week-chip">จ. – อา.</span></div>
          <div className="analyse-week-stats"><div><strong>{workoutCount}</strong><span>วันฝึก</span></div><div><strong>{weekLogs.length}</strong><span>เซตที่ทำ</span></div><div><strong>{Math.round(weeklyVolume).toLocaleString()}</strong><span>ปริมาณรวม kg·ครั้ง</span></div></div>
          <div className="analyse-chart-title"><b>ปริมาณการฝึกในแต่ละวัน</b><span>น้ำหนัก × จำนวนครั้ง</span></div>
          <div className="analyse-volume-chart" role="img" aria-label={`กราฟปริมาณฝึก 7 วัน รวม ${Math.round(weeklyVolume)} กิโลกรัมคูณครั้ง`}>
            {dailyTraining.map((day) => <div className="analyse-chart-day" key={localDateKey(day.date)} title={`${day.label}: ${Math.round(day.volume).toLocaleString()} kg·ครั้ง · ${day.sets} เซต`}><div className="analyse-bar-space"><span className={day.volume ? "has-volume" : ""} style={{ height: `${Math.max(day.volume ? 9 : 3, day.volume / maxDailyVolume * 100)}%` }}/></div><b>{day.label}</b></div>)}
          </div>
        </section>
        <section className="analyse-card"><div className="analyse-section-heading"><div><span className="analyse-kicker">MUSCLE GROUPS</span><h2>สัปดาห์นี้ฝึกส่วนไหนแล้ว</h2></div><span className="analyse-mini-count">{muscleSummary.filter((item) => item.sets > 0).length}/{muscleGroups.length}</span></div>
          <div className="analyse-muscle-list">{muscleSummary.map((item) => <div className="analyse-muscle-row" key={item.group}><span className={`analyse-muscle-dot ${item.sets ? "trained" : ""}`}/><b>{item.group}</b><div className="analyse-muscle-track"><span style={{ width: `${weekLogs.length ? Math.min(100, item.sets / Math.max(...muscleSummary.map((muscle) => muscle.sets), 1) * 100) : 0}%` }}/></div><small>{item.sets ? `${item.sets} เซต` : "ยังไม่ได้ฝึก"}</small></div>)}</div>
          {!weekLogs.length && <p className="analyse-empty-note">เมื่อคุณติ๊กเซตเสร็จในหน้าออกกำลังกาย ระบบจะแสดงกล้ามเนื้อและกราฟของสัปดาห์นี้ที่นี่</p>}
        </section>
        <section className="analyse-card"><div className="analyse-section-heading"><div><span className="analyse-kicker">PROFILE CALCULATIONS</span><h2>คำนวณจากโปรไฟล์ล่าสุด</h2></div><button className="analyse-edit-link" onClick={editBodyRecord}>แก้ไขข้อมูล <ArrowRight size={14}/></button></div>
          <div className="analyse-profile-grid"><article><span>BMI</span><b>{bmi.toFixed(1)}</b><small>น้ำหนัก ÷ ส่วนสูง²</small></article><article><span>มวลไขมันโดยประมาณ</span><b>{fatMass.toFixed(1)} <i>kg</i></b><small>น้ำหนัก × ไขมัน {latestBody.fat}%</small></article><article><span>มวลไร้ไขมันโดยประมาณ</span><b>{leanMass.toFixed(1)} <i>kg</i></b><small>น้ำหนัก − มวลไขมัน</small></article><article><span>BMR</span><b>{basalCalories ? basalCalories.toLocaleString() : "—"} <i>kcal</i></b><small>{basalCalories ? "Mifflin–St Jeor" : "เพิ่มอายุและเพศในแผนโภชนาการ"}</small></article><article className="analyse-profile-wide"><span>พลังงานต่อวันโดยประมาณ · TDEE</span><b>{calorieEstimate ? calorieEstimate.toLocaleString() : "—"} <i>kcal</i></b><small>{calorieEstimate ? `BMR × ตัวคูณกิจกรรม ${calorieProfile.activity}` : "ตั้งค่าอายุ เพศ และกิจกรรม เพื่อคำนวณ"}</small></article></div>
          <div className="analyse-edit-actions"><button onClick={editBodyRecord}><Plus size={15}/> แก้ไขข้อมูลร่างกาย</button><button onClick={()=>setModal("nutrition")}><Flame size={15}/> ปรับค่าแคลอรี</button></div>
          <p className="analyse-disclaimer">ใช้ส่วนสูง น้ำหนัก และเปอร์เซ็นต์ไขมันล่าสุดใน Profile; ค่า BMI และพลังงานเป็นค่าประมาณ ไม่ใช่การวินิจฉัย</p>
        </section>
      </section>}

      {tab === "Profile" && <section className="figma-screen profile-dashboard">
        <header className="profile-page-heading"><div><span className="analyse-kicker">YOUR SPACE</span><h1>โปรไฟล์</h1><p>ข้อมูลบัญชีและภาพรวมโปรแกรมของคุณ</p></div><span className="profile-avatar-small"><CircleUserRound size={25}/></span></header>
        <section className="profile-identity-card"><div className="profile-identity-top"><div className="profile-avatar-large"><CircleUserRound size={43}/></div><span className={`profile-status ${userEmail ? "connected" : "local"}`}><i/>{userEmail ? "ซิงก์บัญชีแล้ว" : "บันทึกในอุปกรณ์นี้"}</span></div><h2>PONGSATHORN N</h2><p>{userEmail || "ยังไม่ได้เชื่อมต่อบัญชี"}</p><div className="profile-account-action">{userEmail ? <button onClick={()=>void signOut()}><LogOut size={15}/> ออกจากระบบ</button> : <button onClick={()=>setModal("auth")}><LogIn size={15}/> เชื่อมต่อบัญชี</button>}</div></section>
        <section className="profile-section-card"><div className="profile-section-heading"><div><span className="analyse-kicker">BODY SNAPSHOT</span><h2>ข้อมูลร่างกายล่าสุด</h2></div><button onClick={()=>setTab("Analyse")}>ดูการวิเคราะห์ <ArrowRight size={14}/></button></div><div className="profile-body-grid"><article><span>ส่วนสูง</span><b>{latestBody.height}<small>cm</small></b></article><article><span>น้ำหนัก</span><b>{latestBody.weight}<small>kg</small></b></article><article><span>มวลกล้ามเนื้อ</span><b>{latestBody.muscle}<small>kg</small></b></article><article><span>ไขมันในร่างกาย</span><b>{latestBody.fat}<small>%</small></b></article></div><small className="profile-readonly-note">แก้ไขข้อมูลร่างกายและดูแนวโน้มได้ที่หน้า Analyse</small></section>
        <section className="profile-section-card profile-program-card"><div className="profile-section-heading"><div><span className="analyse-kicker">CURRENT PROGRAM</span><h2>โปรแกรมที่เลือก</h2></div><Dumbbell size={18}/></div><div className="profile-current-program"><span className="profile-program-icon"><Activity size={19}/></span><div><b>{activeProgram.name}</b><small>{activeProgram.goal || "โปรแกรมออกกำลังกาย"}</small></div></div><div className="profile-program-meta"><span><Dumbbell size={13}/>{activeProgram.exercises.length} ท่า</span><span><Clock3 size={13}/>{activeProgram.minutesPerSession ?? 60} นาที/ครั้ง</span></div><button className="profile-program-link" onClick={()=>setTab("Program")}>ดูโปรแกรมทั้งหมด <ArrowRight size={15}/></button></section>
        <button className="profile-analysis-link" onClick={()=>setTab("Analyse")}><span><HeartPulse size={17}/></span><div><b>สถิติและการคำนวณร่างกาย</b><small>ดูข้อมูลการฝึกประจำสัปดาห์</small></div><ChevronRight size={17}/></button>
      </section>}
      {!workoutScreenVisible && <nav className="bottom-nav" aria-label="เมนูหลัก">{([ ["Program", <Dumbbell/>], ["Workout", <Activity/>], ["Analyse", <BarChart3/>], ["Profile", <UserRound/>] ] as [Tab, ReactNode][]).map(([name, icon]) => <button key={name} className={`nav-item ${tab === name ? "active" : ""}`} onClick={() => setTab(name)}>{icon}<span>{name === "Workout" ? "Workout" : name === "Program" ? "Program" : name === "Analyse" ? "Analyse" : "Profile"}</span></button>)}</nav>}

      {message && <div className="toast" role="status"><span>{message}</span><button onClick={() => setMessage("")} aria-label="ปิด"><X size={16}/></button></div>}
      {!ready && <div className="loading-cover"><span className="loader"/>กำลังเตรียมข้อมูลของคุณ</div>}
      {modal && <Modal title={modal === "builder" ? "สร้างโปรแกรมของฉัน" : modal === "body" ? "บันทึกข้อมูลร่างกาย" : modal === "nutrition" ? "แผนโภชนาการ" : "บัญชี BEST"} onClose={() => setModal(null)}>
        {modal === "builder" && <div className="modal-form">
          <label className="field-label" htmlFor="program-name">ชื่อโปรแกรม</label>
          <input id="program-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="เช่น Upper Body"/>
          <div className="builder-section-title"><span>01</span><b>เลือกท่าออกกำลังกาย</b><small>{chosen.length} ท่า</small></div>
          <div className="search-box"><Search size={17}/><input aria-label="ค้นหาท่า" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาท่าออกกำลังกาย"/></div>
          <div className="filter-pills">{groups.map((group) => <button key={group} className={filter === group ? "selected" : ""} onClick={() => setFilter(group)}>{group}</button>)}</div>
          <div className="exercise-picker">{filteredExercises.map((exercise) => <button className={`picker-row ${chosen.includes(exercise.name) ? "picked" : ""}`} key={exercise.name} onClick={() => setChosen((items) => items.includes(exercise.name) ? items.filter((item) => item !== exercise.name) : [...items, exercise.name])}><span className="picker-icon"><Dumbbell size={17}/></span><span><b>{exercise.name}</b><small>{exercise.group}</small></span><span className="check-circle">{chosen.includes(exercise.name) && <Check size={14}/>}</span></button>)}</div>
          <div className="builder-section-title"><span>02</span><b>กำหนดเซตและจำนวนครั้ง</b></div>
          <div className="set-config"><label>จำนวนเซต<input aria-label="จำนวนเซต" type="number" min="1" max="8" value={customSets} onChange={(e) => setCustomSets(e.target.value)}/></label><label>จำนวนครั้ง/เซต<input aria-label="จำนวนครั้งต่อเซต" type="number" min="1" value={customReps} onChange={(e) => setCustomReps(e.target.value)}/></label></div>
          <section className="set-weight-editor" aria-label="กำหนดน้ำหนักแต่ละเซต">
            <div className="editor-heading"><b><span className="builder-step-number">03</span>น้ำหนักแยกแต่ละเซต</b><span>kg · ใส่ 0 หากไม่เพิ่มน้ำหนัก</span></div>
            {chosen.length === 0 ? <p className="editor-empty">เลือกท่าก่อน แล้วกำหนดน้ำหนักแต่ละเซต</p> : chosen.map((name) => <div className="exercise-weight-card" key={name}><b>{name}</b><div className="weight-set-grid">{Array.from({ length: Math.min(8, Math.max(1, Number(customSets) || 3)) }, (_, index) => <label key={index}>เซต {index + 1}<input aria-label={`${name} เซต ${index + 1} น้ำหนัก กิโลกรัม`} type="number" min="0" step="0.5" placeholder="0" value={customSetWeights[name]?.[index] ?? ""} onChange={(e) => updateCustomSetWeight(name, index, e.target.value)}/></label>)}</div></div>)}
          </section>
          <section className="training-day-editor"><div className="editor-heading"><b><span className="builder-step-number">04</span>เลือกวันที่จะฝึก</b><span>เลือกได้หลายวัน</span></div><div className="training-day-list">{["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์", "อาทิตย์"].map((day) => <button type="button" key={day} className={`training-day-chip ${customDays.includes(day) ? "selected" : ""}`} aria-pressed={customDays.includes(day)} onClick={() => toggleCustomDay(day)}>{day}</button>)}</div></section>
          <button className="primary-submit" onClick={createCustomProgram}>บันทึก {chosen.length} ท่า <ArrowRight size={17}/></button>
        </div>}
        {modal === "body" && <div className="modal-form"><p className="modal-intro">บันทึกข้อมูลวันนี้เพื่อดูแนวโน้มความก้าวหน้าของคุณ</p>{([["weight", "น้ำหนัก", "kg"], ["height", "ส่วนสูง", "cm"], ["muscle", "มวลกล้ามเนื้อ", "kg"], ["fat", "ไขมันในร่างกาย", "%"]] as const).map(([key, label, unit]) => <label className="field-label" key={key}>{label}<div className="input-with-unit"><input type="number" min="0" step="0.1" value={bodyDraft[key]} onChange={(e) => setBodyDraft((d) => ({ ...d, [key]: e.target.value }))}/><span>{unit}</span></div></label>)}<button className="primary-submit" onClick={() => void saveBody()}>บันทึกข้อมูล <Check size={17}/></button></div>}
        {modal === "nutrition" && <div className="modal-form">
          <div className="nutrition-total"><Flame size={18}/><span>พลังงานที่ใช้ต่อวันโดยประมาณ</span><b>{displayedCalories?.toLocaleString() ?? "—"} kcal</b></div>
          <p className="modal-intro">คำนวณจากน้ำหนัก {latestBody.weight} kg และส่วนสูง {latestBody.height} cm ที่บันทึกล่าสุด</p>
          <label className="field-label" htmlFor="calorie-age">อายุ (19–78 ปี)<input id="calorie-age" type="number" min="19" max="78" value={calorieProfile.age} onChange={(e) => setCalorieProfile((current) => ({ ...current, age: e.target.value }))} placeholder="ระบุอายุ"/></label>
          <label className="field-label">เพศในสมการคำนวณ<div className="choice-row">{[["male", "ชาย"], ["female", "หญิง"], ["average", "ใช้ค่ากลาง"]].map(([value, label]) => <button type="button" key={value} className={`choice-chip ${calorieProfile.sex === value ? "selected" : ""}`} aria-pressed={calorieProfile.sex === value} onClick={() => setCalorieProfile((current) => ({ ...current, sex: current.sex === value ? "" : value }))}>{label}</button>)}</div></label>
          <label className="field-label" htmlFor="calorie-activity">ระดับกิจกรรมโดยรวม<select id="calorie-activity" value={calorieProfile.activity} onChange={(e) => setCalorieProfile((current) => ({ ...current, activity: e.target.value }))}><option value="1.2">นั่งเป็นส่วนใหญ่</option><option value="1.375">กิจกรรมเบา · 1–3 วัน/สัปดาห์</option><option value="1.55">กิจกรรมปานกลาง · 3–5 วัน/สัปดาห์</option><option value="1.725">กิจกรรมหนัก · 6–7 วัน/สัปดาห์</option></select></label>
          {calorieEstimate ? <p className="calorie-method-note">คำนวณด้วยสมการ Mifflin–St Jeor และระดับกิจกรรม เป็นค่าประมาณสำหรับผู้ใหญ่</p> : <p className="calorie-method-note">กรอกอายุและเลือกเพศในสมการเพื่อดูค่าประมาณ</p>}
          <label className="field-label" htmlFor="food-style">รูปแบบแผนอาหาร</label><select id="food-style" value={planStyle} onChange={(e) => setPlanStyle(e.target.value)}>{["สมดุล", "คีโต", "IF", "ไขมันต่ำ", "คาร์โบไฮเดรตต่ำ · เน้นโปรตีน"].map((style) => <option key={style}>{style}</option>)}</select>
          {plannedMeals.length ? <>
            <div className="meal-allocation-note"><b>สัดส่วนสำหรับแผน{planStyle}</b><span>{mealAllocationText}</span><small>{mealAllocationDescription}</small></div>
            <div className="meal-list">{plannedMeals.map((meal) => <div className="meal-row" key={meal.name}><div className="meal-top"><b>{meal.name}<small>{meal.share}%</small></b><span>{meal.calories} kcal</span></div><p className="meal-suggestion">{meal.suggestion}</p><div className="macro-bars"><span>คาร์บ <b>{meal.carbs} g</b></span><span>โปรตีน <b>{meal.protein} g</b></span><span>ไขมัน <b>{meal.fat} g</b></span></div></div>)}</div>
            <p className="training-meal-note">{mealPlanNote}</p>
            <details className="meal-evidence"><summary>วิเคราะห์และดูแหล่งอ้างอิง</summary><div className="meal-evidence-body">
              <p><b>แผน{planStyle}:</b> {mealAllocationDescription} แบ่งโปรตีนรายวันให้ใกล้เคียงกันในแต่ละมื้อ เพื่อให้แต่ละมื้อมีแหล่งโปรตีนประกอบ</p>
              {planStyle === "IF" && <p>IF คือการกำหนดช่วงเวลากิน ไม่ใช่สูตรกำหนดชนิดอาหารหรือจำนวนแคลอรีตายตัว ตัวอย่างนี้แบ่งเป็นสองมื้อในช่วงกินที่ผู้ใช้จัดเอง งานทดลองในผู้ใหญ่ที่มี metabolic syndrome ใช้ช่วงกิน 8–10 ชั่วโมงและพบผลดีเล็กน้อยใน 3 เดือน แต่ผู้วิจัยระบุว่ายังต้องติดตามผลระยะยาว</p>}
              {planStyle === "คีโต" && <p>แผนนี้จำกัดคาร์บไม่เกิน 50 g/วันเพื่อเป็นตัวอย่างสไตล์คีโต ไม่รับประกันว่าจะเกิด ketosis ในแต่ละคน และผู้ใช้ยารักษาเบาหวานหรือมีโรคประจำตัวควรคุยกับบุคลากรสุขภาพก่อน</p>}
              {planStyle === "ไขมันต่ำ" && <p>ตั้งไขมันไว้ประมาณ 20% ของพลังงาน ซึ่งอยู่ที่ขอบล่างของช่วง AMDR สำหรับผู้ใหญ่ (20–35%); ใช้เป็นแนวทางจัดสัดส่วน ไม่ได้หมายถึงตัดไขมันจำเป็นทิ้ง</p>}
              {planStyle === "คาร์โบไฮเดรตต่ำ · เน้นโปรตีน" && <p>ตัวอย่างนี้จำกัดคาร์บไม่เกิน 25% ของพลังงานและไม่เกิน 130 g/วัน พร้อมตั้งโปรตีน 2 g/kg ซึ่งอยู่ในช่วงที่ ISSN ระบุว่าเพียงพอสำหรับผู้ที่ออกกำลังกายส่วนใหญ่ (1.4–2.0 g/kg/วัน)</p>}
              {planStyle === "สมดุล" && <p>สัดส่วนเช้า 35% · กลางวัน 40% · เย็น 25% เป็นการเลือกแบบปานกลางตามหลักฐานเรื่องการรับพลังงานช่วงต้นวัน ไม่ใช่สัดส่วนที่มีหลักฐานยืนยันว่าเหมาะกับทุกคน</p>}
              <p>งานทบทวน 9 การทดลองพบแนวโน้มเล็กน้อยว่าการกระจายพลังงานไปช่วงเช้าและกลางวันให้ผลดีกว่าการเน้นช่วงเย็น แต่ผลต่างกันสูง และเมื่อเอาการทดลองหนึ่งออก ผลรวมไม่ชัดเจน ส่วน meta-analysis ปี 2024 มีการทดลองเรื่องกระจายแคลอรีเพียง 4 ชิ้นและให้ความเชื่อมั่นหลักฐานต่ำ</p>
              <p>ตัวอย่างอาหารสมดุลอิงแนวทางจานอาหารที่แนะนำผักและผลไม้ประมาณครึ่งจาน ธัญพืชไม่ขัดสีและโปรตีนอย่างละประมาณหนึ่งในสี่ ส่วนคาร์บและเวลาอาหารปรับตามตารางฝึกและความสะดวก</p>
              <ul>
                <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10078448/" target="_blank" rel="noreferrer">Systematic review: กระจายพลังงานช่วงต้นวัน (9 RCTs)</a></li>
                <li><a href="https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2825747" target="_blank" rel="noreferrer">JAMA Network Open: วิเคราะห์รวมการทดลองเรื่องเวลาอาหาร</a></li>
                <li><a href="https://onlinelibrary.wiley.com/doi/10.1002/oby.20460" target="_blank" rel="noreferrer">การทดลองเปรียบเทียบมื้อเช้าหนักกับมื้อเย็นหนัก</a></li>
                <li><a href="https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/" target="_blank" rel="noreferrer">Harvard Healthy Eating Plate: แนวทางจัดสัดส่วนอาหาร</a></li>
                <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/" target="_blank" rel="noreferrer">ISSN: โปรตีนและการออกกำลังกาย</a></li>
                <li><a href="https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-macronutrients.html" target="_blank" rel="noreferrer">Health Canada: ช่วงสัดส่วนสารอาหารสำหรับผู้ใหญ่</a></li>
                <li><a href="https://www.nih.gov/news-events/nih-research-matters/time-restricted-eating-metabolic-syndrome" target="_blank" rel="noreferrer">NIH: การกินแบบจำกัดช่วงเวลา (time-restricted eating)</a></li>
              </ul>
            </div></details>
          </> : <p className="calorie-method-note">กรอกข้อมูลเพื่อดูตัวอย่างการแบ่งพลังงานและสารอาหารรายมื้อ</p>}
          <button className="primary-submit" onClick={() => void saveNutrition()} disabled={!calorieEstimate}>บันทึกแผนนี้ <Check size={17}/></button>
          <small className="disclaimer">เป็นค่าประมาณ ไม่ใช่คำแนะนำทางการแพทย์ ความต้องการจริงอาจแตกต่างกัน</small>
        </div>}
        {modal === "auth" && <AuthForm onSubmit={authenticate}/>}
      </Modal>}
    </main>
  );
}

function Metric({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: ReactNode }) { return <div className="metric-card"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><strong>{value}<small> {unit}</small></strong><span className="metric-foot">อัปเดตล่าสุด</span></div>; }

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-sheet" role="dialog" aria-modal="true" aria-label={title}><div className="modal-grabber"/><header className="modal-header"><button className="modal-back" onClick={onClose} aria-label="กลับ"><ArrowLeft size={19}/></button><h2>{title}</h2><button className="modal-close" onClick={onClose} aria-label="ปิด"><X size={19}/></button></header><div className="modal-body">{children}</div></section></div>; }

function AuthForm({ onSubmit }: { onSubmit: (email: string, password: string, signup: boolean) => Promise<void> }) { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [signup, setSignup] = useState(false); return <form className="modal-form" onSubmit={(e) => { e.preventDefault(); void onSubmit(email, password, signup); }}><div className="step-note"><LogIn size={17}/> ใช้ Supabase Auth เพื่อซิงก์ข้อมูลระหว่างอุปกรณ์</div><label className="field-label">อีเมล<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></label><label className="field-label">รหัสผ่าน<input type="password" required minLength={6} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร"/></label><button className="primary-submit" type="submit">{signup ? "สร้างบัญชี" : "ลงชื่อเข้าใช้"} <ArrowRight size={17}/></button><button type="button" className="switch-auth" onClick={() => setSignup((v) => !v)}>{signup ? "มีบัญชีแล้ว? ลงชื่อเข้าใช้" : "ยังไม่มีบัญชี? สร้างบัญชี"}</button>{!hasSupabaseConfig() && <small className="disclaimer">ต้องตั้งค่า URL และ Publishable key ในไฟล์ .env.local ก่อน</small>}</form>; }
