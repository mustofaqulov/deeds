import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Onboarding from './components/Onboarding/Onboarding';
import LevelUpModal from './components/Gamification/LevelUpModal';
import AchievementToast from './components/Gamification/AchievementToast';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Calendar from './pages/Calendar/Calendar';
import IftorSaharlik from './pages/IftorSaharlik/IftorSaharlik';
import Challenges from './pages/Challenges/Challenges';
import QuranHadith from './pages/QuranHadith/QuranHadith';
import QuranHifz from './pages/QuranHifz/QuranHifz';
import Profile from './pages/Profile/Profile';
import Tasbeh from './pages/Tasbeh/Tasbeh';
import Qibla from './pages/Qibla/Qibla';
import Videos from './pages/Videos/Videos';
import NafsJourney from './pages/NafsJourney/NafsJourney';
import { getLevelInfo } from './utils/helpers';
import { ACHIEVEMENTS } from './utils/xpSystem';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, updateUser } = useAuth();
  const [dismissedLevelToken, setDismissedLevelToken] = useState(null);
  const [dismissedAchievementToken, setDismissedAchievementToken] = useState(null);
  const [dismissedFreezeToken, setDismissedFreezeToken] = useState(null);

  const showOnboarding = !!(user && !user.onboardingDone);

  const levelToken = user?._levelUp && user?.xp
    ? `${user._levelUp.from || 0}:${user._levelUp.to || 0}:${user.xp}`
    : null;
  const showLevelUp = !!levelToken && dismissedLevelToken !== levelToken;

  const levelUpData = showLevelUp
    ? (() => {
      const level = getLevelInfo(user?.xp || 0).current;
      return {
        level,
        fromLevel: user?._levelUp?.from || Math.max(1, level.level - 1),
      };
    })()
    : null;

  const achievementToken = user?._newAchievements?.length
    ? user._newAchievements.join(',')
    : null;
  const showAchievements = !!achievementToken && dismissedAchievementToken !== achievementToken;

  const achievementItems = showAchievements
    ? user._newAchievements
      .map((id) => ACHIEVEMENTS.find((item) => item.id === id))
      .filter(Boolean)
    : [];

  const freezeToken = (user?._freezeUsed || user?._freezeAwarded)
    ? `${user._freezeUsed || 0}:${user._freezeAwarded || 0}`
    : null;
  const showFreeze = !!freezeToken && dismissedFreezeToken !== freezeToken;

  const freezeEvent = showFreeze
    ? { used: user?._freezeUsed || 0, awarded: user?._freezeAwarded || 0 }
    : null;

  useEffect(() => {
    if (!showAchievements && !showFreeze) return undefined;

    const timer = setTimeout(() => {
      if (achievementToken) setDismissedAchievementToken(achievementToken);
      if (freezeToken) setDismissedFreezeToken(freezeToken);
      updateUser({ _clearTransient: true });
    }, 6500);

    return () => clearTimeout(timer);
  }, [showAchievements, showFreeze, achievementToken, freezeToken, updateUser]);

  const doneOnboarding = () => {
    updateUser({ onboardingDone: true });
  };

  const closeLevelUp = () => {
    if (levelToken) setDismissedLevelToken(levelToken);
    updateUser({ _clearTransient: true });
  };

  const closeAchievementToast = () => {
    if (achievementToken) setDismissedAchievementToken(achievementToken);
    if (freezeToken) setDismissedFreezeToken(freezeToken);
    updateUser({ _clearTransient: true });
  };

  return (
    <>
      {user && <Navbar />}
      {showOnboarding && <Onboarding onDone={doneOnboarding} />}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/calendar"
          element={(
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/iftor"
          element={(
            <ProtectedRoute>
              <IftorSaharlik />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/challenges"
          element={(
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/quran"
          element={(
            <ProtectedRoute>
              <QuranHadith />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/quran-hifz"
          element={(
            <ProtectedRoute>
              <QuranHifz />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/videos"
          element={(
            <ProtectedRoute>
              <Videos />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/nafs"
          element={(
            <ProtectedRoute>
              <NafsJourney />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/tasbeh"
          element={(
            <ProtectedRoute>
              <Tasbeh />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/qibla"
          element={(
            <ProtectedRoute>
              <Qibla />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>

      <LevelUpModal
        open={showLevelUp}
        level={levelUpData?.level}
        fromLevel={levelUpData?.fromLevel}
        onClose={closeLevelUp}
      />

      <AchievementToast
        achievements={achievementItems}
        freezeEvent={freezeEvent}
        onClose={closeAchievementToast}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
