"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface PastPaper {
    id: string;
    subject: string;
    season: string;
    year: number;
    paper: number;
    variant: number;
    question_file_path: string;
}

export default function PastPaperPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const roomId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [pastPaper, setPastPaper] = useState<PastPaper | null>(null);
    const [questionImageUrl, setQuestionImageUrl] = useState<string>("");
    const [error, setError] = useState<string>("");

    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [aiComment, setAiComment] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    useEffect(() => {
        // Redirect teachers away from this page
        if (user && user.userRole === "TEACHER") {
            router.push("/dashboard");
            return;
        }

        fetchRandomPastPaper();
    }, [roomId, user, router]);

    useEffect(() => {
        // Cleanup preview URL on unmount
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const fetchRandomPastPaper = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/past-paper/room/${roomId}/random`);
            if (!res.ok) {
                throw new Error("Failed to fetch past paper");
            }

            const data: PastPaper = await res.json();
            setPastPaper(data);

            // Get the question image URL from Firebase Storage
            const questionRef = ref(storage, data.question_file_path);
            const url = await getDownloadURL(questionRef);
            setQuestionImageUrl(url);
        } catch (err) {
            console.error("Error fetching past paper:", err);
            setError("Failed to load past paper. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            return;
        }

        setSelectedImage(file);
        setError("");

        // Create preview URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
    };

    const handleUploadSolution = async () => {
        if (!selectedImage || !pastPaper) return;

        setUploading(true);
        setError("");

        try {
            // Upload image to Firebase Storage
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).slice(2, 9);
            const fileExt = selectedImage.name.match(/\.[a-z0-9]+$/i)?.[0] || ".jpg";
            const uniqueFileName = `solution-${timestamp}-${randomStr}${fileExt}`;
            const storageRef = ref(storage, `past-paper-solutions/${uniqueFileName}`);

            const uploadTask = uploadBytesResumable(storageRef, selectedImage);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(percent));
                },
                (error) => {
                    console.error("Upload failed:", error);
                    setError("Failed to upload solution. Please try again.");
                    setUploading(false);
                },
                async () => {
                    // Upload complete, now submit to backend
                    const solutionPath = `past-paper-solutions/${uniqueFileName}`;
                    await submitSolution(solutionPath);
                }
            );
        } catch (err) {
            console.error("Error uploading solution:", err);
            setError("Failed to upload solution. Please try again.");
            setUploading(false);
        }
    };

    const submitSolution = async (solutionPath: string) => {
        if (!pastPaper) return;

        setSubmitting(true);

        try {
            const res = await fetch(`/api/past-paper/bank/${pastPaper.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ solution_file_path: solutionPath }),
            });

            if (!res.ok) {
                throw new Error("Failed to submit solution");
            }

            const data = await res.json();
            setAiComment(data.comment || "No feedback available.");
        } catch (err) {
            console.error("Error submitting solution:", err);
            setError("Failed to get AI feedback. Please try again.");
        } finally {
            setUploading(false);
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner className="h-8 w-8" />
                    <p className="text-muted-foreground">Loading past paper...</p>
                </div>
            </div>
        );
    }

    if (!pastPaper) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error || "Failed to load past paper."}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>

                    <Button
                        onClick={() => {
                            setAiComment("");
                            setSelectedImage(null);
                            setPreviewUrl("");
                            fetchRandomPastPaper();
                        }}
                        variant="outline"
                    >
                        Try Another Question
                    </Button>
                </div>

                <h1 className="text-3xl font-bold mb-6">AI Tutor - Past Paper Practice</h1>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Question */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Question Details</CardTitle>
                            <div className="text-sm text-muted-foreground mt-2">
                                <p><strong>Subject:</strong> {pastPaper.subject}</p>
                                <p><strong>Year:</strong> {pastPaper.year} ({pastPaper.season})</p>
                                <p><strong>Paper:</strong> {pastPaper.paper} - Variant {pastPaper.variant}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="border rounded-lg overflow-hidden bg-muted">
                                    {questionImageUrl ? (
                                        <img
                                            src={questionImageUrl}
                                            alt="Past paper question"
                                            className="w-full h-auto"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-64">
                                            <Spinner />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-accent/50 rounded-lg">
                                    <p className="text-sm font-medium mb-2">Instructions:</p>
                                    <p className="text-sm text-muted-foreground">
                                        Solve this question on paper or digitally, then upload your solution below to receive AI-powered feedback and guidance.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column - Solution Upload & Feedback */}
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload Your Solution</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Preview */}
                                {previewUrl && (
                                    <div className="border rounded-lg overflow-hidden bg-muted">
                                        <img
                                            src={previewUrl}
                                            alt="Solution preview"
                                            className="w-full h-auto max-h-96 object-contain"
                                        />
                                    </div>
                                )}

                                {/* Upload Controls */}
                                <div className="flex flex-col gap-3">
                                    <Button
                                        variant="outline"
                                        disabled={uploading || submitting}
                                        className="w-full"
                                    >
                                        <label className="cursor-pointer flex items-center justify-center w-full">
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            {selectedImage ? "Change Image" : "Select Image"}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                hidden
                                                onChange={handleImageSelect}
                                            />
                                        </label>
                                    </Button>

                                    {selectedImage && (
                                        <Button
                                            onClick={handleUploadSolution}
                                            disabled={uploading || submitting}
                                            className="w-full"
                                        >
                                            {uploading || submitting ? (
                                                <>
                                                    <Spinner className="mr-2 h-4 w-4" />
                                                    {uploading ? `Uploading... ${uploadProgress}%` : "Getting feedback..."}
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Submit for AI Review
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {uploading && (
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI Feedback Section */}
                        {aiComment && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Tutor Feedback</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 bg-accent/50 rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{aiComment}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
