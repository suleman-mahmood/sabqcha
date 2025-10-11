"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Entry = {
  id: string;
  display_name: string;
  score: number;
  rank: number;
  current_user?: boolean;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const room_id = String(params?.room_id ?? "");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard/${encodeURIComponent(room_id)}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch leaderboard");
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid leaderboard response");
        }
        const mapped = data.map((it: any) => ({
          id: String(it.id ?? it[0] ?? ""),
          display_name: it.display_name ?? it[1] ?? "Unknown",
          score: typeof it.score === "number" ? it.score : Number(it.score ?? (it[2] ?? 0)),
          rank: typeof it.rank === "number" ? it.rank : Number(it.rank ?? (it[3] ?? 0)),
          current_user: !!(it.current_user ?? it[4]),
        }));
        if (mounted) setEntries(mapped);
      } catch (e: any) {
        console.error("Leaderboard fetch failed:", e);
        if (mounted) setError(e.message || "Failed to load leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => {
      mounted = false;
    };
  }, [room_id]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>Back</Button>
          </div>
        </div>
        <Card>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Spinner /></div>
            ) : error ? (
              <div className="text-destructive">{error}</div>
            ) : entries.length === 0 ? (
              <div className="text-muted-foreground">No entries yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2">Rank</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => {
                      const highlight = e.current_user;
                      return (
                        <tr key={e.id} className={highlight ? "bg-primary/10 font-semibold" : ""}>
                          <td className="py-2">{e.rank}</td>
                          <td className="py-2">{e.display_name}</td>
                          <td className="py-2 text-right">{e.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
