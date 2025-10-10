"use client";

import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";

interface Room {
  id: string;
  display_name: string;
  invite_code?: string;
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) {
        if (stored === "dark") {
          document.documentElement.classList.add("dark");
          setIsDark(true);
        } else {
          document.documentElement.classList.remove("dark");
          setIsDark(false);
        }
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    if (next) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    }
  };

  return (
    <Button variant="ghost" onClick={toggle}>
      {isDark ? "🌙 Dark" : "🌤️ Light"}
    </Button>
  );
}

export default function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [ytLink, setYtLink] = useState("");
  const [uploadMode, setUploadMode] = useState<"upload" | "youtube">("upload");
  const router = useRouter();
  const { user, setUser } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  // 🔹 Fetch rooms from /room
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/room");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        // expected: { user_role, user_diplay_name, rooms: [ { id, display_name, invite_code } ] }
        if (data.user_diplay_name) {
          try {
            localStorage.setItem("display_name", data.user_diplay_name);
          } catch (e) {}
          // update context user
          if (typeof setUser === "function") {
            setUser({ displayName: data.user_diplay_name, userId: localStorage.getItem("user_id") || "" });
          }
        }
        if (data.user_role) {
          setUserRole(data.user_role);
          try {
            localStorage.setItem("user_role", data.user_role);
          } catch (e) {}
        }
        if (Array.isArray(data.rooms)) {
          const mapped: Room[] = data.rooms.map((r: any) => ({ id: r.id || r.doc_id || "", display_name: r.display_name || r.title || "Untitled", invite_code: r.invite_code }));
          setRooms(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [setUser]);

  // The existing upload/transcribe logic remains unchanged — keep using the external service
  const base = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;

  const handleUpload = async (file: File) => {
    const title = window.prompt("Enter a title for this lecture:");
    if (!title) {
      alert("Upload cancelled: title is required.");
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `lecture/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(percent));
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log("✅ File uploaded at:", downloadURL);

        try {
          const res = await fetch(`${base}/transcribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_path: `lecture/${file.name}`, yt_video_link: null, title, user_id: user?.userId ?? "" }),
          });
          const data = await res.json();
          console.log("Transcription started:", data);
        } catch (err) {
          console.error("Failed to start transcription:", err);
        }

        try {
          const listRes = await fetch(`${base}/transcribe/list`);
          const listData = await listRes.json();
          if (listData.data) {
            // no-op: keep previous behavior for transcribe list
          }
        } catch (err) {
          console.error("Failed to refresh lectures:", err);
        }

        setUploading(false);
      }
    );
  };

  const handleYoutubeSubmit = async () => {
    if (!ytLink) {
      alert("Please enter a YouTube share link.");
      return;
    }
    let parsed;
    try {
      parsed = new URL(ytLink);
    } catch (e) {
      alert("Invalid URL.");
      return;
    }

    if (parsed.hostname !== "youtu.be") {
      alert("Please provide a youtu.be share URL (use YouTube's Share -> Copy link)." );
      return;
    }

    const title = window.prompt("Enter a title for this lecture:");
    if (!title) {
      alert("Submission cancelled: title is required.");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch(`${base}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: null, yt_video_link: ytLink, title, user_id: user?.userId ?? "" }),
      });
      const data = await res.json();
      console.log("Transcription started (yt):", data);

      const listRes = await fetch(`${base}/transcribe/list`);
      const listData = await listRes.json();
      if (listData.data) {
        // keep existing behavior
      }

      setYtLink("");
    } catch (err) {
      console.error("Failed to submit YouTube link:", err);
      alert("Failed to submit YouTube link.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
          <div className="flex justify-end items-center mb-4">
            <span className="mr-3 text-sm text-muted-foreground">Hi, {user?.displayName}</span>
            <ThemeToggle />
          </div>
        {/* 🔹 Title */}
        <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>

        {/* 🔸 Upload & Leaderboards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Upload / YouTube card */}
          <Card className="md:col-span-2 p-6">
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="p-3 bg-accent rounded-lg self-center sm:self-start">
                  <Upload />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Add Lecture</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose one option to add a lecture — upload audio OR submit a YouTube link.</p>

                  <div className="inline-flex rounded-md bg-muted p-1 mb-4">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-sm ${uploadMode === 'upload' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                      onClick={() => setUploadMode('upload')}
                    >
                      Upload Audio
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-sm ${uploadMode === 'youtube' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                      onClick={() => setUploadMode('youtube')}
                    >
                      YouTube Link
                    </button>
                  </div>

                  {uploadMode === 'upload' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Button asChild disabled={uploading}>
                        <label className="cursor-pointer">
                          {uploading ? 'Uploading...' : 'Select Audio File'}
                          <input
                            type="file"
                            accept="audio/*"
                            hidden
                            onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                          />
                        </label>
                      </Button>

                      <p className="text-sm text-muted-foreground">Supported: mp3</p>
                    </div>
                  )}

                  {uploadMode === 'youtube' && (
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={ytLink}
                        onChange={(e) => setYtLink(e.target.value)}
                        placeholder="Paste youtu.be share link (eg. https://youtu.be/ID?si=...)"
                        className="border border-input px-3 py-2 rounded-md w-full sm:w-80 text-sm"
                        disabled={uploading}
                      />
                      <Button variant="outline" disabled={uploading} onClick={handleYoutubeSubmit}>
                        {uploading ? 'Submitting...' : 'Submit'}
                      </Button>
                    </div>
                  )}

                  {uploading && (
                    <div className="mt-4">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Uploading... {progress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboards card */}
          {!loading && userRole !== "TEACHER" && (
            <Card className="p-6">
              <CardContent className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-2">Leaderboards</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">See top learners and compare your progress.</p>
                <Button variant="ghost" onClick={() => router.push("/leaderboards")}>View Leaderboards</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 🔸 Room List */}
        <Card className="p-6 mb-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Rooms</h2>

            {loading ? (
              <div className="flex flex-col items-center">
                <Spinner className="mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Loading rooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-muted-foreground text-sm">No rooms found yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted border-border text-center">
                  <p className="text-foreground font-medium mb-2">
                    🎧 Get Started — Select a room below to view its MCQs
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rooms.map((room) => (
                    <Card
                      key={room.id}
                      className="cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => router.push(`/mcqs/${room.id}`)}
                    >
                      <CardContent className="p-4 text-center">
                        <p className="font-semibold text-foreground truncate">
                          {room.display_name || "Untitled Room"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          ID: {room.id}
                        </p>
                        <Button className="mt-3 w-full" variant="outline">
                          View MCQs
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
