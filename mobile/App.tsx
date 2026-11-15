import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SAMPLES, type Sample } from "./src/samples";

const NOTICE = "PROTOTYPE FOR INTERNAL TESTING. Every item is a fictional, nonclinical sample written to test the app. It contains no ICU, patient or medication content and must not be used for clinical decisions.";

export default function App() {
  const dark = useColorScheme() === "dark";
  const c = dark ? { bg: "#111418", fg: "#f3f5f7", card: "#1d232a", line: "#3a444f", accent: "#7fb0ff" } : { bg: "#ffffff", fg: "#14181c", card: "#f2f5f8", line: "#c9d1d9", accent: "#1d4ed8" };
  const [open, setOpen] = useState<Sample | null>(null);
  const [seen, setSeen] = useState<Record<string, string[]>>({});
  const [part, setPart] = useState<number | null>(null);
  const s = styles(c);

  const choose = (code: string, i: number, label: string) => { setPart(i); setSeen((p) => ((p[code] ?? []).includes(label) ? p : { ...p, [code]: [...(p[code] ?? []), label] })); };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style={dark ? "light" : "dark"} />
      <View style={s.notice} accessibilityRole="alert"><Text style={s.noticeText}>{NOTICE}</Text></View>
      {open === null ? (
        <FlatList
          data={SAMPLES}
          keyExtractor={(x) => x.code}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListHeaderComponent={<Text accessibilityRole="header" style={s.h1}>Equipment samples</Text>}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} style={s.card} onPress={() => { setOpen(item); setPart(null); }}>
              <Text style={s.h2}>{item.title}</Text>
              <Text style={s.body}>{item.summary}</Text>
              <Text style={s.meta}>{(seen[item.code] ?? []).length} of {item.parts.length} parts viewed</Text>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Pressable accessibilityRole="button" onPress={() => setOpen(null)} style={s.back}><Text style={s.link}>← Back</Text></Pressable>
          <Text accessibilityRole="header" style={s.h1}>{open.title}</Text>
          <Text style={s.h2}>Parts</Text>
          {open.parts.map((p, i) => (
            <Pressable key={p.label} accessibilityRole="button" accessibilityState={{ selected: part === i }} onPress={() => choose(open.code, i, p.label)} style={[s.card, part === i && { borderColor: c.accent, borderWidth: 2 }]}>
              <Text style={s.h3}>{i + 1}. {p.label}{(seen[open.code] ?? []).includes(p.label) ? "  (viewed)" : ""}</Text>
            </Pressable>
          ))}
          <View style={s.detail} accessibilityLiveRegion="polite"><Text style={s.body}>{part === null ? "Choose a part to see what it does." : `${open.parts[part]!.label}: ${open.parts[part]!.detail}`}</Text></View>
          <Text style={s.h2}>Safety concepts</Text>
          {open.safety.map((t) => <Text key={t} style={s.body}>• {t}</Text>)}
          <Text style={s.h2}>When to escalate</Text>
          {open.escalate.map((t) => <Text key={t} style={s.body}>• {t}</Text>)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = (c: { bg: string; fg: string; card: string; line: string; accent: string }) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  notice: { backgroundColor: "#fff3cd", padding: 12, borderBottomWidth: 1, borderColor: "#e0c36a" },
  noticeText: { color: "#5c4400", fontSize: 13 },
  h1: { color: c.fg, fontSize: 26, fontWeight: "700", marginBottom: 8 },
  h2: { color: c.fg, fontSize: 19, fontWeight: "600", marginTop: 8 },
  h3: { color: c.fg, fontSize: 16, fontWeight: "600" },
  body: { color: c.fg, fontSize: 16, lineHeight: 22 },
  meta: { color: c.fg, opacity: 0.7, fontSize: 13, marginTop: 6 },
  card: { backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderRadius: 10, padding: 14, minHeight: 48 },
  detail: { backgroundColor: c.card, borderRadius: 10, padding: 14, minHeight: 56 },
  back: { minHeight: 48, justifyContent: "center" },
  link: { color: c.accent, fontSize: 16, fontWeight: "600" },
});
