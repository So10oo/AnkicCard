import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { DeckList } from "./DeckList";
import { AppProviders } from "./providers/AppProviders";

describe("DeckList", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("creates a deck from the modal", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <DeckList />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /новая колода|new deck/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /новая колода|new deck/i }));
    const input = await screen.findByRole("textbox");
    await user.clear(input);
    await user.type(input, "HSK 1");
    await user.click(screen.getByRole("button", { name: /создать|create/i }));

    await waitFor(async () => {
      expect(await db.decks.count()).toBe(1);
      expect(screen.getByText("HSK 1")).toBeInTheDocument();
    });
  });
});
