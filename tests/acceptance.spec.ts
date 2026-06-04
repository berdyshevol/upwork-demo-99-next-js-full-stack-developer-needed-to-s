import { test, expect, type Page } from "@playwright/test";

const MOCK_BYOK = JSON.stringify({
  provider: "mock",
  apiKey: "test",
  model: "mock",
});

async function seedMockKey(page: Page) {
  await page.addInitScript((blob) => {
    window.localStorage.setItem("byok", blob as string);
  }, MOCK_BYOK);
}

test.describe("Lafayette Academy — Personalization Cues", () => {
  // AC1: Dashboard loads seeded students with their scores from the database.
  test("AC1: dashboard lists seeded students with their scores", async ({
    page,
  }) => {
    await page.goto("/");
    const rows = page.getByTestId("student-row");
    await expect(rows.first()).toBeVisible();
    // At least a few seeded students.
    expect(await rows.count()).toBeGreaterThanOrEqual(3);
    // A known seeded student is present.
    await expect(page.getByText("Maya Hernandez")).toBeVisible();
    // Each student row surfaces at least one numeric score chip.
    await expect(
      page.getByTestId("student-row").first().getByTestId("score-chip").first()
    ).toBeVisible();
  });

  // AC2: Opening a student shows their real score history.
  test("AC2: student detail shows real score history", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Maya Hernandez").click();
    await expect(page).toHaveURL(/\/students\/.+/);
    await expect(
      page.getByRole("heading", { name: /Maya Hernandez/ })
    ).toBeVisible();
    const scoreRows = page.getByTestId("score-row");
    await expect(scoreRows.first()).toBeVisible();
    expect(await scoreRows.count()).toBeGreaterThanOrEqual(2);
    // Score history shows a subject and a numeric value.
    await expect(page.getByText(/Math|Reading|Writing|Science/).first()).toBeVisible();
  });

  // AC (BYOK gate): no key → AI feature disabled with hint visible.
  test("AC3a: with no API key the cue feature is gated with a hint", async ({
    page,
  }) => {
    await page.goto("/students/1");
    await expect(page.getByTestId("byok-hint")).toBeVisible();
    await expect(page.getByTestId("byok-hint")).toContainText(
      /Settings to enable live AI/i
    );
    await expect(page.getByTestId("generate-cue")).toBeDisabled();
  });

  // AC3: Clicking "Generate Personalization Cue" returns an AI cue grounded in scores.
  test("AC3b: with a key set, generating a cue returns grounded text", async ({
    page,
  }) => {
    await seedMockKey(page);
    await page.goto("/students/1");
    const btn = page.getByTestId("generate-cue");
    await expect(btn).toBeEnabled();
    await btn.click();
    const cue = page.getByTestId("cue-text").first();
    await expect(cue).toBeVisible({ timeout: 10_000 });
    // Cue is grounded: mentions the student's name and a subject.
    await expect(cue).toContainText("Maya Hernandez");
    await expect(cue).toContainText(/Math|Reading|Writing|Science/);
  });

  // AC4: The generated cue persists — reload shows it saved against the student.
  test("AC4: a generated cue persists across reload", async ({ page }) => {
    await seedMockKey(page);
    await page.goto("/students/2");
    await page.getByTestId("generate-cue").click();
    await expect(page.getByTestId("cue-text").first()).toBeVisible({
      timeout: 10_000,
    });
    const countBefore = await page.getByTestId("cue-text").count();
    expect(countBefore).toBeGreaterThanOrEqual(1);

    await page.reload();
    // After reload the cue is rendered from the server store, not client state.
    await expect(page.getByTestId("cue-text").first()).toBeVisible();
    expect(await page.getByTestId("cue-text").count()).toBeGreaterThanOrEqual(1);
  });

  // AC (Settings BYOK): settings persists provider/key/model to localStorage.byok.
  test("AC5: settings saves BYOK config to localStorage and clear wipes it", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.getByTestId("provider-select").selectOption("openai");
    await expect(page.getByTestId("apikey-input")).toHaveAttribute(
      "placeholder",
      /OpenAI/i
    );
    await page.getByTestId("apikey-input").fill("sk-test-123");
    await page.getByTestId("model-select").selectOption("gpt-4o");
    await page.getByTestId("save-byok").click();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("byok")
    );
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored as string);
    expect(parsed.provider).toBe("openai");
    expect(parsed.apiKey).toBe("sk-test-123");
    expect(parsed.model).toBe("gpt-4o");

    await page.getByTestId("clear-byok").click();
    const cleared = await page.evaluate(() =>
      window.localStorage.getItem("byok")
    );
    expect(cleared).toBeNull();
  });

  // AC6: Site works on mobile width.
  test("AC6: dashboard is usable at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByTestId("student-row").first()).toBeVisible();
    // No horizontal overflow at mobile width.
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1
    );
    expect(overflow).toBeTruthy();
  });
});
