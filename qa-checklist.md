# QA Checklist — CX Review Dashboard

Run this checklist after every screen change using Chrome DevTools or Chrome MCP.

---

## Upload Screen

- [ ] Page loads at `http://localhost:3000`
- [ ] "Upload Reviews CSV" heading is visible
- [ ] File input accepts `.csv` files only
- [ ] Selecting a file displays the filename
- [ ] "Upload & Analyze" button is disabled until a file is selected
- [ ] Clicking "Upload & Analyze" shows "Uploading..." state
- [ ] After upload, shows "Analyzing with AI..." state
- [ ] Button is disabled during upload/analysis
- [ ] On error, shows a human-readable error message
- [ ] After success, transitions to Dashboard view

---

## Dashboard Screen

- [ ] Summary cards section is visible with 3 cards
- [ ] "Total Reviews" card shows the correct count
- [ ] "Positive %" card shows a percentage value
- [ ] "Top Theme" card shows the most frequent theme
- [ ] Theme Distribution bar chart is rendered
- [ ] Bar chart has labelled X-axis (theme names)
- [ ] Sentiment Breakdown chart is rendered (pie/donut)
- [ ] Sentiment chart has a legend
- [ ] Reviews table is visible with headers: Product, Review, Theme, Sentiment, Key Phrases
- [ ] Table shows all analysed reviews
- [ ] Theme badges are colour-coded
- [ ] Sentiment badges are colour-coded (green=Positive, red=Negative, grey=Neutral)

---

## Filter & Search

- [ ] Free-text search input is visible
- [ ] Typing in search filters the table in real-time
- [ ] Theme dropdown filters the table
- [ ] Sentiment dropdown filters the table
- [ ] Row count updates when filters are applied
- [ ] Clearing filters restores all rows

---

## Theme Detail View

- [ ] Clicking a bar in the chart opens the Detail panel
- [ ] Detail panel shows the selected theme name
- [ ] Detail panel shows counts: Total, Positive, Negative, Neutral
- [ ] Individual review cards are shown in the panel
- [ ] Each review card shows product name and review text
- [ ] "Close" button dismisses the detail panel

---

## General

- [ ] No console errors in Chrome DevTools
- [ ] App is responsive (1280x800 minimum)
- [ ] All API calls use `http://localhost:8000` as the base URL
- [ ] Loading states are shown while data is fetching
