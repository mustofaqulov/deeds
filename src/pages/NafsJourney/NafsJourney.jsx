import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiSaveNafsStage } from '../../lib/api';
import {
  IconBarChart,
  IconBolt,
  IconBookOpen,
  IconBookmark,
  IconCheckCircle,
  IconEdit,
  IconFire,
  IconHeart,
  IconTarget,
  IconXP,
} from '../../components/Icons/RamadanIcons';
import {
  ANGER_SOS_STEPS,
  NAFS_ARTICLE_LIBRARY,
  NAFS_STAGE_EVIDENCE,
  ULAMA_NASIHA,
} from '../../utils/nafsResources';
import './NafsJourney.css';

const TRACKER_TARGET_DAYS = 7;
const TRACKER_REQUIRED_DAYS = 3;
const NOTE_MIN_CHARS = 40;
const RECENT_DAYS = 7;
const WEEKLY_REVIEW_XP = 35;
const SOS_DAILY_XP = 20;
const RESOURCE_READ_XP = 10;
const ARTICLE_ACTION_XP = 18;
const ARTICLE_NOTE_MIN_CHARS = 12;
const SOS_TIMER_SECONDS = 180;
const WEEKDAY_LABELS = ['Yak', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'];

const NAFS_STAGES = [
  {
    id: 1,
    name: 'Nafsi Ammora',
    subtitle: 'Yomonlikka undovchi nafs',
    ayah: 'Yusuf 12:53',
    xpReward: 45,
    summary: "Bu bosqichda inson nafs istaklariga ergashadi. Maqsad: o'zini tiyish va gunohdan qaytish.",
    reflectionPrompt: 'Bugun qaysi holatda nafsim meni tez qarorga undadi?',
    practices: [
      { id: 'identify_trigger', text: "Kun davomida 1 ta kuchli nafsiy odatni aniqlang va uni to'xtating." },
      { id: 'control_habit', text: "Ovqat, uyqu va internet iste'molida aniq me'yor qo'ying." },
      { id: 'night_check', text: "Kechqurun 5 daqiqa muhasaba qiling: bugun qayerda nafs yutdi?" },
    ],
  },
  {
    id: 2,
    name: 'Nafsi Lavvoma',
    subtitle: "O'zini malomat qiluvchi nafs",
    ayah: 'Qiyomat 75:2',
    xpReward: 55,
    summary: "Nafsi Lavvoma - qalb uyg'onib, xatodan keyin o'zini malomat qiladigan va tavbaga qaytaradigan bosqich.",
    heartMessage: `Lavvoma eshigidasan.
Bu yer jalol dasturxoni, pushaymonliklar vodiysi, xatolarni takrorlash fasli.
Bu yerda mashg'ul bo'lib qolma. Bu diyordan tezroq ko'ch.
Lavvoma eshigidan o'tib ol, zikringni yangilaylik.

Inson nafs sohibidir.
"G'aflatga tushmayman" degan kishi ba'zan g'aflatda ekanini ham bilmay qoladi.
Hatto qumursqaga ham ulkan nazar bilan qaragin - uning ham joni bor.
Haqqa xizmat oxirida xalqqa xizmatdir.
Bo'l, do'stim: bu yerda uzoq to'xtab qolma.`,
    reflectionPrompt: "Bugun qaysi g'aflatimni tan oldim va zikrimni yangilash uchun qaysi aniq qadamni qo'ydim?",
    practices: [
      { id: 'repent_fast', text: "Xatoni yashirmang: nomini yozing, darhol tavba va isti'gfor bilan qayting." },
      { id: 'pause_impulse', text: "Nafsiy impuls kelganda 10 soniya sukut qiling va javobni kechiktiring." },
      { id: 'write_balance', text: "Kechki muhasaba: bugungi 1 g'aflat, 1 tuzatish va ertangi 1 xizmat amalini yozing." },
    ],
  },
  {
    id: 3,
    name: 'Nafsi Mulhima',
    subtitle: 'Ilhomlangan nafs',
    ayah: 'Shams 91:8',
    xpReward: 65,
    summary: "Yaxshilik va yomonlik farqi ravshanlashadi. Inson halol-haromga sezgir bo'lib boradi.",
    reflectionPrompt: 'Bugungi ilhomimni amaliy yaxshilikka aylantira oldimmi?',
    practices: [
      { id: 'secret_good', text: 'Har kuni kamida 1 ta yashirin yaxshilik qiling.' },
      { id: 'halal_focus', text: "Halol rizq va halol so'zga alohida e'tibor bering." },
      { id: 'daily_ilm', text: "Har kuni kamida 10 daqiqa ilm yoki Qur'on bilan mashg'ul bo'ling." },
    ],
  },
  {
    id: 4,
    name: "Nafsi Mutma'inna",
    subtitle: 'Xotirjam nafs',
    ayah: "Fajr 89:27, Ra'd 13:28",
    xpReward: 75,
    summary: "Qalb zikr bilan taskin topadi. Nafs shoshqaloqlikdan chiqib, sokinlikka kiradi.",
    reflectionPrompt: 'Qaysi vaziyatda qalb sokinligini saqlab qoldim?',
    practices: [
      { id: 'zikr_routine', text: 'Tong va kech zikrini muntazam qiling.' },
      { id: 'worship_stability', text: "Qiyin vaziyatda ham ibodat tartibini buzmaslikka harakat qiling." },
      { id: 'tafakkur_time', text: 'Kuniga kamida 1 marta sukut va tafakkur vaqti ajrating.' },
    ],
  },
  {
    id: 5,
    name: 'Nafsi Roziya',
    subtitle: "Allohning taqdiridan rozi bo'luvchi nafs",
    ayah: 'Fajr 89:28',
    xpReward: 85,
    summary: "Bu bosqichda inson ne'mat va sinovda ham shukr va sabr bilan qoladi.",
    reflectionPrompt: "Sinovli vaziyatda norozilik o'rniga qanday shukr amali qildim?",
    practices: [
      { id: 'gratitude_3', text: "Har kuni 3 ta ne'mat uchun shukr yozing." },
      { id: 'alhamdulillah', text: "Norozi holatda darhol 'Alhamdulillah ala kulli hal'ni eslang." },
      { id: 'process_focus', text: "Qarorlarda natijaga emas, to'g'ri amal qilishga urg'u bering." },
    ],
  },
  {
    id: 6,
    name: 'Nafsi Marziya',
    subtitle: "Alloh rozi bo'lgan nafs",
    ayah: 'Fajr 89:28',
    xpReward: 95,
    summary: "Bandaning amali ixlos bilan pishadi. Nafs xizmat va adolatga moyil bo'ladi.",
    reflectionPrompt: 'Qaysi xizmatni maqtov kutmasdan ado eta oldim?',
    practices: [
      { id: 'daily_service', text: 'Har kuni bir kishiga manfaat yetkazadigan aniq amal qiling.' },
      { id: 'without_praise', text: 'Maqtov kutmasdan xizmat qilishni odat qiling.' },
      { id: 'check_niyat', text: 'Niyatni tekshiring: bu amal kim uchun?' },
    ],
  },
  {
    id: 7,
    name: 'Nafsi Sofiya (Komila)',
    subtitle: 'Poklangan va komillikka yaqin nafs',
    ayah: 'Fotir 35:18',
    xpReward: 120,
    summary: "Bu yuksak maqomda qalb pokligi va ixlos ustun bo'ladi. Maqsad: doimiy sobitlik.",
    reflectionPrompt: "Qalbimda qolgan eng kuchli ichki to'siq nima va uni qanday yengaman?",
    practices: [
      { id: 'sunnah_life', text: "Sunnatga muvofiq hayot tartibini mustahkamlang." },
      { id: 'clean_heart', text: "Qalbni hasad, kibr, riyo va g'azabdan doimiy tozalang." },
      { id: 'systemized_amal', text: "Ilm, zikr, xizmat va tavbani bitta tizimga aylantiring." },
    ],
  },
];

const JOURNEY_DEFAULTS = {
  selfAssessedStageId: null,
  selfAssessedAt:      null,
  completedStages: [],
  stageTasks: {},
  stageTracker: {},
  stageNotes: {},
  weeklyReviews: {},
  badgesClaimed: {},
  resourceReads: {},
  sosLogs: {},
  xpEvents: [],
  articleParagraphNotes: {},
  articleActionChecks: {},
  articleActionRewards: {},
};

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeObject = (value) => (value && typeof value === 'object' ? value : {});
const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const isNoteReady = (text = '') => text.trim().length >= NOTE_MIN_CHARS;
const formatSeconds = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

function getRecentDays(count = RECENT_DAYS) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    days.push({
      key: getDateKey(date),
      label: WEEKDAY_LABELS[date.getDay()],
      dayNum: date.getDate(),
      isToday: offset === 0,
    });
  }

  return days;
}

function getWeekKey(date = new Date()) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function hasReviewAnswers(review) {
  if (!review) return false;
  return ['wins', 'blockers', 'plan'].every((field) => Boolean((review[field] || '').trim()));
}

function normalizeJourney(rawJourney) {
  const raw = safeObject(rawJourney);
  return {
    ...JOURNEY_DEFAULTS,
    ...raw,
    selfAssessedStageId: raw.selfAssessedStageId ?? null,
    selfAssessedAt:      raw.selfAssessedAt      ?? null,
    completedStages: safeArray(raw.completedStages),
    stageTasks: safeObject(raw.stageTasks),
    stageTracker: safeObject(raw.stageTracker),
    stageNotes: safeObject(raw.stageNotes),
    weeklyReviews: safeObject(raw.weeklyReviews),
    badgesClaimed: safeObject(raw.badgesClaimed),
    resourceReads: safeObject(raw.resourceReads),
    sosLogs: safeObject(raw.sosLogs),
    xpEvents: safeArray(raw.xpEvents),
    articleParagraphNotes: safeObject(raw.articleParagraphNotes),
    articleActionChecks: safeObject(raw.articleActionChecks),
    articleActionRewards: safeObject(raw.articleActionRewards),
  };
}

function buildDailyFocus(stage, journey, completedSet) {
  if (!stage) return null;

  const stageKey = String(stage.id);
  const taskIds = safeArray(journey.stageTasks[stageKey]);
  const trackedDays = safeArray(journey.stageTracker[stageKey]);
  const noteText = journey.stageNotes[stageKey] || '';
  const todayKey = getDateKey();
  const isCompleted = completedSet.has(stage.id);

  const firstMissingTask = stage.practices.find((item) => !taskIds.includes(item.id));
  if (firstMissingTask && !isCompleted) {
    return {
      type: 'task',
      stageId: stage.id,
      taskId: firstMissingTask.id,
      stageName: stage.name,
      title: 'Bugungi eng muhim qadam: checklist',
      detail: firstMissingTask.text,
      actionLabel: 'Qadamni bajarish',
    };
  }

  if (!trackedDays.includes(todayKey)) {
    return {
      type: 'tracker',
      stageId: stage.id,
      stageName: stage.name,
      title: 'Bugungi eng muhim qadam: amaliy iz',
      detail: "Bugungi amalni belgilab 7 kunlik ritmni ushlab turing.",
      actionLabel: "Bugungi amaliyotni belgilash",
    };
  }

  if (!isNoteReady(noteText)) {
    return {
      type: 'note',
      stageId: stage.id,
      stageName: stage.name,
      title: 'Bugungi eng muhim qadam: muhasaba',
      detail: `Kamida ${NOTE_MIN_CHARS} belgilik xulosa yozing.`,
      actionLabel: 'Xulosa yozish',
    };
  }

  if (!isCompleted) {
    return {
      type: 'complete',
      stageId: stage.id,
      stageName: stage.name,
      title: 'Bugungi eng muhim qadam: bosqichni yakunlash',
      detail: "Asosiy shartlar tayyor. Bosqichni yakunlab keyingisiga o'ting.",
      actionLabel: 'Bosqichni yakunlash',
    };
  }

  return {
    type: 'maintain',
    stageId: stage.id,
    stageName: stage.name,
    title: 'Bugungi eng muhim qadam: barqarorlik',
    detail: "Jarayon yakunlangan. Endi shu bosqichning amaliy intizomini davom ettiring.",
    actionLabel: "Bugungi amaliyotni belgilash",
  };
}

function StageCard({
  stage,
  done,
  active,
  locked,
  checkedTaskIds,
  trackedDays,
  noteText,
  onToggleTask,
  onToggleToday,
  onOpenNote,
  onComplete,
}) {
  const taskTotal = stage.practices.length;
  const taskDone = checkedTaskIds.length;
  const trackerDone = trackedDays.length;
  const noteDone = isNoteReady(noteText);
  const todayKey = getDateKey();
  const markedToday = trackedDays.includes(todayKey);

  const allTasksDone = taskDone >= taskTotal;
  const canComplete = !done && !locked && allTasksDone && trackerDone >= TRACKER_REQUIRED_DAYS && noteDone;

  const blockers = [];
  if (locked) blockers.push("Oldingi bosqich tugallanmagan.");
  if (!allTasksDone) blockers.push(`Checklist: ${taskDone}/${taskTotal}.`);
  if (trackerDone < TRACKER_REQUIRED_DAYS) blockers.push(`Amaliy kun: ${trackerDone}/${TRACKER_REQUIRED_DAYS}.`);
  if (!noteDone) blockers.push(`Xulosa: kamida ${NOTE_MIN_CHARS} belgi.`);

  return (
    <article
      id={`nafs-stage-${stage.id}`}
      className={`nafs-stage card ${done ? 'done' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
    >
      <div className="nafs-stage-head">
        <div className="nafs-stage-index">{stage.id}</div>
        <div className="nafs-stage-title">
          <h3>{stage.name}</h3>
          <p>{stage.subtitle}</p>
        </div>
        <div className="nafs-stage-badges">
          <span className="badge badge-accent">{stage.ayah}</span>
          <span className="badge badge-gold"><IconXP size={11} /> +{stage.xpReward} XP</span>
        </div>
      </div>

      <p className="nafs-stage-summary">{stage.summary}</p>
      {stage.heartMessage && <blockquote className="nafs-stage-heart">{stage.heartMessage}</blockquote>}

      <div className="nafs-checklist-head">
        <strong>Amaliy checklist</strong>
        <span>{taskDone}/{taskTotal}</span>
      </div>
      <ul className="nafs-practices">
        {stage.practices.map((item) => {
          const checked = checkedTaskIds.includes(item.id);
          const disabled = done || locked;
          return (
            <li key={item.id}>
              <label className={`nafs-check ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggleTask(stage.id, item.id)}
                />
                <span>{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="nafs-tracker card">
        <div className="nafs-tracker-head">
          <strong>7 kunlik amaliy iz</strong>
          <span>{trackerDone}/{TRACKER_TARGET_DAYS}</span>
        </div>
        <div className="nafs-tracker-dots">
          {Array.from({ length: TRACKER_TARGET_DAYS }).map((_, index) => (
            <span key={`${stage.id}-${index + 1}`} className={`nafs-dot ${index < trackerDone ? 'done' : ''}`}>
              {index + 1}
            </span>
          ))}
        </div>
        <button
          className="btn btn-outline nafs-tracker-btn"
          onClick={() => onToggleToday(stage.id)}
          disabled={done || locked}
        >
          {markedToday ? "Bugungi amaliyotni bekor qilish" : "Bugungi amaliyotni belgilash"}
        </button>
      </div>

      <div className="nafs-note-area">
        <div className="nafs-note-head">
          <strong>Muhasaba xulosasi</strong>
          <button className="btn btn-ghost nafs-note-btn" onClick={() => onOpenNote(stage.id)}>
            <IconEdit size={14} />
            {noteText.trim() ? 'Xulosani tahrirlash' : 'Xulosa yozish'}
          </button>
        </div>
        <p className="nafs-note-prompt">{stage.reflectionPrompt}</p>
        {noteText.trim() ? (
          <p className="nafs-note-preview">{noteText}</p>
        ) : (
          <p className="nafs-note-empty">Hozircha xulosa yozilmagan.</p>
        )}
      </div>

      <div className="nafs-stage-footer">
        {done ? (
          <span className="badge badge-success"><IconCheckCircle size={12} /> Bosqich yakunlandi</span>
        ) : (
          <button className="btn btn-primary" onClick={() => onComplete(stage.id)} disabled={!canComplete}>
            Bosqichni yakunlash
          </button>
        )}
        {!done && blockers.length > 0 && <p className="nafs-stage-hint">{blockers.join(' ')}</p>}
      </div>
    </article>
  );
}

// === NAFS BAHOLASH EKRANI ===
function NafsAssessment({ onSelect }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = NAFS_STAGES.find((s) => s.id === selectedId);

  return (
    <div className="page-wrapper nafs-assess-page">
      <div className="nafs-assess-header card fade-in-up">
        <span className="ui-kicker"><IconHeart size={14} /> Nafs Tarbiyasi Yo'li</span>
        <h1 className="nafs-assess-title">Nafsingiz hozir qaysi darajada?</h1>
        <p className="nafs-assess-sub">
          Quyidagi 7 bosqichdan o'zingizni eng yaxshi tavsiflaydiganni tanlang.
          Halol javob bering — bu faqat sizning shaxsiy safar xaritangiz.
          Tanlagan bosqichingizdan yo'lingiz boshlanadi.
        </p>
      </div>

      <div className="nafs-assess-grid fade-in-up" style={{ animationDelay: '0.1s' }}>
        {NAFS_STAGES.map((stage) => {
          const isSelected = selectedId === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              className={`nafs-assess-card card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedId(stage.id)}
            >
              <div className="nafs-assess-num">{stage.id}</div>
              <div className="nafs-assess-body">
                <h3 className="nafs-assess-name">{stage.name}</h3>
                <p className="nafs-assess-subtitle">{stage.subtitle}</p>
                <p className="nafs-assess-ayah">— {stage.ayah}</p>
                <p className="nafs-assess-summary">{stage.summary}</p>
              </div>
              {isSelected && <span className="nafs-assess-check"><IconCheckCircle size={16} /></span>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="nafs-assess-confirm fade-in-up">
          <div className="nafs-assess-confirm-inner card">
            <p>
              <strong>{selected.name}</strong> tanladingiz.
              Bu bosqichdan yo'lingizni boshlaymiz.
            </p>
            <button className="btn btn-primary" onClick={() => onSelect(selected.id)}>
              <IconCheckCircle size={16} /> Tasdiqlash va boshlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NafsJourney() {
  const { user, updateUser } = useAuth();
  const [noteModalStageId, setNoteModalStageId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({ wins: '', blockers: '', plan: '' });
  const [reviewSaved, setReviewSaved] = useState(false);
  const [xpToast, setXpToast] = useState(null);
  const [knowledgeStageId, setKnowledgeStageId] = useState(1);
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const [paragraphDraftId, setParagraphDraftId] = useState(null);
  const [paragraphDraft, setParagraphDraft] = useState('');
  const [sosCheckedSteps, setSosCheckedSteps] = useState([]);
  const [sosTimer, setSosTimer] = useState(SOS_TIMER_SECONDS);
  const [sosRunning, setSosRunning] = useState(false);
  const badgeAwardLockRef = useRef('');
  const xpEventIdRef = useRef(0);

  const journey = normalizeJourney(user?.nafsJourney);
  const completedSet = useMemo(() => new Set(journey.completedStages), [journey.completedStages]);

  const nextStageId = useMemo(() => {
    // Hech bir bosqich tugatilmagan bo'lsa va o'z-o'zini baholagan bo'lsa — u bosqichdan boshlash
    if (completedSet.size === 0 && journey.selfAssessedStageId) {
      return journey.selfAssessedStageId;
    }
    const next = NAFS_STAGES.find((stage) => !completedSet.has(stage.id));
    return next ? next.id : NAFS_STAGES.length;
  }, [completedSet, journey.selfAssessedStageId]);

  const completedCount = completedSet.size;
  const isJourneyComplete = completedCount === NAFS_STAGES.length;
  const activeStage = NAFS_STAGES.find((stage) => stage.id === nextStageId) || NAFS_STAGES[NAFS_STAGES.length - 1];
  const stageCompletionPercent = Math.round((completedCount / NAFS_STAGES.length) * 100);
  const todayKey = getDateKey();

  const overallProgress = useMemo(() => {
    const score = NAFS_STAGES.reduce((sum, stage) => {
      if (completedSet.has(stage.id)) return sum + 1;

      const stageKey = String(stage.id);
      const taskRatio = Math.min(1, safeArray(journey.stageTasks[stageKey]).length / stage.practices.length);
      const trackerRatio = Math.min(1, safeArray(journey.stageTracker[stageKey]).length / TRACKER_REQUIRED_DAYS);
      const noteRatio = isNoteReady(journey.stageNotes[stageKey]) ? 1 : 0;
      return sum + (taskRatio * 0.55) + (trackerRatio * 0.3) + (noteRatio * 0.15);
    }, 0);

    return Math.round((score / NAFS_STAGES.length) * 100);
  }, [completedSet, journey.stageNotes, journey.stageTasks, journey.stageTracker]);

  const savedNotesCount = useMemo(
    () => Object.values(journey.stageNotes).filter((text) => Boolean((text || '').trim())).length,
    [journey.stageNotes],
  );

  const activeTrackedDays = safeArray(journey.stageTracker[String(activeStage.id)]).length;

  const weeklyActivity = useMemo(() => {
    const baseDays = getRecentDays();
    const indexByKey = new Map(baseDays.map((day, index) => [day.key, index]));
    const days = baseDays.map((day) => ({ ...day, count: 0, stageIds: [] }));
    const stageHits = {};

    Object.entries(journey.stageTracker).forEach(([stageId, rawDays]) => {
      safeArray(rawDays).forEach((dayKey) => {
        const dayIndex = indexByKey.get(dayKey);
        if (dayIndex === undefined) return;

        days[dayIndex].count += 1;
        if (!days[dayIndex].stageIds.includes(Number(stageId))) {
          days[dayIndex].stageIds.push(Number(stageId));
        }
        stageHits[stageId] = (stageHits[stageId] || 0) + 1;
      });
    });

    const totalCheckins = days.reduce((sum, day) => sum + day.count, 0);
    const activeDays = days.filter((day) => day.count > 0).length;
    const maxCount = Math.max(1, ...days.map((day) => day.count));

    let streak = 0;
    for (let index = days.length - 1; index >= 0; index -= 1) {
      if (days[index].count > 0) streak += 1;
      else break;
    }

    const topStageEntry = Object.entries(stageHits).sort((a, b) => b[1] - a[1])[0];
    const bestStage = topStageEntry
      ? NAFS_STAGES.find((stage) => String(stage.id) === topStageEntry[0])
      : null;

    return {
      days,
      totalCheckins,
      activeDays,
      streak,
      maxCount,
      bestStage,
    };
  }, [journey.stageTracker]);

  const fullyPreparedStages = useMemo(
    () => NAFS_STAGES.filter((stage) => stage.practices.every((item) => (
      safeArray(journey.stageTasks[String(stage.id)]).includes(item.id)
    ))).length,
    [journey.stageTasks],
  );

  const focusStage = useMemo(() => {
    if (!isJourneyComplete) return activeStage;

    let candidate = NAFS_STAGES[0];
    let minCount = Number.POSITIVE_INFINITY;

    NAFS_STAGES.forEach((stage) => {
      const count = safeArray(journey.stageTracker[String(stage.id)]).length;
      if (count < minCount) {
        candidate = stage;
        minCount = count;
      }
    });

    return candidate;
  }, [activeStage, isJourneyComplete, journey.stageTracker]);

  const dailyFocus = useMemo(
    () => buildDailyFocus(focusStage, journey, completedSet),
    [completedSet, focusStage, journey],
  );

  const currentWeekKey = useMemo(() => getWeekKey(), []);
  const thisWeekReview = safeObject(journey.weeklyReviews[currentWeekKey]);
  const reviewDone = hasReviewAnswers(thisWeekReview);
  const resourceReads = safeObject(journey.resourceReads);
  const sosLogs = safeObject(journey.sosLogs);
  const articleParagraphNotes = safeObject(journey.articleParagraphNotes);
  const articleActionChecks = safeObject(journey.articleActionChecks);
  const articleActionRewards = safeObject(journey.articleActionRewards);
  const sosDoneToday = Boolean(sosLogs[todayKey]);
  const knowledgeStage = NAFS_STAGES.find((stage) => stage.id === knowledgeStageId) || activeStage;
  const stageEvidence = NAFS_STAGE_EVIDENCE[knowledgeStage.id] || [];
  const readResourceCount = Object.keys(resourceReads).length;
  const xpEvents = safeArray(journey.xpEvents);
  const sortedArticles = useMemo(() => {
    const activeId = activeStage.id;
    return [...NAFS_ARTICLE_LIBRARY].sort((a, b) => {
      const aMatch = (a.stageIds || []).includes(activeId) ? 1 : 0;
      const bMatch = (b.stageIds || []).includes(activeId) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [activeStage.id]);
  const focusedArticleCount = useMemo(
    () => sortedArticles.filter((item) => (item.stageIds || []).includes(activeStage.id)).length,
    [activeStage.id, sortedArticles],
  );
  const actionPlanProgress = useMemo(() => {
    const allPoints = sortedArticles.flatMap((resource) => (
      (resource.actionPlan || []).map((_, idx) => `${resource.id}_a_${idx}`)
    ));
    const done = allPoints.filter((key) => Boolean(articleActionChecks[key])).length;
    return { done, total: allPoints.length };
  }, [articleActionChecks, sortedArticles]);
  const sosProgressCount = sosCheckedSteps.length;
  const canCompleteSos = !sosDoneToday && sosProgressCount === ANGER_SOS_STEPS.length;
  const isSosActive = sosRunning && sosTimer > 0;

  const claimedBadges = safeObject(journey.badgesClaimed);
  const badgeItems = useMemo(() => {
    const items = [
      {
        id: 'nafs_step_1',
        icon: 'B1',
        label: 'Birinchi Qadam',
        desc: '1 bosqichni yakunlang.',
        target: 1,
        progress: completedCount,
        xpBonus: 30,
      },
      {
        id: 'nafs_step_3',
        icon: 'IT',
        label: 'Ichki Tartib',
        desc: 'Kamida 3 bosqichni tugating.',
        target: 3,
        progress: completedCount,
        xpBonus: 60,
      },
      {
        id: 'nafs_step_7',
        icon: 'KY',
        label: 'Komil Yul',
        desc: '7 bosqichning barchasini yakunlang.',
        target: 7,
        progress: completedCount,
        xpBonus: 220,
      },
      {
        id: 'nafs_notes_3',
        icon: 'ND',
        label: 'Muhasaba Daftari',
        desc: '3 ta bosqich uchun xulosa yozing.',
        target: 3,
        progress: savedNotesCount,
        xpBonus: 40,
      },
      {
        id: 'nafs_week_5',
        icon: 'HI',
        label: 'Haftalik Intizom',
        desc: 'Songgi 7 kunda 5 kun faol boling.',
        target: 5,
        progress: weeklyActivity.activeDays,
        xpBonus: 70,
      },
      {
        id: 'nafs_ready_4',
        icon: 'TB',
        label: 'Tayyor Bosqichlar',
        desc: '4 bosqich checklistini toliq bajaring.',
        target: 4,
        progress: fullyPreparedStages,
        xpBonus: 55,
      },
      {
        id: 'nafs_streak_3',
        icon: 'DR',
        label: 'Doimiy Ritm',
        desc: '3 kun ketma-ket amaliy qayd qoldiring.',
        target: 3,
        progress: weeklyActivity.streak,
        xpBonus: 45,
      },
      {
        id: 'nafs_week_10',
        icon: 'FH',
        label: 'Faol Hafta',
        desc: 'Songgi haftada 10+ amaliy qayd topling.',
        target: 10,
        progress: weeklyActivity.totalCheckins,
        xpBonus: 80,
      },
    ];

    return items.map((item) => {
      const progress = Math.max(0, item.progress);
      return {
        ...item,
        earned: progress >= item.target,
        claimed: Boolean(claimedBadges[item.id]),
        progressText: `${Math.min(progress, item.target)}/${item.target}`,
      };
    });
  }, [claimedBadges, completedCount, fullyPreparedStages, savedNotesCount, weeklyActivity.activeDays, weeklyActivity.streak, weeklyActivity.totalCheckins]);

  useEffect(() => {
    if (!noteSaved) return undefined;
    const timeoutId = window.setTimeout(() => setNoteSaved(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [noteSaved]);

  useEffect(() => {
    if (!reviewSaved) return undefined;
    const timeoutId = window.setTimeout(() => setReviewSaved(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [reviewSaved]);

  useEffect(() => {
    if (!sosRunning || sosTimer <= 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSosTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [sosRunning, sosTimer]);

  useEffect(() => {
    if (!xpToast) return undefined;
    const timeoutId = window.setTimeout(() => setXpToast(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [xpToast]);

  const isAnyModalOpen = Boolean(noteModalStageId || reviewModalOpen);

  useEffect(() => {
    if (!isAnyModalOpen) return undefined;

    const handleEsc = (event) => {
      if (event.key !== 'Escape') return;
      if (noteModalStageId) {
        setNoteModalStageId(null);
        setNoteSaved(false);
      } else {
        setReviewModalOpen(false);
        setReviewSaved(false);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isAnyModalOpen, noteModalStageId, reviewModalOpen]);

  useEffect(() => {
    if (!user) return;

    const pendingBadges = badgeItems.filter((badge) => badge.earned && !badge.claimed);
    if (pendingBadges.length === 0) {
      badgeAwardLockRef.current = '';
      return;
    }

    const signature = pendingBadges.map((badge) => badge.id).sort().join('|');
    if (badgeAwardLockRef.current === signature) return;
    badgeAwardLockRef.current = signature;

    const now = new Date().toISOString();
    const nextClaimed = { ...claimedBadges };
    pendingBadges.forEach((badge) => {
      nextClaimed[badge.id] = {
        claimedAt: now,
        xpBonus: badge.xpBonus,
      };
    });

    const bonusXP = pendingBadges.reduce((sum, badge) => sum + (badge.xpBonus || 0), 0);
    const nextEvents = bonusXP > 0
      ? [
        {
          id: `badge_${signature}_${now}`,
          label: 'Badge bonusi',
          amount: bonusXP,
          createdAt: now,
          deducted: false,
        },
        ...xpEvents,
      ].slice(0, 60)
      : xpEvents;

    updateUser({
      xp: (user.xp || 0) + bonusXP,
      nafsJourney: {
        ...journey,
        badgesClaimed: nextClaimed,
        xpEvents: nextEvents,
        updatedAt: now,
      },
    });

  }, [badgeItems, claimedBadges, journey, updateUser, user, xpEvents]);

  const persistJourney = (patch, extraUserUpdates = {}) => {
    updateUser({
      ...extraUserUpdates,
      nafsJourney: {
        ...journey,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleAssessmentSelect = (stageId) => {
    persistJourney({
      selfAssessedStageId: stageId,
      selfAssessedAt:      new Date().toISOString(),
    });
    apiSaveNafsStage(stageId);
  };

  const createXpEvent = (label, amount, createdAt = new Date().toISOString()) => {
    xpEventIdRef.current += 1;
    return {
      id: `xp_evt_${xpEventIdRef.current}`,
      label,
      amount: Math.max(0, Number(amount) || 0),
      createdAt,
      deducted: false,
    };
  };

  const grantJourneyXP = (label, amount, journeyPatch = {}, userPatch = {}, showToast = true) => {
    const safeAmount = Math.max(0, Number(amount) || 0);
    if (!safeAmount) return;

    const event = createXpEvent(label, safeAmount);
    const nextEvents = [event, ...xpEvents].slice(0, 60);

    persistJourney(
      { ...journeyPatch, xpEvents: nextEvents },
      { ...userPatch, xp: (user?.xp || 0) + safeAmount },
    );

    if (showToast) {
      setXpToast({ stageName: label, xp: safeAmount });
    }
  };

  const deductXpEvent = (eventId) => {
    const event = xpEvents.find((item) => item.id === eventId && !item.deducted);
    if (!event) return;

    const nextEvents = xpEvents.map((item) => (
      item.id === eventId
        ? { ...item, deducted: true, deductedAt: new Date().toISOString() }
        : item
    ));

    persistJourney(
      { xpEvents: nextEvents },
      { xp: Math.max(0, (user?.xp || 0) - (event.amount || 0)) },
    );
    setXpToast({ stageName: `${event.label} (ayirildi)`, xp: -(event.amount || 0) });
  };

  const toggleSosStep = (stepId) => {
    setSosCheckedSteps((prev) => (
      prev.includes(stepId)
        ? prev.filter((item) => item !== stepId)
        : [...prev, stepId]
    ));
  };

  const startSosTimer = () => {
    if (sosTimer <= 0) {
      setSosTimer(SOS_TIMER_SECONDS);
    }
    setSosRunning(true);
  };

  const pauseSosTimer = () => {
    setSosRunning(false);
  };

  const resetSosSession = () => {
    setSosRunning(false);
    setSosTimer(SOS_TIMER_SECONDS);
    setSosCheckedSteps([]);
  };

  const completeSosSession = () => {
    if (!canCompleteSos) return;

    const now = new Date().toISOString();
    grantJourneyXP(
      "G'azab SOS amaliyoti",
      SOS_DAILY_XP,
      {
        sosLogs: {
          ...sosLogs,
          [todayKey]: {
            completedAt: now,
            stepCount: ANGER_SOS_STEPS.length,
          },
        },
      },
    );
    resetSosSession();
  };

  const markResourceRead = (resourceId) => {
    if (resourceReads[resourceId]) return;

    grantJourneyXP(
      "Ilmiy manba o'qildi",
      RESOURCE_READ_XP,
      {
        resourceReads: {
          ...resourceReads,
          [resourceId]: new Date().toISOString(),
        },
      },
    );
  };

  const getParagraphKey = (resourceId, paragraphIndex) => `${resourceId}_p_${paragraphIndex}`;
  const getActionKey = (resourceId, actionIndex) => `${resourceId}_a_${actionIndex}`;

  const openParagraphDraft = (resourceId, paragraphIndex) => {
    const paragraphKey = getParagraphKey(resourceId, paragraphIndex);
    setParagraphDraftId(paragraphKey);
    setParagraphDraft(articleParagraphNotes[paragraphKey] || '');
  };

  const cancelParagraphDraft = () => {
    setParagraphDraftId(null);
    setParagraphDraft('');
  };

  const saveParagraphDraft = () => {
    if (!paragraphDraftId) return;

    const trimmed = paragraphDraft.trim();
    const nextNotes = { ...articleParagraphNotes };
    if (trimmed) nextNotes[paragraphDraftId] = trimmed;
    else delete nextNotes[paragraphDraftId];

    persistJourney({ articleParagraphNotes: nextNotes });
    cancelParagraphDraft();
  };

  const toggleArticleAction = (resourceId, actionIndex, actionItems = [], resourceTitle = '') => {
    if (actionItems.length === 0) return;

    const actionKey = getActionKey(resourceId, actionIndex);
    const nextChecks = {
      ...articleActionChecks,
      [actionKey]: !articleActionChecks[actionKey],
    };

    const completedAll = actionItems.every((_, idx) => Boolean(nextChecks[getActionKey(resourceId, idx)]));
    const rewarded = Boolean(articleActionRewards[resourceId]);

    if (completedAll && !rewarded) {
      grantJourneyXP(
        `Action plan: ${resourceTitle}`,
        ARTICLE_ACTION_XP,
        {
          articleActionChecks: nextChecks,
          articleActionRewards: {
            ...articleActionRewards,
            [resourceId]: new Date().toISOString(),
          },
        },
      );
      return;
    }

    persistJourney({ articleActionChecks: nextChecks });
  };

  const isLockedStage = (stageId) => stageId > 1 && !completedSet.has(stageId - 1);

  const jumpToStage = (stageId) => {
    const target = document.getElementById(`nafs-stage-${stageId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleTask = (stageId, taskId) => {
    if (completedSet.has(stageId) || isLockedStage(stageId)) return;

    const stageKey = String(stageId);
    const current = safeArray(journey.stageTasks[stageKey]);
    const exists = current.includes(taskId);
    const nextTasks = {
      ...journey.stageTasks,
      [stageKey]: exists ? current.filter((id) => id !== taskId) : [...current, taskId],
    };

    persistJourney({ stageTasks: nextTasks });
  };

  const toggleTodayPractice = (stageId) => {
    if (isLockedStage(stageId)) return;

    const stageKey = String(stageId);
    const todayKey = getDateKey();
    const current = safeArray(journey.stageTracker[stageKey]);
    const nextDays = current.includes(todayKey)
      ? current.filter((day) => day !== todayKey)
      : [...current, todayKey].sort().slice(-TRACKER_TARGET_DAYS);

    persistJourney({
      stageTracker: {
        ...journey.stageTracker,
        [stageKey]: nextDays,
      },
    });
  };

  const openNoteModal = (stageId) => {
    const stageKey = String(stageId);
    setNoteModalStageId(stageId);
    setNoteSaved(false);
    setNoteDraft(journey.stageNotes[stageKey] || '');
  };

  const closeNoteModal = () => {
    setNoteModalStageId(null);
    setNoteSaved(false);
  };

  const saveStageNote = () => {
    if (!noteModalStageId) return;

    const stageKey = String(noteModalStageId);
    const trimmed = noteDraft.trim();
    const nextNotes = { ...journey.stageNotes };
    if (trimmed) nextNotes[stageKey] = trimmed;
    else delete nextNotes[stageKey];

    persistJourney({ stageNotes: nextNotes });
    setNoteSaved(true);
  };

  const completeStage = (stageId) => {
    if (completedSet.has(stageId) || isLockedStage(stageId)) return;

    const stage = NAFS_STAGES.find((item) => item.id === stageId);
    if (!stage) return;

    const stageKey = String(stageId);
    const checkedTaskIds = safeArray(journey.stageTasks[stageKey]);
    const trackedDays = safeArray(journey.stageTracker[stageKey]);
    const noteText = journey.stageNotes[stageKey] || '';

    const allTasksDone = stage.practices.every((item) => checkedTaskIds.includes(item.id));
    const enoughTrackerDays = trackedDays.length >= TRACKER_REQUIRED_DAYS;
    if (!allTasksDone || !enoughTrackerDays || !isNoteReady(noteText)) return;

    const nextCompleted = [...journey.completedStages, stageId].sort((a, b) => a - b);
    const xpGain = stage.xpReward;
    grantJourneyXP(
      stage.name,
      xpGain,
      { completedStages: nextCompleted },
      {},
    );
  };

  const handleDailyFocusAction = () => {
    if (!dailyFocus) return;

    if (dailyFocus.type === 'task') {
      toggleTask(dailyFocus.stageId, dailyFocus.taskId);
      return;
    }

    if (dailyFocus.type === 'tracker' || dailyFocus.type === 'maintain') {
      toggleTodayPractice(dailyFocus.stageId);
      return;
    }

    if (dailyFocus.type === 'note') {
      openNoteModal(dailyFocus.stageId);
      return;
    }

    if (dailyFocus.type === 'complete') {
      completeStage(dailyFocus.stageId);
    }
  };

  const openReviewModal = () => {
    setReviewSaved(false);
    setReviewDraft({
      wins: thisWeekReview.wins || '',
      blockers: thisWeekReview.blockers || '',
      plan: thisWeekReview.plan || '',
    });
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewSaved(false);
  };

  const canSaveReview = [reviewDraft.wins, reviewDraft.blockers, reviewDraft.plan]
    .every((value) => value.trim().length >= 8);

  const saveWeeklyReview = () => {
    if (!canSaveReview) return;

    const wins = reviewDraft.wins.trim();
    const blockers = reviewDraft.blockers.trim();
    const plan = reviewDraft.plan.trim();
    const existing = safeObject(journey.weeklyReviews[currentWeekKey]);
    const isFirstReview = !hasReviewAnswers(existing);

    const nextWeeklyReviews = {
      ...journey.weeklyReviews,
      [currentWeekKey]: {
        wins,
        blockers,
        plan,
        updatedAt: new Date().toISOString(),
      },
    };

    const bonusXP = isFirstReview ? WEEKLY_REVIEW_XP : 0;
    if (bonusXP > 0) {
      grantJourneyXP('Haftalik review bonusi', bonusXP, { weeklyReviews: nextWeeklyReviews });
    } else {
      persistJourney({ weeklyReviews: nextWeeklyReviews });
    }

    setReviewSaved(true);
  };

  const resetJourney = () => {
    if (!window.confirm("Nafs yo'lini to'liq qayta boshlashni xohlaysizmi?")) return;

    updateUser({
      nafsJourney: {
        ...JOURNEY_DEFAULTS,
        updatedAt: new Date().toISOString(),
      },
    });
    setNoteModalStageId(null);
    setReviewModalOpen(false);
    setNoteSaved(false);
    setReviewSaved(false);
  };

  const noteModalStage = noteModalStageId
    ? NAFS_STAGES.find((stage) => stage.id === noteModalStageId)
    : null;

  // Birinchi kirish: baholash ekrani
  if (!journey.selfAssessedStageId) {
    return <NafsAssessment onSelect={handleAssessmentSelect} />;
  }

  return (
    <div className="page-wrapper nafs-page">
      <section className="nafs-hero card fade-in-up">
        <div className="nafs-hero-main">
          <span className="ui-kicker"><IconHeart size={14} /> Nafs Tarbiyasi Yo'li</span>
          <h1>Nafsning 7 bosqichi: nazariyadan amaliyotga</h1>
          <p>
            Har bir bosqich faqat bitta tugma bilan emas, balki checklist, kunlik amaliy iz va muhasaba yozuvi
            orqali tugallanadi. Bu usul nafs tarbiyasini odatga aylantiradi.
          </p>
          <div className="nafs-principles">
            <span className="badge badge-gold"><IconTarget size={12} /> Sunnatga muvofiq yashash</span>
            <span className="badge badge-accent"><IconBookmark size={12} /> Qalbni hasad va kibrdan poklash</span>
            <span className="badge badge-success"><IconFire size={12} /> Muhasaba va intizom</span>
          </div>
        </div>

        <aside className="nafs-hero-side">
          <div className="nafs-progress card">
            <div className="nafs-progress-top">
              <span>Yakunlangan bosqichlar</span>
              <strong>{completedCount}/{NAFS_STAGES.length}</strong>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${stageCompletionPercent}%` }} />
            </div>
            <p>{stageCompletionPercent}% bosqich bajarildi</p>
          </div>

          <div className="nafs-progress card">
            <div className="nafs-progress-top">
              <span>Umumiy amaliy progress</span>
              <strong>{overallProgress}%</strong>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <p>Checklist + amaliy kunlar + xulosa hisobga olindi</p>
          </div>
        </aside>

        <div className="nafs-metrics">
          <div className="nafs-metric card">
            <span className="nafs-metric-label">Faol bosqich</span>
            <strong>{activeStage.id}. {activeStage.name}</strong>
          </div>
          <div className="nafs-metric card">
            <span className="nafs-metric-label">Faol bosqich amaliy kuni</span>
            <strong>{activeTrackedDays}/{TRACKER_TARGET_DAYS}</strong>
          </div>
          <div className="nafs-metric card">
            <span className="nafs-metric-label">Yozilgan xulosalar</span>
            <strong>{savedNotesCount} ta</strong>
          </div>
          <div className="nafs-metric card">
            <span className="nafs-metric-label">O'qilgan manbalar</span>
            <strong>{readResourceCount} ta</strong>
          </div>
        </div>
      </section>

      <section className="nafs-focus-grid">
        <article className="nafs-focus-card card">
          <div className="nafs-section-head">
            <h2><IconTarget size={16} /> Bugungi eng muhim qadam</h2>
            <p>{dailyFocus?.stageName || activeStage.name}</p>
          </div>

          <p className="nafs-focus-title">{dailyFocus?.title}</p>
          <p className="nafs-focus-detail">{dailyFocus?.detail}</p>

          <div className="nafs-focus-actions">
            <button className="btn btn-primary" onClick={handleDailyFocusAction}>
              {dailyFocus?.actionLabel || 'Amal bajarish'}
            </button>
            <button className="btn btn-outline" onClick={() => jumpToStage(dailyFocus?.stageId || activeStage.id)}>
              Bosqichga o'tish
            </button>
          </div>
        </article>

        <article className="nafs-review-lite card">
          <div className="nafs-section-head">
            <h2>Haftalik review</h2>
            <p>{currentWeekKey}</p>
          </div>

          {reviewDone ? (
            <div className="nafs-review-preview">
              <strong>Bu hafta yutug'im</strong>
              <p>{thisWeekReview.wins}</p>
              <strong>To'siqlar</strong>
              <p>{thisWeekReview.blockers}</p>
            </div>
          ) : (
            <p className="nafs-review-empty">
              3 savolga javob bering: nima yaxshi bo'ldi, nima to'xtatdi, keyingi haftada 1 niyat.
            </p>
          )}

          <div className="nafs-focus-actions">
            <button className="btn btn-outline" onClick={openReviewModal}>
              {reviewDone ? 'Reviewni tahrirlash' : 'Reviewni boshlash'}
            </button>
            <span className="nafs-review-bonus">Birinchi saqlash: +{WEEKLY_REVIEW_XP} XP</span>
          </div>
        </article>
      </section>

      <section className="nafs-knowledge-grid">
        <article className="nafs-evidence card">
          <div className="nafs-section-head">
            <h2><IconBookOpen size={16} /> Dalil markazi</h2>
            <p>{knowledgeStage.name}</p>
          </div>

          <div className="nafs-evidence-stage-tabs">
            {NAFS_STAGES.map((stage) => (
              <button
                key={stage.id}
                className={`nafs-stage-chip ${stage.id === knowledgeStage.id ? 'active' : ''}`}
                onClick={() => setKnowledgeStageId(stage.id)}
              >
                {stage.id}. {stage.name.replace('Nafsi ', '')}
              </button>
            ))}
          </div>

          <div className="nafs-evidence-list">
            {stageEvidence.map((item) => (
              <article key={item.id} className="nafs-evidence-item">
                <div className="nafs-evidence-top">
                  <span className={`badge ${item.type === 'Hadis' ? 'badge-accent' : 'badge-gold'}`}>{item.type}</span>
                  {item.grade && <span className={`nafs-grade ${item.gradeTone || 'neutral'}`}>{item.grade}</span>}
                </div>
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
                <div className="nafs-evidence-foot">
                  <span>{item.reference}</span>
                  <a href={item.url} target="_blank" rel="noreferrer">Manba</a>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="nafs-sos card">
          <div className="nafs-section-head">
            <h2><IconBolt size={16} /> G'azab SOS protokoli</h2>
            <p>3 daqiqa</p>
          </div>

          <p className="nafs-sos-text">
            G'azab chiqqanda shu mini-protokolni bajaring: nafas, isti'oza, holatni o'zgartirish, tahorat.
          </p>

          <div className="nafs-sos-timer-wrap">
            <strong className="nafs-sos-timer">{formatSeconds(sosTimer)}</strong>
            <div className="nafs-sos-timer-actions">
              <button className="btn btn-outline" onClick={isSosActive ? pauseSosTimer : startSosTimer}>
                {isSosActive ? "To'xtatish" : 'Start'}
              </button>
              <button className="btn btn-ghost" onClick={resetSosSession}>Reset</button>
            </div>
          </div>

          <ul className="nafs-sos-list">
            {ANGER_SOS_STEPS.map((step) => {
              const checked = sosCheckedSteps.includes(step.id);
              return (
                <li key={step.id}>
                  <label className={`nafs-check ${checked ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSosStep(step.id)}
                    />
                    <span>
                      <strong>{step.title}</strong>
                      <small>{step.detail}</small>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="nafs-sos-foot">
            <span className={`nafs-sos-status ${sosDoneToday ? 'done' : ''}`}>
              {sosDoneToday ? "Bugungi SOS bajarilgan" : `Progress: ${sosProgressCount}/${ANGER_SOS_STEPS.length}`}
            </span>
            <button className="btn btn-primary" onClick={completeSosSession} disabled={!canCompleteSos}>
              Yakunlash +{SOS_DAILY_XP} XP
            </button>
          </div>
        </article>
      </section>

      <section className="nafs-library-grid">
        <article className="nafs-ulama card">
          <div className="nafs-section-head">
            <h2><IconBookmark size={16} /> Ulamolar nasihati</h2>
            <p>Amaliy yondashuv</p>
          </div>

          <div className="nafs-ulama-list">
            {ULAMA_NASIHA.map((item) => (
              <article key={item.id} className="nafs-ulama-item">
                <div className="nafs-ulama-head">
                  <strong>{item.scholar}</strong>
                  <span>{item.work}</span>
                </div>
                <p>{item.advice}</p>
                <p className="nafs-ulama-action"><strong>Amaliy qadam:</strong> {item.action}</p>
                <a href={item.source} target="_blank" rel="noreferrer">Manbani ko'rish</a>
              </article>
            ))}
          </div>
        </article>

        <article className="nafs-reading card">
          <div className="nafs-section-head">
            <h2><IconBookOpen size={16} /> Tarjima maqolalar kutubxonasi</h2>
            <p>{readResourceCount}/{sortedArticles.length} o'qildi</p>
          </div>

          <p className="nafs-reading-meta">
            Tashqi havolaga o'tmasdan, asosiy maqolalarning Uzbekcha mazmuni shu yerda jamlandi.
          </p>
          <div className="nafs-reading-focus">
            <span>Faol bosqichga mos: {focusedArticleCount} ta maqola</span>
            <span>Action plan: {actionPlanProgress.done}/{actionPlanProgress.total}</span>
          </div>

          <div className="nafs-reading-list">
            {sortedArticles.map((resource) => {
              const isRead = Boolean(resourceReads[resource.id]);
              const isExpanded = expandedArticleId === resource.id;
              const isFocused = (resource.stageIds || []).includes(activeStage.id);
              const actionItems = resource.actionPlan || [];
              const doneActions = actionItems.filter((_, idx) => (
                Boolean(articleActionChecks[`${resource.id}_a_${idx}`])
              )).length;
              const actionRewarded = Boolean(articleActionRewards[resource.id]);
              return (
                <article
                  key={resource.id}
                  className={`nafs-reading-item ${isRead ? 'read' : ''} ${isFocused ? 'focused' : ''}`}
                >
                  <div className="nafs-reading-top">
                    <span className="badge badge-accent">{resource.publisher}</span>
                    <span className="nafs-reading-tag">{resource.tag}</span>
                  </div>
                  <h4>{resource.title}</h4>
                  {isFocused && <span className="nafs-reading-match">Faol bosqichga mos</span>}
                  <p className="nafs-reading-summary">{resource.summaryUz}</p>

                  {isExpanded && (
                    <div className="nafs-reading-body">
                      {resource.paragraphsUz?.map((paragraph, idx) => {
                        const paragraphKey = `${resource.id}_p_${idx}`;
                        const savedNote = articleParagraphNotes[paragraphKey] || '';
                        const editing = paragraphDraftId === paragraphKey;
                        return (
                          <div key={paragraphKey} className="nafs-reading-paragraph">
                            <p>{paragraph}</p>

                            {editing ? (
                              <div className="nafs-reading-note-editor">
                                <textarea
                                  className="input-field"
                                  rows={3}
                                  value={paragraphDraft}
                                  onChange={(event) => setParagraphDraft(event.target.value)}
                                  placeholder="Shu paragraf bo'yicha xulosangiz..."
                                />
                                <small className="nafs-reading-note-limit">
                                  {paragraphDraft.trim().length} / {ARTICLE_NOTE_MIN_CHARS} (minimal)
                                </small>
                                <div className="nafs-reading-note-actions">
                                  <button
                                    className="btn btn-outline"
                                    onClick={saveParagraphDraft}
                                    disabled={paragraphDraft.trim().length > 0 && paragraphDraft.trim().length < ARTICLE_NOTE_MIN_CHARS}
                                  >
                                    Saqlash
                                  </button>
                                  <button className="btn btn-ghost" onClick={cancelParagraphDraft}>
                                    Bekor qilish
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="nafs-reading-note-preview">
                                {savedNote
                                  ? <p>{savedNote}</p>
                                  : <p className="nafs-reading-note-empty">Bu paragraf uchun izoh yozilmagan.</p>}
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => openParagraphDraft(resource.id, idx)}
                                >
                                  {savedNote ? 'Izohni tahrirlash' : 'Paragrafga izoh yozish'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="nafs-reading-points">
                        {actionItems.map((point, idx) => {
                          const actionKey = `${resource.id}_a_${idx}`;
                          const checked = Boolean(articleActionChecks[actionKey]);
                          return (
                            <label key={actionKey} className={`nafs-action-check ${checked ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleArticleAction(resource.id, idx, actionItems, resource.title)}
                              />
                              <span>{point}</span>
                            </label>
                          );
                        })}
                        <div className="nafs-reading-action-foot">
                          <span>{doneActions}/{actionItems.length} bajarildi</span>
                          <span className={actionRewarded ? 'done' : ''}>
                            {actionRewarded ? `Bonus olindi (+${ARTICLE_ACTION_XP} XP)` : `To'liq bajarsa +${ARTICLE_ACTION_XP} XP`}
                          </span>
                        </div>
                      </div>
                      <small className="nafs-reading-source">{resource.sourceLabel}</small>
                    </div>
                  )}

                  <div className="nafs-reading-actions">
                    <button
                      className="btn btn-ghost"
                      onClick={() => setExpandedArticleId(isExpanded ? null : resource.id)}
                    >
                      {isExpanded ? "Yig'ish" : "Tarjimani o'qish"}
                    </button>
                    <button
                      className={`btn ${isRead ? 'btn-ghost' : 'btn-outline'}`}
                      onClick={() => markResourceRead(resource.id)}
                      disabled={isRead}
                    >
                      {isRead ? "O'qilgan" : `O'qib belgilash +${RESOURCE_READ_XP} XP`}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <section className="nafs-xp-ledger card">
        <div className="nafs-section-head">
          <h2><IconXP size={16} /> XP nazorati</h2>
          <p>{xpEvents.length} ta tranzaksiya</p>
        </div>

        {xpEvents.length ? (
          <div className="nafs-xp-list">
            {xpEvents.slice(0, 10).map((event) => (
              <article key={event.id} className={`nafs-xp-item ${event.deducted ? 'deducted' : ''}`}>
                <div className="nafs-xp-item-head">
                  <strong>{event.label}</strong>
                  <span className={`nafs-xp-amount ${event.deducted ? 'negative' : 'positive'}`}>
                    {event.deducted ? '-' : '+'}{event.amount} XP
                  </span>
                </div>
                <div className="nafs-xp-item-foot">
                  <small>{event.createdAt ? new Date(event.createdAt).toLocaleString('uz-UZ') : '-'}</small>
                  <button
                    className={`btn ${event.deducted ? 'btn-ghost' : 'btn-outline'}`}
                    onClick={() => deductXpEvent(event.id)}
                    disabled={event.deducted}
                  >
                    {event.deducted ? 'Ayirildi' : "XP ni ayirish"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="nafs-xp-empty">Hali XP tranzaksiya yaratilmagan.</p>
        )}
      </section>

      <section className="nafs-timeline card">
        <div className="nafs-section-head">
          <h2><IconTarget size={16} /> Bosqichlar timeline</h2>
          <p>{isJourneyComplete ? 'Barcha bosqichlar yakunlangan.' : `${nextStageId}-bosqich faol.`}</p>
        </div>
        <div className="nafs-timeline-scroll">
          {NAFS_STAGES.map((stage, index) => {
            const done = completedSet.has(stage.id);
            const locked = !done && stage.id > 1 && !completedSet.has(stage.id - 1);
            const active = isJourneyComplete ? stage.id === NAFS_STAGES.length : stage.id === nextStageId;

            return (
              <div key={stage.id} className="nafs-node-wrap">
                <button
                  className={`nafs-node-btn ${done ? 'done' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
                  onClick={() => jumpToStage(stage.id)}
                >
                  <span className="nafs-node-num">{done ? 'OK' : stage.id}</span>
                  <span className="nafs-node-label">{stage.name.replace('Nafsi ', '')}</span>
                  <span className="nafs-node-sub">{stage.ayah}</span>
                </button>
                {index < NAFS_STAGES.length - 1 && (
                  <span className={`nafs-node-link ${done ? 'done' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="nafs-insights">
        <article className="nafs-weekly card">
          <div className="nafs-section-head">
            <h2><IconBarChart size={16} /> Haftalik hisobot</h2>
            <p>{weeklyActivity.totalCheckins} ta amaliy qayd</p>
          </div>

          <div className="nafs-week-chart">
            {weeklyActivity.days.map((day) => {
              const barHeight = day.count > 0
                ? Math.max(14, Math.round((day.count / weeklyActivity.maxCount) * 74))
                : 6;

              return (
                <div key={day.key} className={`nafs-week-col ${day.isToday ? 'today' : ''}`}>
                  <span className="nafs-week-count">{day.count}</span>
                  <div className="nafs-week-bar-wrap">
                    <span
                      className={`nafs-week-bar ${day.count > 0 ? 'active' : ''}`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <span className="nafs-week-day">{day.label}</span>
                  <small>{day.dayNum}</small>
                </div>
              );
            })}
          </div>

          <p className="nafs-week-meta">
            Faol kunlar: <strong>{weeklyActivity.activeDays}/7</strong>. Joriy ritm: <strong>{weeklyActivity.streak} kun</strong>.
          </p>
          <p className="nafs-week-meta">
            Eng faol bosqich: <strong>{weeklyActivity.bestStage ? weeklyActivity.bestStage.name : 'Hali aniqlanmadi'}</strong>.
          </p>
        </article>

        <article className="nafs-badges card">
          <div className="nafs-section-head">
            <h2>Achievement badge</h2>
            <p>Jarayonni vizual kuzatish</p>
          </div>

          <div className="nafs-badge-grid">
            {badgeItems.map((badge) => (
              <article key={badge.id} className={`nafs-badge-item ${badge.earned ? 'earned' : ''} ${badge.claimed ? 'claimed' : ''}`}>
                <span className="nafs-badge-icon">{badge.icon}</span>
                <div className="nafs-badge-body">
                  <h4>{badge.label}</h4>
                  <p>{badge.desc}</p>
                  <div className="nafs-badge-foot">
                    <span className="nafs-badge-progress">{badge.progressText}</span>
                    <span className="nafs-badge-xp">+{badge.xpBonus} XP</span>
                  </div>
                  <span className={`nafs-badge-state ${badge.claimed ? 'claimed' : ''}`}>
                    {badge.claimed ? 'Bonus olingan' : badge.earned ? 'Bonus tayyor' : 'Jarayonda'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="nafs-stage-grid">
        {NAFS_STAGES.map((stage) => {
          const stageKey = String(stage.id);
          const done = completedSet.has(stage.id);
          const active = !done && stage.id === nextStageId;
          const locked = !done && isLockedStage(stage.id);

          return (
            <StageCard
              key={stage.id}
              stage={stage}
              done={done}
              active={active}
              locked={locked}
              checkedTaskIds={safeArray(journey.stageTasks[stageKey])}
              trackedDays={safeArray(journey.stageTracker[stageKey])}
              noteText={journey.stageNotes[stageKey] || ''}
              onToggleTask={toggleTask}
              onToggleToday={toggleTodayPractice}
              onOpenNote={openNoteModal}
              onComplete={completeStage}
            />
          );
        })}
      </section>

      <section className="nafs-summary card">
        <h2>Yo'lning asosiy qoidasi</h2>
        <p>
          Nafs tarbiyasi bir martalik ilhom emas: nafs istaganini har safar berib yubormaslik,
          istamagan to'g'ri amalni odat qilish, va har kuni o'zini hisob-kitob qilishdir.
        </p>
        <button className="btn btn-ghost nafs-reset-btn" onClick={resetJourney}>Yo'lni qaytadan boshlash</button>
      </section>

      {noteModalStage && (
        <div className="nafs-note-modal" role="dialog" aria-modal="true" aria-label="Nafs bosqichi xulosasi">
          <div className="nafs-note-backdrop" onClick={closeNoteModal} />
          <div className="nafs-note-card card">
            <header className="nafs-note-header">
              <div>
                <p className="ui-kicker">{noteModalStage.id}-bosqich</p>
                <h3>{noteModalStage.name} uchun xulosa</h3>
              </div>
              <button className="btn btn-ghost" onClick={closeNoteModal}>Yopish</button>
            </header>
            <p className="nafs-note-help">{noteModalStage.reflectionPrompt}</p>
            <textarea
              className="input-field nafs-note-input"
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Bugungi ichki kurash va xulosani aniq yozing..."
              rows={8}
            />
            <div className="nafs-note-foot">
              <span className={isNoteReady(noteDraft) ? 'ready' : ''}>
                {noteDraft.trim().length} / {NOTE_MIN_CHARS} belgi
              </span>
              {noteSaved && <span className="nafs-note-saved">Saqlandi</span>}
            </div>
            <div className="nafs-note-actions">
              <button className="btn btn-outline" onClick={saveStageNote}>Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {reviewModalOpen && (
        <div className="nafs-review-modal" role="dialog" aria-modal="true" aria-label="Haftalik review">
          <div className="nafs-review-backdrop" onClick={closeReviewModal} />
          <div className="nafs-review-dialog card">
            <header className="nafs-review-header">
              <div>
                <p className="ui-kicker">{currentWeekKey}</p>
                <h3>Haftalik review</h3>
              </div>
              <button className="btn btn-ghost" onClick={closeReviewModal}>Yopish</button>
            </header>

            <div className="nafs-review-fields">
              <label className="nafs-review-field">
                <span>1. Bu hafta nima yaxshi bo'ldi?</span>
                <textarea
                  className="input-field"
                  value={reviewDraft.wins}
                  onChange={(event) => setReviewDraft((prev) => ({ ...prev, wins: event.target.value }))}
                  rows={3}
                />
              </label>

              <label className="nafs-review-field">
                <span>2. Asosiy to'siq nima bo'ldi?</span>
                <textarea
                  className="input-field"
                  value={reviewDraft.blockers}
                  onChange={(event) => setReviewDraft((prev) => ({ ...prev, blockers: event.target.value }))}
                  rows={3}
                />
              </label>

              <label className="nafs-review-field">
                <span>3. Keyingi haftadagi bitta aniq niyat</span>
                <textarea
                  className="input-field"
                  value={reviewDraft.plan}
                  onChange={(event) => setReviewDraft((prev) => ({ ...prev, plan: event.target.value }))}
                  rows={3}
                />
              </label>
            </div>

            <div className="nafs-review-actions">
              <span className="nafs-review-bonus">Birinchi saqlash: +{WEEKLY_REVIEW_XP} XP</span>
              {reviewSaved && <span className="nafs-review-saved">Saqlandi</span>}
              <button className="btn btn-primary" onClick={saveWeeklyReview} disabled={!canSaveReview}>
                Reviewni saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {xpToast && (
        <div className={`nafs-xp-toast ${xpToast.xp < 0 ? 'negative' : ''}`} role="status" aria-live="polite">
          <strong>{xpToast.xp < 0 ? '-' : '+'}{Math.abs(xpToast.xp)} XP</strong>
          <span>{xpToast.stageName}</span>
        </div>
      )}

    </div>
  );
}
