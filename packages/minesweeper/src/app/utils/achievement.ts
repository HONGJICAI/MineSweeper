const Achievement = {
    // basic
    completeEasyMode: "completeEasyMode",
    completeMediumMode: "completeMediumMode",
    completeHardMode: "completeHardMode",
    // speedrun
    completeEasyModeFast: "completeEasyModeFast",
    completeMediumModeFast: "completeMediumModeFast",
    completeHardModeFast: "completeHardModeFast",
    // perfect
    completeEasyModePerfect: "completeEasyModePerfect",
    completeMediumModePerfect: "completeMediumModePerfect",
    completeHardModePerfect: "completeHardModePerfect",
    // lessSteps
    completeEasyModeLessSteps: "completeEasyModeLessSteps",
    completeMediumModeLessSteps: "completeMediumModeLessSteps",
    completeHardModeLessSteps: "completeHardModeLessSteps",
    // without flag
    completeEasyModeWithoutFlag: "completeEasyModeWithoutFlag",
    completeMediumModeWithoutFlag: "completeMediumModeWithoutFlag",
    completeHardModeWithoutFlag: "completeHardModeWithoutFlag",
    // retry
    completeAfterRetry: "completeAfterRetry",
    fasterAfterRetry: "fasterAfterRetry",
    failedAfterRetry: "failedAfterRetry",
    retryAfterRetry: "retryAfterRetry"
} as const;

function activateAchievement(
    achievement: keyof typeof Achievement,
): boolean {
    console.log(`Achievement activated: ${achievement}`);
    return true;
}

export { Achievement, activateAchievement };