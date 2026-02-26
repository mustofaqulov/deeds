export const DAILY_QUESTS = [
  {
    id: 'dq_namoz_quran',
    title: "Namoz va Qur'on",
    desc: "Namoz va Qur'on o'qishni bajaring",
    requiredIds: ['namoz', 'quran'],
    bonusXP: 40,
    icon: '🕌',
  },
  {
    id: 'dq_three_tasks',
    title: 'Uch ibodat',
    desc: 'Istalgan 3 ta ibodatni bajaring',
    requiredCount: 3,
    bonusXP: 50,
    icon: '⭐',
  },
  {
    id: 'dq_zikr_quran',
    title: "Zikr va Qur'on",
    desc: "Zikr va Qur'on o'qishni bajaring",
    requiredIds: ['zikr', 'quran'],
    bonusXP: 35,
    icon: '📿',
  },
  {
    id: 'dq_tahajjud_any',
    title: 'Kechgi Ibodat',
    desc: 'Tahajjud yoki Zikrni bajaring',
    requiredIds: ['tahajjud', 'zikr'],
    requireAny: true,
    bonusXP: 45,
    icon: '🌙',
  },
  {
    id: 'dq_sadaqa_zikr',
    title: 'Saxiy va Zikrli Kun',
    desc: 'Sadaqa va Zikrni bajaring',
    requiredIds: ['sadaqa', 'zikr'],
    bonusXP: 55,
    icon: '🤲',
  },
  {
    id: 'dq_namoz_sadaqa',
    title: 'Namoz va Saxovat',
    desc: 'Namoz va sadaqani bajaring',
    requiredIds: ['namoz', 'sadaqa'],
    bonusXP: 50,
    icon: '🤲',
  },
  {
    id: 'dq_all_five',
    title: 'Mukammal Kun',
    desc: 'Barcha 5 ta ibodatni bajaring',
    requiredCount: 5,
    bonusXP: 80,
    icon: '💎',
  },
];

export function getDailyQuest(date = new Date()) {
  const dayIndex = Math.floor(new Date(date).setHours(0, 0, 0, 0) / 86400000);
  const idx = Math.abs(dayIndex) % DAILY_QUESTS.length;
  return DAILY_QUESTS[idx];
}

export function getQuestProgress(quest, todayDoneIds) {
  if (!quest) return { done: 0, total: 1, complete: false };

  if (quest.requiredCount) {
    const done = Math.min(todayDoneIds.length, quest.requiredCount);
    return { done, total: quest.requiredCount, complete: done >= quest.requiredCount };
  }

  if (quest.requireAny) {
    const complete = quest.requiredIds.some((id) => todayDoneIds.includes(id));
    return { done: complete ? 1 : 0, total: 1, complete };
  }

  const done = quest.requiredIds.filter((id) => todayDoneIds.includes(id)).length;
  return { done, total: quest.requiredIds.length, complete: done >= quest.requiredIds.length };
}
