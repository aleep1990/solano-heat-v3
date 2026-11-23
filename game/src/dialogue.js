// SOLANO HEAT — dialogue: the story lines that play in the dialogue
// box (speaker portrait + line), plus the mission-start briefings.
// The box shows one line at a time and queues the rest.

export const CREW_LINES = {
  RICO: [
    'Plates are clean. Drive like you stole it — because you did.',
    'I can lose any tail. Just keep the pedal down.',
    'That was close. Next time, let me drive.',
  ],
  LENA: [
    'Engine sounds rough. Bring it by the garage when you can.',
    'I tuned the suspension. She corners like a dream now.',
    'Armour is holding. Barely. Do not test it again.',
  ],
  KIKI: [
    'Two units on the avenue, one on the pier. Go now.',
    'I see a roadblock forming at the marina. Take the side streets.',
    'Helicopter is circling back. Stay under the overpass.',
  ],
};

export const DANTE_LINES = [
  'One last job. That is what I said last time too.',
  'Port Solano never sleeps. Neither do I.',
  'Four stars… the whole city is coming. Drive like you mean it, Dante.',
];

export function pushDialogue(S, speaker, line, colour = '#e86a1a') {
  S.dialogue.push({ speaker, line, colour, at: S.time });
  if (S.dialogue.length > 4) S.dialogue.shift();
  S.dialogueUntil = S.time + 7;
}

export function currentDialogue(S) {
  if (S.time > S.dialogueUntil) return null;
  return S.dialogue[S.dialogue.length - 1] || null;
}

export function clearDialogue(S) {
  S.dialogue = [];
  S.dialogueUntil = 0;
}
