QUIZ_GENERATION_PROMPT = """
You are a technical quiz generator.
Given these skills: {skills}

Generate 5 multiple choice questions to assess the user's actual knowledge level.
- Each question should be multiple-choice with 4 options (A, B, C, D) and only one correct answer.
- Questions should be a mix of theoretical and practical scenarios relevant to the user's proficiency level (beginner, intermediate, advanced).
- Ensure questions cover a range of skills if multiple are provided, but focus more on higher proficiency skills.

Return ONLY a raw JSON array. No markdown, no ```json fences, no explanation.
Output must start with [ and end with ].

Each question must follow this exact structure:
[
  {{
    "question": "What is FastAPI?",
    "options": ["A. A Python web framework", "B. A Java library", "C. A database", "D. A cloud service"],
    "correct_answer": "A",
    "skill_tested_on": "Python"
  }},
  ...
]
"""
