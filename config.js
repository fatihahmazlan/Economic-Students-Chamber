/* ===========================================================
   ESC site settings — the easiest place to edit content.
   Anything marked TODO should be replaced with your real info.
   =========================================================== */
window.ESC_CONFIG = {

  /* TODO: your real contact details (leave a value empty to hide it) */
  contact: {
    email: "escbrunei@example.com",
    instagram: "https://instagram.com/",
    linkedin: "",
    telegram: ""
  },

  /* Optional: connect Esync to a real AI model.
     Put the URL of YOUR OWN small backend here (see README → "Upgrade Esync").
     NEVER paste an API key into this file — anyone can read it.
     Leave empty to use the built-in answers below. */
  esyncApiUrl: "",

  /* World Bank indicators offered in the Data hub and Regression lab */
  indicators: [
    { id: "NY.GDP.MKTP.KD.ZG",    label: "GDP growth (annual %)" },
    { id: "NY.GDP.MKTP.CD",       label: "GDP (current US$)" },
    { id: "NY.GDP.PCAP.CD",       label: "GDP per capita (current US$)" },
    { id: "FP.CPI.TOTL.ZG",       label: "Inflation, consumer prices (annual %)" },
    { id: "SL.UEM.TOTL.ZS",       label: "Unemployment (% of labour force, modelled ILO)" },
    { id: "SP.POP.TOTL",          label: "Population, total" },
    { id: "NE.TRD.GNFS.ZS",       label: "Trade (% of GDP)" },
    { id: "NE.EXP.GNFS.ZS",       label: "Exports of goods and services (% of GDP)" },
    { id: "NY.GDP.PETR.RT.ZS",    label: "Oil rents (% of GDP)" },
    { id: "BX.KLT.DINV.WD.GD.ZS", label: "FDI, net inflows (% of GDP)" },
    { id: "SP.DYN.LE00.IN",       label: "Life expectancy at birth (years)" },
    { id: "IT.NET.USER.ZS",       label: "Internet users (% of population)" }
  ],

  /* [World Bank code, display name] */
  countries: [
    ["BRN", "Brunei Darussalam"], ["SGP", "Singapore"], ["MYS", "Malaysia"],
    ["IDN", "Indonesia"], ["THA", "Thailand"], ["VNM", "Viet Nam"],
    ["PHL", "Philippines"], ["KHM", "Cambodia"], ["LAO", "Lao PDR"],
    ["CHN", "China"], ["JPN", "Japan"], ["KOR", "Korea, Rep."],
    ["IND", "India"], ["AUS", "Australia"], ["GBR", "United Kingdom"],
    ["USA", "United States"], ["WLD", "World"]
  ],

  /* Cards shown under "Where to find more". tag: "Brunei" or "International".
     Please double-check each link still works before launch. */
  dataSources: [
    { name: "DEPS Brunei", tag: "Brunei", url: "https://deps.mofe.gov.bn",
      desc: "Department of Economic Planning and Statistics — national accounts, trade, labour force and population." },
    { name: "BDCB", tag: "Brunei", url: "https://www.bdcb.gov.bn",
      desc: "Brunei Darussalam Central Bank — monetary, banking and financial statistics and publications." },
    { name: "World Bank — Brunei", tag: "Brunei", url: "https://data.worldbank.org/country/brunei-darussalam",
      desc: "Open indicators for Brunei going back decades, free to download." },
    { name: "IMF — Brunei", tag: "Brunei", url: "https://www.imf.org/en/Countries/BRN",
      desc: "Article IV reports, outlooks and country data for Brunei Darussalam." },
    { name: "ASEANstats", tag: "International", url: "https://data.aseanstats.org",
      desc: "Official ASEAN statistics — handy for comparing Brunei with the region." },
    { name: "IMF DataMapper", tag: "International", url: "https://www.imf.org/external/datamapper",
      desc: "Interactive world economic outlook data and forecasts." },
    { name: "UN Comtrade", tag: "International", url: "https://comtradeplus.un.org",
      desc: "International merchandise trade flows by country and product." },
    { name: "ADB Data Library", tag: "International", url: "https://data.adb.org",
      desc: "Asian Development Bank datasets for Asia and the Pacific." },
    { name: "FRED", tag: "International", url: "https://fred.stlouisfed.org",
      desc: "Hundreds of thousands of time series from the St. Louis Fed." },
    { name: "Our World in Data", tag: "International", url: "https://ourworldindata.org",
      desc: "Clear charts and downloadable data on development, health and more." }
  ],

  /* Esync's built-in knowledge. Each entry: keys (words/phrases to listen for) and
     answer (supports **bold**, [links](https://...) and \n line breaks).
     Add more entries any time. */
  kb: [
    { keys: ["hi", "hello", "hey", "salam", "assalamualaikum", "good morning", "good evening"],
      answer: "Hi! 👋 I'm **Esync**, the Economics Students' Chamber assistant. Ask me about ESC, how to use the tools here, economics concepts, or where to find Brunei data." },
    { keys: ["who are you", "what are you", "your name", "esync"],
      answer: "I'm **Esync**, ESC's built-in assistant. Right now I run on a set of built-in answers plus live Brunei figures from the dashboard — the team can upgrade me to a full AI model later." },
    { keys: ["what is esc", "about esc", "about the chamber", "economics students chamber", "who is esc", "about you guys", "about us"],
      answer: "The **Economics Students' Chamber (ESC)** is a student-led society for economics students in Brunei. We build data skills, encourage research on Brunei's economy, and connect students with industry, government and academia. See the [About section](#about)." },
    { keys: ["vision", "mission", "objective", "objectives", "goals", "purpose"],
      answer: "**Vision:** to be Brunei's leading student community for economic thinking.\n**Mission:** connect students with data, skills, mentors and each other.\nFind the full objectives in the [About section](#about)." },
    { keys: ["join", "member", "membership", "register", "sign up", "become a member"],
      answer: "We'd love to have you! Send us a message in the [Join us section](#contact) and the team will reply with next steps." },
    { keys: ["contact", "email", "instagram", "social", "reach you", "get in touch"],
      answer: "You can reach the team through the form in the [Join us section](#contact), or via our social links at the bottom of the page." },
    { keys: ["event", "events", "workshop", "talk", "seminar", "activities"],
      answer: "Follow our social channels for the latest workshops, talks and meet-ups — the links are in the [Join us section](#contact)." },
    { keys: ["dashboard", "indicators", "charts"],
      answer: "The [dashboard](#dashboard) shows Brunei's GDP, growth, inflation, unemployment and population, plus charts on GDP per capita, oil rents and a comparison with ASEAN peers. It loads live from the World Bank." },
    { keys: ["brunei data", "deps", "statistics brunei", "where can i find data", "find data", "data source", "data sources", "datasets"],
      answer: "For Brunei: **DEPS** (national statistics), **BDCB** (central bank) and the **World Bank / IMF** country pages. For international comparisons try ASEANstats, IMF DataMapper and UN Comtrade. All links are in the [Data hub](#data)." },
    { keys: ["international data", "world data", "compare countries", "download", "csv"],
      answer: "In the [Data hub](#data) you can pick any indicator, compare two countries, and **download the series as CSV**." },
    { keys: ["regression tool", "how to use regression", "regression lab", "run a regression", "use the regression"],
      answer: "Open the [Regression lab](#regression), paste \"x, y\" pairs (one per line) or load two World Bank indicators for a country, pick a functional form, then hit **Run regression**. You'll get the equation, R², p-values, a chart and a plain-English reading." },
    { keys: ["regression", "ols", "least squares", "line of best fit"],
      answer: "**Regression (OLS)** fits the straight line that minimises the sum of squared gaps between your data points and the line. The slope tells you how much Y tends to change when X rises by one unit. Try it in the [Regression lab](#regression)." },
    { keys: ["r squared", "r2", "r-squared", "coefficient of determination", "goodness of fit"],
      answer: "**R²** is the share of the variation in Y that your model explains — from 0 to 1. An R² of 0.80 means 80% of the variation is explained. A high R² doesn't prove causation, and a low one isn't always bad (it depends on the field)." },
    { keys: ["p value", "p-value", "significant", "significance", "t stat", "t-stat", "statistically"],
      answer: "The **p-value** asks: if the true slope were really zero, how likely is data at least this extreme? A small p-value (commonly below 0.05) is evidence against 'no relationship'. It does not measure how big or important the effect is." },
    { keys: ["elasticity", "log log", "log-log", "logarithm", "ln"],
      answer: "In a **log-log** model, the slope is an **elasticity**: a 1% rise in X is associated with roughly a b% change in Y. Choose *Log-log* in the [Regression lab](#regression). All values must be positive." },
    { keys: ["causation", "correlation", "causal", "spurious"],
      answer: "**Correlation isn't causation.** Two trending series (like many macro variables) can look related for no real reason — that's a *spurious regression*. Think about omitted variables, reverse causality and use of differences or growth rates." },
    { keys: ["what is gdp", "gdp definition", "define gdp", "gross domestic product"],
      answer: "**GDP** (Gross Domestic Product) is the total market value of final goods and services produced within a country in a period. **Real GDP** adjusts for price changes, so growth reflects actual output rather than inflation." },
    { keys: ["what is inflation", "define inflation", "inflation mean"],
      answer: "**Inflation** is the rate at which the general price level rises, so each unit of money buys less. It's often measured with the Consumer Price Index (CPI). Persistently *negative* inflation is called deflation." },
    { keys: ["what is unemployment", "define unemployment", "unemployment rate"],
      answer: "The **unemployment rate** is the share of the labour force that is without work but actively looking for it. Definitions vary by country, so check the source's notes before comparing." },
    { keys: ["gdp per capita", "per capita", "income per person"],
      answer: "**GDP per capita** is GDP divided by population — a rough measure of average output (and income) per person. It hides inequality and doesn't capture wellbeing on its own." },
    { keys: ["vision 2035", "wawasan", "wawasan brunei 2035"],
      answer: "**Wawasan Brunei 2035** is the national vision with three goals: a well-educated and highly skilled people, a high quality of life, and a dynamic and sustainable economy." },
    { keys: ["oil and gas", "diversification", "diversify", "resource dependence", "hydrocarbon"],
      answer: "Brunei's economy has long relied heavily on oil and gas, so **economic diversification** is a major policy theme. The 'Oil rents' chart on the [dashboard](#dashboard) is one way to track resource dependence over time." },
    { keys: ["thanks", "thank you", "terima kasih", "cheers"],
      answer: "You're welcome! 😊 Ask me anything else whenever you like." },
    { keys: ["bye", "goodbye", "see you"],
      answer: "Bye for now! Come back any time." }
  ]
};
