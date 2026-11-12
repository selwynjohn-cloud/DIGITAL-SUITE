"""One thought for each day of the month. The film date picks the day."""

HEADING = "AGILE SENTINEL- DAILY SECURITY BRIEFING AND MOTIVATION"

THOUGHTS = [
    None,
    {
        "theme": "Vigilance & Alertness",
        "thought": "Alert today, alive tomorrow.",
        "takeaway": "Never let routine make you careless. Keep your eyes and ears open at all times.",
    },
    {
        "theme": "Vigilance & Alertness",
        "thought": "Complacency is the biggest enemy of security.",
        "takeaway": "Just because nothing happened yesterday doesn't mean nothing will happen today.",
    },
    {
        "theme": "Vigilance & Alertness",
        "thought": "Observation is the first line of defense.",
        "takeaway": "Notice the small details—an unlocked door, an unattended bag, or an unfamiliar face.",
    },
    {
        "theme": "Vigilance & Alertness",
        "thought": "A sharp eye prevents a crisis before it begins.",
        "takeaway": "Prevention is always better than reaction. Spot the hazard early.",
    },
    {
        "theme": "Vigilance & Alertness",
        "thought": "Your presence is the first deterrent.",
        "takeaway": "Stand tall, stay attentive, and patrol actively. Visibility stops trouble.",
    },
    {
        "theme": "Vigilance & Alertness",
        "thought": "Never assume a gate is locked—check it yourself.",
        "takeaway": "Verification is the core of security duty. Trust only what you have inspected.",
    },
    {
        "theme": "Vigilance & Alertness",
        "thought": "Distraction for a second can cost a day's peace.",
        "takeaway": "Keep mobile phones away on duty. Your focus is your strongest shield.",
    },
    {
        "theme": "Discipline & Grooming",
        "thought": "Your uniform represents authority, trust, and safety.",
        "takeaway": "Wear a clean, well-ironed uniform with polished shoes. Command respect at first glance.",
    },
    {
        "theme": "Discipline & Grooming",
        "thought": "Punctuality is the first sign of a disciplined guard.",
        "takeaway": "Reporting 10 minutes early ensures a smooth handover and a stress-free shift.",
    },
    {
        "theme": "Discipline & Grooming",
        "thought": "Firm in duty, polite in behavior.",
        "takeaway": "You can enforce strict security rules while still speaking respectfully to visitors and staff.",
    },
    {
        "theme": "Discipline & Grooming",
        "thought": "You are the first impression of the site you protect.",
        "takeaway": "Greet clients and visitors with a crisp salute or a polite welcome while checking credentials.",
    },
    {
        "theme": "Discipline & Grooming",
        "thought": "Discipline is doing the right thing even when no one is watching.",
        "takeaway": "Whether on a night shift or a quiet post, maintain the exact same standard of duty.",
    },
    {
        "theme": "Discipline & Grooming",
        "thought": "A calm mind handles any emergency better than panic.",
        "takeaway": "In tense situations, take a breath, follow protocol, and act with composure.",
    },
    {
        "theme": "Discipline & Grooming",
        "thought": "Pride in your posture shows pride in your work.",
        "takeaway": "Avoid slouching or leaning at your post. A sharp posture signals readiness.",
    },
    {
        "theme": "Integrity & Procedure",
        "thought": "No ID, no entry—no exceptions.",
        "takeaway": "Politeness is mandatory, but security rules apply equally to everyone.",
    },
    {
        "theme": "Integrity & Procedure",
        "thought": "If it is not written in the register, it did not happen.",
        "takeaway": "Maintain clean, accurate, and timely entries in all gate and occurrence books.",
    },
    {
        "theme": "Integrity & Procedure",
        "thought": "Integrity is the backbone of a security professional.",
        "takeaway": "People entrust their property and lives to us because they trust our honesty.",
    },
    {
        "theme": "Integrity & Procedure",
        "thought": "A good handover makes a strong next shift.",
        "takeaway": "Brief your reliever clearly on pending issues, keys, and equipment status before leaving.",
    },
    {
        "theme": "Integrity & Procedure",
        "thought": "Know your post orders inside out.",
        "takeaway": "Understanding your site's specific rules gives you the confidence to act without hesitation.",
    },
    {
        "theme": "Integrity & Procedure",
        "thought": "Every visitor, vehicle, and material movement matters.",
        "takeaway": "Check inward and outward passes thoroughly. Never wave a vehicle through without checking.",
    },
    {
        "theme": "Integrity & Procedure",
        "thought": "Report even the smallest incident immediately.",
        "takeaway": "Small issues ignored today become major security breaches tomorrow. Keep supervisors informed.",
    },
    {
        "theme": "Readiness & Teamwork",
        "thought": "In an emergency, training takes over.",
        "takeaway": "Know where every fire extinguisher, alarm panel, and emergency exit is located at your site.",
    },
    {
        "theme": "Readiness & Teamwork",
        "thought": "A single guard is strong; a connected team is unbreakable.",
        "takeaway": "Back up your fellow guards and communicate clearly over the radio or phone.",
    },
    {
        "theme": "Readiness & Teamwork",
        "thought": "Clear communication saves critical seconds.",
        "takeaway": "When reporting an incident, state the exact location, nature of the issue, and help needed.",
    },
    {
        "theme": "Readiness & Teamwork",
        "thought": "Equipment is only useful if it is working.",
        "takeaway": "Check your torch, walkie-talkie, baton, and emergency numbers at the start of every shift.",
    },
    {
        "theme": "Readiness & Teamwork",
        "thought": "Safety starts with self-care.",
        "takeaway": "Get proper rest between shifts and stay hydrated so your body and mind stay sharp on duty.",
    },
    {
        "theme": "Readiness & Teamwork",
        "thought": "Fire and safety hazards don't wait for permission.",
        "takeaway": "During patrols, watch out for loose wires, blocked exits, or water leaks and report them.",
    },
    {
        "theme": "Readiness & Teamwork",
        "thought": "Respect your seniors, guide your juniors.",
        "takeaway": "Share site knowledge with new guards on your post so the whole team grows stronger.",
    },
    {
        "theme": "Pride & Purpose",
        "thought": "Because we stay awake, others can work and sleep in peace.",
        "takeaway": "Never underestimate the value of your role. You are the backbone of a safe workplace.",
    },
    {
        "theme": "Pride & Purpose",
        "thought": "Excellence is not a one-day act; it is a daily habit.",
        "takeaway": "Finish the month with the same energy and alertness you had on Day 1.",
    },
    {
        "theme": "Pride & Purpose",
        "thought": "We don't just guard buildings; we protect people and livelihoods.",
        "takeaway": "Take pride in your badge and your duty. Every safe shift is a successful mission.",
    },
]


def thought_for(date_text):
    """The film date chooses the day. The 28th uses day 28."""
    raw = (date_text or "").strip()
    parts = raw.split("-")
    day = 0
    if len(parts) == 3 and parts[2].isdigit():
        day = int(parts[2])
    if day < 1 or day > 31:
        day = 1
    return THOUGHTS[day]


def read_seconds(text):
    """Keep the card up long enough to read the words in the picture space."""
    words = len((text or "").split())
    return max(12.0, words / 2.0 + 4.0)
