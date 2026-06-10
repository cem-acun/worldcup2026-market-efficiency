"""2026 FIFA World Cup group draw.

48 teams in 12 groups of 4. Source: official FIFA final draw (5 December 2025),
cross-checked against ESPN and Yahoo Sports.

Team names match the convention used in the international results dataset
(martj42/international_results) so they can be looked up directly in the Elo
ratings dictionary.
"""

GROUPS = {
    "A": ["Mexico", "South Africa", "South Korea", "Czech Republic"],
    "B": ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    "C": ["Brazil", "Morocco", "Haiti", "Scotland"],
    "D": ["United States", "Paraguay", "Australia", "Turkey"],
    "E": ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
    "F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
    "G": ["Belgium", "Egypt", "Iran", "New Zealand"],
    "H": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    "I": ["France", "Senegal", "Iraq", "Norway"],
    "J": ["Argentina", "Algeria", "Austria", "Jordan"],
    "K": ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
    "L": ["England", "Croatia", "Ghana", "Panama"],
}

# Sanity checks
assert len(GROUPS) == 12, "Expected 12 groups"
assert all(len(teams) == 4 for teams in GROUPS.values()), "Each group needs 4 teams"
ALL_TEAMS = [t for teams in GROUPS.values() for t in teams]
assert len(ALL_TEAMS) == 48 and len(set(ALL_TEAMS)) == 48, "Expected 48 unique teams"
