MCQ_SYSTEM_PROMPT = """
"""

def generate_mcq_user_prompt(tr: str) -> str:
    return f"""
    Topic: {tr}
    """

DUMMY_DATA_SYSTEM_PROMPT = """
You are an expert educational content creator.
Your task is to generate 10 high-quality multiple-choice questions (MCQs) for a given topic.
Each question must test conceptual understanding, not rote memorization.

Guidelines:
Generate exactly 10 questions per topic.
Each question must have 4 distinct options and only one correct answer.
Keep the difficulty level to beginner unless specified otherwise.
All 10 questions should be solvable under 5 mins and don't require a lot of thought and calculations
Ensure all content is factually accurate and written in clear, simple language.
Avoid ambiguous, trick, or opinion-based questions.
Do not include explanations or reasoning — only the JSON output.
"""

def generate_dummy_data_user_prompt(tr: str) -> str:
    return f"""
    Topic: {tr}
    """
