"use client";

import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

export default function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lectures, setLectures] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loadingMCQs, setLoadingMCQs] = useState(false);

  // 🔹 Fetch all available lectures from backend
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await fetch("/api/transcribe/list");
        const data = await res.json();
        if (data.docs) setLectures(data.docs);
      } catch (err) {
        console.error("Failed to fetch lectures:", err);
      }
    };
    fetchLectures();
  }, []);

  // 🔹 Handle file upload
  const handleUpload = async (file: File) => {
    setUploading(true);
    const storageRef = ref(storage, `lecture/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
        const res = await fetch(`/api/transcribe?filePath=${encodeURIComponent(downloadURL)}`);
        const data = await res.json();

        if (data.transcription_id) {
          // Refresh lecture list after new transcription is ready
          const listRes = await fetch("/api/transcribe/list");
          const listData = await listRes.json();
          if (listData.docs) setLectures(listData.docs);
        }

        setUploading(false);
      }
    );
  };

  // 🔹 Fetch MCQs for a selected transcription
  const handleSelectLecture = async (id: string) => {
    setSelectedId(id);
    setLoadingMCQs(true);
    setMcqs([]);
    try {
      const res = await fetch(`/api/mcqs?transcription_id=${id}`);
      const data = await res.json();
      if (data.mcqs) setMcqs(data.mcqs);
    } catch (err) {
      console.error("Failed to load MCQs:", err);
    } finally {
      setLoadingMCQs(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
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
                  onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                />
              </label>
            </Button>
            {uploading && (
              <p className="text-sm text-gray-600 mt-2">Uploading... {progress}%</p>
            )}
          </CardContent>
        </Card>

        {/* 🔸 Lecture List */}
        <Card className="p-6 mb-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Available Lectures</h2>
            {lectures.length === 0 && (
              <p className="text-gray-500 text-sm">No lectures found yet.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lectures.map((id) => (
                <Button
                  key={id}
                  variant={selectedId === id ? "default" : "outline"}
                  onClick={() => handleSelectLecture(id)}
                >
                  {id}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 🔸 MCQs Display */}
        {loadingMCQs && <p className="text-center text-gray-600">Loading MCQs...</p>}
        {!loadingMCQs && mcqs.length > 0 && (
          <Card className="p-4">
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">
                MCQs for {selectedId}
              </h2>
              {mcqs.map((q, i) => (
                <div key={i} className="mb-5">
                  <p className="font-medium">{i + 1}. {q.question}</p>
                  <ul className="list-disc ml-5 mt-2">
                    {q.options.map((opt, idx) => (
                      <li key={idx}>{opt}</li>
                    ))}
                  </ul>
                  <p className="text-green-700 mt-2">
                    ✅ Answer: {q.answer}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
