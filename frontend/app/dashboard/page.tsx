"use client";

import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";

interface Lecture {
  doc_id: string;
  title: string;
}

export default function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const router = useRouter();

  // 🔹 Fetch all available lectures from backend
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await fetch("/api/transcribe/list");
        const data = await res.json();
        // ✅ New format: { data: [ { doc_id, title } ] }
        if (data.data) setLectures(data.data);
      } catch (err) {
        console.error("Failed to fetch lectures:", err);
      }
    };
    fetchLectures();
  }, []);

  // 🔹 Handle file upload + trigger transcription
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

        // Call backend to transcribe the uploaded file
        const res = await fetch(`/api/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: `lecture/${file.name}`, title }),
        });

        const data = await res.json();
        console.log("Transcription started:", data);

        // Refresh lecture list
        const listRes = await fetch("/api/transcribe/list");
        const listData = await listRes.json();
        if (listData.data) setLectures(listData.data);

        setUploading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 🔹 Title */}
        <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>

        {/* 🔸 Upload Section */}
        <Card className="p-6 text-center mb-8">
          <CardContent>
            <Upload className="mx-auto mb-3" />
            <Button asChild disabled={uploading}>
              <label className="cursor-pointer">
                {uploading ? "Uploading..." : "Select Audio File"}
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleUpload(e.target.files[0])
                  }
                />
              </label>
            </Button>
            {uploading && (
              <p className="text-sm text-gray-600 mt-2">
                Uploading... {progress}%
              </p>
            )}
          </CardContent>
        </Card>

        {/* 🔸 Lecture List */}
        <Card className="p-6 mb-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Available Lectures</h2>

            {lectures.length === 0 ? (
              <p className="text-gray-500 text-sm">No lectures found yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-100 border text-center">
                  <p className="text-gray-700 font-medium mb-2">
                    🎧 Get Started — Select a lecture below to view its MCQs
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lectures.map((lecture) => (
                    <Card
                      key={lecture.doc_id}
                      className="cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => router.push(`/mcqs/${lecture.doc_id}`)}
                    >
                      <CardContent className="p-4 text-center">
                        <p className="font-semibold text-gray-900 truncate">
                          {lecture.title || "Untitled Lecture"}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          ID: {lecture.doc_id}
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
