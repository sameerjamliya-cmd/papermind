import type { LearningProfile } from "./types";

export function formatMemory(profile: LearningProfile): string {
  const parts: string[] = [];

  if (profile.summary) {
    parts.push(`Summary: ${profile.summary}`);
  }

  if (profile.learningTrajectory) {
    parts.push(`Trajectory: ${profile.learningTrajectory}`);
  }

  if (profile.strongAreas.length > 0) {
    parts.push(`Strong areas: ${profile.strongAreas.join(", ")}`);
  }

  if (profile.weakAreas.length > 0) {
    parts.push(`Weak areas: ${profile.weakAreas.join(", ")}`);
  }

  if (profile.recommendedFocus.length > 0) {
    parts.push(`Recommended focus: ${profile.recommendedFocus.join(", ")}`);
  }

  return parts.join("\n");
}
