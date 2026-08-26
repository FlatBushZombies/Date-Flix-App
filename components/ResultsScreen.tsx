import { useToast } from '@/components/Toast/ToastProvider';
import { DeviceSheet } from '@/components/cast/DeviceSheet';
import { EnrichedMovie, useEnrichedMovies } from '@/hooks/useEnrichedMovies';
import { castableMovieFromEnriched } from '@/lib/cast/media';
import { useCast } from '@/lib/cast/CastProvider';
import { getWatchUrl } from '@/lib/streaming';
import { sendToStreamingApp } from '@/lib/tvCast';
import type { Movie } from '@/types';
import { MovieNightPlan } from '@/types/planner';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Cast, ChevronLeft as ChevronLeftIcon, Clapperboard, Share2, Star, Tv } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_H * 0.86);

interface ResultsScreenProps {
  plan: MovieNightPlan;
  prompt: string;
  onReset: () => void;
  isSaved: (movieId: number) => boolean;
  toggleSave: (movie: Movie) => Promise<boolean>;
}

export function ResultsScreen({ plan, prompt, onReset, isSaved, toggleSave }: ResultsScreenProps) {
  const { movies: enriched, loading: enrichLoading } = useEnrichedMovies(plan.movies);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [sendingToTv, setSendingToTv] = useState(false);
  const [showDeviceSheet, setShowDeviceSheet] = useState(false);
  const [casting, setCasting] = useState(false);
  const toast = useToast();
  const cast = useCast();

  // Tracks "user asked to cast but wasn't connected yet" across the
  // device-picker round trip — the sheet's own connect() promise can resolve
  // slightly before the SDK's session hooks re-render, so castNowViewing()
  // (defined below, after `active` exists) reacts to the connectionState
  // change instead of being called directly from a callback. Declared above
  // the early return below so hook order stays consistent across renders.
  const pendingCastRef = useRef(false);
  useEffect(() => {
    if (pendingCastRef.current && cast.connectionState === 'connected') {
      pendingCastRef.current = false;
      castNowViewing();
    }
  }, [cast.connectionState]);

  const list: EnrichedMovie[] =
    enriched.length > 0 ? enriched : plan.movies.map((m) => ({ ...m, tmdb: null }));

  const topPickIndex = Math.max(
    0,
    plan.movies.findIndex((m) => m.topPick)
  );
  const [activeIndex, setActiveIndex] = useState(topPickIndex);

  if (list.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#F0EAE4', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
          No movies came back for this plan.
        </Text>
        <TouchableOpacity
          onPress={onReset}
          style={{ paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, backgroundColor: '#FF3B5C' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Plan a different night</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const active = list[activeIndex] ?? list[0];
  const backdropPath = active.tmdb?.backdrop_path || active.tmdb?.poster_path || null;
  const backdropUri = backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : null;
  const overviewText = active.tmdb?.overview?.trim() || active.reason;
  const ratingLabel = active.tmdb ? active.tmdb.vote_average.toFixed(1) : active.rating;

  const handleSelectThumbnail = (idx: number) => {
    setActiveIndex(idx);
    setOverviewExpanded(false);
  };

  const handleSave = async () => {
    if (!active.tmdb) return;
    await toggleSave(active.tmdb);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${active.title} (${active.year}) — recommended by Duo.\n\n${active.reason}`,
      });
    } catch {
      // best-effort, no-op on failure/cancel
    }
  };

  const handleWatch = () => {
    Linking.openURL(getWatchUrl(active.streaming, active.title)).catch(() => {});
  };

  // There's no video to cast directly — this opens the title in its actual
  // streaming app, which has its own Cast/AirPlay button once it's open.
  // Falls back to the same web search "Watch Now" uses if the app isn't
  // installed, so it never dead-ends.
  const handleSendToTv = async () => {
    if (sendingToTv) return;
    setSendingToTv(true);
    try {
      const result = await sendToStreamingApp(active.streaming, active.title);
      if (result === 'app') {
        toast.info('Opened ' + active.streaming, 'Tap the Cast or AirPlay icon in the app to send it to your TV.');
      } else {
        toast.info('Opened in browser', `Install the ${active.streaming} app to send it to your TV directly.`);
      }
    } catch {
      toast.error('Error', "Couldn't open the streaming app. Try again.");
    } finally {
      setSendingToTv(false);
    }
  };

  // Sends this movie's poster/title/overview to the connected Cast receiver
  // as a "Now Viewing" display. See lib/cast/CastProvider.native.tsx for why this shows
  // artwork rather than streaming the movie itself (DateFlix has no video of
  // its own — see the "Known limitations" note in the implementation report).
  // Declared as a hoisted function so the useEffect above (which runs before
  // this line executes) can safely reference it.
  async function castNowViewing() {
    setCasting(true);
    try {
      const result = await cast.watchOnTV(castableMovieFromEnriched(active));
      if (result.ok) {
        toast.success('Casting', `Now showing ${active.title} on ${cast.device?.name ?? 'your TV'}.`);
      } else {
        toast.error('Cast failed', result.message ?? 'Could not send this to your TV.');
      }
    } finally {
      setCasting(false);
    }
  };

  const handleCast = () => {
    if (casting) return;
    if (cast.connectionState !== 'connected') {
      pendingCastRef.current = true;
      setShowDeviceSheet(true);
      return;
    }
    castNowViewing();
  };

  const saved = !!active.tmdb && isSaved(active.tmdb.id);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Full-bleed hero reveal ───────────────────────────────── */}
        <View style={{ height: HERO_HEIGHT, width: '100%' }}>
          {backdropUri ? (
            <Image source={{ uri: backdropUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={['#3a0a1a', '#150509', '#0a0a0f']}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {!backdropUri && (
            <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
              <Clapperboard size={64} color="rgba(255,255,255,0.12)" strokeWidth={1.2} />
            </View>
          )}

          {/* Top + bottom legibility fades */}
          <LinearGradient
            colors={['rgba(10,10,15,0.9)', 'rgba(10,10,15,0.35)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.6)', '#0a0a0f']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 380 }}
          />

          <SafeAreaView style={{ flex: 1 }}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
              <TouchableOpacity
                onPress={onReset}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Back to start"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(10,10,15,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <ChevronLeftIcon size={22} color="#fff" />
              </TouchableOpacity>
              {enrichLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
            </View>

            <View style={{ flex: 1 }} />

            {/* Bottom content block */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              {active.topPick && (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(255,59,92,0.18)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,59,92,0.5)',
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: '#FF9FB3', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                    TOP PICK
                  </Text>
                </View>
              )}

              <Text
                style={{ color: '#fff', fontSize: 30, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 }}
                numberOfLines={2}
              >
                {active.title}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Star size={13} color="#FFD166" fill="#FFD166" />
                <Text style={{ color: '#E8DFE3', fontSize: 12, fontWeight: '600' }}>{ratingLabel}</Text>
                <Text style={{ color: 'rgba(232,223,227,0.4)', fontSize: 12 }}>•</Text>
                <Text style={{ color: '#E8DFE3', fontSize: 12 }}>{active.year}</Text>
                <Text style={{ color: 'rgba(232,223,227,0.4)', fontSize: 12 }}>•</Text>
                <Text style={{ color: '#E8DFE3', fontSize: 12 }}>{active.duration}</Text>
                <Text style={{ color: 'rgba(232,223,227,0.4)', fontSize: 12 }}>•</Text>
                <Text style={{ color: '#E8DFE3', fontSize: 12 }}>{active.streaming}</Text>
              </View>

              {!!overviewText && (
                <View style={{ marginBottom: 16 }}>
                  <Text
                    numberOfLines={overviewExpanded ? undefined : 3}
                    style={{ color: '#C9BFC4', fontSize: 13, lineHeight: 19 }}
                  >
                    {overviewText}
                  </Text>
                  <TouchableOpacity onPress={() => setOverviewExpanded((v) => !v)} activeOpacity={0.7}>
                    <Text style={{ color: '#FF9FB3', fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                      {overviewExpanded ? 'less' : '...more'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* More like this */}
              {list.length > 1 && (
                <View style={{ marginBottom: 18 }}>
                  <Text
                    style={{
                      color: '#9A8A94',
                      fontSize: 11,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 10,
                    }}
                  >
                    More like this
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {list.map((m, idx) =>
                        idx === activeIndex ? null : (
                          <TouchableOpacity
                            key={`${m.title}-${idx}`}
                            onPress={() => handleSelectThumbnail(idx)}
                            activeOpacity={0.8}
                            style={{ width: 64 }}
                          >
                            {m.tmdb?.poster_path ? (
                              <Image
                                source={{ uri: `https://image.tmdb.org/t/p/w342${m.tmdb.poster_path}` }}
                                style={{ width: 64, height: 94, borderRadius: 10, backgroundColor: '#1a1a22' }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={{
                                  width: 64,
                                  height: 94,
                                  borderRadius: 10,
                                  backgroundColor: '#1a1a22',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 1,
                                  borderColor: 'rgba(255,255,255,0.08)',
                                }}
                              >
                                <Clapperboard size={18} color="rgba(255,255,255,0.3)" />
                              </View>
                            )}
                            <Text numberOfLines={1} style={{ color: '#C9BFC4', fontSize: 10, marginTop: 4 }}>
                              {m.title}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Action circles */}
              <View style={{ flexDirection: 'row', gap: 20, marginBottom: 18 }}>
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={!active.tmdb}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={saved ? 'Remove from watchlist' : 'Save to watchlist'}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: saved ? '#FF3B5C' : 'rgba(255,255,255,0.12)',
                      opacity: active.tmdb ? 1 : 0.35,
                      borderWidth: 1,
                      borderColor: saved ? 'transparent' : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <Bookmark size={22} color="#fff" fill={saved ? '#fff' : 'transparent'} />
                  </TouchableOpacity>
                  <Text style={{ color: '#C9BFC4', fontSize: 11, marginTop: 6 }}>
                    {saved ? 'Saved' : 'Save'}
                  </Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={handleShare}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Share this pick"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <Share2 size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={{ color: '#C9BFC4', fontSize: 11, marginTop: 6 }}>Share</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={handleSendToTv}
                    disabled={sendingToTv}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Send to TV"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      opacity: sendingToTv ? 0.5 : 1,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <Tv size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={{ color: '#C9BFC4', fontSize: 11, marginTop: 6 }}>TV</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={handleCast}
                    disabled={casting}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      cast.connectionState === 'connected' ? 'Cast to TV' : 'Connect a TV first'
                    }
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: cast.connectionState === 'connected' ? '#06b6d4' : 'rgba(255,255,255,0.12)',
                      opacity: casting ? 0.5 : 1,
                      borderWidth: 1,
                      borderColor: cast.connectionState === 'connected' ? 'transparent' : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <Cast size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={{ color: '#C9BFC4', fontSize: 11, marginTop: 6 }}>
                    {cast.connectionState === 'connected' ? 'Casting' : 'Cast'}
                  </Text>
                </View>
              </View>

              {/* Primary CTA */}
              <TouchableOpacity
                onPress={handleWatch}
                activeOpacity={0.88}
                style={{
                  width: '100%',
                  paddingVertical: 17,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: '#FF3B5C',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                  Match on {active.streaming}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Secondary detail section (existing content, preserved) ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 }}>
          {!!plan.summary && (
            <Text
              style={{ color: '#C9BFC4', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 24 }}
            >
              {plan.summary}
            </Text>
          )}

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#9A8A94', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              — Set the scene —
            </Text>
          </View>

          {/* Snack */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#20202c',
              backgroundColor: '#151520',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>🍿</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9A8A94', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
                Tonight's snack pairing
              </Text>
              <Text style={{ color: '#C9BFC4', fontSize: 13, lineHeight: 19 }}>{plan.snack}</Text>
            </View>
          </View>

          {/* Ambiance */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#20202c',
              backgroundColor: '#151520',
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>🕯️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9A8A94', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
                Ambiance
              </Text>
              <Text style={{ color: '#C9BFC4', fontSize: 13, lineHeight: 19 }}>{plan.ambiance}</Text>
            </View>
          </View>

          {/* Reset */}
          <TouchableOpacity
            onPress={onReset}
            activeOpacity={0.7}
            style={{
              width: '100%',
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#20202c',
            }}
          >
            <Text style={{ color: '#9A8A94', fontSize: 13 }}>Plan a different night</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DeviceSheet visible={showDeviceSheet} onClose={() => setShowDeviceSheet(false)} />
    </View>
  );
}
