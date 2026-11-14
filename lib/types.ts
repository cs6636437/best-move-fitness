export type ExerciseSet = { id: string; weight: number; reps: number; done: boolean };
export type Exercise = { id: string; name: string; group: string; sets: ExerciseSet[] };
export type Program = { id: string; name: string; source: "AI" | "สร้างเอง" | "สำเร็จรูป"; goal: string; durationWeeks?: number; trainingDays?: string[]; minutesPerSession?: number; targetWeightKg?: number; exercises: Exercise[]; createdAt: string };
export type BodyRecord = { id: string; date: string; weight: number; height: number; muscle: number; fat: number };
export type NutritionPlan = { id: string; calories: number; protein: number; carbs: number; fat: number; style: string; createdAt: string };
export type WorkoutLog = { id: string; sessionId: string; setId?: string; programName: string; exerciseName: string; muscleGroup: string; weight: number; reps: number; completedAt: string };
export type AppData = { programs: Program[]; bodyRecords: BodyRecord[]; nutritionPlans: NutritionPlan[] };
