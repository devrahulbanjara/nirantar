import {
  BarbellIcon,
  BowlFoodIcon,
  GaugeIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { BrandLogo } from "@/components/auth-shell";
import "@/app/landing.css";

const records = [
  {
    icon: BarbellIcon,
    title: "Workouts",
    body: "Sessions, ordered exercises, sets, dropsets, and supersets.",
  },
  {
    icon: BowlFoodIcon,
    title: "Meals",
    body: "Meals and food items saved together, with honest nutrition totals.",
  },
  {
    icon: GaugeIcon,
    title: "Body weight",
    body: "One dated measurement at a time, kept alongside the rest of your history.",
  },
];

const exampleSummary = [
  {
    icon: BarbellIcon,
    label: "Workout",
    value: "Upper body",
    detail: "Completed",
  },
  {
    icon: BowlFoodIcon,
    label: "Meals",
    value: "3 logged",
    detail: "Nutrition incomplete",
  },
  {
    icon: GaugeIcon,
    label: "Body weight",
    value: "74.6 kg",
    detail: "Logged today",
  },
];

const questions = [
  "Show my bench press history",
  "Compare this month with last month",
  "Log today’s workout",
];

function ProductPreview() {
  return (
    <div className="landing-preview" aria-label="Example Nirantar daily summary">
      <div className="landing-preview-topbar">
        <BrandLogo sizes="40px" />
        <nav aria-label="Example app navigation">
          <span aria-current="page">Today</span>
          <span>Workouts</span>
          <span>Meals</span>
          <span>History</span>
        </nav>
      </div>

      <div className="landing-preview-body">
        <div className="landing-preview-heading">
          <div>
            <p>Sunday, 16 August</p>
            <h2>Today</h2>
          </div>
          <span>Example</span>
        </div>

        <div className="landing-preview-actions" aria-hidden="true">
          <span>Log workout</span>
          <span>Log meal</span>
          <span>Log weight</span>
        </div>

        <div className="landing-preview-summary">
          {exampleSummary.map(({ icon: Icon, label, value, detail }) => (
            <div className="landing-preview-row" key={label}>
              <span className="icon-surface" aria-hidden="true">
                <Icon size={20} weight="bold" />
              </span>
              <div>
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="landing" data-design-form="daily-record:b36dfe7b">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <div className="landing-brand">
            <BrandLogo sizes="42px" />
            <span>Nirantar</span>
          </div>
          <nav className="landing-header-actions" aria-label="Account">
            <Link className="button-secondary button-compact" href="/sign-in">
              Sign in
            </Link>
            <Link className="button-primary button-compact" href="/sign-up">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-shell landing-hero">
          <div className="landing-hero-copy">
            <h1>Keep your fitness history clear.</h1>
            <p>
              Log workouts, meals, and body weight. Review exact records. Use
              the same history with AI.
            </p>
            <div className="landing-actions">
              <Link className="button-primary" href="/sign-up">
                Get started
              </Link>
              <Link className="button-secondary" href="#how-it-works">
                See how it works
              </Link>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section
          className="landing-shell landing-records"
          id="how-it-works"
          aria-labelledby="records-title"
        >
          <div className="landing-section-heading">
            <h2 id="records-title">One record of the work you repeat.</h2>
            <p>
              Every entry stays structured, ordered, and available when you
              need to review it.
            </p>
          </div>
          <div className="landing-record-list">
            {records.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <span className="icon-surface" aria-hidden="true">
                  <Icon size={21} weight="bold" />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-history" aria-labelledby="history-title">
          <div className="landing-shell landing-history-inner">
            <div className="landing-section-heading">
              <h2 id="history-title">The saved details stay visible.</h2>
              <p>
                Open a past entry and see the order, units, timestamps, and
                completeness exactly as recorded.
              </p>
            </div>
            <div className="landing-history-example" aria-label="Example history">
              <div className="landing-history-label">
                <span>Example history</span>
                <span>Latest first</span>
              </div>
              <div className="landing-history-row">
                <time>Today</time>
                <strong>Upper body</strong>
                <span>Workout completed</span>
              </div>
              <div className="landing-history-row">
                <time>Today</time>
                <strong>Lunch</strong>
                <span>Nutrition incomplete</span>
              </div>
              <div className="landing-history-row">
                <time>Yesterday</time>
                <strong>Body weight</strong>
                <span>Measurement logged</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-shell landing-ai" aria-labelledby="ai-title">
          <div className="landing-ai-copy">
            <h2 id="ai-title">Use your history with AI.</h2>
            <p>
              Nirantar exposes the same structured records through MCP, so
              compatible AI tools can work from your data.
            </p>
          </div>
          <div className="landing-questions" aria-label="Example questions">
            {questions.map((question) => (
              <p key={question}>“{question}”</p>
            ))}
          </div>
        </section>

        <section className="landing-shell landing-final" aria-labelledby="final-title">
          <div>
            <h2 id="final-title">Start with today.</h2>
            <p>Build a fitness history you can use.</p>
          </div>
          <Link className="button-primary" href="/sign-up">
            Get started
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div className="landing-brand">
            <BrandLogo sizes="38px" />
            <span>Nirantar</span>
          </div>
          <nav aria-label="Footer">
            <Link className="text-link" href="/sign-in">
              Sign in
            </Link>
            <Link className="text-link" href="/sign-up">
              Get started
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
