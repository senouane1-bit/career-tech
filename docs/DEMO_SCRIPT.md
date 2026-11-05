# CareerTech presentation and live demonstration

Allow about 10 minutes. Use only the fictional sample CVs. An actual analysis requires a configured backend and model. The static hosted demo explicitly labels its prewritten example.

1. Introduce the problem: opportunities and CV versions spread across notes, spreadsheets and emails. Explain the personal workspace and single job-seeker role.
2. Register a new account in connected mode. Show that the workspace starts empty. Show the name and monthly-goal controls in Settings.
3. Upload `samples/Sara_Morgan_CV.pdf`. Open the actual PDF and show filename, upload date and version fingerprint. Explain that readable text is required.
4. Add a Frontend Developer opportunity. Paste `samples/frontend-job-description.txt`, set Saved, record the job link and a personal note. Show list search and status filter. Switch to board view.
5. Open the independent CV analysis page. Select the main CV, paste the description and run a real analysis. Show the processing indicator. If credentials are unavailable, state that clearly and open the fictional example instead.
6. Explain the category and weighted evidence score. Review matching quotes, unconfirmed PostgreSQL, relevant experience and section-specific improvements. Explain why an unmentioned skill is unconfirmed rather than absent. Download the report PDF.
7. Return to the opportunity and manually move it to Applied. Add the application date and follow-up date. Later move it to Interview and add the interview date and a note about the employer interaction.
8. Show the dashboard totals, pipeline, monthly progress, upcoming actions and recent activity. Explain that calculations come from the current account's stored records.
9. Open the original saved report. Review the original job description and CV version. Replace the main CV, then show that the prior report remains unchanged.
10. Run another analysis with `samples/Sara_Morgan_Backend_CV.pdf` as an alternative. Confirm that the main CV filename does not change and both reports remain separate in history.
11. Show logout. Sign in using a second test account and confirm it cannot see the first account's jobs, reports or PDFs.
12. Explain the architecture: Next.js App Router, Express TypeScript, PostgreSQL, Node PDF extraction, OpenAI-compatible AI request and validation. End with the current deployment status and any remaining credential/provider setup.

Technical questions to prepare for:

- Why keep Express separate? The brief requires it and it centralizes authorization and AI secrets.
- Why store PDF bytes in PostgreSQL? The 4 MB limit keeps a student-scale deployment simple and private. Larger deployments can move documents to private object storage.
- Why preserve old CV references? Replacing a main document must not change the meaning of an earlier report.
- Why validate quotes? A plausible model answer can still invent evidence. Exact source checking catches some failures before persistence.
- What does the score mean? Weighted documented alignment, never hiring probability.
- What remains before production? Deployed API/database credentials, a successful live AI integration test, a target GitHub repository and provider operational configuration.
