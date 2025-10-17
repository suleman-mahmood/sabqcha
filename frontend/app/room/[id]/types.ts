export type TaskSet = {
  id: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
};

export type Lecture = {
  id: string;
  title: string;
  created_at: string;
};

export type Week = {
  lecture_group_id: string;
  week_name: string;
  lectures: Lecture[];
  task_sets: TaskSet[];
};

export type Quiz = {
  id: string;
  title: string;
  answer_sheet_path?: string | null;
  rubric_path?: string | null;
  created_at?: string;
};
