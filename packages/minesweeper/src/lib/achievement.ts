export const Achievement = {
    completeEasyMode: "completeEasyMode",
    completeMediumMode: "completeMediumMode",
    completeHardMode: "completeHardMode",
    completeEasyModeFast: "completeEasyModeFast",
    completeMediumModeFast: "completeMediumModeFast",
    completeHardModeFast: "completeHardModeFast",
    completeEasyModePerfect: "completeEasyModePerfect",
    completeMediumModePerfect: "completeMediumModePerfect",
    completeHardModePerfect: "completeHardModePerfect",
    completeEasyModeLessSteps: "completeEasyModeLessSteps",
    completeMediumModeLessSteps: "completeMediumModeLessSteps",
    completeHardModeLessSteps: "completeHardModeLessSteps",
    completeEasyModeWithoutFlag: "completeEasyModeWithoutFlag",
    completeMediumModeWithoutFlag: "completeMediumModeWithoutFlag",
    completeHardModeWithoutFlag: "completeHardModeWithoutFlag",
} as const;

export type AchievementKey = keyof typeof Achievement;
