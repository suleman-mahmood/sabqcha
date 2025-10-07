"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/components/UserProvider";
import { useRouter } from "next/navigation";

interface LeaderboardRow {
  display_name: string;
  user_id: string;
  rank: number;
  score: number;
}

export default function Leaderboards() {
  const { user } = useUser();

  const base = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
  const router = useRouter();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${base}/leaderboard`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        // Expecting an array of { display_name, user_id, rank, score }
        if (Array.isArray(data)) setRows(data);
        else if (data.data && Array.isArray(data.data)) setRows(data.data);
        else setRows([]);
      } catch (e) {
        console.error(e);
        setError("Failed to load leaderboards.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Leaderboards</h1>
          <div>
            <Button variant="ghost" onClick={() => router.push("/")}>Back</Button>
          </div>
        </div>

        <Card className="p-6">
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center">
                <Spinner className="mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Loading leaderboards...</p>
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leaderboard data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Player</th>
                      <th className="p-3">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .slice()
                      .sort((a, b) => a.rank - b.rank)
                      .map((r) => {
                        const isCurrent = user && r.user_id === user.userId;
                        return (
                          <tr
                            key={r.user_id}
                            className={`${isCurrent ? "bg-yellow-100 dark:bg-yellow-900/30 font-semibold" : ""}`}
                          >
                            <td className="p-3">{r.rank}</td>
                            <td className="p-3">{r.display_name}</td>
                            <td className="p-3">{r.score}</td>
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
