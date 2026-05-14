import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App.jsx";

describe("App", () => {
  it("renders the scraper workspace", () => {
    const { getByText } = render(<App />);
    expect(getByText(/Spidey/i)).toBeInTheDocument();
    expect(getByText(/Scrapear web/i)).toBeInTheDocument();
  });
});
