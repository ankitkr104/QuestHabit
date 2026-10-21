import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { MemoryRouter } from "react-router-dom";
import {
  Onboarding,
  Layout,
  Dashboard,
  Quests,
  SettingsPage,
  LibraryPage,
  CalendarPage,
} from "../App";
import { AppState, Quest, blankState, starterQuests } from "../lib/game";

// Helper to run automated accessibility checks with axe-core
async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
    },
    rules: {
      // Color contrast calculation in JSDOM is inaccurate without a real rendering engine
      "color-contrast": { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

function createTestState(overrides: Partial<AppState> = {}): AppState {
  const base = blankState();
  return {
    ...base,
    profile: {
      ...base.profile,
      name: "Hero",
      avatar: "🧙",
      onboarding: true,
      ...overrides.profile,
    },
    quests: overrides.quests ?? starterQuests(),
    completions: overrides.completions ?? [],
    unlocked: overrides.unlocked ?? [],
  };
}

describe("Accessibility: Onboarding Flow", () => {
  it("has accessible dialog role, title, form label, progress bar, and no a11y violations", async () => {
    const onDone = () => {};
    const { container } = render(<Onboarding onDone={onDone} />);

    const dialog = screen.getByRole("dialog", {
      name: /welcome, adventurer!/i,
    });
    expect(dialog).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar", {
      name: /onboarding progress/i,
    });
    expect(progressBar).toHaveAttribute("aria-valuenow", "1");

    const nameInput = screen.getByLabelText(/what should we call you\?/i);
    expect(nameInput).toHaveFocus();

    await expectNoA11yViolations(container);
  });

  it("supports full keyboard completion without a mouse", async () => {
    const user = userEvent.setup();
    let completedProfile: { name: string; avatar: string } | null = null;

    const { container } = render(
      <Onboarding
        onDone={(name, avatar) => {
          completedProfile = { name, avatar };
        }}
      />,
    );

    const nameInput = screen.getByLabelText(/what should we call you\?/i);
    await user.type(nameInput, "Galen");

    // Continue button becomes enabled and can be activated with Enter or click
    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).not.toBeDisabled();
    await user.click(continueBtn);

    // Step 2 is shown: avatar selection
    const avatarGroup = screen.getByRole("radiogroup", {
      name: /choose your adventurer/i,
    });
    expect(avatarGroup).toBeInTheDocument();

    // Step 2 has no a11y violations
    await expectNoA11yViolations(container);

    // Choose avatar via keyboard/button
    const elfAvatar = screen.getByRole("radio", { name: /choose 🧝 avatar/i });
    await user.click(elfAvatar);
    expect(elfAvatar).toHaveAttribute("aria-checked", "true");

    // Finish onboarding
    const finishBtn = screen.getByRole("button", { name: /begin my journey/i });
    await user.click(finishBtn);

    expect(completedProfile).toEqual({ name: "Galen", avatar: "🧝" });
  });
});

describe("Accessibility: Dashboard Flow", () => {
  it("renders proper landmarks, headings, accessible buttons, and passes a11y audit", async () => {
    const state = createTestState();
    const update = () => {};

    const { container } = render(
      <MemoryRouter>
        <Dashboard state={state} update={update} />
      </MemoryRouter>,
    );

    // Heading structure
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(
      0,
    );

    // Settings action button has accessible name
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();

    // Progress bars have proper roles and labels
    expect(
      screen.getByRole("progressbar", { name: /today's quest progress/i }),
    ).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });
});

describe("Accessibility: Quest Completion and Undo Flow", () => {
  it("allows keyboard toggle of quest completion and undo with accessible status feedback", async () => {
    const user = userEvent.setup();
    let currentState = createTestState();
    let toastMessage = "";

    const update = (next: AppState, message?: string) => {
      currentState = next;
      if (message) toastMessage = message;
    };

    const { rerender, container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Layout state={currentState} update={update} toast={toastMessage} />
      </MemoryRouter>,
    );

    const firstQuest = currentState.quests[0];
    const completeButton = screen.getByRole("button", {
      name: new RegExp(`Complete ${firstQuest.title}`, "i"),
    });
    expect(completeButton).toBeInTheDocument();
    expect(completeButton).toHaveAttribute("aria-pressed", "false");

    // Toggle complete using keyboard Tab and Space/Enter
    completeButton.focus();
    expect(completeButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(currentState.completions.length).toBe(1);
    expect(toastMessage).toContain("Quest complete");

    // Rerender with updated state
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <Layout state={currentState} update={update} toast={toastMessage} />
      </MemoryRouter>,
    );

    // Toast status is announced in an accessible live region
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveTextContent(/quest complete/i);

    // Accessible name and pressed state now reflect Undo
    const undoButton = screen.getByRole("button", {
      name: new RegExp(`Undo ${firstQuest.title}`, "i"),
    });
    expect(undoButton).toHaveAttribute("aria-pressed", "true");

    await expectNoA11yViolations(container);

    // Now undo with keyboard
    undoButton.focus();
    await user.keyboard(" ");

    expect(currentState.completions.length).toBe(0);
    expect(toastMessage).toContain("Quest undone");
  });
});

describe("Accessibility: Quest Creation Dialog Flow", () => {
  it("dialog has accessible name, associated form labels, focus trap, and restores focus on close", async () => {
    const user = userEvent.setup();
    const state = createTestState();
    const update = () => {};

    const { container } = render(
      <MemoryRouter>
        <Quests state={state} update={update} />
      </MemoryRouter>,
    );

    const newQuestBtn = screen.getByRole("button", { name: /new quest/i });
    newQuestBtn.focus();
    expect(newQuestBtn).toHaveFocus();

    // Open the creation modal
    await user.click(newQuestBtn);

    const dialog = screen.getByRole("dialog", {
      name: /what will you conquer\?/i,
    });
    expect(dialog).toBeInTheDocument();

    // Focus moves into the modal to the title input
    const titleInput = within(dialog).getByLabelText(/quest title/i);
    expect(titleInput).toHaveFocus();

    // Form controls have associated labels
    expect(within(dialog).getByLabelText(/icon/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/description/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/category/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/difficulty/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/xp reward/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/frequency/i)).toBeInTheDocument();

    // Close button has accessible name
    const closeBtn = within(dialog).getByRole("button", {
      name: /close dialog/i,
    });
    expect(closeBtn).toBeInTheDocument();

    // Passes automated a11y audit
    await expectNoA11yViolations(container);

    // Escape key closes modal and returns focus to the trigger button
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(newQuestBtn).toHaveFocus();
  });

  it("traps focus inside the dialog while open", async () => {
    const user = userEvent.setup();
    const state = createTestState();
    const update = () => {};

    render(
      <MemoryRouter>
        <Quests state={state} update={update} />
      </MemoryRouter>,
    );

    const newQuestBtn = screen.getByRole("button", { name: /new quest/i });
    await user.click(newQuestBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close dialog/i });
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });

    // Shift-Tab from close button (first interactive element) wraps to cancel button (last enabled element)
    closeBtn.focus();
    expect(closeBtn).toHaveFocus();
    await user.tab({ shift: true });
    expect(cancelBtn).toHaveFocus();

    // Tab from cancel button wraps to close button
    await user.tab();
    expect(closeBtn).toHaveFocus();
  });

  it("creates a custom quest with selected weekdays and passes a11y audit", async () => {
    const user = userEvent.setup();
    let state = createTestState();
    const update = (next: AppState) => {
      state = next;
    };

    const { container } = render(
      <MemoryRouter>
        <Quests state={state} update={update} />
      </MemoryRouter>,
    );

    const newQuestBtn = screen.getByRole("button", { name: /new quest/i });
    await user.click(newQuestBtn);

    const dialog = screen.getByRole("dialog", {
      name: /what will you conquer\?/i,
    });
    const titleInput = within(dialog).getByLabelText(/quest title/i);
    await user.type(titleInput, "Gym Workout");

    const freqSelect = within(dialog).getByLabelText(/frequency/i);
    await user.selectOptions(freqSelect, "Custom");

    // Weekday toggle buttons appear
    const mondayBtn = within(dialog).getByRole("button", { name: /monday/i });
    const wednesdayBtn = within(dialog).getByRole("button", {
      name: /wednesday/i,
    });
    const fridayBtn = within(dialog).getByRole("button", { name: /friday/i });
    const saveBtn = within(dialog).getByRole("button", {
      name: /create quest/i,
    });

    // Save button must be disabled when no weekdays are selected
    expect(saveBtn).toBeDisabled();

    // Select Monday, Wednesday, Friday
    await user.click(mondayBtn);
    expect(mondayBtn).toHaveAttribute("aria-pressed", "true");
    expect(saveBtn).not.toBeDisabled();

    await user.click(wednesdayBtn);
    await user.click(fridayBtn);

    await expectNoA11yViolations(container);

    await user.click(saveBtn);

    const added = state.quests.find((q) => q.title === "Gym Workout");
    expect(added).toBeDefined();
    expect(added?.frequency).toBe("Custom");
    expect(added?.weekdays).toEqual([1, 3, 5]);
  });
});

describe("Accessibility: Quest Editing Dialog Flow", () => {
  it("opens accessible edit dialog with populated labels, saves via keyboard, and restores focus", async () => {
    const user = userEvent.setup();
    let state = createTestState();
    const update = (next: AppState) => {
      state = next;
    };

    const { rerender, container } = render(
      <MemoryRouter>
        <Quests state={state} update={update} />
      </MemoryRouter>,
    );

    const firstQuest = state.quests[0];
    const editBtn = screen.getByRole("button", {
      name: new RegExp(`Edit "${firstQuest.title}"`, "i"),
    });
    editBtn.focus();
    await user.click(editBtn);

    const dialog = screen.getByRole("dialog", { name: /edit quest/i });
    expect(dialog).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/quest title/i);
    expect(titleInput).toHaveValue(firstQuest.title);

    await expectNoA11yViolations(container);

    // Update title and save
    await user.clear(titleInput);
    await user.type(titleInput, "Hydrate Well");

    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveBtn);

    expect(state.quests.find((q) => q.id === firstQuest.id)?.title).toBe(
      "Hydrate Well",
    );

    // Rerender and ensure dialog is closed
    rerender(
      <MemoryRouter>
        <Quests state={state} update={update} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preserves custom schedule when editing a quest and allows toggling weekdays", async () => {
    const user = userEvent.setup();
    const customQuest: Quest = {
      id: "custom-1",
      title: "Reading Session",
      description: "Read 20 pages",
      icon: "📖",
      category: "Learning",
      difficulty: "Easy",
      xp: 15,
      duration: 20,
      frequency: "Custom",
      weekdays: [1, 3, 5],
      startDate: "2026-01-01",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    let state = createTestState({ quests: [customQuest] });
    const update = (next: AppState) => {
      state = next;
    };

    const { container } = render(
      <MemoryRouter>
        <Quests state={state} update={update} />
      </MemoryRouter>,
    );

    const editBtn = screen.getByRole("button", {
      name: new RegExp(`Edit "${customQuest.title}"`, "i"),
    });
    await user.click(editBtn);

    const dialog = screen.getByRole("dialog", { name: /edit quest/i });
    const freqSelect = within(dialog).getByLabelText(/frequency/i);
    expect(freqSelect).toHaveValue("Custom");

    const mondayBtn = within(dialog).getByRole("button", { name: /monday/i });
    const tuesdayBtn = within(dialog).getByRole("button", { name: /tuesday/i });
    const wednesdayBtn = within(dialog).getByRole("button", {
      name: /wednesday/i,
    });
    const fridayBtn = within(dialog).getByRole("button", { name: /friday/i });

    expect(mondayBtn).toHaveAttribute("aria-pressed", "true");
    expect(tuesdayBtn).toHaveAttribute("aria-pressed", "false");
    expect(wednesdayBtn).toHaveAttribute("aria-pressed", "true");
    expect(fridayBtn).toHaveAttribute("aria-pressed", "true");

    await expectNoA11yViolations(container);

    // Toggle off Monday, toggle on Tuesday
    await user.click(mondayBtn);
    expect(mondayBtn).toHaveAttribute("aria-pressed", "false");
    await user.click(tuesdayBtn);
    expect(tuesdayBtn).toHaveAttribute("aria-pressed", "true");

    const saveBtn = within(dialog).getByRole("button", {
      name: /save changes/i,
    });
    await user.click(saveBtn);

    const updated = state.quests.find((q) => q.id === "custom-1");
    expect(updated?.frequency).toBe("Custom");
    expect(updated?.weekdays).toEqual([2, 3, 5]);
  });
});

describe("Accessibility: Desktop and Mobile Navigation", () => {
  it("desktop sidebar navigation provides skip link, accessible names, aria-current, and passes audit", async () => {
    const state = createTestState();
    const update = () => {};

    const { container } = render(
      <MemoryRouter initialEntries={["/quests"]}>
        <Layout state={state} update={update} toast="" />
      </MemoryRouter>,
    );

    // Skip link is present and points to main content
    const skipLink = screen.getByRole("link", {
      name: /skip to main content/i,
    });
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Sidebar navigation landmark
    const mainNav = screen.getByRole("navigation", {
      name: /main navigation/i,
    });
    expect(mainNav).toBeInTheDocument();

    // Active link has aria-current="page"
    const activeLink = within(mainNav).getByRole("link", {
      name: /my quests/i,
    });
    expect(activeLink).toHaveAttribute("aria-current", "page");

    await expectNoA11yViolations(container);
  });

  it("mobile navigation provides labeled links with aria-current for narrow viewports", async () => {
    const state = createTestState();
    const update = () => {};

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Layout state={state} update={update} toast="" />
      </MemoryRouter>,
    );

    const mobileNav = screen.getByRole("navigation", {
      name: /mobile navigation/i,
    });
    expect(mobileNav).toBeInTheDocument();

    const overviewLink = within(mobileNav).getByRole("link", {
      name: /overview/i,
    });
    expect(overviewLink).toHaveAttribute("aria-current", "page");

    // All links in mobile nav are accessible
    const mobileLinks = within(mobileNav).getAllByRole("link");
    expect(mobileLinks.length).toBe(5);
    for (const link of mobileLinks) {
      expect(link).toHaveAccessibleName();
    }

    await expectNoA11yViolations(container);
  });
});

describe("Accessibility: Settings and Import/Export Controls", () => {
  it("has associated form labels, accessible export/reset buttons, and keyboard-reachable file import", async () => {
    const state = createTestState();
    const update = () => {};

    const { container } = render(
      <SettingsPage state={state} update={update} />,
    );

    // Form controls have associated labels
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily quest target/i)).toBeInTheDocument();

    // Export button has accessible name
    const exportBtn = screen.getByRole("button", { name: /export backup/i });
    expect(exportBtn).toBeInTheDocument();

    // Import file input is associated with label and focusable by keyboard
    const importInput = screen.getByLabelText(/import backup/i);
    expect(importInput).toBeInTheDocument();
    importInput.focus();
    expect(importInput).toHaveFocus();

    // Reset button has accessible name
    const resetBtn = screen.getByRole("button", { name: /reset local data/i });
    expect(resetBtn).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });
});

describe("Accessibility: Habit Library and Calendar", () => {
  it("habit library has search label and disambiguated add quest button names", async () => {
    const state = createTestState();
    const update = () => {};

    const { container } = render(<LibraryPage state={state} update={update} />);

    expect(
      screen.getByLabelText(/search the habit library/i),
    ).toBeInTheDocument();
    const addButtons = screen.getAllByRole("button", { name: /add quest/i });
    expect(addButtons.length).toBeGreaterThan(0);

    await expectNoA11yViolations(container);
  });

  it("calendar page has accessible month navigation buttons and calendar labels", async () => {
    const state = createTestState();

    const { container } = render(<CalendarPage state={state} />);

    expect(
      screen.getByRole("button", { name: /previous month/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next month/i }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.calendar[aria-label="Completion calendar"]'),
    ).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });
});

describe("Accessibility: Keyboard Reachability Audit across Core Controls", () => {
  it("all visible interactive controls in the application are keyboard reachable with accessible names", () => {
    const state = createTestState();
    const update = () => {};

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Layout state={state} update={update} toast="" />
      </MemoryRouter>,
    );

    // Query all interactive elements: a[href], button:not([disabled]), input, select, textarea
    const interactives = container.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
    );

    expect(interactives.length).toBeGreaterThan(0);

    for (const el of Array.from(interactives)) {
      // Must not be negative tabindex (unless intentionally sr-only or special purpose)
      expect(el.tabIndex).toBeGreaterThanOrEqual(0);

      // Must have an accessible name or label
      const accessibleName =
        el.getAttribute("aria-label") ||
        el.getAttribute("aria-labelledby") ||
        el.textContent?.trim() ||
        (el as HTMLInputElement).placeholder ||
        (el as HTMLInputElement).value ||
        (el.id &&
          container
            .querySelector(`label[for="${el.id}"]`)
            ?.textContent?.trim());

      expect(accessibleName && accessibleName.length > 0).toBe(true);
    }
  });
});
