export type AudioTagGroup = {
  label: string;
  tags: string[];
};

export const AUDIO_TAG_GROUPS: AudioTagGroup[] = [
  {
    label: "Emotions",
    tags: [
      "excited",
      "happy",
      "sad",
      "angry",
      "nervous",
      "frustrated",
      "curious",
      "crying",
      "tired",
      "hopeful",
      "annoyed",
      "sarcastic",
    ],
  },
  {
    label: "Delivery",
    tags: [
      "whispers",
      "shouts",
      "softly",
      "deadpan",
      "cheerfully",
      "playfully",
      "dramatic tone",
      "serious tone",
      "slowly",
      "rushed",
      "stammers",
      "hesitates",
    ],
  },
  {
    label: "Reactions",
    tags: [
      "laughs",
      "laughs harder",
      "chuckles",
      "giggles",
      "sighs",
      "exhales",
      "gasps",
      "gulps",
      "snorts",
      "clears throat",
      "coughs",
      "yawns",
      "groans",
    ],
  },
  {
    label: "Pauses & pacing",
    tags: ["pause", "short pause", "long pause", "interrupting", "drawn out"],
  },
];
