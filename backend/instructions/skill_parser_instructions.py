SKILL_EXTRACTION_PROMPT = """
Extract technical skills from the resume below for the {domain} domain.
Rules:
- Focus on: Languages, Frameworks, Databases, Tools, Cloud, Testing
- Proficiency: beginner (academic/once mentioned), intermediate (1-2 projects), advanced (production/years of exp)
- Return 3-10 skills
Return ONLY a raw JSON array. No markdown, no ```json fences, no explanation.
Output must start with [ and end with ].
Format:
[
  {{"skill_name": "Python", "level": "advanced"}},
  {{"skill_name": "FastAPI", "level": "intermediate"}}
]
Resume Text: {resume_text}
"""
