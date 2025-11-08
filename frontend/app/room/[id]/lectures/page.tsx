"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react";

interface Lecture {
    id: string;
    title: string;
    file_path: string;
    created_at: string;
}

interface TaskSet {
    id: string;
    day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
}

interface Week {
    lecture_group_id: string;
    week_name: string;
    lectures: Lecture[];
    task_sets: TaskSet[];
}

interface RoomData {
    room: {
        id: string;
        display_name: string;
        invite_code: string;
        daily_task_set_id: string;
        score: number;
        ai_tutor_enabled: boolean;
    };
    this_week: Week;
    past_weeks: Week[];
}

export default function LectureRecordingsPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);

    // Media player state
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [mediaUrl, setMediaUrl] = useState<string>("");
    const [loadingMedia, setLoadingMedia] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        fetchLectures();
    }, [roomId]);

    const fetchLectures = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/lecture/room/${roomId}`);
            if (!res.ok) {
                throw new Error("Failed to fetch lecture data");
            }
            const data: RoomData = await res.json();
            setRoomData(data);
        } catch (err) {
            console.error("Failed to fetch lectures:", err);
            setError("Failed to load lecture recordings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLectureClick = async (lecture: Lecture) => {
        setSelectedLecture(lecture);
        setLoadingMedia(true);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        try {
            // Fetch the download URL from Firebase Storage
            const { getDownloadURL, ref } = await import("firebase/storage");
            const { storage } = await import("@/lib/firebase");
            const storageRef = ref(storage, lecture.file_path);
            const url = await getDownloadURL(storageRef);
            setMediaUrl(url);
        } catch (err) {
            console.error("Failed to load media:", err);
            setError("Failed to load media file. Please try again.");
            setSelectedLecture(null);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handlePlayPause = () => {
        const media = audioRef.current || videoRef.current;
        if (!media) return;

        if (isPlaying) {
            media.pause();
        } else {
            media.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const media = audioRef.current || videoRef.current;
        if (media) {
            setCurrentTime(media.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        const media = audioRef.current || videoRef.current;
        if (media) {
            setDuration(media.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const media = audioRef.current || videoRef.current;
        if (media) {
            const newTime = parseFloat(e.target.value);
            media.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const toggleMute = () => {
        const media = audioRef.current || videoRef.current;
        if (media) {
            media.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const closeDialog = () => {
        const media = audioRef.current || videoRef.current;
        if (media) {
            media.pause();
        }
        setSelectedLecture(null);
        setMediaUrl("");
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    };

    const isVideoFile = (filePath: string) => {
        const videoExtensions = [".mp4", ".mkv", ".webm", ".mov", ".avi", ".mpeg", ".mpg", ".wmv", ".flv"];
        return videoExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
    };

    const renderWeek = (week: Week, isCurrentWeek: boolean = false) => {
        if (!week.lectures || week.lectures.length === 0) return null;

        return (
            <Card key={week.lecture_group_id} className="mb-6">
                <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-foreground">
                        {isCurrentWeek ? "📚 This Week" : week.week_name || "Week"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {week.lectures.map((lecture) => (
                            <Card
                                key={lecture.id}
                                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                                onClick={() => handleLectureClick(lecture)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Play className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground truncate">
                                                {lecture.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(lecture.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <Spinner className="h-8 w-8 mb-4" />
                        <p className="text-muted-foreground">Loading lecture recordings...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !roomData) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-5xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard")}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-foreground">
                        Lecture Recordings {roomData && `| ${roomData.room.display_name}`}
                    </h1>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Lecture Weeks */}
                {roomData && (
                    <>
                        {/* This Week */}
                        {renderWeek(roomData.this_week, true)}

                        {/* Past Weeks */}
                        {roomData.past_weeks && roomData.past_weeks.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-foreground">
                                    Past Weeks
                                </h2>
                                {roomData.past_weeks.map((week) => renderWeek(week, false))}
                            </div>
                        )}

                        {/* No lectures message */}
                        {(!roomData.this_week.lectures || roomData.this_week.lectures.length === 0) &&
                            (!roomData.past_weeks || roomData.past_weeks.length === 0 ||
                                roomData.past_weeks.every(w => !w.lectures || w.lectures.length === 0)) && (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <p className="text-muted-foreground">
                                            No lecture recordings available yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                    </>
                )}

                {/* Media Player Dialog */}
                <Dialog open={selectedLecture !== null} onOpenChange={(open) => !open && closeDialog()}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{selectedLecture?.title}</DialogTitle>
                        </DialogHeader>

                        {loadingMedia ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Spinner className="h-8 w-8 mb-4" />
                                <p className="text-muted-foreground">Loading media...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Media Element */}
                                {selectedLecture && mediaUrl && (
                                    <>
                                        {isVideoFile(selectedLecture.file_path) ? (
                                            <video
                                                ref={videoRef}
                                                src={mediaUrl}
                                                className="w-full rounded-lg"
                                                onTimeUpdate={handleTimeUpdate}
                                                onLoadedMetadata={handleLoadedMetadata}
                                                onEnded={() => setIsPlaying(false)}
                                                controls={false}
                                            />
                                        ) : (
                                            <audio
                                                ref={audioRef}
                                                src={mediaUrl}
                                                onTimeUpdate={handleTimeUpdate}
                                                onLoadedMetadata={handleLoadedMetadata}
                                                onEnded={() => setIsPlaying(false)}
                                                className="hidden"
                                            />
                                        )}

                                        {/* Custom Controls */}
                                        <div className="space-y-3">
                                            {/* Progress Bar */}
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration || 0}
                                                value={currentTime}
                                                onChange={handleSeek}
                                                className="w-full"
                                            />

                                            {/* Time Display */}
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>

                                            {/* Control Buttons */}
                                            <div className="flex items-center justify-center gap-4">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handlePlayPause}
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="h-5 w-5" />
                                                    ) : (
                                                        <Play className="h-5 w-5" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={toggleMute}
                                                >
                                                    {isMuted ? (
                                                        <VolumeX className="h-5 w-5" />
                                                    ) : (
                                                        <Volume2 className="h-5 w-5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <DialogClose asChild>
                                <Button variant="outline" onClick={closeDialog}>
                                    Close
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
