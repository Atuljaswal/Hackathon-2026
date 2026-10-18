import { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, Compass, GraduationCap,
  Search, ShieldCheck, Sparkles, Trash2,
} from 'lucide-react';
import { Avatar, StageTag } from '../components/Shared.jsx';
import { CATEGORIES } from '../data/demoData.js';
import { deleteExperience, watchMyPassport } from '../services/passportService.js';
import { getMyProfile } from '../services/userService.js';
import './SkillPassportPage.css';

const activityNames = {
  explore: 'Explored together',
  share: 'Shared a skill',
  ask: 'Asked for help',
  challenge: 'Tried a challenge',
};
const interestLabels = new Map(CATEGORIES.map(({ id, label }) => [id, label]));
const activityFilters = [
  { id: 'all', label: 'All' },
  { id: 'explore', label: 'Explored' },
  { id: 'share', label: 'Shared' },
  { id: 'ask', label: 'Asked for help' },
  { id: 'challenge', label: 'Challenges' },
];

function savedTime(value) {
  return value?.toMillis?.() ?? (value?.seconds || 0) * 1000;
}

function savedDate(value) {
  const date = value?.toDate?.();
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString()
    : 'Recently';
}

export default function SkillPassportPage({ user, authReady = true, navigate, startMode }) {
  const [entries, setEntries] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [readError, setReadError] = useState('');
  const [interestsError, setInterestsError] = useState('');
  const [notice, setNotice] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    if (!user?.uid) {
      setEntries([]);
      setInterests([]);
      setLoading(false);
      setInterestsLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setInterestsLoading(true);
    setReadError('');
    setInterestsError('');

    getMyProfile()
      .then(profile => {
        if (!active) return;
        setInterests(Array.isArray(profile?.categories) ? profile.categories : []);
      })
      .catch(error => {
        if (active) setInterestsError(error?.message || 'Unable to load interests.');
      })
      .finally(() => { if (active) setInterestsLoading(false); });

    let unsubscribe = () => {};
    try {
      unsubscribe = watchMyPassport(
        items => {
          if (!active) return;
          setEntries(items);
          setLoading(false);
          setReadError('');
        },
        error => {
          if (!active) return;
          setReadError(error?.message || 'Unable to load saved experiences.');
          setLoading(false);
        },
      );
    } catch (error) {
      setReadError(error?.message || 'Unable to load saved experiences.');
      setLoading(false);
    }

    return () => { active = false; unsubscribe(); };
  }, [user?.uid]);

  async function removeExperience(entry) {
    if (removingId || !window.confirm(`Remove “${entry.topic || 'this activity'}” from your Skill Passport?`)) return;
    setRemovingId(entry.id);
    setNotice('');
    try {
      await deleteExperience(entry.id);
      // The live Firestore listener removes the entry from the page automatically.
      setNotice('Experience removed from your Skill Passport.');
    } catch (error) {
      setNotice(`Could not remove experience: ${error?.message || String(error)}`);
    } finally {
      setRemovingId(null);
    }
  }

  const total = entries.length;
  const shared = entries.filter(entry => entry.type === 'share').length;
  const profileName = user?.displayName?.trim() || 'Your profile';
  const displayInterests = [...new Set(interests.filter(value => typeof value === 'string' && value.trim()))];
  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const visibleEntries = entries
    .filter(entry => typeFilter === 'all' || entry.type === typeFilter)
    .filter(entry => !normalizedSearch || [entry.topic, entry.partnerDisplayName]
      .some(value => String(value || '').toLocaleLowerCase().includes(normalizedSearch)))
    .sort((a, b) => sortOrder === 'oldest'
      ? savedTime(a.savedAt) - savedTime(b.savedAt)
      : savedTime(b.savedAt) - savedTime(a.savedAt));
  const hasFilters = Boolean(normalizedSearch) || typeFilter !== 'all';

  return (
    <section className="passport-page wrap">
      <div className="passport-heading">
        <div>
          <span className="section-eyebrow">YOUR LEARNING JOURNEY</span>
          <h1>Skill Passport</h1>
          <p>Your collection of activities and interests, saved when you choose.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => startMode('meet')}>
          Explore a skill <ArrowRight size={17} />
        </button>
      </div>

      {!authReady ? (
        <div className="passport-main"><p role="status">Loading your account…</p></div>
      ) : !user ? (
        <div className="passport-main passport-signin">
          <BookOpen size={28} />
          <h2>Your Skill Passport is waiting</h2>
          <p>Log in to see your saved experiences and interests.</p>
          <button className="btn btn-primary" type="button" onClick={() => navigate('login')}>Log in</button>
        </div>
      ) : (
        <div className="passport-layout passport-layout-wide">
          <div className="passport-main">
            <div className="passport-profile">
              <Avatar person={{ name: profileName, initials: (user.displayName || 'You').slice(0, 2).toUpperCase(), hue: 'blue' }} size="xl" />
              <div className="passport-profile-info">
                <h2>{profileName}</h2>
                <div className="passport-interests" aria-label="Your interests">
                  {displayInterests.map(interest => (
                    <span className="passport-interest-chip" key={interest}>
                      {interestLabels.get(interest) || interest}
                    </span>
                  ))}
                  {interestsLoading && <span className="passport-interests-empty">Loading interests…</span>}
                  {!interestsLoading && !interestsError && !displayInterests.length && (
                    <span className="passport-interests-empty">No interests selected yet</span>
                  )}
                  {interestsError && <span className="passport-interests-empty" role="alert">Unable to load interests</span>}
                </div>
                <StageTag kind="green"><ShieldCheck size={14} /> Personal passport</StageTag>
              </div>
            </div>

            <div className="passport-stat-grid">
              <div><BookOpen size={22} /><strong>{loading || readError ? '–' : total === 100 ? '100+' : total}</strong><span>Experiences saved</span></div>
              <div><GraduationCap size={22} /><strong>{loading || readError ? '–' : shared}</strong><span>Skill-sharing activities</span></div>
              <div><Compass size={22} /><strong>{interestsLoading || interestsError ? '–' : displayInterests.length}</strong><span>Your interests</span></div>
            </div>

            <div className="passport-subsection passport-library">
              <div className="passport-library-heading">
                <div>
                  <h3>Saved experiences</h3>
                  <p>Find the activities you explored, shared, or tried with others.</p>
                </div>
                {entries.length === 100 && <span className="passport-library-limit">Showing your 100 most recent entries</span>}
              </div>

              {notice && <p role="status" className="passport-message">{notice}</p>}
              {readError && <p role="alert" className="passport-message passport-error">{readError}</p>}
              {loading ? (
                <p className="passport-message" role="status">Loading saved experiences…</p>
              ) : !readError && entries.length ? (
                <>
                  <div className="passport-library-controls">
                    <div className="passport-activity-filters" role="group" aria-label="Filter saved experiences by activity type">
                      {activityFilters.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          className={`passport-filter-chip${typeFilter === id ? ' is-active' : ''}`}
                          aria-pressed={typeFilter === id}
                          onClick={() => setTypeFilter(id)}
                        >
                          {label}
                          <span>{id === 'all' ? total : entries.filter(entry => entry.type === id).length}</span>
                        </button>
                      ))}
                    </div>
                    <div className="passport-library-tools">
                      <label className="passport-search">
                        <Search size={17} aria-hidden="true" />
                        <input
                          type="search"
                          value={searchText}
                          onChange={event => setSearchText(event.target.value)}
                          placeholder="Search activity or person"
                          aria-label="Search saved experiences"
                        />
                      </label>
                      <label className="passport-sort">
                        <span>Sort by</span>
                        <select value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="passport-library-count" role="status">
                    Showing {visibleEntries.length} of {total} saved experiences
                    {hasFilters && (
                      <button type="button" onClick={() => { setSearchText(''); setTypeFilter('all'); }}>
                        Clear filters
                      </button>
                    )}
                  </div>
                  {visibleEntries.length ? (
                    <div className="activity-list passport-experience-list">
                      {visibleEntries.map(entry => (
                        <article className="passport-experience" key={entry.id}>
                          <span className="activity-icon"><Check size={17} /></span>
                          <div className="passport-experience-details">
                            <strong>{activityNames[entry.type] || 'Skill activity'}: {entry.topic || 'Untitled activity'}</strong>
                            <small>With {entry.partnerDisplayName || 'a matched member'} · {savedDate(entry.savedAt)}</small>
                          </div>
                          <button
                            className="passport-delete"
                            type="button"
                            aria-label={`Delete ${entry.topic || 'experience'} from passport`}
                            disabled={Boolean(removingId)}
                            onClick={() => removeExperience(entry)}
                            title="Delete saved experience"
                          >
                            <Trash2 size={16} /> <span>{removingId === entry.id ? 'Removing…' : 'Remove'}</span>
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-activity">
                      <Search size={20} />
                      <span>No experiences match your search. Try another search or clear the filters.</span>
                    </div>
                  )}
                </>
              ) : !readError ? (
                <div className="empty-activity">
                  <Sparkles size={20} />
                  <span>No saved experiences yet. Activities are optional, and you can save one after both participants agree.</span>
                </div>
              ) : null}
            </div>
          </div>

        </div>
      )}
    </section>
  );
}
