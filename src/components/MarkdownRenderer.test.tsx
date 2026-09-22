import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders headings with proper text content", () => {
    const md = "# Heading 1\n\n## Heading 2\n\n### Heading 3\n\n#### Heading 4";
    render(<MarkdownRenderer content={md} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Heading 1");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Heading 2");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Heading 3");
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Heading 4");
  });

  it("handles multi-line heading blocks without swallowing subsequent lines", () => {
    const md = "### Morning Habits\n- Drink warm water\n- 10-minute meditation";
    render(<MarkdownRenderer content={md} />);

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Morning Habits");
    expect(heading).not.toHaveTextContent("Drink warm water");
    expect(screen.getByText("Drink warm water")).toBeInTheDocument();
    expect(screen.getByText("10-minute meditation")).toBeInTheDocument();
  });

  it("renders inline bold, italic, and code formatting", () => {
    const md = "This has **bold text**, *italic text*, and `code text`.";
    const { container } = render(<MarkdownRenderer content={md} />);

    expect(container.querySelector("strong")).toHaveTextContent("bold text");
    expect(container.querySelector("em")).toHaveTextContent("italic text");
    expect(container.querySelector("code")).toHaveTextContent("code text");
  });

  it("renders safe links and sanitizes unsafe javascript/data URL schemes", () => {
    const md = "[Safe Link](https://example.com) and [Malicious](javascript:alert(1)) and [Data](data:text/html,bad)";
    const { container } = render(<MarkdownRenderer content={md} />);

    const safeLink = screen.getByRole("link", { name: "Safe Link" });
    expect(safeLink).toHaveAttribute("href", "https://example.com");
    expect(safeLink).toHaveAttribute("target", "_blank");

    expect(screen.queryByRole("link", { name: "Malicious" })).not.toBeInTheDocument();
    expect(screen.getByText("Malicious")).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Data" })).not.toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
  });

  it("renders bullet lists cleanly", () => {
    const md = "- First item\n- Second item\n- Third item";
    render(<MarkdownRenderer content={md} />);

    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
    expect(screen.getByText("Third item")).toBeInTheDocument();
  });

  it("renders blockquotes cleanly", () => {
    const md = "> A gentle quote on mindful living.";
    const { container } = render(<MarkdownRenderer content={md} />);

    const blockquote = container.querySelector("blockquote");
    expect(blockquote).toBeInTheDocument();
    expect(blockquote).toHaveTextContent("A gentle quote on mindful living.");
  });

  it("handles null, undefined, and empty string without crashing", () => {
    const { container: c1 } = render(<MarkdownRenderer content="" />);
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(<MarkdownRenderer content={undefined} />);
    expect(c2).toBeEmptyDOMElement();
  });

  it("safely falls back to raw markdown text without throwing errors", () => {
    const complexUnclosedMd = "### Unclosed formatting **bold with [unclosed link and special chars <<>>";
    const { container } = render(<MarkdownRenderer content={complexUnclosedMd} />);

    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain("Unclosed formatting");
  });
});
